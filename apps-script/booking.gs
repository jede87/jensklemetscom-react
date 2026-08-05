/**
 * Booking endpoint for jensklemets.com — runs on Google Apps Script.
 *
 * Deploy this signed in as jechnotechno@gmail.com so MailApp and CalendarApp
 * act on that account. See apps-script/README.md for the one-time setup.
 *
 * The React form POSTs JSON (text/plain, no-cors) to the /exec URL. On each
 * request this: (1) emails the request to jechnotechno@gmail.com, and
 * (2) creates a tentative all-day event on the default calendar for the date.
 */

// Optional shared secret. Set the same value in the form payload to block spam.
// Leave empty to accept any request.
var SHARED_SECRET = '';

var NOTIFY_TO = 'jechnotechno@gmail.com';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && data.token !== SHARED_SECRET) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim();
    var date = String(data.date || '').trim(); // YYYY-MM-DD
    var location = String(data.location || '').trim();
    var message = String(data.message || '').trim();

    if (!name || !email || !date || !location) {
      return json_({ ok: false, error: 'missing fields' });
    }

    var body =
      'Namn: ' + name + '\n' +
      'E-post: ' + email + '\n' +
      'Datum: ' + date + '\n' +
      'Plats: ' + location + '\n\n' +
      'Meddelande:\n' + (message || '(inget)');

    // 1. Email the request (reply goes straight to the requester).
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: 'Bokningsförfrågan: ' + name + ' – ' + date,
      body: body,
      replyTo: email,
    });

    // 2. Tentative all-day calendar note on the requested date.
    var day = new Date(date + 'T00:00:00');
    CalendarApp.getDefaultCalendar().createAllDayEvent(
      'DJ-förfrågan: ' + name + ' @ ' + location,
      day,
      { description: body },
    );

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Simple GET so you can confirm the deployment is live in a browser.
function doGet() {
  return json_({ ok: true, service: 'jensklemets booking endpoint' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
