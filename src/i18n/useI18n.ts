import { useCallback } from 'react';
import { detectLanguage, Language, translations, TranslationKey } from './translations';

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }, template);
};

export const useI18n = () => {
  const language: Language = detectLanguage();

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const value = translations[language][key] ?? translations.en[key];
    return interpolate(value, params);
  }, [language]);

  return {
    language,
    t
  };
};
