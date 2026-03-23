import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';

import fr from './fr.json';
import en from './en.json';

i18n
  .use(BrowserLanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

