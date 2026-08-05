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

    // 3. Time trap.
    var elapsed = Number(data.elapsed);
    if (!isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
      return drop_('timing');
    }

    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim();
    var date = String(data.date || '').trim(); // YYYY-MM-DD
    var location = String(data.location || '').trim();
    var message = String(data.message || '').trim();

    if (!name || !email || !date || !location) return drop_('missing fields');

    // 4. Size caps och formatkontroll.
    if (
      name.length > LIMITS.name ||
      email.length > LIMITS.email ||
      location.length > LIMITS.location ||
      message.length > LIMITS.message
    ) {
      return drop_('too long');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return drop_('bad email');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return drop_('bad date');
    // Header injection via replyTo/subject.
    if (/[\r\n]/.test(email + name + location)) return drop_('control chars');

    // 5 + 6. Rate limits och dubblettspärr (serialiserat).
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return drop_('busy');
    try {
      var gate = gate_(email, name + '|' + date + '|' + location + '|' + message);
      if (gate) return drop_(gate);
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
    if (!suspicious) {
      var day = new Date(date + 'T00:00:00');
      CalendarApp.getDefaultCalendar().createAllDayEvent(
        'DJ-förfrågan: ' + name + ' @ ' + location,
        day,
        { description: body },
      );
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
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

/** Svarar neutralt och loggar orsaken i Apps Script-loggen. */
function drop_(reason) {
  console.warn('booking dropped: ' + reason);
  return json_({ ok: true }); // säg inget till boten om varför
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
  return json_({ ok: true, service: 'jensklemets booking endpoint' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
