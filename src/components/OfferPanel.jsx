import { FileSpreadsheet, Printer, User, Hash } from 'lucide-react';

export default function OfferPanel({ customerName, onCustomerNameChange, offerNo, onOfferNoChange, onExcel, onPrint }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-slate-800">Teklif & Dışa Aktarım</h2>
      <div className="space-y-3">
        <Field icon={User} label="Müşteri Adı Soyadı">
          <input
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
          />
        </Field>
        <Field icon={Hash} label="Teklif No">
          <input
            value={offerNo}
            onChange={(e) => onOfferNoChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-700"
          >
            <FileSpreadsheet className="size-5" /> Excel (.xlsx)
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-bold text-white shadow transition hover:bg-slate-700"
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
