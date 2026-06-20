/**
 * i18next setup — FR default, EN toggle. Resources are typed in resources.ts.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, DEFAULT_LANGUAGE, type AppLanguage } from './resources';

const STORAGE_KEY = 'moustachir.lang';

const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as AppLanguage | null) : null;
const initial: AppLanguage = stored === 'en' || stored === 'fr' ? stored : DEFAULT_LANGUAGE;

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: AppLanguage) {
  void i18n.changeLanguage(lang);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

// Set initial <html lang> on load.
if (typeof document !== 'undefined') document.documentElement.lang = initial;

export default i18n;
