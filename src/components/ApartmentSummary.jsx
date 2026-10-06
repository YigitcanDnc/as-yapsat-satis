import { House, Layers, Compass, BadgePercent, Banknote, Tag } from 'lucide-react';
import { CEPHE_LABELS, katLabel, aptShortCode } from '../data/apartments';
import { cashPriceK } from '../lib/finance';
import { formatTL } from '../lib/format';

export default function ApartmentSummary({ apt, saleK }) {
  const bazK = apt.bazFiyat * 100;
  const diffK = saleK - bazK;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
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
          <span className="rounded-lg bg-amber-500 px-3 py-1 text-lg font-extrabold text-slate-900">{apt.tip}</span>
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-300">Nihai Liste Satış Fiyatı</p>
          <p className="text-2xl font-extrabold tabular-nums text-amber-300">{formatTL(saleK)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-slate-100 text-sm">
        <Item icon={Layers} label="Kat" value={katLabel(apt.kat)} />
        <Item icon={Compass} label="Cephe" value={`${apt.cephe} · ${CEPHE_LABELS[apt.cephe]}`} />
        <Item icon={House} label="Tip" value={apt.tip} />
        <Item icon={BadgePercent} label="Şerefiye Katsayısı" value={`${apt.katsayi} (%${apt.katsayi})`} />
        <Item icon={Tag} label="Baz Fiyat" value={formatTL(bazK)} />
        <Item
          icon={Banknote}
          label="Şerefiye Farkı"
          value={`${diffK >= 0 ? '+' : '−'}${formatTL(Math.abs(diffK))}`}
          valueClass={diffK >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />
      </dl>
      <div className="flex items-center justify-between border-t border-slate-100 bg-emerald-50 px-5 py-3 text-sm">
        <span className="font-medium text-emerald-800">Peşin Fiyat (%15 indirimli)</span>
        <span className="font-bold tabular-nums text-emerald-700">{formatTL(cashPriceK(saleK))}</span>
      </div>
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
