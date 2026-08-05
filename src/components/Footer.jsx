import { useLang } from '../i18n/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLang();
  const email = t('footer.email');

  return (
    <footer className="footer" id="kontakt">
      <span className="kicker">{t('footer.kicker')}</span>
      <div className="footer__grid">
        <div>
          <p className="lede" style={{ maxWidth: '24ch', marginBottom: '1.4rem' }}>
            {t('footer.tagline')}
          </p>
          <ul className="link-list">
            <li>
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/jens-klemets"
                target="_blank"
                rel="noreferrer"
              >
                {t('footer.linkedin')} ↗
              </a>
            </li>
            <li>
              <a href="https://soundcloud.com/jens-klemets" target="_blank" rel="noreferrer">
                {t('footer.soundcloud')} ↗
              </a>
            </li>
          </ul>
        </div>
        <a className="btn" href="#boka">
          {t('footer.book')}
        </a>
      </div>
      <p className="footer__fine">
        © {t('footer.rights')} — Stockholm
      </p>
    </footer>
  );
}
