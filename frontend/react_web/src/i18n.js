import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import koTranslation from './locales/ko/translation.json';

i18n
  .use(initReactI18next) // React와 연결
  .init({
    resources: {
      ko: {
        translation: koTranslation,
      },
    },
    lng: 'ko',              // 기본 언어
    fallbackLng: 'ko',      // 번역이 없을 때 기본 한국어
    interpolation: {
      escapeValue: false,   // React는 XSS 자동 방지
    },
  });

export default i18n;