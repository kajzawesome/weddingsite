/**
 * RSVP receiver: paste this into Google Apps Script (attached to your RSVP sheet).
 *
 * What it does: the website sends each RSVP here. This script adds it as a row
 * in the "RSVP" tab and emails the guest their confirmation from your Gmail.
 *
 * Setup (about 10 minutes):
 *  1. Create a Google Sheet called "Wedding RSVPs". Share it with Tayna.
 *  2. In the sheet: Extensions > Apps Script. Delete what's there, paste this whole file.
 *  3. Change SECRET below to a long random string (any letters/numbers).
 *  4. Click Deploy > New deployment > type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Click Deploy, approve the permissions (it needs Sheets + "send email as you").
 *  5. Copy the Web app URL. In the website folder, create .env.local with:
 *       RSVP_SCRIPT_URL=<the Web app URL>
 *       RSVP_SECRET=<the same SECRET as below>
 *     (Add the same two values in Vercel > Project > Settings > Environment Variables.)
 *  6. IMPORTANT, every time you paste a newer copy of this script:
 *       Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
 *     Saving alone is not enough; the website keeps talking to the old version
 *     (that's why an email can arrive as plain text after a change).
 *
 * "Anyone" access is safe here: without the SECRET the script refuses the request,
 * and the SECRET only lives on our server, never in the browser.
 *
 * Personal invites
 *  Wedding > Set up guest list adds a "Guests" tab. One row per invite (a person or
 *  a household); see "Guest list" further down for the columns. The website's
 *  /invites page reads it and sends the emails through this script.
 *
 * After the wedding: thank-you emails
 *  Reload the sheet and a "Wedding" menu appears at the top.
 *  1. Wedding > Set up thank-you note: adds a "Thank-you note" tab with a draft in
 *     English, Portuguese and Spanish. Edit the wording there. {name} becomes each
 *     guest's first name.
 *  2. Wedding > Send a test to me: emails you the English version to check.
 *  3. Wedding > Send thank-you emails: sends to everyone who said Yes, in their
 *     language, and writes the date in the "Thank-you sent" column so nobody gets
 *     two. Gmail allows about 100 emails a day; if it stops early, run it again
 *     tomorrow and it carries on where it left off.
 *  To thank someone who didn't RSVP Yes (e.g. a gift from afar), add a row for
 *  them with Attending = Yes.
 */

const SECRET = "change-me-to-a-long-random-string";
const SHEET_NAME = "RSVP"; // the tab name at the bottom of the sheet
const FROM_NAME = "KAJ & Tayna";
const NOTE_SHEET = "Thank-you note";
// Columns in the RSVPs tab (1 = A)
const COL = { name: 2, email: 3, attending: 4, language: 7, thanked: 8 };

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: "unauthorized" });
    if (data.action) return reply(guestAction(data)); // invites (see "Guest list" below)

    // Lock so two RSVPs at the same moment don't overwrite each other's row.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet().appendRow([
        new Date(),
        clean(data.name),
        clean(data.email),
        clean(data.attending),
        Number(data.guests) || 0,
        clean(data.message),
        clean(data.locale),
      ]);
    } finally {
      lock.releaseLock();
    }

    MailApp.sendEmail({
      to: data.email,
      subject: data.subject,
      body: data.body, // plain-text fallback
      htmlBody: data.html || undefined, // the designed version, built by the website
      inlineImages: inlineImages(data.images), // pictures the HTML shows with "cid:name"
      name: FROM_NAME,
    });

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// ---------- Guest list (personal invites) ----------
/*
  The "Guests" tab: one row per invite (a person or a household).
    Link ID      : the end of their personal link, e.g. ana-silva. Leave it
                   blank and it's made from the name the first time the site
                   reads the list. Don't change it once the invite is sent.
    Name         : what the envelope says, e.g. "Ana" or "Ana & Pedro"
    Email        : for the "Email" button (optional)
    WhatsApp     : number with country code, e.g. +55 71 91234-5678 (optional)
    Language     : en, pt or es
    Emailed / WhatsApp sent / Opened : filled in by the website
*/
const GUESTS_SHEET = "Guests";
const GUEST_HEADERS = ["Link ID", "Name", "Email", "WhatsApp", "Language", "Emailed", "WhatsApp sent", "Opened"];
const G = { slug: 0, name: 1, email: 2, phone: 3, lang: 4, emailed: 5, whatsapp: 6, opened: 7 }; // 0 = column A

function guestAction(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getGuestSheet();
    const rows = withSlugs(sheet);
    const find = function (slug) {
      for (let r = 1; r < rows.length; r++) if (rows[r][G.slug] === slug) return r;
      return -1;
    };

    if (data.action === "guests") return { ok: true, guests: rows.slice(1).filter(function (row) { return row[G.name]; }).map(toGuest) };

    const r = find(String(data.slug || ""));
    if (data.action === "guest") return { ok: true, guest: r > 0 ? toGuest(rows[r]) : null };
    if (r < 0) return { ok: false, error: "no such guest" };

    // Write a date into one column (only the first time, for "opened").
    const stamp = function (col, onlyOnce) {
      if (onlyOnce && rows[r][col]) return;
      sheet.getRange(r + 1, col + 1).setValue(new Date());
    };
    if (data.action === "opened") stamp(G.opened, true);
    else if (data.action === "whatsapp") stamp(G.whatsapp, false);
    else if (data.action === "sendInvite") {
      const email = String(rows[r][G.email]).trim();
      if (!email) return { ok: false, error: "no email" };
      MailApp.sendEmail({
        to: email,
        subject: data.subject,
        body: data.body,
        htmlBody: data.html || undefined,
        inlineImages: inlineImages(data.images),
        name: FROM_NAME,
      });
      stamp(G.emailed, false);
    } else return { ok: false, error: "unknown action" };
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getGuestSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GUESTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(GUESTS_SHEET);
    sheet.appendRow(GUEST_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange("D:D").setNumberFormat("@"); // keep "+55..." as text, not a number
  }
  return sheet;
}

// Reads the tab, filling in any missing Link IDs (unique, made from the name).
function withSlugs(sheet) {
  const rows = sheet.getDataRange().getDisplayValues();
  const used = {};
  rows.slice(1).forEach(function (row) { if (row[G.slug]) used[row[G.slug]] = true; });
  for (let r = 1; r < rows.length; r++) {
    if (rows[r][G.slug] || !rows[r][G.name]) continue;
    const base = slugify(rows[r][G.name]) || "guest";
    let slug = base;
    for (let n = 2; used[slug]; n++) slug = base + "-" + n;
    used[slug] = true;
    rows[r][G.slug] = slug;
    sheet.getRange(r + 1, G.slug + 1).setValue(slug);
  }
  return rows;
}

// "Ana & Pedro Simões" -> "ana-pedro-simoes"
function slugify(text) {
  return String(text)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function toGuest(row) {
  return {
    slug: row[G.slug],
    name: row[G.name],
    email: row[G.email],
    phone: row[G.phone],
    lang: String(row[G.lang] || "en").trim().toLowerCase(),
    emailed: row[G.emailed],
    whatsapp: row[G.whatsapp],
    opened: row[G.opened],
  };
}

// Before the site is online, the website sends the email's pictures as base64
// text: { garland: { data, type }, ... }. This turns them into attachments.
function inlineImages(images) {
  if (!images) return undefined;
  const out = {};
  Object.keys(images).forEach(function (name) {
    const img = images[name];
    out[name] = Utilities.newBlob(Utilities.base64Decode(img.data), img.type, name);
  });
  return out;
}

// Finds (or creates) the RSVP tab. If it's empty, adds the headers and a
// running total, so it works whether you made the tab yourself or not.
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Time", "Name", "Email", "Attending", "Guests", "Message", "Language", "Thank-you sent"]);
    sheet.setFrozenRows(1);
    sheet.getRange("I1").setValue("Total guests coming");
    sheet.getRange("I2").setFormula('=SUMIF(D:D,"Yes",E:E)');
  }
  return sheet;
}

// Stops text like "=SUM(...)" in a guest's answer being run as a spreadsheet formula.
function clean(value) {
  const text = String(value == null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Thank-you emails ----------

// Adds the "Wedding" menu when the sheet opens.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Wedding")
    .addItem("Set up guest list", "setUpGuestList")
    .addSeparator()
    .addItem("Set up thank-you note", "setUpThankYouNote")
    .addItem("Send a test to me", "sendThankYouTest")
    .addItem("Send thank-you emails", "sendThankYous")
    .addToUi();
}

// Creates the "Guests" tab (if needed) and fills in Link IDs for any new rows.
function setUpGuestList() {
  const sheet = getGuestSheet();
  withSlugs(sheet);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
}

// A tab with one row per language: Language | Subject | Message. Edit freely.
function setUpThankYouNote() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(NOTE_SHEET)) {
    SpreadsheetApp.getUi().alert('The "' + NOTE_SHEET + '" tab already exists. Edit the wording there.');
    return;
  }
  const sheet = ss.insertSheet(NOTE_SHEET);
  sheet.getRange(1, 1, 4, 3).setValues([
    ["Language", "Subject", "Message ({name} = the guest's first name)"],
    [
      "en",
      "Thank you, from KAJ & Tayna",
      [
        "Dear {name},",
        "",
        "Thank you so much for celebrating with us. Having you there made our day even more special, and we're so grateful for your love and support.",
        "",
        "All the photos and videos from the day are in our album: [add the album link and code here]",
        "",
        "With love,",
        "KAJ & Tayna",
      ].join("\n"),
    ],
    [
      "pt",
      "Obrigado, de KAJ & Tayna",
      [
        "Querido(a) {name},",
        "",
        "Muito obrigado por celebrar com a gente. Ter você lá deixou o nosso dia ainda mais especial, e somos muito gratos pelo seu carinho e apoio.",
        "",
        "Todas as fotos e vídeos do dia estão no nosso álbum: [coloque aqui o link e o código do álbum]",
        "",
        "Com amor,",
        "KAJ & Tayna",
      ].join("\n"),
    ],
    [
      "es",
      "Gracias, de KAJ & Tayna",
      [
        "Querido(a) {name}:",
        "",
        "Muchas gracias por celebrar con nosotros. Tenerte allí hizo nuestro día aún más especial, y estamos muy agradecidos por tu cariño y apoyo.",
        "",
        "Todas las fotos y videos del día están en nuestro álbum: [añade aquí el enlace y el código del álbum]",
        "",
        "Con cariño,",
        "KAJ & Tayna",
      ].join("\n"),
    ],
  ]);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(3, 600);
  sheet.getRange("C2:C4").setWrap(true);
  ss.setActiveSheet(sheet);
}

// Reads the note tab into { en: {subject, body}, pt: ..., es: ... }.
function getNotes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOTE_SHEET);
  if (!sheet) throw new Error('Run "Set up thank-you note" first.');
  const notes = {};
  sheet.getDataRange().getValues().slice(1).forEach(function (row) {
    const lang = String(row[0]).trim().toLowerCase();
    if (lang && row[1] && row[2]) notes[lang] = { subject: String(row[1]), body: String(row[2]) };
  });
  if (!notes.en) throw new Error('The "' + NOTE_SHEET + '" tab needs an "en" row.');
  return notes;
}

function fillIn(note, fullName) {
  const first = String(fullName).trim().split(/\s+/)[0] || "";
  return note.body.replace(/\{name\}/g, first);
}

function sendThankYouTest() {
  const ui = SpreadsheetApp.getUi();
  try {
    const note = getNotes().en;
    const me = Session.getActiveUser().getEmail();
    sendNote(me, "[Test] " + note.subject, fillIn(note, "Ana"));
    ui.alert("Sent a test to " + me + ".");
  } catch (err) {
    ui.alert(String(err.message || err));
  }
}

function sendThankYous() {
  const ui = SpreadsheetApp.getUi();
  let notes;
  try {
    notes = getNotes();
  } catch (err) {
    ui.alert(String(err.message || err));
    return;
  }

  const sheet = getSheet();
  if (!sheet.getRange(1, COL.thanked).getValue()) sheet.getRange(1, COL.thanked).setValue("Thank-you sent");
  const rows = sheet.getDataRange().getValues();

  // One email per address: if a guest RSVP'd twice, their latest answer counts.
  const latest = {};
  for (let r = 1; r < rows.length; r++) {
    const email = String(rows[r][COL.email - 1]).trim().toLowerCase();
    if (email) latest[email] = r;
  }
  const thanked = {};
  for (let r = 1; r < rows.length; r++) {
    const email = String(rows[r][COL.email - 1]).trim().toLowerCase();
    if (rows[r][COL.thanked - 1]) thanked[email] = true;
  }
  const todo = Object.keys(latest)
    .filter(function (email) {
      return !thanked[email] && String(rows[latest[email]][COL.attending - 1]).trim().toLowerCase() === "yes";
    })
    .map(function (email) {
      return latest[email];
    });

  if (todo.length === 0) {
    ui.alert("Everyone who said Yes has already been thanked.");
    return;
  }
  const ok = ui.alert(
    "Send thank-you emails?",
    "This emails " + todo.length + " guest(s) from your Gmail, each in their own language.",
    ui.ButtonSet.YES_NO,
  );
  if (ok !== ui.Button.YES) return;

  let sent = 0;
  for (const r of todo) {
    if (MailApp.getRemainingDailyQuota() < 1) break;
    const row = rows[r];
    const note = notes[String(row[COL.language - 1]).trim().toLowerCase()] || notes.en;
    sendNote(String(row[COL.email - 1]).trim(), note.subject, fillIn(note, row[COL.name - 1]));
    sheet.getRange(r + 1, COL.thanked).setValue(new Date());
    sent++;
  }

  const left = todo.length - sent;
  ui.alert(
    left === 0
      ? "Done! Sent " + sent + " thank-you emails."
      : "Sent " + sent + ". Gmail's daily limit was reached; run this again tomorrow to send the other " + left + ".",
  );
}

// ---------- Email design ----------
// Same look as the website's RSVP email (lib/emailTemplate.ts): a white card
// on cream, our names with a gold "&". Email apps need tables and inline styles.
// Edit COUPLE if the names change.
const COUPLE = { first: "KAJ", second: "Tayna" };

function sendNote(to, subject, text) {
  MailApp.sendEmail({ to: to, subject: subject, body: text, htmlBody: noteHtml(text), name: FROM_NAME });
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Turns the plain note into the designed email: the first line ("Dear Ana,")
// becomes the greeting, the last paragraph ("With love, ...") the signoff.
function noteHtml(text) {
  const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const sans = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const paras = String(text).split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(String);
  const greeting = paras.length > 2 ? paras.shift() : "";
  const signoff = paras.length > 1 ? paras.pop() : "";
  const cell = function (style, html) { return '<tr><td style="' + style + '">' + html + "</td></tr>"; };
  const br = function (t) { return esc(t).replace(/\n/g, "<br>"); };

  return [
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;600&display=swap" rel="stylesheet"></head>',
    '<body style="margin:0;padding:0;background:#fbf8f5">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f5"><tr><td align="center" style="padding:32px 12px">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece3dc;border-radius:28px">',
    cell("padding:44px 40px 0;text-align:center;font:400 40px/1.15 " + serif + ";color:#2b2a33",
      esc(COUPLE.first) + ' <span style="font-style:italic;color:#b8955a">&amp;</span> ' + esc(COUPLE.second)),
    cell("padding:14px 40px 0;text-align:center;font:13px/1 " + sans + ";color:#b8955a;letter-spacing:6px",
      "&#8212;&#8212;&#8212;&nbsp;&#9670;&nbsp;&#8212;&#8212;&#8212;"),
    greeting ? cell("padding:36px 40px 0;font:500 24px/1.3 " + serif + ";color:#2b2a33", br(greeting)) : "",
    paras.map(function (p) { return cell("padding:12px 40px 0;font:16px/1.65 " + sans + ";color:#2b2a33", br(p)); }).join(""),
    signoff ? cell("padding:32px 40px 44px;font:400 22px/1.4 " + serif + ";color:#2b2a33", br(signoff)) : cell("height:44px", ""),
    "</table></td></tr></table></body></html>",
  ].join("");
}
