# CLAUDE.md — KAJ & Tay Wedding Site

Read this file and `PLAN.md` before every task. Work one phase of `PLAN.md` at a time and tick its boxes when done.

## What this is
A wedding website for ~100 guests:
1. Digital invite (envelope-opening animation, story, schedule, travel, FAQ)
2. RSVP
3. Guest photo/video upload via QR code (`/share`)
4. Shared gallery that goes live when the wedding starts (`/gallery`)
5. Invite delivery by email (Resend) and WhatsApp (personal links)

The wedding date is NOT set yet (visa delays). Every event detail lives in `config/event.ts` with placeholders. Never hard-code a date, venue or name anywhere else. The gift registry lives in `config/registry.json`.

## About the developer
KAJ is building this to learn. When you introduce a new concept (server actions, signed uploads, RLS, Open Graph, etc.), explain it in 2–3 plain sentences and say why it's used. Handle boilerplate and config without asking. Prefer simple, elegant UI over feature bloat.

## Stack
- Next.js 16 (App Router, TypeScript, Cache Components on) + Tailwind CSS v4. This Next.js is newer than most training data: read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`). Middleware is `proxy.ts`; the locale comes from `next/root-params`.
- next-intl: English default, Portuguese (pt-BR) and Spanish toggle. All UI text lives in `messages/en.json`, `messages/pt.json`, `messages/es.json`. No hard-coded user-facing strings.
- Framer Motion for animation (respect `prefers-reduced-motion`, always offer "skip")
- RSVPs: Google Sheet via Apps Script (`scripts/rsvp-apps-script.gs`), confirmation email sent from KAJ's Gmail
- Supabase (Postgres) for photo records and likes (Phase 3+)
- Cloudinary for photo/video storage (signed direct uploads from the browser)
- Resend for email
- Vercel for hosting

## Rules
- Mobile first. Most guests open this on a phone from WhatsApp or a QR code. Test at 375px wide.
- Secrets only in `.env.local` (never committed). Keep `.env.example` up to date with every key name.
- Server-only keys (Supabase service role, Cloudinary secret, Resend key) are used only in server code.
- Gallery password and guest codes are checked on the server, never in client code.
- Pages that hold guest info or the gallery set `noindex`.
- Photos and videos upload straight from the phone to Cloudinary; never stream files through our server.
- Uploads must survive bad venue signal: queue on the phone, retry, show progress.
- Keep components small; one feature per folder under `app/`.
- Before calling a phase done: `npm run lint`, `npm run build`, and check the page on a phone-sized viewport.

## Design
- Tone: romantic but professional. No emojis or clip-art; decorative artwork (e.g. roses, sunflowers, Tayna's favourites) only from files KAJ provides
- Colours: blue, pink and gold (tokens in `app/globals.css`: primary, blush, rose, gold)
- Fonts: a serif for names and headings, a clean sans for body text (pick from Google Fonts via `next/font`)

## Commands
- `npm run dev` — local site at http://localhost:3000
- `npm run lint`, `npm run build`
