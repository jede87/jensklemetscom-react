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
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
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
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          ...form,
          lang,
          token,
          elapsed: Date.now() - startedAt.current,
          company: '',
          website: '',
        }),
      });
      recordSend(sent);
      // Response is opaque under no-cors; resolution implies delivery.
      setStatus('success');
      setForm(EMPTY);
    } catch {
      setStatus('error');
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

      {status === 'error' && (
        <p className="form__status">
          {configured ? t('booking.errorBody') : t('booking.errNotConfigured')}{' '}
          <a href={`mailto:${t('footer.email')}`}>{t('footer.email')}</a>
        </p>
      )}
    </form>
  );
}
