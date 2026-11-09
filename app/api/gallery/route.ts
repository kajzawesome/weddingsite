import { galleryAccess, galleryIsOpen, listPhotos } from "@/lib/gallery";

// The open gallery calls this every so often to pick up new photos during the
// wedding. Same rules as the page: right code (cookie) and gallery open.
export async function GET() {
  const { guest, admin } = await galleryAccess();
  if (!guest) return Response.json({ error: "locked" }, { status: 401 });
  if (!galleryIsOpen() && !admin) return Response.json({ error: "closed" }, { status: 403 });

  const photos = await listPhotos();
  return Response.json(
    { photos: admin ? photos : photos.filter((p) => !p.hidden) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
