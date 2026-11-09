# KAJ & Tay Wedding Website

Digital invite, RSVP, guest photo upload and a shared gallery.

Build steps: see `PLAN.md`. Rules for Claude Code: see `CLAUDE.md`.

## Event details (edit in `config/event.ts`)
- Date: not set yet (waiting on visa). Leave `date: null` and the site shows "Date coming soon"
- Sealing: Provo City Center Temple, Provo, Utah
- Ring ceremony and reception: to be decided
- When the day ends: `endsAt` (optional, used for the calendar button; defaults to 6 hours after `startsAt`)
- Dress code: professional or church attire
- RSVP deadline: to be decided
- Languages: English (default), Portuguese and Spanish via the header toggle. All text lives in `messages/en.json`, `pt.json` and `es.json`

## Look and feel
- Colours: blue, pink, gold (tokens in `app/globals.css`)
- Fonts: Cormorant Garamond (headings), Pinyon Script (accents), Inter (text). Set in `lib/fonts.ts`
- Photos: files in `public/photos`, chosen in `config/event.ts`
- Tone: romantic, professional

## Features
- [x] Invite page: hero, our story, schedule, travel and stay, FAQ
- [x] Registry page with gift ideas and store links (edit `config/registry.json`)
- [x] RSVP at `/rsvp`: goes to a Google Sheet and emails the guest a designed confirmation (photo, flowers, the day's schedule, "Add to Google Calendar")
- [x] Guest photo/video upload via QR at `/share`: works on bad signal (queues and retries)
- [x] Shared gallery at `/gallery`: opens when the wedding starts, 5-photo preview, hearts and zip download
- [x] Admin at `/gallery/admin`: hide photos, download everything
- [ ] Admin: send invites
- [ ] Personal guest links with envelope-opening animation (`/i/[guest]`)
- [ ] Invite email via Resend + WhatsApp send button + link preview image

## Privacy
- Guest code: needed for the full gallery only (5-photo preview without it)
- Gallery opens: when the wedding starts
- Guest pages and the gallery are hidden from search engines

## Stack
Next.js 16, Tailwind CSS v4, next-intl, Framer Motion, Vercel, Cloudinary (photos), Google Sheets + Apps Script (RSVPs), Resend (email)

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the keys
3. `npm run dev` and open http://localhost:3000

## One-time setup
- **RSVP sheet:** follow the steps at the top of `scripts/rsvp-apps-script.gs`, then set `RSVP_SCRIPT_URL` and `RSVP_SECRET`. After pasting a newer copy of the script, always Deploy > Manage deployments > New version, or emails keep using the old one
- **Email pictures:** small copies of the art and photo live in `public/email/`. Until `SITE_URL` is set to the live https address they're attached to each email; after that they're linked
- **Photo uploads:** create a Cloudinary account, then set the three `CLOUDINARY` keys and `SHARE_CODE`
- **QR code:** `node scripts/make-qr.mts <site-url> <code>` writes `print/share-qr.svg` and `.png`. Print only once the domain is final
- **Vercel:** add the same keys under Project Settings > Environment Variables

## Launch checklist
- [ ] Domain bought and connected
- [ ] Tested on iPhone and Android, in all three languages
- [ ] Venue signal checked
- [ ] Backup QR (Google Photos album) printed
- [ ] Photo backup downloaded after the wedding
