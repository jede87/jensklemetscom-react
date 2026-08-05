import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations.js';

const LanguageContext = createContext(null);

const SUPPORTED = ['sv', 'en'];
const STORAGE_KEY = 'jk-lang';

function detectInitialLang() {
  if (typeof window === 'undefined') return 'sv';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  const nav = (window.navigator.language || 'sv').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(nav) ? nav : 'sv';
}

/** Resolve a dotted key like "booking.name" against the active language. */
function resolve(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const value = useMemo(() => {
    const dict = translations[lang];
    const t = (key) => {
      const val = resolve(dict, key);
      return val === undefined ? key : val;
    };
    return { lang, setLang: setLangState, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
}
