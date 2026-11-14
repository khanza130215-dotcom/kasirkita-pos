import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 rounded-full bg-amber-500 border border-amber-600/40 px-3 py-1 text-[11px] font-medium text-white shadow-md">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode Offline — Data Lokal Aktif</span>
    </div>
  );
};
