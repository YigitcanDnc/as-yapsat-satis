import { Building2 } from 'lucide-react';
import { APARTMENT_DATA, BLOCK_CEPHELER, CEPHE_LABELS, KAT_ORDER, aptId, findApartment } from '../data/apartments';
import { salePriceK } from '../lib/finance';
import { formatNumber } from '../lib/format';

const tone = (k) => {
  if (k >= 104) return 'bg-emerald-50 border-emerald-200 hover:border-emerald-400';
  if (k >= 100) return 'bg-sky-50 border-sky-200 hover:border-sky-400';
  if (k >= 95) return 'bg-slate-50 border-slate-200 hover:border-slate-400';
  return 'bg-amber-50 border-amber-200 hover:border-amber-400';
};

const shortMoney = (k) => {
  const tl = k / 100;
  return `${(tl / 1_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
};

export default function ApartmentGrid({ block, onBlockChange, selectedId, onSelect, onOpenFloorPlan }) {
  const cepheler = BLOCK_CEPHELER[block];
  const count = APARTMENT_DATA.filter((a) => a.blok === block).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Building2 className="size-5 text-amber-500" /> Daire Seçim Paneli
          </h2>
          <p className="text-xs text-slate-500">Kat planı & şerefiye matrisi · {count} daire</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenFloorPlan && (
            <button
              onClick={onOpenFloorPlan}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 shadow-sm"
            >
              <Building2 className="size-3.5 text-amber-600" /> Kat Şeması (PDF)
            </button>
          )}
          <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">
            {['A', 'B'].map((b) => (
              <button
                key={b}
                role="tab"
                aria-selected={block === b}
                onClick={() => onBlockChange(b)}
                className={`rounded-lg px-5 py-1.5 text-sm font-bold transition ${
                  block === b ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {b} Blok
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bina görünümü */}
      <div className="rounded-xl bg-gradient-to-b from-slate-100 to-slate-50 p-3">
        <div className="mx-auto mb-2 h-2 w-[92%] rounded-t-lg bg-slate-400" aria-hidden />
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `56px repeat(${cepheler.length}, minmax(0, 1fr))` }}
        >
          <div />
          {cepheler.map((c) => (
            <div key={c} className="pb-1 text-center">
              <div className="text-xs font-bold text-slate-700">{c}</div>
              <div className="text-[10px] text-slate-400">{CEPHE_LABELS[c]}</div>
            </div>
          ))}

          {KAT_ORDER.map((kat) => (
            <Row key={kat} kat={kat} block={block} cepheler={cepheler} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
        <div className="mt-2 h-1.5 rounded bg-slate-700" aria-hidden />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <Legend cls="bg-emerald-100 border-emerald-300" label="Katsayı ≥ 104" />
        <Legend cls="bg-sky-100 border-sky-300" label="100 – 103" />
        <Legend cls="bg-slate-100 border-slate-300" label="95 – 99" />
        <Legend cls="bg-amber-100 border-amber-300" label="< 95" />
      </div>
    </section>
  );
}

function Row({ kat, block, cepheler, selectedId, onSelect }) {
  return (
    <>
      <div className="flex items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white">
        {kat === 'Z' ? 'Zemin' : `${kat}. Kat`}
      </div>
      {cepheler.map((c) => {
        const apt = findApartment(block, kat, c);
        if (!apt) return <div key={c} />;
        const id = aptId(apt);
        const active = id === selectedId;
        return (
          <button
            key={c}
            onClick={() => onSelect(apt)}
            aria-pressed={active}
            title={`${apt.blok} Blok ${kat === 'Z' ? 'Zemin' : kat + '. Kat'} ${c} · ${formatNumber(salePriceK(apt))} TL`}
            className={`group rounded-lg border-2 px-2 py-1.5 text-left transition ${
              active
                ? 'border-amber-500 bg-slate-900 text-white shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                : `${tone(apt.katsayi)} text-slate-700`
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black tracking-tight">
                {apt.no || `${apt.blok}${kat}-${c}`}
              </span>
              <span
                className={`rounded px-1 text-[9px] font-bold ${
                  apt.tip === '3+1'
                    ? active ? 'bg-amber-400 text-slate-900' : 'bg-indigo-100 text-indigo-700'
                    : active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {apt.tip}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[11px]">
              <span className={active ? 'text-amber-300' : 'text-slate-500'}>×{apt.katsayi}</span>
              <span className="font-semibold tabular-nums">{shortMoney(salePriceK(apt))}</span>
            </div>
          </button>
        );
      })}
    </>
  );
}

function Legend({ cls, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded border ${cls}`} /> {label}
    </span>
  );
}
