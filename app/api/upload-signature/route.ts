import { z } from "zod";
import { clientIp, rateLimiter } from "@/lib/rateLimit";
import { cloudinaryConfig, contextValue, sign, UPLOAD_FOLDER, UPLOAD_TAG } from "@/lib/cloudinary";

// A guest's phone asks for permission to upload one file. We check the event
// code (from the table QR card), then hand back a signed set of upload settings.

const body = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(60),
});

// At most 40 signatures a minute from one IP address.
const tooMany = rateLimiter(40);

export async function POST(request: Request) {
  const config = cloudinaryConfig();
  const eventCode = process.env.SHARE_CODE;
  if (!config || !eventCode) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  if (tooMany(clientIp(request.headers))) return Response.json({ error: "slow-down" }, { status: 429 });

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
