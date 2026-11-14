import React, { createContext, useCallback, useContext, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  DEMO_MAX_TRANSACTIONS,
  getOrCreateDeviceId,
  getStoredActivatedLicense,
  saveActivatedLicense,
} from '../services/licenseService';

export interface LicenseContextValue {
  deviceId: string;
  isActivated: boolean;
  activatedKey: string | null;
  transactionCount: number;
  maxDemoTransactions: number;
  remainingTransactions: number;
  isDemoExpired: boolean;
  isActivationModalOpen: boolean;
  openActivationModal: () => void;
  closeActivationModal: () => void;
  activateApp: (code: string) => { success: boolean; message: string };
}

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [activatedKey, setActivatedKey] = useState<string | null>(() =>
    getStoredActivatedLicense(getOrCreateDeviceId())
  );
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);

  const transactionCount = useLiveQuery(() => db.transactions.count(), [], 0) ?? 0;

  const isActivated = Boolean(activatedKey);
  const remainingTransactions = Math.max(0, DEMO_MAX_TRANSACTIONS - transactionCount);
  const isDemoExpired = !isActivated && transactionCount >= DEMO_MAX_TRANSACTIONS;

  const openActivationModal = useCallback(() => {
    setIsActivationModalOpen(true);
  }, []);

  const closeActivationModal = useCallback(() => {
    setIsActivationModalOpen(false);
  }, []);

  const activateApp = useCallback(
    (code: string): { success: boolean; message: string } => {
      if (!code.trim()) {
        return { success: false, message: 'Masukkan Kode Aktivasi terlebih dahulu.' };
      }

      const ok = saveActivatedLicense(code, deviceId);
      if (!ok) {
        return {
          success: false,
          message: 'Kode Aktivasi tidak valid untuk ID Perangkat ini.',
        };
      }

      const stored = getStoredActivatedLicense(deviceId);
      setActivatedKey(stored);
      setIsActivationModalOpen(false);
      return {
        success: true,
        message: 'Aplikasi berhasil diaktivasi penuh secara permanen.',
      };
    },
    [deviceId]
  );

  return (
    <LicenseContext.Provider
      value={{
        deviceId,
        isActivated,
        activatedKey,
        transactionCount,
        maxDemoTransactions: DEMO_MAX_TRANSACTIONS,
        remainingTransactions,
        isDemoExpired,
        isActivationModalOpen,
        openActivationModal,
        closeActivationModal,
        activateApp,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextValue => {
  const ctx = useContext(LicenseContext);
  if (!ctx) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return ctx;
};
