import "server-only";
import { createHash } from "node:crypto";

/*
  Signed uploads: guests' phones upload straight to Cloudinary (files never pass
  through our server). To stop strangers filling our storage, Cloudinary only
  accepts an upload that carries a "signature": a hash of the upload settings
  plus our secret key. Only our server knows the secret, so only our server can
  sign. The signature also locks the folder, tags and uploader name so a guest
  can't change them.
*/

export const UPLOAD_FOLDER = "wedding";
export const UPLOAD_TAG = "wedding";

export function cloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

// Cloudinary's rule: sort the params, join as a=1&b=2, append the secret, SHA-1 it.
export function sign(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

// Values inside Cloudinary "context" must escape = and |.
export function contextValue(text: string) {
  return text.replace(/([=|])/g, "\\$1");
}
