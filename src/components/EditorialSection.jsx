import { useLang } from '../i18n/LanguageContext.jsx';
import Reveal from './Reveal.jsx';

/** Numbered editorial section: meta rail + prose. Used by Developer & DJ. */
export default function EditorialSection({ id, ns }) {
  const { t } = useLang();
  const rail = t(`${ns}.rail`);

  return (
    <section id={id} className="section">
      <div className="container spread">
        <Reveal as="aside" className="rail">
          <span className="kicker">{t(`${ns}.kicker`)}</span>
          <dl className="rail__meta">
            {rail.map(([term, def]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="prose" delay={120}>
          <h2>{t(`${ns}.title`)}</h2>
          <p className="lede">{t(`${ns}.lede`)}</p>
          <p>{t(`${ns}.body`)}</p>
        </Reveal>
      </div>
    </section>
  );
}
