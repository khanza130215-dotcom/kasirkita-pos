import { useState } from 'react';
import Papa from 'papaparse';
import { productServices } from '../../services/productServices';
import { Button } from '../ui/Button';

interface ImportExportModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const ImportExportModal = ({ onClose, onRefresh }: ImportExportModalProps) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [report, setReport] = useState<{valid: any[], errors: any[]} | null>(null);

  const handleDownloadTemplate = () => {
    const csv = productServices.generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_produk.csv';
    link.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const validationReport = await productServices.validateImportData(results.data);
          setReport(validationReport);
        }
      });
    }
  };

  const handleImport = async () => {
    if (report?.valid) {
      await productServices.importFromCSV(report.valid);
      onRefresh();
      alert('Impor selesai!');
      onClose();
    }
  };

  const handleExport = async () => {
    const csv = await productServices.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'master_barang.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-bold mb-4 text-[var(--text-main)]">Import & Export Master Barang</h2>
        <div className="space-y-4">
          <Button onClick={handleDownloadTemplate} className="w-full bg-[var(--bg-subtle)] text-[var(--text-main)] hover:opacity-80">Unduh Template</Button>
          <div className="p-4 border-2 border-dashed border-[var(--border-app)] rounded-xl bg-[var(--bg-subtle)]/30 text-center">
            <input type="file" onChange={handleFileChange} className="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--primary-accent)] file:text-white hover:file:opacity-90" accept=".csv" />
          </div>
          {report && (
            <div className="text-sm p-4 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-app)]">
              <div className="flex justify-between font-bold mb-2">
                <p className="text-green-600">Valid: {report.valid.length}</p>
                <p className="text-red-500">Error: {report.errors.length}</p>
              </div>
              {report.errors.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full mt-2 border border-[var(--border-app)] text-[11px]">
                    <thead><tr className="bg-[var(--bg-subtle)]"><th className="p-1 border border-[var(--border-app)]">Baris</th><th className="p-1 border border-[var(--border-app)]">Kesalahan</th></tr></thead>
                    <tbody>{report.errors.map((e, i) => <tr key={i}><td className="p-1 border border-[var(--border-app)] text-center">{e.row}</td><td className="p-1 border border-[var(--border-app)]">{e.errors.join(', ')}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 mt-4">
            <Button onClick={handleImport} disabled={!report || report.valid.length === 0} className="w-full bg-[var(--primary-accent)]">Impor Data Valid</Button>
            <Button onClick={handleExport} className="w-full bg-green-600">Ekspor Data</Button>
            <Button onClick={onClose} className="w-full bg-[var(--bg-subtle)] text-[var(--text-main)] hover:opacity-80">Tutup</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
