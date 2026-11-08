/**
 * Makes the table QR code that opens the photo upload page.
 *
 * Usage (from the project folder):
 *   node scripts/make-qr.mts https://kajandtaywedding.com YOURCODE
 *
 * Writes print/share-qr.svg (best for Canva / printing at any size) and
 * print/share-qr.png (1200px). Print the short address and the code under the QR
 * too, for guests whose camera won't scan it.
 *
 * Only print the cards once the domain is final: the QR points at that address.
 * The print/ folder is git-ignored because it contains the event code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";

const [site, code] = process.argv.slice(2);
if (!site || !code) {
  console.error("Usage: node scripts/make-qr.mts <site-url> <event-code>");
  process.exit(1);
}

const url = `${site.replace(/\/$/, "")}/share?c=${encodeURIComponent(code)}`;
const options = {
  errorCorrectionLevel: "M" as const, // survives a little smudging on printed cards
  margin: 2,
  color: { dark: "#2b2a33", light: "#ffffff" },
};

mkdirSync("print", { recursive: true });
writeFileSync("print/share-qr.svg", await QRCode.toString(url, { ...options, type: "svg" }));
await QRCode.toFile("print/share-qr.png", url, { ...options, width: 1200 });
console.log(`QR code for ${url}\n  print/share-qr.svg\n  print/share-qr.png`);
