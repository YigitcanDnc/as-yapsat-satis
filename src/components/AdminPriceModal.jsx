import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import MoneyInput from './MoneyInput';
import { formatTL } from '../lib/format';

export default function AdminPriceModal({ isOpen, onClose, basePrices, onSave, onReset }) {
  const [prices, setPrices] = useState(basePrices);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && basePrices) {
      setPrices(basePrices);
      setSuccess(false);
    }
  }, [isOpen, basePrices]);

  if (!isOpen) return null;

  const handlePriceChange = (tip, kurus) => {
    setPrices((prev) => ({
      ...prev,
      [tip]: Math.round(kurus / 100),
    }));
    setSuccess(false);
  };

  const handleSave = () => {
    onSave(prices);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    if (window.confirm('Baz fiyatları fabrika/varsayılan ayarlarına (6.000.000 TL ve 8.500.000 TL) döndürmek istediğinize emin misiniz?')) {
      onReset();
      setPrices({ '2+1': 6000000, '3+1': 8500000 });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-amber-400 shadow-sm">
              <Settings className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Yönetici Fiyat Paneli</h3>
              <p className="text-xs text-slate-500">Daire Tipi Baz Fiyat Düzenleme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Bu panel müşteri tekliflerinde veya dışarıda görünmez. Değiştirilen baz fiyatlar tüm şerefiye ve ödeme hesaplamalarını anında günceller.
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                2+1 Daireler Baz Fiyatı (TL)
              </label>
              <MoneyInput
                valueK={prices['2+1'] * 100}
                onChange={(k) => handlePriceChange('2+1', k)}
                commitOnBlur
                className="border-slate-300 font-bold text-slate-900"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Mevcut: {formatTL(prices['2+1'] * 100)}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                3+1 Daireler Baz Fiyatı (TL)
              </label>
              <MoneyInput
                valueK={prices['3+1'] * 100}
                onChange={(k) => handlePriceChange('3+1', k)}
                commitOnBlur
                className="border-slate-300 font-bold text-slate-900"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Mevcut: {formatTL(prices['3+1'] * 100)}
              </span>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Baz fiyatlar başarıyla kaydedildi ve tüm hesaplamalar güncellendi!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw className="size-3.5" /> Varsayılana Dön
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
            >
              <Save className="size-3.5 text-amber-400" /> Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
