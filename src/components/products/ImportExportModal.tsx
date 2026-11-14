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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
      <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] p-3.5 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-[16px] font-semibold mb-3 text-[#172033] dark:text-white leading-tight">Import & Export Master Barang</h2>
        <div className="space-y-2.5">
          <Button onClick={handleDownloadTemplate} className="w-full bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-white hover:opacity-85">Unduh Template</Button>
          <div className="p-3 border border-dashed border-[#E2E8F0] dark:border-[#263954] rounded-xl bg-[#F1F4F8] dark:bg-[#070B16] text-center">
            <input type="file" onChange={handleFileChange} className="w-full text-[11.5px] text-[#64748B] dark:text-[#94A3B8] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0866E9] file:text-white hover:file:bg-[#0758CC]" accept=".csv" />
          </div>
          {report && (
            <div className="text-[12px] p-3 bg-[#F1F4F8] dark:bg-[#070B16] rounded-xl border border-[#E2E8F0] dark:border-[#263954]">
              <div className="flex justify-between font-semibold mb-1.5">
                <p className="text-emerald-600 dark:text-emerald-400">Valid: {report.valid.length}</p>
                <p className="text-rose-600 dark:text-rose-400">Error: {report.errors.length}</p>
              </div>
              {report.errors.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full mt-1.5 border border-[#E2E8F0] dark:border-[#263954] text-[11.5px] text-[#172033] dark:text-white">
                    <thead><tr className="bg-white dark:bg-[#111D30]"><th className="p-1.5 border border-[#E2E8F0] dark:border-[#263954] font-semibold">Baris</th><th className="p-1.5 border border-[#E2E8F0] dark:border-[#263954] font-semibold text-left">Kesalahan</th></tr></thead>
                    <tbody>{report.errors.map((e, i) => <tr key={i}><td className="p-1.5 border border-[#E2E8F0] dark:border-[#263954] text-center tabular-nums">{e.row}</td><td className="p-1.5 border border-[#E2E8F0] dark:border-[#263954]">{e.errors.join(', ')}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 mt-2.5">
            <Button onClick={handleImport} disabled={!report || report.valid.length === 0} className="w-full bg-[#0866E9] hover:bg-[#0758CC] text-white">Impor Data Valid</Button>
            <Button onClick={handleExport} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Ekspor Data</Button>
            <Button onClick={onClose} className="w-full bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] text-[#172033] dark:text-white hover:opacity-85">Tutup</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
