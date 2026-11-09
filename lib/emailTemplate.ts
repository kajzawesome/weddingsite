/*
  HTML for our emails. Email apps (Gmail, Outlook, Apple Mail) are much pickier
  than browsers: no stylesheets, no flexbox, little CSS support. So this uses
  old-school tables and inline styles, which every email app understands.
  Fonts fall back to Georgia / Helvetica where web fonts aren't allowed (Gmail).
  The same look is copied into scripts/rsvp-apps-script.gs for thank-you emails.

  Image src values are either a full https:// URL (once the site is online) or
  "cid:name", which points at an image attached to the email itself.
*/

const C = {
  cream: "#fbf8f5",
  paper: "#ffffff",
  ink: "#2b2a33",
  muted: "#6b6570",
  line: "#ece3dc",
  primary: "#3d5a80",
  gold: "#b8955a",
  blush: "#f6dfe2",
  blushSoft: "#fcf1f2",
};
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Guests type their own name and note, so never put them in HTML unescaped.
export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const lines = (text: string) => escapeHtml(text).replace(/\n/g, "<br>");

export type ScheduleItem = {
  label: string;
  note?: string;
  time: string;
  place: string;
  address?: string;
  map?: { label: string; href: string };
};

export type EmailButton = { label: string; href: string; outline?: boolean };

export type EmailContent = {
  lang: string;
  preview: string; // the grey line shown after the subject in the inbox
  kicker: string; // "The wedding of"
  first: string;
  second: string;
  dateLine: string;
  greeting: string;
  paragraphs: string[];
  summaryTitle?: string;
  summary?: [label: string, value: string][];
  schedule?: { title: string; items: ScheduleItem[]; extra?: [label: string, value: string] };
  buttons?: EmailButton[];
  footnote?: string;
  signoff: string;
  art?: string; // floral header
  photo?: { src: string; alt: string }; // photo of us, 3:2
  footerArt?: string; // flowers under the signoff
};

const kicker = (text: string) =>
  `<tr><td style="padding:20px 24px 4px;font:600 11px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${C.gold}">${escapeHtml(text)}</td></tr>`;

const card = (bg: string, rows: string) => `
          <tr><td style="padding:20px 32px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1px solid ${C.line};border-radius:18px">
              ${rows}
              <tr><td style="height:20px;line-height:20px">&nbsp;</td></tr>
            </table>
          </td></tr>`;

function summaryCard(c: EmailContent) {
  if (!c.summary?.length) return "";
  return card(
    C.cream,
    kicker(c.summaryTitle ?? "") +
      c.summary
        .map(
          ([label, value]) => `
              <tr><td style="padding:10px 24px 0;font:12px/1.4 ${SANS};color:${C.muted}">${escapeHtml(label)}</td></tr>
              <tr><td style="padding:2px 24px 0;font:16px/1.5 ${SANS};color:${C.ink}">${lines(value)}</td></tr>`,
        )
        .join(""),
  );
}

function scheduleCard(c: EmailContent) {
  const s = c.schedule;
  if (!s?.items.length) return "";
  const items = s.items
    .map(
      (i, n) => `
              <tr><td style="padding:${n === 0 ? "10px" : "18px"} 24px 0;font:500 22px/1.25 ${SERIF};color:${C.ink}">${escapeHtml(i.label)}</td></tr>
              <tr><td style="padding:4px 24px 0;font:600 14px/1.4 ${SANS};color:${C.gold}">${escapeHtml(i.time)}</td></tr>
              <tr><td style="padding:2px 24px 0;font:15px/1.5 ${SANS};color:${C.ink}">${escapeHtml(i.place)}${i.address ? `<br><span style="color:${C.muted};font-size:14px">${escapeHtml(i.address)}</span>` : ""}</td></tr>
              ${i.note ? `<tr><td style="padding:4px 24px 0;font:italic 14px/1.5 ${SANS};color:${C.muted}">${escapeHtml(i.note)}</td></tr>` : ""}
              ${i.map ? `<tr><td style="padding:6px 24px 0;font:14px/1.4 ${SANS}"><a href="${escapeHtml(i.map.href)}" style="color:${C.primary};text-decoration:underline">${escapeHtml(i.map.label)}</a></td></tr>` : ""}`,
    )
    .join("");
  const extra = s.extra
    ? `
              <tr><td style="padding:20px 24px 0"><div style="border-top:1px solid ${C.blush};font-size:0;line-height:0">&nbsp;</div></td></tr>
              <tr><td style="padding:14px 24px 0;font:12px/1.4 ${SANS};color:${C.muted}">${escapeHtml(s.extra[0])}</td></tr>
              <tr><td style="padding:2px 24px 0;font:15px/1.5 ${SANS};color:${C.ink}">${lines(s.extra[1])}</td></tr>`
    : "";
  return card(C.blushSoft, kicker(s.title) + items + extra);
}

function buttons(list?: EmailButton[]) {
  if (!list?.length) return "";
  return list
    .map(
      (b, n) => `
          <tr><td align="center" style="padding:${n === 0 ? "28px" : "12px"} 32px 0">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="background:${b.outline ? C.paper : C.primary};border:1px solid ${C.primary};border-radius:999px">
                <a href="${escapeHtml(b.href)}" style="display:inline-block;padding:14px 30px;font:600 15px/1 ${SANS};color:${b.outline ? C.primary : "#ffffff"};text-decoration:none;border-radius:999px">${escapeHtml(b.label)}</a>
              </td>
            </tr></table>
          </td></tr>`,
    )
    .join("");
}

export function renderEmail(c: EmailContent) {
  const photo = c.photo
    ? `<tr><td style="padding:28px 32px 0"><img src="${escapeHtml(c.photo.src)}" width="496" alt="${escapeHtml(c.photo.alt)}" style="display:block;width:100%;max-width:496px;height:auto;border:0;border-radius:18px"></td></tr>`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(c.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<title>${escapeHtml(c.first)} &amp; ${escapeHtml(c.second)}</title>
</head>
<body style="margin:0;padding:0;background:${C.blushSoft}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(c.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.blushSoft}">
    <tr><td align="center" style="padding:28px 10px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.paper};border:1px solid ${C.line};border-radius:28px">
        ${c.art ? `<tr><td align="center" style="padding:24px 32px 0"><img src="${escapeHtml(c.art)}" width="240" alt="" style="display:block;width:240px;max-width:75%;height:auto;border:0"></td></tr>` : ""}
        <tr><td align="center" style="padding:${c.art ? "14px" : "44px"} 32px 0;font:600 11px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${C.gold}">${escapeHtml(c.kicker)}</td></tr>
        <tr><td align="center" style="padding:14px 32px 0;font:400 42px/1.15 ${SERIF};color:${C.ink}">
          ${escapeHtml(c.first)} <span style="font-style:italic;color:${C.gold}">&amp;</span> ${escapeHtml(c.second)}
        </td></tr>
        <tr><td align="center" style="padding:14px 32px 0;font:13px/1 ${SANS};color:${C.gold};letter-spacing:6px">&#8212;&#8212;&#8212;&nbsp;&#9670;&nbsp;&#8212;&#8212;&#8212;</td></tr>
        <tr><td align="center" style="padding:12px 32px 0;font:italic 400 21px/1.4 ${SERIF};color:${C.muted}">${escapeHtml(c.dateLine)}</td></tr>
        ${photo}

        <tr><td style="padding:32px 32px 0;font:500 26px/1.3 ${SERIF};color:${C.ink}">${escapeHtml(c.greeting)}</td></tr>
        ${c.paragraphs.map((p) => `<tr><td style="padding:12px 32px 0;font:16px/1.65 ${SANS};color:${C.ink}">${lines(p)}</td></tr>`).join("")}
        ${summaryCard(c)}
        ${scheduleCard(c)}
        ${buttons(c.buttons)}
        ${c.footnote ? `<tr><td style="padding:28px 32px 0;font:14px/1.6 ${SANS};color:${C.muted}">${lines(c.footnote)}</td></tr>` : ""}
        <tr><td style="padding:28px 32px ${c.footerArt ? "8px" : "44px"};font:400 23px/1.4 ${SERIF};color:${C.ink}">${lines(c.signoff)}</td></tr>
        ${c.footerArt ? `<tr><td align="center" style="padding:0 32px 28px"><img src="${escapeHtml(c.footerArt)}" width="110" alt="" style="display:block;width:110px;height:auto;border:0"></td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
