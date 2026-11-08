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
 */

const SECRET = "change-me-to-a-long-random-string";
const SHEET_NAME = "RSVPs";
const FROM_NAME = "KAJ & Tayna";

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
    sheet.appendRow(["Time", "Name", "Email", "Attending", "Guests", "Message", "Language"]);
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
