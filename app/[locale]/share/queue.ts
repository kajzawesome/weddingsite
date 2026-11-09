import { createStore, del, entries, set } from "idb-keyval";

/*
  The upload queue lives in IndexedDB, a small database inside the guest's
  browser. Each chosen photo/video is saved there first, so nothing is lost if
  the signal drops, the screen locks or the page is closed: uploads resume
  the next time the page is open with a connection.
*/

export type QueueItem = {
  id: string;
  fileName: string;
  kind: "image" | "video";
  type: string;
  size: number;
  blob: Blob;
  uploadId: string; // groups the pieces of one large upload on Cloudinary
  offset: number; // bytes already uploaded (large files go up in pieces)
  attempts: number;
  createdAt: number;
};

const store = typeof indexedDB === "undefined" ? undefined : createStore("wedding-uploads", "queue");

export const saveItem = (item: QueueItem) => set(item.id, item, store);
export const removeItem = (id: string) => del(id, store);
export async function loadItems(): Promise<QueueItem[]> {
  const all = await entries<string, QueueItem>(store);
  return all.map(([, item]) => item).sort((a, b) => a.createdAt - b.createdAt);
}

export const CHUNK_SIZE = 6 * 1024 * 1024; // Cloudinary needs pieces of at least 5 MB
// Cloudinary's free plan refuses videos over 100 MB. Raise this if we upgrade the plan.
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
// Above either of these we ask "are you sure?" first (big files are slow on venue
// signal), but the guest can always choose to upload anyway.
export const LARGE_VIDEO_BYTES = 40 * 1024 * 1024;
export const LARGE_VIDEO_SECONDS = 60;
const MAX_IMAGE_EDGE = 2500;

/*
  Photos are resized in the browser before uploading (phones take 12+ MP shots):
  much faster on weak signal, and it strips hidden location data. If the browser
  can't read the format (e.g. some HEIC files), the original is uploaded instead.
*/
export async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

// Reads a video's length without uploading it.
export function videoSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0); // unknown length: let Cloudinary decide
    };
    video.src = url;
  });
}

export type Signature = {
  url: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  tags: string;
  context: string;
};

export class UploadError extends Error {
  constructor(
    message: string,
    public permanent: boolean,
    public status = 0,
  ) {
    super(message);
  }
}

// Sends one request (a whole photo, or one piece of a video) with progress updates.
export function sendPart(
  sig: Signature,
  part: Blob,
  fileName: string,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", part, fileName);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("tags", sig.tags);
    form.append("context", sig.context);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.url);
    xhr.timeout = 120_000; // a stalled connection counts as a failure, then we retry
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`HTTP ${xhr.status}`, xhr.status === 400 || xhr.status === 401, xhr.status));
    };
    xhr.onerror = () => reject(new UploadError("network", false));
    xhr.ontimeout = () => reject(new UploadError("timeout", false));
    xhr.send(form);
  });
}
