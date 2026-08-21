import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationHI from './locales/hi/translation.json';
import translationDE from './locales/de/translation.json';
import translationPL from './locales/pl/translation.json';
import translationFR from './locales/fr/translation.json';
import translationIT from './locales/it/translation.json';
import translationUR from './locales/ur/translation.json';
import translationRO from './locales/ro/translation.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  hi: { translation: translationHI },
  de: { translation: translationDE },
  pl: { translation: translationPL },
  fr: { translation: translationFR },
  it: { translation: translationIT },
  ur: { translation: translationUR },
  ro: { translation: translationRO },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
