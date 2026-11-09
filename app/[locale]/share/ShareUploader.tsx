"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/navigation";
import {
  CHUNK_SIZE,
  LARGE_VIDEO_BYTES,
  LARGE_VIDEO_SECONDS,
  loadItems,
  MAX_VIDEO_BYTES,
  prepareImage,
  type QueueItem,
  removeItem,
  saveItem,
  sendPart,
  type Signature,
  UploadError,
  videoSeconds,
} from "./queue";

type Status = "waiting" | "uploading" | "retrying" | "done" | "rejected";
type Row = {
  id: string;
  kind: "image" | "video";
  preview?: string;
  status: Status;
  progress: number;
  message?: "tooBig" | "failed";
};
type Queued = QueueItem & { retryAt: number };
type BigVideo = { id: string; file: File; mb: number; seconds: number };
type BigVideos = { videos: BigVideo[]; answer: (keep: Set<string>) => void };

const CODE_KEY = "share-code";
const NAME_KEY = "share-name";
const PARALLEL = 2; // uploads at once; more than 2 just splits weak signal further

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

export function ShareUploader() {
  const t = useTranslations("Share");
  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [online, setOnline] = useState(true);
  const [blocked, setBlocked] = useState<null | "wrongCode" | "notReady">(null);
  const [bigVideos, setBigVideos] = useState<BigVideos | null>(null);

  // Refs hold the live queue so background uploads always see the latest values.
  const queue = useRef(new Map<string, Queued>());
  const active = useRef(new Set<string>());
  const creds = useRef({ code: null as string | null, name: null as string | null, blocked: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pumpRef = useRef<() => void>(() => {});

  const patch = useCallback((id: string, change: Partial<Row>) => {
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }, []);

  // Asks our server for permission to upload one file (see /api/upload-signature).
  const getSignature = useCallback(async (): Promise<Signature> => {
    let res: Response;
    try {
      res = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: creds.current.code, name: creds.current.name }),
      });
    } catch {
      throw new UploadError("network", false);
    }
    if (res.status === 403) {
      setBlocked("wrongCode");
      storage.set(CODE_KEY, null);
      throw new UploadError("wrong-code", false, 403);
    }
    if (res.status === 503) {
      setBlocked("notReady");
      throw new UploadError("not-configured", false, 503);
    }
    if (!res.ok) throw new UploadError(`HTTP ${res.status}`, false, res.status);
    return res.json();
  }, []);

  // Uploads one queued file: whole photos in one go, videos in 6 MB pieces so a
  // dropped connection only repeats the current piece.
  const upload = useCallback(
    async (item: Queued) => {
      active.current.add(item.id);
      patch(item.id, { status: "uploading", progress: item.offset / item.size });
      try {
        const sig = await getSignature();
        if (item.size <= CHUNK_SIZE) {
          await sendPart(sig, item.blob, item.fileName, {}, (n) => patch(item.id, { progress: n / item.size }));
        } else {
          while (item.offset < item.size) {
            const start = item.offset;
            const end = Math.min(start + CHUNK_SIZE, item.size);
            await sendPart(
              sig,
              item.blob.slice(start, end),
              item.fileName,
              { "X-Unique-Upload-Id": item.uploadId, "Content-Range": `bytes ${start}-${end - 1}/${item.size}` },
              (n) => patch(item.id, { progress: (start + n) / item.size }),
            );
            item.offset = end;
            await saveItem(item); // remember progress in case the page closes
          }
        }
        await removeItem(item.id);
        queue.current.delete(item.id);
        patch(item.id, { status: "done", progress: 1 });
      } catch (err) {
        const error = err instanceof UploadError ? err : new UploadError(String(err), false);
        item.attempts += 1;
        if (error.permanent && item.offset > 0) {
          // The half-finished upload expired on Cloudinary's side: start that file over.
          item.offset = 0;
          item.uploadId = crypto.randomUUID();
        } else if (error.permanent && item.attempts >= 3) {
          await removeItem(item.id);
          queue.current.delete(item.id);
          patch(item.id, { status: "rejected", message: "failed" });
          return;
        }
        // Wait a little longer after each failure: 2s, 4s, 8s … up to a minute.
        item.retryAt = Date.now() + Math.min(60, 2 ** item.attempts) * 1000;
        await saveItem(item);
        patch(item.id, { status: "retrying" });
      } finally {
        active.current.delete(item.id);
        pumpRef.current();
      }
    },
    [getSignature, patch],
  );

  // Starts the next uploads when there's signal and a free slot.
  useEffect(() => {
    pumpRef.current = () => {
      clearTimeout(timer.current);
      const { code: c, name: n, blocked: b } = creds.current;
      if (!c || !n || b || !navigator.onLine) return;
      const now = Date.now();
      let nextRetry = Infinity;
      // Easiest first: whatever has the fewest bytes left to send.
      const next = [...queue.current.values()].sort((a, b) => a.size - a.offset - (b.size - b.offset));
      for (const item of next) {
        if (active.current.size >= PARALLEL) break;
        if (active.current.has(item.id)) continue;
        if (item.retryAt > now) {
          nextRetry = Math.min(nextRetry, item.retryAt);
          continue;
        }
        void upload(item);
      }
      if (nextRetry < Infinity) timer.current = setTimeout(() => pumpRef.current(), nextRetry - now);
    };
  }, [upload]);

  // On load: read the code from the QR link (or memory), the guest's name, and any
  // uploads left over from last time; then resume.
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("c");
    if (fromLink) storage.set(CODE_KEY, fromLink);
    /* eslint-disable react-hooks/set-state-in-effect -- reads browser storage after load */
    setCode(fromLink ?? storage.get(CODE_KEY));
    setName(storage.get(NAME_KEY));
    setOnline(navigator.onLine);
    /* eslint-enable react-hooks/set-state-in-effect */

    loadItems()
      .then((items) => {
        for (const item of items) queue.current.set(item.id, { ...item, retryAt: 0 });
        setRows(
          items.map((item) => ({
            id: item.id,
            kind: item.kind,
            preview: item.kind === "image" ? URL.createObjectURL(item.blob) : undefined,
            status: "waiting",
            progress: item.offset / item.size,
          })),
        );
      })
      .catch(() => {})
      .finally(() => {
        setLoaded(true);
        pumpRef.current();
      });

    const goOnline = () => {
      setOnline(true);
      // Back online: retry everything right away instead of waiting out the timers.
      for (const item of queue.current.values()) item.retryAt = 0;
      pumpRef.current();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Keep the uploader's copy of code/name current, and re-check the queue when they change.
  useEffect(() => {
    creds.current = { code, name, blocked: blocked !== null };
    pumpRef.current();
  }, [code, name, blocked]);

  const pending = rows.some((r) => r.status === "waiting" || r.status === "uploading" || r.status === "retrying");

  // While uploading: keep the screen awake, and warn before leaving the page.
  useEffect(() => {
    if (!pending) return;
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      lock?.release().catch(() => {});
      window.removeEventListener("beforeunload", warn);
    };
  }, [pending]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).map((file) => ({
      file,
      id: crypto.randomUUID(),
      kind: file.type.startsWith("video") ? ("video" as const) : ("image" as const),
    }));

    // Over Cloudinary's limit: show why on the tile instead of queueing it.
    const tooBig = picked.filter((p) => p.kind === "video" && p.file.size > MAX_VIDEO_BYTES);
    setRows((all) => [
      ...all,
      ...tooBig.map((p): Row => ({ id: p.id, kind: p.kind, status: "rejected", progress: 0, message: "tooBig" })),
    ]);
    let accepted = picked.filter((p) => !tooBig.includes(p));

    // Long or heavy videos: one popup for all of them. The guest picks which to send.
    const videos = await Promise.all(
      accepted.filter((p) => p.kind === "video").map(async (p) => ({ ...p, seconds: await videoSeconds(p.file) })),
    );
    const big = videos.filter((v) => v.file.size > LARGE_VIDEO_BYTES || v.seconds > LARGE_VIDEO_SECONDS + 0.5);
    if (big.length > 0) {
      const keep = await new Promise<Set<string>>((resolve) =>
        setBigVideos({
          videos: big.map((v) => ({ id: v.id, file: v.file, mb: Math.round(v.file.size / (1024 * 1024)), seconds: v.seconds })),
          answer: (ids) => {
            setBigVideos(null);
            resolve(ids);
          },
        }),
      );
      accepted = accepted.filter((p) => !big.some((b) => b.id === p.id) || keep.has(p.id));
    }

    // Smallest first: photos finish in seconds, big videos go last.
    accepted.sort((a, b) => a.file.size - b.file.size);
    setRows((all) => [...all, ...accepted.map((p): Row => ({ id: p.id, kind: p.kind, status: "waiting", progress: 0 }))]);

    for (const { file, id, kind } of accepted) {
      const blob = kind === "image" ? await prepareImage(file) : file;
      const item: Queued = {
        id,
        fileName: kind === "image" && blob !== file ? file.name.replace(/\.\w+$/, ".jpg") : file.name,
        kind,
        type: blob.type,
        size: blob.size,
        blob,
        uploadId: crypto.randomUUID(),
        offset: 0,
        attempts: 0,
        createdAt: Date.now(),
        retryAt: 0,
      };
      await saveItem(item).catch(() => {}); // still uploads this visit if storage is blocked
      queue.current.set(id, item);
      patch(id, { preview: kind === "image" ? URL.createObjectURL(blob) : undefined });
      pumpRef.current();
    }
  }

  if (!loaded) return <div className="h-40" />;

  const input =
    "w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-base outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
  const button =
    "w-full rounded-full bg-primary px-8 py-3.5 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark";

  // Step 1: event code (normally filled in automatically by the QR link)
  if (!code || blocked === "wrongCode") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("code") ?? "").trim();
          if (!value) return;
          storage.set(CODE_KEY, value);
          setCode(value);
          setBlocked(null);
        }}
      >
        <h2 className="text-center font-serif text-3xl">{t("codeTitle")}</h2>
        <p className="text-center text-muted">{t("codeHint")}</p>
        {blocked === "wrongCode" && (
          <p className="rounded-2xl bg-blush/70 px-4 py-3 text-sm" role="alert">{t("wrongCode")}</p>
        )}
        <input name="code" autoCapitalize="characters" autoComplete="off" className={`${input} text-center tracking-[0.3em] uppercase`} />
        <button className={button}>{t("continue")}</button>
      </form>
    );
  }

  // Step 2: the guest's name, asked once and remembered on this phone
  if (!name) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("name") ?? "").trim().slice(0, 60);
          if (!value) return;
          storage.set(NAME_KEY, value);
          setName(value);
        }}
      >
        <h2 className="text-center font-serif text-3xl">{t("nameTitle")}</h2>
        <p className="text-center text-muted">{t("nameHint")}</p>
        <input name="name" autoComplete="given-name" className={`${input} text-center`} />
        <button className={button}>{t("continue")}</button>
      </form>
    );
  }

  const done = rows.filter((r) => r.status === "done").length;
  const total = rows.filter((r) => r.status !== "rejected").length;
  const overall = total ? rows.reduce((sum, r) => sum + (r.status === "rejected" ? 0 : r.progress), 0) / total : 0;

  // Step 3: pick and upload
  return (
    <div className="space-y-5">
      <p className="text-center">
        {t("hello", { name })}{" "}
        <button
          type="button"
          onClick={() => {
            storage.set(NAME_KEY, null);
            setName(null);
          }}
          className="text-sm text-muted underline underline-offset-4"
        >
          {t("notYou")}
        </button>
      </p>

      {blocked === "notReady" ? (
        <p className="rounded-2xl bg-blush/70 px-4 py-3 text-center text-sm">{t("notReady")}</p>
      ) : (
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-primary/30 bg-white/50 px-6 py-8 text-center hover:border-primary/60">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = ""; // allow choosing the same files again
            }}
          />
          <span className="inline-block rounded-full bg-primary px-8 py-3 font-medium text-paper ring-1 ring-gold/40">
            {t("pick")}
          </span>
          <span className="mt-3 block text-sm text-muted">{t("pickHint")}</span>
        </label>
      )}

      {!online && (
        <p className="rounded-2xl bg-sky/80 px-4 py-3 text-center text-sm" role="status">{t("offline")}</p>
      )}

      {total > 0 && (
        <div className="text-center" aria-live="polite">
          {/* While uploading, the count sits in the pinned banner at the bottom */}
          {pending ? <p className="text-sm text-muted">{t("keepOpen")}</p> : <p className="font-medium">{t("allDone")}</p>}
        </div>
      )}

      {rows.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {rows.map((row) => (
            <li key={row.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white/60">
              {row.preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of a file on the phone
                <img src={row.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs uppercase tracking-wider text-muted">
                  {t("video")}
                </div>
              )}
              <div
                className={`absolute inset-x-0 bottom-0 px-2 py-1 text-[0.7rem] font-medium ${
                  row.status === "done"
                    ? "bg-primary/85 text-paper"
                    : row.status === "rejected"
                      ? "bg-rose/90 text-paper"
                      : "bg-white/85 text-ink"
                }`}
              >
                {row.status === "rejected"
                  ? t(`errors.${row.message ?? "failed"}`)
                  : row.status === "uploading"
                    ? t("status.uploading", { percent: Math.round(row.progress * 100) })
                    : t(`status.${row.status}`)}
                {(row.status === "uploading" || row.status === "retrying") && (
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-primary/15">
                    <span className="block h-full bg-primary transition-[width]" style={{ width: `${row.progress * 100}%` }} />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {bigVideos && (
        <OnPage>
          <BigVideoDialog {...bigVideos} />
        </OnPage>
      )}

      {/* Pinned reminder while anything is still uploading */}
      {pending && (
        <OnPage>
          <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" role="status">
            <div className="glass mx-auto max-w-xl rounded-3xl bg-white/80 px-5 py-3 text-center">
              <p className="text-sm font-medium">{t("progress", { done, total })}</p>
              <p className="text-xs text-muted">{t("keepOpenShort")}</p>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-primary/15">
                <span className="block h-full bg-primary transition-[width]" style={{ width: `${overall * 100}%` }} />
              </span>
            </div>
          </div>
        </OnPage>
      )}

      {/* Secondary button: outlined, so "Choose photos" stays the main action */}
      <Link
        href="/gallery"
        className="block w-full rounded-full border border-primary/40 bg-white/60 px-8 py-3.5 text-center font-medium text-primary-dark hover:bg-white/90"
      >
        {t("galleryLink")}
      </Link>
    </div>
  );
}

// Draws its children straight onto the page body. Needed for anything pinned to
// the screen: inside the frosted "glass" card, position: fixed would stick to the
// card instead of the screen (a quirk of the blur effect).
function OnPage({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

// "These videos are quite large" popup: one list for every big video picked at
// once, each ticked by default. Uploading is the main button: we'd rather have a
// slow upload than miss the moment.
function BigVideoDialog({ videos, answer }: BigVideos) {
  const t = useTranslations("Share");
  const [keep, setKeep] = useState(() => new Set(videos.map((v) => v.id)));
  // Little previews of each video, so guests know which is which (file names are like IMG_1234).
  const [urls] = useState(() => videos.map((v) => URL.createObjectURL(v.file)));
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  const length = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const flip = (id: string) =>
    setKeep((old) => {
      const next = new Set(old);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="big-title"
        className="glass flex max-h-[85dvh] w-full max-w-sm flex-col rounded-[2rem] bg-white/85 p-6 text-center"
      >
        <h2 id="big-title" className="font-serif text-3xl">{t("big.title", { count: videos.length })}</h2>
        <p className="mt-3 leading-relaxed text-muted">{t("big.body", { count: videos.length })}</p>

        <ul className="mt-4 min-h-0 space-y-2 overflow-y-auto text-left">
          {videos.map((v, i) => (
            <li key={v.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/70 p-2 pr-3">
                <video src={`${urls[i]}#t=0.1`} muted playsInline preload="metadata" className="size-14 shrink-0 rounded-xl bg-ink/10 object-cover" />
                <span className="flex-1 text-sm tabular-nums">
                  {v.seconds > 0 ? t("big.factsLength", { size: v.mb, length: length(v.seconds) }) : t("big.facts", { size: v.mb })}
                </span>
                <input
                  type="checkbox"
                  checked={keep.has(v.id)}
                  onChange={() => flip(v.id)}
                  aria-label={t("big.include")}
                  className="size-5 accent-primary"
                />
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          autoFocus
          onClick={() => answer(keep)}
          className="mt-5 w-full rounded-full bg-primary px-8 py-3.5 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark"
        >
          {t("big.upload", { count: keep.size })}
        </button>
        <button type="button" onClick={() => answer(new Set())} className="mt-3 text-sm text-muted underline underline-offset-4">
          {t("big.skip", { count: videos.length })}
        </button>
      </div>
    </div>
  );
}
