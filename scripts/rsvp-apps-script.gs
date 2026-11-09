/**
 * RSVP receiver: paste this into Google Apps Script (attached to your RSVP sheet).
 *
 * What it does: the website sends each RSVP here. This script adds it as a row
 * in the "RSVPs" tab and emails the guest their confirmation from your Gmail.
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
 *  6. If you edit this script later: Deploy > Manage deployments > edit > New version.
 *
 * "Anyone" access is safe here: without the SECRET the script refuses the request,
 * and the SECRET only lives on our server, never in the browser.
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
const SHEET_NAME = "RSVPs";
const FROM_NAME = "KAJ & Tayna";
const NOTE_SHEET = "Thank-you note";
// Columns in the RSVPs tab (1 = A)
const COL = { name: 2, email: 3, attending: 4, language: 7, thanked: 8 };

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: "unauthorized" });

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
      body: data.body,
      name: FROM_NAME,
    });

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// Creates the RSVPs tab with headers and a running total the first time.
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
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
    .addItem("Set up thank-you note", "setUpThankYouNote")
    .addItem("Send a test to me", "sendThankYouTest")
    .addItem("Send thank-you emails", "sendThankYous")
    .addToUi();
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
    MailApp.sendEmail({ to: me, subject: "[Test] " + note.subject, body: fillIn(note, "Ana"), name: FROM_NAME });
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
    MailApp.sendEmail({ to: String(row[COL.email - 1]).trim(), subject: note.subject, body: fillIn(note, row[COL.name - 1]), name: FROM_NAME });
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
