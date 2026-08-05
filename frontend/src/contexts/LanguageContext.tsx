import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from '../locales/en.json';
import ur_roman from '../locales/ur_roman.json';
import ur from '../locales/ur.json';

export type Language = 'en' | 'ur_roman' | 'ur';

export type TranslationSchema = typeof en;

export const translations: Record<Language, TranslationSchema> = {
  en,
  ur_roman: ur_roman as unknown as TranslationSchema,
  ur: ur as unknown as TranslationSchema
};

export type TranslationKey = 
  | `navigation.${keyof TranslationSchema['navigation']}`
  | `dashboard.${keyof TranslationSchema['dashboard']}`
  | `counter.${keyof TranslationSchema['counter']}`
  | `forms.${keyof TranslationSchema['forms']}`
  | `buttons.${keyof TranslationSchema['buttons']}`
  | `validation.${keyof TranslationSchema['validation']}`
  | `toast.${keyof TranslationSchema['toast']}`
  | `emptyStates.${keyof TranslationSchema['emptyStates']}`
  | `dialogs.${keyof TranslationSchema['dialogs']}`
  | `settings.${keyof TranslationSchema['settings']}`
  | `calendar.${keyof TranslationSchema['calendar']}`
  | `statistics.${keyof TranslationSchema['statistics']}`
  | `history.${keyof TranslationSchema['history']}`
  | `auth.${keyof TranslationSchema['auth']}`;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    // Map previous 'hi' selection to 'ur_roman'
    if (saved === 'hi') return 'ur_roman';
    return (saved as Language) || 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((path: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let currentObj: any = translations[language];
    
    for (const key of keys) {
      if (currentObj && typeof currentObj === 'object' && key in currentObj) {
        currentObj = currentObj[key];
      } else {
        // Fallback to English
        let fallbackObj: any = translations['en'];
        for (const fKey of keys) {
          if (fallbackObj && typeof fallbackObj === 'object' && fKey in fallbackObj) {
            fallbackObj = fallbackObj[fKey];
          } else {
            fallbackObj = path;
            break;
          }
        }
        currentObj = fallbackObj;
        break;
      }
    }
    
    let text = typeof currentObj === 'string' ? currentObj : path;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
