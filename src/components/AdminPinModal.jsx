import { useState, useRef, useEffect } from 'react';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';

export default function AdminPinModal({ isOpen, onClose, onSuccess, currentPin = '1907' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (pin.trim() === currentPin.trim()) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-slate-900 text-amber-400 shadow-md">
            <Lock className="size-6" />
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-900">Yönetici Doğrulaması</h3>
          <p className="mt-1 text-xs text-slate-500">
            Satış kayıtları, müşteri bilgileri ve baz fiyatları yönetmek için PIN kodunuzu giriniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                ref={inputRef}
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="PIN Kodunu Giriniz"
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-center font-mono text-lg tracking-widest outline-none transition ${
                  error
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                }`}
              />
            </div>
            {error && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
                <AlertCircle className="size-3.5" /> Hatalı PIN kodu girdiniz!
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
            >
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
