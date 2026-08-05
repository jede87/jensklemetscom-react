import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import Reveal from './Reveal.jsx';

const EMPTY = { name: '', email: '', date: '', location: '', message: '' };
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
  const today = todayISO();
  const endpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
  const configured = endpoint && !endpoint.includes('XXXXXXXX');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
    setStatus('submitting');
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...form, lang }),
      });
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
