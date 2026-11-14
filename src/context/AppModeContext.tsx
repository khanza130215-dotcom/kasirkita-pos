import * as React from 'react';

const AppModeContext = React.createContext({ mode: 'lite' as 'lite' | 'pro', setMode: (mode: 'lite' | 'pro') => {} });

export const AppModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = React.useState<'lite' | 'pro'>('lite');
  return <AppModeContext.Provider value={{ mode, setMode }}>{children}</AppModeContext.Provider>;
};

export const useAppMode = () => React.useContext(AppModeContext);
