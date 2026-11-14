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
      <div className="flex-1 flex items-center justify-center p-6 text-[#64748B] dark:text-[#94A3B8] text-[13px] font-medium bg-[#F1F4F8] dark:bg-[#070B16]">
        Memuat konfigurasi toko...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#F1F4F8] dark:bg-[#070B16] text-[#172033] dark:text-white select-none transition-colors duration-200">
      {/* Header Halaman Terkunci di Atas */}
      <div className="shrink-0 px-3 pt-2 pb-1.5 border-b border-[#E2E8F0] dark:border-[#263954] bg-[#F1F4F8] dark:bg-[#070B16]">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
              Pengaturan Toko
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight truncate">
              Konfigurasi identitas toko, QRIS, dan printer
            </p>
          </div>
          {showToast && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/70 shrink-0">
              <CheckCircle2 size={13} /> {toastText}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="max-w-3xl mx-auto w-full">
          {errorMsg && (
            <div className="mb-2 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-400 text-[12px] px-3 py-2 rounded-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveIdentity} className="flex flex-col gap-2">
            {/* Identitas Toko */}
            <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2.5 shadow-2xs flex flex-col gap-1.5 transition-colors">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#E2E8F0] dark:border-[#263954]">
                <Store className="w-4 h-4 text-[#0866E9] dark:text-[#FF7900]" />
                <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
                  Identitas Toko
                </h2>
              </div>

            {/* Nama Toko */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                <span>Nama Toko</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Store className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-3" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Masukkan nama toko..."
                  className="w-full h-10 pl-9 pr-3 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                />
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                Alamat Lengkap
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat toko..."
                  className="w-full h-10 pl-9 pr-3 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                />
              </div>
            </div>

            {/* Telepon & WhatsApp */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Telepon
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="No. telepon..."
                    className="w-full h-10 pl-8 pr-2.5 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  WhatsApp
                </label>
                <div className="relative flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-2.5" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="No. WhatsApp..."
                    className="w-full h-10 pl-8 pr-2.5 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                  />
                </div>
              </div>
            </div>

            {/* QRIS Toko */}
            <div className="bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#0866E9] dark:text-[#FF7900]" />
                  <span className="text-[12.5px] font-semibold text-[#172033] dark:text-white leading-tight">
                    QRIS Pembayaran Toko
                  </span>
                </div>
                {qrisImage && (
                  <span className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-1.5 py-0.5 rounded-md">
                    Aktif
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  NMID / Nama Merchant QRIS
                </label>
                <input
                  type="text"
                  value={qrisName}
                  onChange={(e) => setQrisName(e.target.value)}
                  placeholder="Contoh: TOKO FARDAN · NMID ID102030..."
                  className="w-full h-10 px-3 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                />
              </div>

              {qrisImage ? (
                <div className="flex items-center gap-2.5 bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2">
                  <div className="bg-white p-1.5 rounded-lg border border-[#E2E8F0] shrink-0">
                    <img
                      src={qrisImage}
                      alt="Preview QRIS Toko"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-[#172033] dark:text-white truncate">
                      Gambar QRIS Terpasang
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="min-h-[44px] px-3 py-1.5 rounded-lg bg-[#F1F4F8] dark:bg-[#070B16] hover:border-[#0866E9] dark:hover:border-[#FF7900] text-[#0866E9] dark:text-[#FF7900] border border-[#E2E8F0] dark:border-[#263954] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload size={13} />
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
                        className="min-h-[44px] px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="min-h-[44px] flex items-center justify-center gap-2 border border-dashed border-[#0866E9]/40 dark:border-[#FF7900]/50 bg-white dark:bg-[#111D30] hover:bg-blue-50/40 dark:hover:bg-[#192842] rounded-xl p-2.5 cursor-pointer transition-colors">
                  <Upload size={16} className="text-[#0866E9] dark:text-[#FF7900] shrink-0" />
                  <div className="text-left">
                    <p className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight">
                      Unggah Gambar QRIS Toko
                    </p>
                    <p className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-tight">
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

            {/* Tagline & Pesan Footer */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Tagline Toko
                </label>
                <div className="relative flex items-center">
                  <Tag className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-2.5" />
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Slogan toko..."
                    className="w-full h-10 pl-8 pr-2.5 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Pesan Footer Struk
                </label>
                <div className="relative flex items-center">
                  <Receipt className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] absolute left-2.5" />
                  <input
                    type="text"
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Pesan footer..."
                    className="w-full h-10 pl-8 pr-2.5 bg-[#F1F4F8] dark:bg-[#070B16] border border-[#E2E8F0] dark:border-[#263954] rounded-xl text-[12.5px] font-normal text-[#172033] dark:text-white focus:outline-none focus:border-[#0866E9] dark:focus:border-[#FF7900] transition-colors placeholder:text-[#64748B]/70 dark:placeholder:text-[#94A3B8]/60"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Simpan Identitas */}
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[44px] mt-0.5 py-2 rounded-xl bg-[#0866E9] hover:bg-[#0758CC] active:scale-[0.98] text-white font-semibold text-[12.5px] shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-45"
            >
              <Save size={15} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Identitas'}</span>
            </button>
          </div>

          {/* Printer & Struk */}
          <div className="bg-white dark:bg-[#111D30] border border-[#E2E8F0] dark:border-[#263954] rounded-xl p-2.5 shadow-2xs flex flex-col gap-2 transition-colors">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#E2E8F0] dark:border-[#263954]">
              <Printer className="w-4 h-4 text-[#0866E9] dark:text-[#FF7900]" />
              <h2 className="text-[13.5px] font-semibold text-[#172033] dark:text-white tracking-tight leading-tight">
                Printer & Struk
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-[#172033] dark:text-white">Ukuran Kertas</span>
              <div className="flex items-center bg-[#F1F4F8] dark:bg-[#070B16] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#263954] gap-1">
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('58mm')}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    paperSize === '58mm'
                      ? 'bg-[#0866E9] dark:bg-[#FF7900] text-white shadow-2xs font-semibold'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white'
                  }`}
                >
                  Thermal 58mm
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('80mm')}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    paperSize === '80mm'
                      ? 'bg-[#0866E9] dark:bg-[#FF7900] text-white shadow-2xs font-semibold'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white'
                  }`}
                >
                  Thermal 80mm
                </button>
              </div>
            </div>

            <label className="min-h-[44px] flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#263954] cursor-pointer">
              <div className="flex flex-col">
                <span className="text-[12.5px] font-medium text-[#172033] dark:text-white leading-tight">Cetak Otomatis</span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-normal mt-0.5 leading-tight">
                  Cetak struk seketika transaksi sukses
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => handleAutoPrintChange(e.target.checked)}
                className="w-5 h-5 accent-[#0866E9] dark:accent-[#FF7900] rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Footer JacS Enterprise */}
          <div className="text-center py-1 flex flex-col items-center gap-0.5">
            <span className="text-[11px] font-semibold text-[#172033] dark:text-white">JacS Enterprise POS</span>
            <span className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8] font-normal">
              Versi 4.0.0 · Mobile Edition
            </span>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;