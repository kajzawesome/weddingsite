// One photo or video in the shared gallery. Safe to send to the browser:
// it only holds public URLs, never keys.
export type GalleryItem = {
  id: string; // Cloudinary public_id (or the file path in demo mode)
  kind: "image" | "video";
  thumb: string; // small, for the grid
  large: string; // screen-sized, for the full-screen view (a still frame for videos)
  video?: string; // playable file, videos only
  original: string; // full-quality file, used for the zip download
  download: string; // link that saves the file instead of opening it
  width: number;
  height: number;
  by: string | null; // the guest's name from the upload page
  at: string; // ISO time it was uploaded
  hidden: boolean;
};
