import { useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import Reveal from './Reveal.jsx';

const EMPTY = { name: '', email: '', date: '', location: '', message: '' };
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Spamskydd: honeypot-fält som bara bottar fyller i, plus en tidsspärr.
// Backend gör samma kontroller igen — det här är bara första ledet.
const HONEYPOT = { company: '', website: '' };
const MIN_FILL_MS = 3500;
const THROTTLE_KEY = 'jk.booking.sent';
const THROTTLE_MAX = 3;
const THROTTLE_WINDOW_MS = 3600000;

function throttled() {
  try {
    const sent = JSON.parse(localStorage.getItem(THROTTLE_KEY) || '[]').filter(
      (ts) => Date.now() - ts < THROTTLE_WINDOW_MS,
    );
    return { blocked: sent.length >= THROTTLE_MAX, sent };
  } catch {
    return { blocked: false, sent: [] };
  }
}

function recordSend(sent) {
  try {
    localStorage.setItem(THROTTLE_KEY, JSON.stringify([...sent, Date.now()]));
  } catch {
    /* privat läge – strunt samma */
  }
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function BookingForm() {
  const { t, lang } = useLang();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  // idle | submitting | success | error | unconfirmed (skickat, obekräftat)
  const [status, setStatus] = useState('idle');
  const trap = useRef({ ...HONEYPOT });
  const startedAt = useRef(0);
  const today = todayISO();
  const endpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
  const token = import.meta.env.VITE_BOOKING_TOKEN || '';
  const configured = endpoint && !endpoint.includes('XXXXXXXX');

  // Klockan startar vid första tangenttrycket, inte vid sidladdning — annars
  // skulle en flik som stått öppen en dag se ut som en replay-attack.
  const set = (key) => (e) => {
    if (!startedAt.current) startedAt.current = Date.now();
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };
  const setTrap = (key) => (e) => {
    trap.current[key] = e.target.value;
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = t('booking.errName');
    if (!EMAIL_RE.test(form.email)) err.email = t('booking.errEmail');
    if (!form.date) err.date = t('booking.errDate');
    else if (form.date < today) err.date = t('booking.errDatePast');
    if (!form.location.trim()) err.location = t('booking.errLocation');
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!configured) {
      setStatus('error');
      return;
    }
    // Honeypot ifyllt = bot. Låtsas att allt gick bra, skicka ingenting.
    if (trap.current.company.trim() || trap.current.website.trim()) {
      setStatus('success');
      return;
    }
    const { blocked, sent } = throttled();
    if (blocked) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    // Tidsspärr: håll inne en supersnabb submit i stället för att avvisa den,
    // så att en rekordsnabb människa inte tappas bort.
    // Autofyll kan hoppa över onChange — sätt klockan här om den inte startat.
    if (!startedAt.current) startedAt.current = Date.now();
    const waited = Date.now() - startedAt.current;
    if (waited < MIN_FILL_MS) {
      await new Promise((r) => setTimeout(r, MIN_FILL_MS - waited));
    }
    const payload = JSON.stringify({
      ...form,
      lang,
      token,
      elapsed: Date.now() - startedAt.current,
      company: '',
      website: '',
    });

    // cors, inte no-cors: Apps Script sätter Access-Control-Allow-Origin på
    // både redirecten och slutsvaret, så vi kan läsa backendens verdict i
    // stället för att anta att allt gick bra. text/plain håller det till en
    // "simple request" — Apps Script kan inte svara på en preflight.
    // Timeouten är tilltagen: rundturen har uppmätts till allt från 1 till 32 s.
    const attempt = async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          signal: AbortSignal.timeout(45000),
          body: payload,
        });
        const data = await res.json();
        // Utan markören läser vi doGet:s svar, inte doPost:s — Googles
        // redirect studsar ibland tillbaka till /exec som GET. Då vet vi
        // ingenting om utfallet och får inte tolka det som ett godkännande.
        if (data.kind !== 'booking') return 'unknown';
        return data.ok ? 'ok' : 'fail';
      } catch {
        return 'unknown';
      }
    };

    // Ett omskick är ofarligt: kom det första fram fångar dubblettspärren i
    // backend det och svarar ok utan att mejla igen.
    let verdict = await attempt();
    if (verdict === 'unknown') verdict = await attempt();

    if (verdict === 'ok') {
      recordSend(sent);
      setStatus('success');
      setForm(EMPTY);
    } else {
      setStatus(verdict === 'fail' ? 'error' : 'unconfirmed');
    }
  };

  if (status === 'success') {
    return (
      <Reveal className="callout">
        <h3>{t('booking.successTitle')}</h3>
        <p style={{ marginBottom: 0 }}>{t('booking.successBody')}</p>
      </Reveal>
    );
  }

  const field = (key, type = 'text', extra = {}) => (
    <div className={`field${errors[key] ? ' field--error' : ''}`}>
      <label htmlFor={key}>{t(`booking.${key}`)}</label>
      {type === 'textarea' ? (
        <textarea
          id={key}
          value={form[key]}
          onChange={set(key)}
          placeholder={t('booking.messagePlaceholder')}
          {...extra}
        />
      ) : (
        <input id={key} type={type} value={form[key]} onChange={set(key)} {...extra} />
      )}
      {errors[key] && <span className="field__error">{errors[key]}</span>}
    </div>
  );

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {/* Honeypot: osynligt för människor, oemotståndligt för bottar. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={setTrap('company')}
        />
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={setTrap('website')}
        />
      </div>

      {field('name')}
      {field('email', 'email')}
      <div className="form__row">
        {field('date', 'date', { min: today })}
        {field('location')}
      </div>
      {field('message', 'textarea', { rows: 4 })}

      <div>
        <button className="btn" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? t('booking.submitting') : t('booking.submit')}
        </button>
      </div>

      {(status === 'error' || status === 'unconfirmed') && (
        <p className="form__status">
          {status === 'unconfirmed'
            ? t('booking.unconfirmedBody')
            : configured
              ? t('booking.errorBody')
              : t('booking.errNotConfigured')}{' '}
          <a href={`mailto:${t('footer.email')}`}>{t('footer.email')}</a>
        </p>
      )}
    </form>
  );
}
