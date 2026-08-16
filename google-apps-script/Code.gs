/**
 * Pik Finder — Contact form handler (Google Apps Script)
 * ------------------------------------------------------
 * This gives you BOTH:
 *   1) An email to sunnysinghauli@gmail.com for every submission
 *   2) A Google Sheet (your "Excel") with one row per message, categorised
 *
 * SETUP (5 minutes, one time):
 * 1. Go to https://sheets.google.com and create a new blank spreadsheet.
 *    Name it e.g. "Pik Finder Messages".
 * 2. In that sheet: Extensions → Apps Script. Delete any sample code.
 * 3. Paste THIS entire file. Click Save.
 * 4. Click Deploy → New deployment → type "Web app".
 *      - Description: Pik Finder contact
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorise when prompted.
 * 5. Copy the "Web app URL" it gives you.
 * 6. In your project's .env file add:
 *      VITE_CONTACT_ENDPOINT=<paste the web app URL here>
 *    then rebuild: npm run build
 *
 * The sheet auto-creates a header row: Timestamp | Category | Name | Email | Message
 * Filter/sort by the Category column to see Bugs, Reviews, Suggestions, etc.
 */

var NOTIFY_EMAIL = 'sunnysinghauli@gmail.com';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var name = String(data.name || '').slice(0, 200);
    var email = String(data.email || '').slice(0, 200);
    var when = new Date();
    
    // Determine if this is a waitlist or contact submission based on the payload
    var isWaitlist = data.profession !== undefined;
    var sheetName = isWaitlist ? 'Waitlist' : 'Contact Messages';
    
    // Get or create the specific sheet
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    var subject, body;

    if (isWaitlist) {
      var profession = String(data.profession || '').slice(0, 100);
      var useCase = String(data.useCase || '').slice(0, 5000);
      var source = String(data.source || '').slice(0, 100);

      // Append row for waitlist
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Name', 'Email', 'Profession', 'Use Case', 'Source']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      }
      sheet.appendRow([when, name, email, profession, useCase, source]);

      subject = '[Pik Finder] New Waitlist Signup: ' + name;
      body = 'Name: ' + name + '\nEmail: ' + email + '\nProfession: ' + profession + '\nUse Case: ' + useCase + '\nSource: ' + source + '\nTime: ' + when;
    } else {
      var category = String(data.category || 'General').slice(0, 60);
      var message = String(data.message || '').slice(0, 5000);

      // Append row for contact message
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Category', 'Name', 'Email', 'Message']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      }
      sheet.appendRow([when, category, name, email, message]);

      subject = '[Pik Finder] ' + category + ' from ' + name;
      body = 'Category: ' + category + '\nName: ' + name + '\nEmail: ' + email + '\nTime: ' + when + '\n\nMessage:\n' + message;
    }

    // Email you a notification
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      replyTo: email || NOTIFY_EMAIL,
      body: body,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Pik Finder contact endpoint is live.');
}
