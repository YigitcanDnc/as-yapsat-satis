import { Calculator } from 'lucide-react';
import { formatTL, formatPct, formatYM } from '../lib/format';

export default function FinancialSummary({ paymentType, plan, cashPlan }) {
  if (paymentType === 'cash') {
    return (
      <Card>
        <Line label="Liste Satış Fiyatı" value={formatTL(cashPlan.saleK)} />
        <Line label={`Peşin İndirim (%${cashPlan.discountPct})`} value={`−${formatTL(cashPlan.discountK)}`} cls="text-rose-300" />
        <Total label="Proje Genel Toplam Maliyeti" value={formatTL(cashPlan.totalK)} />
        <p className="mt-3 text-center text-xs text-emerald-300">Peşin alımda {formatTL(cashPlan.discountK)} avantaj</p>
      </Card>
    );
  }

  const parts = [
    { k: plan.downK, cls: 'bg-amber-400', label: 'Peşinat' },
    { k: plan.paidK, cls: 'bg-emerald-400', label: 'Taksit' },
    { k: plan.balonK, cls: 'bg-indigo-400', label: 'Balon' },
    { k: plan.vadeFarkiK, cls: 'bg-rose-400', label: 'Vade Farkı' },
  ];
  const mat = formatYM(plan.maturity);

  return (
    <Card>
      <Line label="Liste Satış Fiyatı" value={formatTL(plan.saleK)} />
      {plan.isFullDown ? (
        <>
          <Line
            label={`Peşin İndirim (%${plan.discountPct})`}
            value={`−${formatTL(plan.discountK)}`}
            cls="text-rose-300"
          />
          <Line
            label="Ödenen Peşinat (Nakit İndirimli)"
            value={formatTL(plan.downK)}
            dot="bg-emerald-400"
            cls="text-emerald-300 font-bold"
          />
        </>
      ) : (
        <Line label={`Alınan Peşinat (${formatPct(plan.downPct)})`} value={formatTL(plan.downK)} dot="bg-amber-400" />
      )}
      <Line label="Taksitlerle Ödenen Ana Para" value={formatTL(plan.paidK)} dot="bg-emerald-400" />
      <Line label={`${mat} Kapanış Ana Para Bakiyesi`} value={formatTL(plan.balonK)} dot="bg-indigo-400" />
      <Line
        label={`Uygulanan Vade Farkı (Aylık %2,5 × ${plan.N} Ay = %${plan.interestPct.toLocaleString('tr-TR')})`}
        value={formatTL(plan.vadeFarkiK)}
        dot="bg-rose-400"
        cls="text-rose-300"
      />
      <Line label={`${mat} Nihai Kapanış Ödemesi`} value={formatTL(plan.balonTotalK)} cls="text-indigo-200 font-extrabold" />

      <div className="my-4 flex h-3 overflow-hidden rounded-full bg-slate-700" aria-hidden>
        {parts.map((p) =>
          p.k > 0 ? <div key={p.label} className={p.cls} style={{ width: `${(p.k / plan.totalK) * 100}%` }} title={p.label} /> : null
        )}
      </div>

      <Total label="Proje Genel Toplam Maliyeti" value={formatTL(plan.totalK)} />
      {plan.isFullDown ? (
        <p className="mt-3 text-center text-xs font-semibold text-emerald-300">
          %100 Peşinat Avantajı: %15 nakit indirimi uygulandı ({formatTL(plan.discountK)} tasarruf)
        </p>
      ) : plan.extraCostK > 0 ? (
        <p className="mt-3 text-center text-xs text-rose-300">Liste fiyatına göre ek maliyet: +{formatTL(plan.extraCostK)}</p>
      ) : (
        <p className="mt-3 text-center text-xs text-emerald-300">Vade farkı yok — liste fiyatıyla kapanıyor</p>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-xl">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
        <Calculator className="size-5 text-amber-400" /> Canlı Finansal Özet
      </h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Line({ label, value, dot, cls = 'text-white' }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 text-sm">
      <span className="flex items-start gap-2 text-slate-400">
        {dot && <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className={`whitespace-nowrap text-right font-semibold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function Total({ label, value }) {
  return (
    <div className="rounded-xl bg-amber-500 p-4 text-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
