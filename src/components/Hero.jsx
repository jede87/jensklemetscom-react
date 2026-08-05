import { useLang } from '../i18n/LanguageContext.jsx';

export default function Hero() {
  const { t } = useLang();
  const roles = t('hero.roles');

  return (
    <header className="hero">
      <h1 className="hero__name">{t('hero.name')}</h1>
      <p className="hero__roles">
        {roles.map((role, i) => (
          <span key={role}>
            {i > 0 && <span className="sep" aria-hidden="true">/&nbsp;&nbsp;</span>}
            {role}
          </span>
        ))}
      </p>
      <p className="hero__intro">{t('hero.intro')}</p>
      <div className="hero__cta">
        <a className="btn" href="#boka">
          {t('hero.ctaBook')}
        </a>
        <a className="btn" href="#utvecklare" style={{ borderColor: 'var(--line)' }}>
          {t('hero.ctaWork')}
        </a>
      </div>
    </header>
  );
}
