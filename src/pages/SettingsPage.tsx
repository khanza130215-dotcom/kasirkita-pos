import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Tag,
  Receipt,
  Printer,
  Save,
  CheckCircle2,
  QrCode,
  Upload,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { settingsService } from '../services/settingsService';

const compressImageToDataUrl = (
  file: File,
  maxDimension = 520,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }
        // Latar putih bersih agar QR Code transparan tetap kontras & terbaca
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar QRIS'));
    };
    img.src = objectUrl;
  });
};

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string>('Berhasil Disimpan');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [storeName, setStoreName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [qrisName, setQrisName] = useState<string>('');
  const [qrisImage, setQrisImage] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [footerMessage, setFooterMessage] = useState<string>('');
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [autoPrint, setAutoPrint] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastText(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Muat data pengaturan yang tersimpan di database lokal
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data && isMounted) {
          setStoreName(data.storeName || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setWhatsapp(data.whatsapp || '');
          setQrisName(data.qrisName || '');
          setQrisImage(data.qrisImage || '');
          setTagline(data.tagline || '');
          setFooterMessage(data.footerMessage || '');
          setPaperSize(data.paperSize === '80mm' ? '80mm' : '58mm');
          setAutoPrint(Boolean(data.autoPrint));
        }
      } catch (err) {
        console.error('Gagal mengambil pengaturan:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      setQrisImage(compressedDataUrl);
      await settingsService.updateSettings({ qrisImage: compressedDataUrl });
      navigator.vibrate?.(15);
      triggerToast('Gambar QRIS disimpan');
    } catch (err) {
      console.error('Gagal mengompres QRIS:', err);
      setErrorMsg('Gagal memproses file gambar QRIS. Pastikan format gambar valid.');
    }
  };

  const handleRemoveQris = async () => {
    setErrorMsg(null);
    setQrisImage('');
    await settingsService.updateSettings({ qrisImage: '' });
    navigator.vibrate?.(15);
    triggerToast('Gambar QRIS dihapus');
  };

  // Simpan Identitas Toko
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!storeName.trim()) {
      setErrorMsg('Nama toko wajib diisi!');
      return;
    }

    try {
      setSaving(true);
      await settingsService.updateSettings({
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        qrisName: qrisName.trim(),
        qrisImage,
        tagline: tagline.trim(),
        footerMessage: footerMessage.trim(),
        paperSize,
        autoPrint
      });

      navigator.vibrate?.(15);
      triggerToast('Identitas Toko Disimpan');
    } catch (err) {
      console.error('Gagal menyimpan identitas toko:', err);
      setErrorMsg('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaperSizeChange = async (size: '58mm' | '80mm') => {
    setPaperSize(size);
    await settingsService.updateSettings({ paperSize: size });
  };

  const handleAutoPrintChange = async (checked: boolean) => {
    setAutoPrint(checked);
    await settingsService.updateSettings({ autoPrint: checked });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-950">
        Memuat konfigurasi toko...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-24 bg-slate-50 dark:bg-slate-950 select-none transition-colors duration-200">
      {/* Header Halaman */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">PENGATURAN TOKO</h2>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            KONFIGURASI SISTEM
          </p>
        </div>
        {showToast && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/70">
            <CheckCircle2 size={13} /> {toastText}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="mb-3 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-400 text-xs px-3 py-2 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveIdentity} className="flex flex-col gap-4">
        {/* Identitas Toko */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3 transition-colors">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-[#0866E9] dark:text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              IDENTITAS TOKO
            </h3>
          </div>

          {/* Nama Toko */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>NAMA TOKO</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Masukkan nama toko..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              ALAMAT LENGKAP
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat toko..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Telepon & WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                TELEPON
              </label>
              <div className="relative flex items-center">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nomor telepon..."
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                WHATSAPP
              </label>
              <div className="relative flex items-center">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Nomor WhatsApp..."
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* QRIS Toko (NMID/Merchant + Unggah Gambar QRIS) */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#0866E9] dark:text-blue-400" />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  QRIS PEMBAYARAN TOKO
                </span>
              </div>
              {qrisImage && (
                <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                NMID / NAMA MERCHANT QRIS
              </label>
              <input
                type="text"
                value={qrisName}
                onChange={(e) => setQrisName(e.target.value)}
                placeholder="Contoh: TOKO FARDAN • NMID ID102030..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>

            {qrisImage ? (
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                {/* Area QRIS selalu putih (bg-white p-2 rounded-lg) agar terbaca jelas oleh scanner */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0">
                  <img
                    src={qrisImage}
                    alt="Preview QRIS Toko"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <p className="text-[10.5px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    Gambar QRIS Terpasang
                  </p>
                  <div className="flex items-center gap-1.5">
                    <label className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#0866E9] dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors">
                      <Upload size={11} />
                      <span>Ganti QRIS</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrisUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveQris}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 rounded-xl p-2.5 cursor-pointer transition-colors">
                <Upload size={15} className="text-[#0866E9] dark:text-blue-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight">
                    Unggah Gambar QRIS Toko
                  </p>
                  <p className="text-[9.5px] text-slate-400">
                    Otomatis dikompres ringan agar cepat tampil di Kasir
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrisUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Tagline Toko */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              TAGLINE TOKO
            </label>
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Slogan atau moto toko..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Pesan Footer Struk */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              PESAN FOOTER STRUK
            </label>
            <div className="relative flex items-center">
              <Receipt className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                placeholder="Pesan di bagian bawah nota/struk..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0866E9] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Tombol Simpan Identitas */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-1 py-2.5 rounded-xl bg-[#0866E9] hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'MENYIMPAN...' : 'SIMPAN IDENTITAS'}</span>
          </button>
        </div>

        {/* Printer & Struk */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3 transition-colors">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Printer className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              PRINTER & STRUK
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Ukuran Kertas</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handlePaperSizeChange('58mm')}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-[#0866E9] text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Thermal 58mm
              </button>
              <button
                type="button"
                onClick={() => handlePaperSizeChange('80mm')}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-[#0866E9] text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Thermal 80mm
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-100">Cetak Otomatis</span>
              <span className="text-[9.5px] text-slate-400 font-normal">
                Cetak struk seketika transaksi sukses
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => handleAutoPrintChange(e.target.checked)}
              className="w-4 h-4 accent-[#0866E9] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer JacS Enterprise */}
        <div className="text-center py-2 flex flex-col items-center">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">JacS Enterprise POS</span>
          <span className="text-[8.5px] text-slate-400 font-normal">
            Versi 4.0.0 • Mobile Edition
          </span>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;