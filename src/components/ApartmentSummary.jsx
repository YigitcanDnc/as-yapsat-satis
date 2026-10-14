import { House, Layers, Compass, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CEPHE_LABELS, katLabel, aptShortCode } from '../data/apartments';
import { cashPriceK } from '../lib/finance';
import { formatTL, formatDate } from '../lib/format';

export default function ApartmentSummary({
  apt,
  saleK,
  saleRecord = null,
  isAdmin = false,
  onConvertToSale = null,
  onViewSaleRecord = null,
}) {
  const isSold = Boolean(saleRecord);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Satıldı Uyarısı / Durum Şeridi */}
      {isSold ? (
        <div className="bg-rose-600 px-4 py-2.5 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 shrink-0 text-white animate-pulse" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                BU DAİRE SATILMIŞTIR (MÜŞTERİYE KAPALI)
              </p>
              <p className="text-[10px] text-rose-100">
                Pazarlık yapılamaz. Daire satış sözleşmesiyle bağlanmıştır.
              </p>
            </div>
          </div>
          {isAdmin && onViewSaleRecord && (
            <button
              onClick={() => onViewSaleRecord(saleRecord, apt)}
              className="rounded-lg bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 text-[11px] font-bold transition shrink-0"
            >
              Satış Detayı
            </button>
          )}
        </div>
      ) : (
        <div className="bg-emerald-600/90 px-4 py-1.5 text-white flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="size-3.5 text-emerald-200" /> Portföy Durumu: Satışa Açık (Müsait)
          </span>
          {onConvertToSale && (
            <button
              onClick={() => onConvertToSale(apt)}
              className="rounded bg-slate-900/40 hover:bg-slate-900/70 text-white px-2 py-0.5 text-[10px] font-bold transition"
            >
              Satıldı Olarak İşaretle
            </button>
          )}
        </div>
      )}

      <div className={`p-5 text-white transition ${isSold ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950' : 'bg-gradient-to-br from-slate-900 to-slate-700'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-300">Seçili Bağımsız Bölüm</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{aptShortCode(apt)}</span>
              <span className="text-sm font-semibold text-slate-300">
                ({apt.blok} Blok · {katLabel(apt.kat)} · {apt.cephe})
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Cephe: {CEPHE_LABELS[apt.cephe]}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-lg bg-amber-500 px-3 py-1 text-lg font-extrabold text-slate-900">{apt.tip}</span>
            {isSold && (
              <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                SATILDI
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-300">Nihai Liste Satış Fiyatı</p>
            <p className={`text-2xl font-extrabold tabular-nums ${isSold ? 'text-slate-400 line-through' : 'text-amber-300'}`}>
              {formatTL(saleK)}
            </p>
          </div>
          {isSold && isAdmin && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-rose-300">Anlaşılan Satış Bedeli</p>
              <p className="text-xl font-black text-rose-400 tabular-nums">
                {formatTL(saleRecord.salePriceK)}
              </p>
            </div>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-px bg-slate-100 text-sm">
        <Item icon={Layers} label="Kat" value={katLabel(apt.kat)} />
        <Item icon={Compass} label="Cephe" value={`${apt.cephe} · ${CEPHE_LABELS[apt.cephe]}`} />
        <Item icon={House} label="Tip" value={apt.tip} />
      </dl>

      {/* Satış Yetkisi / Yönetici Bilgisi veya Standart Peşin Fiyat */}
      {isSold && isAdmin ? (
        <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-900 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Alıcı: {saleRecord.customerName}</p>
                <p className="text-[10px] text-rose-700">Tarih: {saleRecord.date ? formatDate(new Date(saleRecord.date)) : '—'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-rose-800">
                {saleRecord.paymentType === 'cash' ? 'Peşin Satış' : 'Vadeli Satış'}
              </span>
              {saleRecord.paymentType !== 'cash' && saleRecord.installmentMonthlyK > 0 && (
                <p className="text-[11px] font-black text-indigo-700">
                  Taksit: {formatTL(saleRecord.installmentMonthlyK)} / ay
                </p>
              )}
            </div>
          </div>
          {saleRecord.notes && (
            <p className="pt-1.5 border-t border-rose-200/60 text-[10.5px] text-slate-700 leading-relaxed font-normal">
              📝 <b>Satış Notu:</b> {saleRecord.notes}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-slate-100 bg-emerald-50 px-5 py-3 text-sm">
          <span className="font-medium text-emerald-800">Peşin Fiyat (%15 indirimli)</span>
          <span className={`font-bold tabular-nums ${isSold ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
            {formatTL(cashPriceK(saleK))}
          </span>
        </div>
      )}
    </section>
  );
}

function Item({ icon: Icon, label, value, valueClass = 'text-slate-800' }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className={`mt-0.5 font-semibold tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}
