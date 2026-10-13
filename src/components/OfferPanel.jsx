import { FileSpreadsheet, Printer, User, Hash, Handshake, ShieldAlert } from 'lucide-react';

export default function OfferPanel({
  customerName,
  onCustomerNameChange,
  offerNo,
  onOfferNoChange,
  onExcel,
  onPrint,
  isSold = false,
  onConvertToSale = null,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Teklif & Dışa Aktarım</h2>
        {isSold && (
          <span className="rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-black uppercase text-rose-800">
            SATILMIŞ DAİRE
          </span>
        )}
      </div>

      <div className="space-y-3">
        {isSold && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="size-4 text-rose-600 shrink-0" />
              Bu Daire Satılmıştır (Müşteriye Kapalı)
            </div>
            <p className="mt-1 text-[11px] text-rose-700 leading-relaxed">
              Bu bağımsız bölümün satışı gerçekleşmiştir. Müşterilerle bu daire üzerinden yeni pazarlık yapılamaz.
            </p>
          </div>
        )}

        <Field icon={User} label="Müşteri Adı Soyadı">
          <input
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
            disabled={isSold}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
              isSold
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
            }`}
          />
        </Field>
        <Field icon={Hash} label="Teklif No">
          <input
            value={offerNo}
            onChange={(e) => onOfferNoChange(e.target.value)}
            disabled={isSold}
            className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none transition ${
              isSold
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
            }`}
          />
        </Field>

        {!isSold && onConvertToSale && (
          <button
            onClick={onConvertToSale}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-50/80 px-4 py-2.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-100 transition"
          >
            <Handshake className="size-4 text-amber-700" />
            Mevcut Teklifi Satışa Dönüştür (Satıldı Olarak Kaydet)
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onExcel}
            disabled={isSold}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold shadow transition ${
              isSold
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <FileSpreadsheet className="size-5" /> Excel (.xlsx)
          </button>
          <button
            onClick={onPrint}
            disabled={isSold}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold shadow transition ${
              isSold
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            <Printer className="size-5" /> Teklif / PDF
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="size-3.5" /> {label}
      </span>
      {children}
    </label>
  );
}
