import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  onResult: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal = ({ onResult, onClose }: BarcodeScannerModalProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 150 } }, false);
    scannerRef.current = scanner;
    
    scanner.render((decodedText) => {
      onResult(decodedText);
      scanner.clear().catch(console.error);
      onClose();
    }, (error) => {
      // Ignore "not found" errors, log others
      if (typeof error === 'string' && error.includes('code not found')) return;
      console.warn('Scanner error:', error);
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onResult, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] p-4 rounded-2xl w-full max-w-sm shadow-2xl">
        <div id="reader" className="overflow-hidden rounded-xl" />
        <button onClick={onClose} className="mt-4 w-full bg-red-500 text-white py-2 rounded-xl font-bold active:scale-95 transition-all">Tutup Scanner</button>
      </div>
    </div>
  );
};
