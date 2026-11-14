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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] p-4 rounded-2xl w-full max-w-sm shadow-2xl space-y-3">
        <h3 className="text-[15px] font-semibold text-[#172033] dark:text-white">Pindai Barcode</h3>
        <div id="reader" className="overflow-hidden rounded-xl border border-[#E2E8F0] dark:border-[#263954]" />
        <button
          onClick={onClose}
          className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
        >
          Tutup Scanner
        </button>
      </div>
    </div>
  );
};
