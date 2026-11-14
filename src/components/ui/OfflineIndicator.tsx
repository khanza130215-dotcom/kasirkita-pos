import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-medium text-white shadow-md">
      <WifiOff className="w-3 h-3 shrink-0" />
      <span>Mode Offline — Data Lokal Aktif</span>
    </div>
  );
};
