# PLAN.md — Build plan

How to use: open the repo in VS Code, start Claude Code, and say
**"Read CLAUDE.md and PLAN.md, then do Phase 1."** Review, test, commit, then move to the next phase.
Each phase ends with something working you can show Tay.

Decisions so far (2026-11-08):
- Build it ourselves. Repo: https://github.com/kajzawesome/weddingsite
- Domain: `JacobsSandeWedding.com` or `KAJandTayWedding.com` (undecided)
- English first, PT/ES toggle (Tay's family is in Brazil)
- ~100 guests
- Gallery goes live when the wedding starts; password on the gallery only; 5-photo public preview; heart photos, then download all hearted as a zip
- Open: during the wedding, do photos auto-publish (with a one-tap hide) or does a trusted friend approve them?

---

## Phase 0 — Accounts and setup (KAJ, ~1 hour)
- [x] Clone the repo, add `CLAUDE.md`, `PLAN.md`, `README.md`
- [ ] Create free accounts: Vercel, Supabase, Cloudinary, Resend
- [ ] Buy the domain (can wait until Phase 6)
- [ ] Connect the GitHub repo to Vercel so every push deploys

## Phase 1 — Project + invite page (1 weekend)
Learn: React components, Tailwind, App Router, i18n, deploys.
- [x] Scaffold: `npx create-next-app@latest` (TypeScript, Tailwind, App Router, ESLint)
- [x] Add next-intl with locales `en` (default), `pt`, `es`; routes `/[locale]/...`; language toggle in the header that remembers the choice
- [x] `config/event.ts` with placeholders: couple names, date (`null` = "Date coming soon"), ceremony + reception venues, dress code, RSVP deadline, hero media
- [x] Home page sections: hero (video with photo fallback), our story, schedule, travel and stay, FAQ, RSVP button
- [x] Fonts via `next/font`, colours as Tailwind theme tokens
- [x] Registry page `/registry`: what we'd love (no prices), store buttons that say "Link coming soon" until the links are added in `config/registry.json`
- [x] Placeholder `/gallery` and `/share` pages ("opens on the wedding day"), linked as "Photos" in the header
- [ ] Deployed on Vercel preview URL
Done when: the page looks good on a phone in all three languages, with no hard-coded text.

## Phase 2 — RSVP (done differently than first planned)
Decision (2026-11-08): RSVPs go to a Google Sheet instead of Supabase, so KAJ and Tayna can read them on their phones.
- [x] RSVP form at `/rsvp`: name, email, attending yes/no, party size (1–8), optional note; spam honeypot; noindex
- [x] Server action validates with zod, then posts to a Google Apps Script (`scripts/rsvp-apps-script.gs`) with a shared secret
- [x] Apps Script appends a row to the "RSVPs" tab and emails the guest a confirmation in their language from KAJ's Gmail
- [ ] KAJ: create the sheet, paste the script, deploy, add `RSVP_SCRIPT_URL` + `RSVP_SECRET` to `.env.local` and Vercel
- [ ] Later (optional): guest list import + personal links `/i/[slug]` pre-filling the form; registry editing without code
Done when: a real RSVP from a phone shows in the sheet and the guest gets the email.

## Phase 3 — Photo upload + QR (built 2026-11-08, needs Cloudinary account)
Decision: Cloudinary only (no Supabase); photos are tagged/foldered there and listed from it in Phase 4.
- [x] `/api/upload-signature`: checks the event code (`SHARE_CODE`), rate-limits, returns a signed upload (folder `wedding`, tag `wedding`, uploader name in context)
- [x] `/share`: code from the QR link (remembered), name asked once, pick many photos/videos
- [x] Photos resized to 2500px in the browser (also strips GPS); videos capped at 60 s / 100 MB (Cloudinary free limit)
- [x] Queue saved in IndexedDB: survives bad signal, offline, locked screen and closing the page; retries with backoff; videos upload in 6 MB pieces and resume mid-file
- [x] Keeps the screen awake while uploading; warns before leaving mid-upload
- [x] QR generator: `node scripts/make-qr.mts <site-url> <code>` → `print/share-qr.svg/png`
- [x] Tested with a flaky fake Cloudinary: dropped requests retried, signatures valid, resumed after closing the page
- [ ] KAJ: create Cloudinary account, add the 4 env keys (`.env.example`), test from a real phone
- [ ] Print QR cards only after the domain is final

## Phase 4 — Gallery (1 weekend)
Learn: auth with cookies, image optimisation, zip downloads.
- [ ] `gallery_opens_at` in `config/event.ts` (= start of the wedding)
- [ ] Before it opens: "Gallery opens on the day" page with a countdown
- [ ] Public `/gallery`: 5 preview photos + "Enter the guest code to see all"
- [ ] Code checked on the server, stored in an httpOnly cookie
- [ ] Full gallery: masonry grid, lightbox, videos, newest first, live refresh during the wedding
- [ ] Photo prompts strip ("A photo with the grandparents", "The dance floor from above", "Your table's best selfie") to nudge new angles
- [ ] Heart button on each photo (`likes` table or localStorage per device), "My hearts" filter, "Download all hearted" as a zip
- [ ] Admin: one-tap hide/unhide, "download everything" backup
Done when: a guest with the code can heart 10 photos and download them as one zip.

## Phase 5 — Envelope invite + sending (1 weekend)
Learn: animation, transactional email, Open Graph link previews.
- [ ] `/i/[slug]`: envelope with "To Ana" / "Para Ana" in the guest's locale; tap to break the seal, card slides out, then the invite page. "Skip" button and reduced-motion version
- [ ] Record `invite_opened_at` when opened
- [ ] Open Graph image (`opengraph-image.tsx`) of the sealed envelope with your names, so WhatsApp and iMessage show a nice card
- [ ] Email template (React Email) with an animated envelope GIF and "Open your invitation" button; send through Resend from your domain
- [ ] Admin: per-guest "Send email" and "Send on WhatsApp" (opens `wa.me` with a pre-written message in their language); shows who opened
Done when: you send yourself the email and a WhatsApp link, and both open the animation.

## Phase 6 — Launch (ongoing)
- [ ] Buy and connect the domain on Vercel; set up Resend DNS (SPF/DKIM) so email lands in the inbox
- [ ] Friends test on iPhone + Android, in PT and ES
- [ ] Check signal at the venue
- [ ] Backup: a Google Photos album QR printed, just in case
- [ ] After the wedding: download a full backup to Drive + a hard drive

---

## Risks to keep in mind
- Bad venue signal → upload queue and "you can upload for 2 weeks after"
- Storage: ~100 guests ≈ 2,000 photos + 100 videos; fits Cloudinary's free tier if photos are resized and videos capped
- Live gallery means photos show without review → decide auto-publish vs a friend moderating
- Date still unknown → nothing printed early should include the date
- Vercel's free plan is for personal use only; selling this to other couples later means the paid plan
