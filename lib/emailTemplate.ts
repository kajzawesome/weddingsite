/*
  HTML for our emails. Email apps (Gmail, Outlook, Apple Mail) are much pickier
  than browsers: no stylesheets, no flexbox, little CSS support. So this uses
  old-school tables and inline styles, which every email app understands.
  Fonts fall back to Georgia / Helvetica where web fonts aren't allowed (Gmail).
  The same look is copied into scripts/rsvp-apps-script.gs for thank-you emails.
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
};
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Guests type their own name and note, so never put them in HTML unescaped.
export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const lines = (text: string) => escapeHtml(text).replace(/\n/g, "<br>");

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
  footnote?: string;
  button?: { label: string; href: string };
  signoff: string;
  art?: string; // absolute URL of the floral header (only works once the site is online)
};

export function renderEmail(c: EmailContent) {
  const summary =
    c.summary && c.summary.length > 0
      ? `
          <tr><td style="padding:8px 40px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border:1px solid ${C.line};border-radius:16px">
              <tr><td style="padding:20px 24px 6px;font:600 11px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${C.gold}">${escapeHtml(c.summaryTitle ?? "")}</td></tr>
              ${c.summary
                .map(
                  ([label, value]) => `
              <tr><td style="padding:10px 24px 0;font:12px/1.4 ${SANS};color:${C.muted}">${escapeHtml(label)}</td></tr>
              <tr><td style="padding:2px 24px 0;font:16px/1.5 ${SANS};color:${C.ink}">${lines(value)}</td></tr>`,
                )
                .join("")}
              <tr><td style="height:20px;line-height:20px">&nbsp;</td></tr>
            </table>
          </td></tr>`
      : "";

  const button = c.button
    ? `
          <tr><td align="center" style="padding:32px 40px 0">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="background:${C.primary};border-radius:999px">
                <a href="${escapeHtml(c.button.href)}" style="display:inline-block;padding:14px 32px;font:600 15px/1 ${SANS};color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(c.button.label)}</a>
              </td>
            </tr></table>
          </td></tr>`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(c.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<title>${escapeHtml(c.first)} &amp; ${escapeHtml(c.second)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(c.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.paper};border:1px solid ${C.line};border-radius:28px">
        ${c.art ? `<tr><td align="center" style="padding:28px 40px 0"><img src="${escapeHtml(c.art)}" width="220" alt="" style="display:block;width:220px;max-width:70%;height:auto;border:0"></td></tr>` : ""}
        <tr><td align="center" style="padding:${c.art ? "16px" : "44px"} 40px 0;font:600 11px/1 ${SANS};letter-spacing:4px;text-transform:uppercase;color:${C.gold}">${escapeHtml(c.kicker)}</td></tr>
        <tr><td align="center" style="padding:14px 40px 0;font:400 40px/1.15 ${SERIF};color:${C.ink}">
          ${escapeHtml(c.first)} <span style="font-style:italic;color:${C.gold}">&amp;</span> ${escapeHtml(c.second)}
        </td></tr>
        <tr><td align="center" style="padding:14px 40px 0;font:13px/1 ${SANS};color:${C.gold};letter-spacing:6px">&#8212;&#8212;&#8212;&nbsp;&#9670;&nbsp;&#8212;&#8212;&#8212;</td></tr>
        <tr><td align="center" style="padding:12px 40px 0;font:400 20px/1.4 ${SERIF};color:${C.muted}">${escapeHtml(c.dateLine)}</td></tr>

        <tr><td style="padding:36px 40px 0;font:500 24px/1.3 ${SERIF};color:${C.ink}">${escapeHtml(c.greeting)}</td></tr>
        ${c.paragraphs.map((p) => `<tr><td style="padding:12px 40px 0;font:16px/1.65 ${SANS};color:${C.ink}">${lines(p)}</td></tr>`).join("")}
        ${summary}
        ${c.footnote ? `<tr><td style="padding:20px 40px 0;font:14px/1.6 ${SANS};color:${C.muted}">${lines(c.footnote)}</td></tr>` : ""}
        ${button}
        <tr><td style="padding:36px 40px 44px;font:400 22px/1.4 ${SERIF};color:${C.ink}">${lines(c.signoff)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
