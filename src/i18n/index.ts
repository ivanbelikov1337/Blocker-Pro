import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import uk from './locales/uk.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  pl: { translation: pl },
  pt: { translation: pt },
  ja: { translation: ja },
  zh: { translation: zh },
  ru: { translation: ru },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'uk', 'de', 'fr', 'es', 'pl', 'pt', 'ja', 'zh', 'ru'],
    detection: {
      order: ['navigator', 'htmlTag', 'localStorage', 'cookie'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
