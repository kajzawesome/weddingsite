import { z } from "zod";
import { cloudinaryConfig, contextValue, sign, UPLOAD_FOLDER, UPLOAD_TAG } from "@/lib/cloudinary";

// A guest's phone asks for permission to upload one file. We check the event
// code (from the table QR card), then hand back a signed set of upload settings.

const body = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(60),
});

// Simple per-device limit: at most 40 signatures a minute from one IP address.
// (Kept in memory, so it's a speed bump rather than a wall, which is fine here.)
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 40;
}

export async function POST(request: Request) {
  const config = cloudinaryConfig();
  const eventCode = process.env.SHARE_CODE;
  if (!config || !eventCode) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooMany(ip)) return Response.json({ error: "slow-down" }, { status: 429 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad-request" }, { status: 400 });
  if (parsed.data.code.toUpperCase() !== eventCode.toUpperCase()) {
    return Response.json({ error: "wrong-code" }, { status: 403 });
  }

  const params = {
    context: `uploader=${contextValue(parsed.data.name)}`,
    folder: UPLOAD_FOLDER,
    tags: UPLOAD_TAG,
    timestamp: Math.round(Date.now() / 1000),
  };

  return Response.json({
    // Overridable so we can test against a fake endpoint locally.
    url:
      process.env.CLOUDINARY_UPLOAD_URL ??
      `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
    apiKey: config.apiKey,
    signature: sign(params, config.apiSecret),
    ...params,
  });
}
