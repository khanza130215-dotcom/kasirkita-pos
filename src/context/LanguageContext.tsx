import * as React from 'react';

const LanguageContext = React.createContext({ lang: 'id', setLang: (lang: string) => {} });

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = React.useState('id');
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => React.useContext(LanguageContext);
