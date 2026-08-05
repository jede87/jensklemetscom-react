/**
 * Booking endpoint for jensklemets.com — runs on Google Apps Script.
 *
 * Deploy this signed in as jechnotechno@gmail.com so MailApp and CalendarApp
 * act on that account. See apps-script/README.md for the one-time setup.
 *
 * The React form POSTs JSON (text/plain, no-cors) to the /exec URL. On each
 * request this: (1) emails the request to jechnotechno@gmail.com, and
 * (2) creates a tentative all-day event on the default calendar for the date.
 *
 * Spam defence (no external service, no captcha):
 *   1. shared secret        — blocks scripts that never loaded the site
 *   2. honeypot field       — bots fill hidden inputs, humans can't see them
 *   3. time trap            — a human needs seconds to fill the form
 *   4. size caps            — nothing pathological reaches Gmail
 *   5. rate limits          — per e-post, per timme, per dygn
 *   6. duplicate suppressor — identical payloads within an hour are dropped
 *   7. link heuristics      — flagged, not dropped, so äkta bokningar överlever
 */

// Shared secret. Must match VITE_BOOKING_TOKEN in the site's .env.
// Empty = check disabled (not recommended).
var SHARED_SECRET = '3c2e220c9ac291b1c67f03964d7fe79f5fe2fdb866f348ab';

var NOTIFY_TO = 'jechnotechno@gmail.com';

// Bumpa vid varje ändring. doGet ekar värdet, så du kan öppna /exec i
// webbläsaren och direkt se vilken kod som faktiskt är distribuerad —
// "sparad i editorn" och "utrullad" är två olika saker i Apps Script.
var BUILD = '2026-08-05-c';

// --- tuning knobs -----------------------------------------------------------
var MIN_FILL_MS = 3000;          // snabbare än så = bot
var MAX_FILL_MS = 6 * 3600000;   // äldre flik än 6 h = misstänkt/replay
var MAX_PER_EMAIL_PER_6H = 3;
var MAX_TOTAL_PER_HOUR = 15;
var MAX_TOTAL_PER_DAY = 40;
var LIMITS = { name: 100, email: 150, location: 150, message: 2000 };
var MAX_LINKS_IN_MESSAGE = 2;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return drop_('no body');

    var raw = e.postData.contents;
    if (raw.length > 8000) return drop_('oversized body');

    var data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      return drop_('bad json');
    }

    // 1. Shared secret.
    if (SHARED_SECRET && String(data.token || '') !== SHARED_SECRET) {
      return drop_('bad token');
    }

    // 2. Honeypot — dolda fält ska alltid vara tomma.
    if (String(data.company || '').trim() || String(data.website || '').trim()) {
      return drop_('honeypot');
    }

    // 3. Time trap. För snabbt = bot (tyst). För gammalt kan vara en människa
    // som gick ifrån datorn — den ska få veta att den behöver ladda om.
    var elapsed = Number(data.elapsed);
    if (!isFinite(elapsed) || elapsed < MIN_FILL_MS) return drop_('timing');
    if (elapsed > MAX_FILL_MS) return drop_('stale form', 'stale');

    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim();
    var date = String(data.date || '').trim(); // YYYY-MM-DD
    var location = String(data.location || '').trim();
    var message = String(data.message || '').trim();

    // 4. Size caps och formatkontroll. Allt här är synligt: en människa med
    // ett för långt meddelande ska inte tro att bokningen gick fram.
    if (!name || !email || !date || !location) return drop_('missing fields', 'invalid');
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      location.length > LIMITS.location ||
      message.length > LIMITS.message
    ) {
      return drop_('too long', 'invalid');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return drop_('bad email', 'invalid');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return drop_('bad date', 'invalid');
    // Header injection via replyTo/subject.
    if (/[\r\n]/.test(email + name + location)) return drop_('control chars', 'invalid');

    // 5 + 6. Rate limits och dubblettspärr (serialiserat).
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return drop_('busy', 'retry');
    try {
      var gate = gate_(email, name + '|' + date + '|' + location + '|' + message);
      // Dubblett = den första förfrågan gick igenom. Då är "tack" rätt svar,
      // inte ett fel — annars mejlar besökaren i onödan.
      if (gate === 'duplicate') return drop_('duplicate (redan mottagen)');
      if (gate) return drop_(gate, 'rate');
    } finally {
      lock.releaseLock();
    }

    // 7. Länkheuristik — flagga, kasta inte.
    var links = (message.match(/\b(?:https?:\/\/|www\.)\S+/gi) || []).length;
    var suspicious =
      links > MAX_LINKS_IN_MESSAGE ||
      /\b(?:https?:\/\/|www\.)/i.test(name + ' ' + location) ||
      /\[url=|\[link=|<a\s+href/i.test(message);

    var body =
      'Namn: ' + name + '\n' +
      'E-post: ' + email + '\n' +
      'Datum: ' + date + '\n' +
      'Plats: ' + location + '\n\n' +
      'Meddelande:\n' + (message || '(inget)');

    // Email the request (reply goes straight to the requester).
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject:
        (suspicious ? '[MÖJLIG SPAM] ' : '') +
        'Bokningsförfrågan: ' + name + ' – ' + date,
      body: body,
      replyTo: email,
    });

    // Tentative all-day calendar note — bara för icke-flaggade förfrågningar.
    // Egen try: mejlet är redan skickat, så ett kalenderfel får inte göra att
    // besökaren tror att bokningen misslyckades och skickar om den.
    if (!suspicious) {
      try {
        var day = new Date(date + 'T00:00:00');
        CalendarApp.getDefaultCalendar().createAllDayEvent(
          'DJ-förfrågan: ' + name + ' @ ' + location,
          day,
          { description: body },
        );
      } catch (calErr) {
        console.error('kalendern misslyckades, mejlet gick fram: ' + calErr);
      }
    }

    return reply_({ ok: true });
  } catch (err) {
    // Hit når vi bl.a. om Gmails dygnskvot är slut. Besökaren måste få veta.
    console.error('booking failed: ' + err);
    return reply_({ ok: false, code: 'server' });
  }
}

/**
 * Returnerar en sträng med orsak om förfrågan ska stoppas, annars ''.
 * Räknar upp kvoterna först när förfrågan faktiskt släpps igenom.
 */
function gate_(email, fingerprint) {
  var cache = CacheService.getScriptCache();
  var key = function (s) {
    return Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s),
    ).slice(0, 24);
  };

  var dupKey = 'dup_' + key(email.toLowerCase() + '|' + fingerprint);
  if (cache.get(dupKey)) return 'duplicate';

  var mailKey = 'em_' + key(email.toLowerCase());
  var perEmail = Number(cache.get(mailKey) || 0);
  if (perEmail >= MAX_PER_EMAIL_PER_6H) return 'per-email limit';

  var hourKey = 'hr_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var perHour = Number(cache.get(hourKey) || 0);
  if (perHour >= MAX_TOTAL_PER_HOUR) return 'hourly limit';

  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), 'Europe/Stockholm', 'yyyy-MM-dd');
  var stamp = props.getProperty('day') || '';
  var perDay = stamp === today ? Number(props.getProperty('dayCount') || 0) : 0;
  if (perDay >= MAX_TOTAL_PER_DAY) return 'daily limit';

  cache.put(dupKey, '1', 3600);         // 1 h
  cache.put(mailKey, String(perEmail + 1), 21600); // 6 h (cachens max)
  cache.put(hourKey, String(perHour + 1), 3600);
  props.setProperties({ day: today, dayCount: String(perDay + 1) });
  return '';
}

/**
 * Stoppar en förfrågan och loggar orsaken.
 *
 * Utan `code` svarar vi {ok:true} — det gäller botsignalerna (token, honeypot,
 * för snabb ifyllnad). En bot ska inte kunna kartlägga vilket lager som tog
 * den, och en människa når aldrig hit eftersom formuläret garanterar dem.
 *
 * Med `code` svarar vi {ok:false} — det gäller lägen en människa faktiskt kan
 * hamna i (kvot, trasig indata). Då måste besökaren få veta att bokningen
 * inte gick fram, annars försvinner den tyst.
 */
function drop_(reason, code) {
  console.warn('booking dropped: ' + reason);
  return code ? reply_({ ok: false, code: code }) : reply_({ ok: true });
}

/**
 * Svar från doPost. `kind` är avgörande: Googles redirect-kedja studsar ibland
 * tillbaka till /exec som GET, så att klienten får doGet:s svar i stället för
 * vårt. Utan markören går ett {ok:false} inte att skilja från den studsen, och
 * ett avslag skulle kunna visas som ett "tack". Rör den inte utan att ändra
 * motsvarande kontroll i BookingForm.jsx.
 */
function reply_(obj) {
  obj.kind = 'booking';
  return json_(obj);
}

/**
 * Kör den här från editorn (välj "testBooking" i listan → Kör) för att
 * auktorisera projektet och se att både mejl och kalender fungerar.
 * Skickar ett riktigt mejl till NOTIFY_TO och lägger en post i kalendern —
 * ta bort dem efteråt. Att köra doPost direkt ger bara "no body".
 */
function testBooking() {
  var stamp = new Date();
  var day = new Date(stamp.getTime() + 30 * 86400000);
  var payload = {
    token: SHARED_SECRET,
    name: 'Testbokning ' + Utilities.formatDate(stamp, 'Europe/Stockholm', 'HH:mm:ss'),
    email: NOTIFY_TO,
    date: Utilities.formatDate(day, 'Europe/Stockholm', 'yyyy-MM-dd'),
    location: 'Under Bron',
    message: 'Detta är ett test från Apps Script-editorn.',
    elapsed: MIN_FILL_MS + 1000,
    company: '',
    website: '',
  };
  var res = doPost({ postData: { contents: JSON.stringify(payload) } });
  console.log('svar: ' + res.getContent());
  console.log('Kolla inkorgen på ' + NOTIFY_TO + ' och kalendern ' + payload.date);
}

// Simple GET so you can confirm the deployment is live in a browser.
function doGet() {
  return json_({ ok: true, service: 'jensklemets booking endpoint', build: BUILD });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
