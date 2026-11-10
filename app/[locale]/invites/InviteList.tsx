"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { markWhatsapp, sendInvite } from "./actions";

export type InviteRow = {
  slug: string;
  name: string;
  lang: string;
  hasEmail: boolean;
  link: string;
  whatsappHref: string;
  emailed: string; // date text from the sheet, "" if never
  whatsapp: string;
  opened: string;
};

type Sending = "sending" | "failed" | undefined;

// "11/9/2026 15:35:00" from the sheet -> "11/9/2026"
const day = (text: string) => text.split(" ")[0];

const pill = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50";
const solid = `${pill} bg-primary text-paper ring-1 ring-gold/40 hover:bg-primary-dark`;
const outline = `${pill} bg-white/60 text-primary-dark ring-1 ring-primary/30 hover:bg-white`;

export function InviteList({ rows: initial }: { rows: InviteRow[] }) {
  const t = useTranslations("Invite.admin");
  const [rows, setRows] = useState(initial);
  const [sending, setSending] = useState<Record<string, Sending>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const update = (slug: string, patch: Partial<InviteRow>) =>
    setRows((list) => list.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));

  async function email(row: InviteRow) {
    setSending((s) => ({ ...s, [row.slug]: "sending" }));
    const { ok } = await sendInvite(row.slug).catch(() => ({ ok: false }));
    setSending((s) => ({ ...s, [row.slug]: ok ? undefined : "failed" }));
    if (ok) update(row.slug, { emailed: t("today") });
    return ok;
  }

  async function emailAll() {
    const todo = rows.filter((r) => r.hasEmail && !r.emailed);
    if (!window.confirm(t("confirmAll", { count: todo.length }))) return;
    setBulk({ done: 0, total: todo.length });
    // One at a time: Gmail and the sheet are happier than with 100 at once.
    for (let i = 0; i < todo.length; i++) {
      await email(todo[i]);
      setBulk({ done: i + 1, total: todo.length });
    }
    setBulk(null);
  }

  const notEmailed = rows.filter((r) => r.hasEmail && !r.emailed).length;

  return (
    <div className="space-y-5">
      <div className="glass rounded-[2rem] p-6 text-center">
        <p className="font-medium">
          {t("summary", {
            total: rows.length,
            emailed: rows.filter((r) => r.emailed).length,
            opened: rows.filter((r) => r.opened).length,
          })}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("help")}</p>
        {notEmailed > 0 && (
          <button type="button" className={`${solid} mt-5`} disabled={bulk !== null} onClick={emailAll}>
            {bulk ? t("sendAllProgress", bulk) : t("sendAll", { count: notEmailed })}
          </button>
        )}
      </div>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.slug} className="glass rounded-3xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-serif text-2xl">{row.name}</p>
              <span className="text-xs uppercase tracking-[0.2em] text-muted">{row.lang}</span>
            </div>

            <p className="mt-1 text-sm text-muted">
              {[
                row.emailed && t("emailed", { date: day(row.emailed) }),
                row.whatsapp && t("whatsappSent", { date: day(row.whatsapp) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className={`text-sm ${row.opened ? "font-medium text-gold" : "text-muted"}`}>
              {row.opened ? t("opened", { date: day(row.opened) }) : t("notOpened")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {row.hasEmail ? (
                <button
                  type="button"
                  className={row.emailed ? outline : solid}
                  disabled={sending[row.slug] === "sending" || bulk !== null}
                  onClick={() => {
                    if (row.emailed && !window.confirm(t("confirmAgain", { name: row.name }))) return;
                    email(row);
                  }}
                >
                  {sending[row.slug] === "sending" ? t("sending") : row.emailed ? t("emailAgain") : t("email")}
                </button>
              ) : (
                <span className={`${pill} text-muted`}>{t("noEmail")}</span>
              )}
              <a
                href={row.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={outline}
                onClick={() => {
                  update(row.slug, { whatsapp: t("today") });
                  markWhatsapp(row.slug).catch(() => {});
                }}
              >
                {t("whatsapp")}
              </a>
              <button
                type="button"
                className={outline}
                onClick={async () => {
                  await navigator.clipboard.writeText(row.link).catch(() => {});
                  setCopied(row.slug);
                  setTimeout(() => setCopied((c) => (c === row.slug ? null : c)), 2000);
                }}
              >
                {copied === row.slug ? t("copied") : t("copy")}
              </button>
            </div>
            {sending[row.slug] === "failed" && <p className="mt-2 text-sm text-rose">{t("failed")}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
