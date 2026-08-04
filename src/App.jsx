import { LanguageProvider, useLang } from './i18n/LanguageContext.jsx';
import LangToggle from './components/LangToggle.jsx';
import Hero from './components/Hero.jsx';
import EditorialSection from './components/EditorialSection.jsx';
import BookingForm from './components/BookingForm.jsx';
import Footer from './components/Footer.jsx';
import Reveal from './components/Reveal.jsx';

function Page() {
  const { t } = useLang();
  return (
    <>
      <div className="topbar">
        <span className="topbar__mark">{t('topbar.mark')}</span>
        <LangToggle />
      </div>

      <Hero />

      <main>
        <EditorialSection id="utvecklare" ns="dev" />
        <EditorialSection id="dj" ns="dj" />

        <section id="boka" className="section">
          <div className="container spread">
            <Reveal as="aside" className="rail">
              <span className="kicker">{t('booking.kicker')}</span>
            </Reveal>
            <Reveal className="prose" delay={120}>
              <h2>{t('booking.title')}</h2>
              <p className="lede" style={{ marginBottom: '2.4rem' }}>
                {t('booking.lede')}
              </p>
              <BookingForm />
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  );
}
