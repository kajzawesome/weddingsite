# KAJ & Tay Wedding Website

Digital invite, RSVP, and shared guest photo gallery.

Build steps: see PLAN.md. Rules for Claude Code: see CLAUDE.md.

## Event details (edit in /config/event.ts)
- Date: [TBD, waiting on visa]
- Ceremony: [venue name, address, time]
- Reception: [venue name, address, time]
- Dress code: [e.g. garden formal]
- RSVP deadline: [date]
- Languages: English (default), Portuguese, Spanish via a toggle in the header (next-intl, files in /messages/en.json, pt.json, es.json)

## Look and feel
- Colours: [e.g. sage, cream, gold]
- Fonts: [e.g. a serif for names, a clean sans for text]
- Hero: [video file or photo]
- Tone: [romantic / playful / minimal]

## Features
- [ ] Invite page (story, schedule, travel, FAQ)
- [ ] RSVP with meal choice and plus-one
- [ ] Guest photo upload via QR (/share)
- [ ] Shared gallery, approved photos only (/gallery)
- [ ] Admin page to approve photos and see RSVPs
- [ ] Personal guest links with envelope-opening animation (/i/[guest])
- [ ] Invite email via Resend (animated envelope GIF + button)
- [ ] WhatsApp share button per guest + link preview image

## Privacy
- Guest password: gallery only (5-photo preview without it)
- Gallery opens: when the wedding starts
- Kids in public photos: [allowed / hide]

## Stack
Next.js, Tailwind, next-intl, Framer Motion, Vercel, Cloudinary, Supabase, Resend

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and add keys
3. `npm run dev` and open http://localhost:3000

## Launch checklist
- [ ] Tested on iPhone and Android
- [ ] Venue signal checked
- [ ] Backup QR (Google Photos album) printed
- [ ] Photo backup downloaded after the wedding
