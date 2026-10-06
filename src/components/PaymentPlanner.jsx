import { useState } from 'react';
import {
  Wallet, CalendarDays, Percent, TriangleAlert, Equal, SlidersHorizontal, ArrowDownToLine, Info, CircleCheck,
} from 'lucide-react';
import MoneyInput from './MoneyInput';
import InstallmentTable from './InstallmentTable';
import { FINANCE } from '../config/project';
import { minDownK, ymKey } from '../lib/finance';
import { formatTL, formatYM, formatPct } from '../lib/format';

export default function PaymentPlanner(props) {
  const {
    paymentType, onPaymentTypeChange, start, onStartChange, startOptions, saleK, downK, onDownChange,
    onDownPctChange, mode, onModeChange, equalTargetK, onEqualTargetChange, plan, cashPlan,
    onFlexChange, onDistribute, notice, minInstallmentK,
  } = props;

  const [draftDown, setDraftDown] = useState(null);
  const minK = minDownK(saleK);
  const downPct = saleK ? (downK / saleK) * 100 : 0;
  const draftInvalid = draftDown !== null && (draftDown < minK || draftDown > saleK);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <Wallet className="size-5 text-amber-500" /> Ödeme Planlayıcı
        </h2>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <Toggle active={paymentType === 'cash'} onClick={() => onPaymentTypeChange('cash')}>
            Peşin (%{FINANCE.cashDiscountPct} İndirimli)
          </Toggle>
          <Toggle active={paymentType === 'installment'} onClick={() => onPaymentTypeChange('installment')}>
            Vadeli / Taksitli
          </Toggle>
        </div>
      </div>

      {paymentType === 'cash' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Liste Satış Fiyatı" value={formatTL(cashPlan.saleK)} />
          <Stat label={`Peşin İndirim (%${cashPlan.discountPct})`} value={`−${formatTL(cashPlan.discountK)}`} tone="rose" />
          <Stat label="Peşin Satış Fiyatı" value={formatTL(cashPlan.cashK)} tone="emerald" big />
          <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 sm:col-span-3">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
            Peşin ödemede liste fiyatı üzerinden net %{FINANCE.cashDiscountPct} indirim uygulanır. Ödemenin tamamı sözleşme
            imzasında tahsil edilir; vade farkı uygulanmaz.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Başlangıç + Peşinat */}
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div>
              <Label icon={CalendarDays}>Sözleşme Başlangıç Ayı</Label>
              <select
                value={ymKey(start)}
                onChange={(e) => onStartChange(startOptions.find((o) => ymKey(o) === Number(e.target.value)))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              >
                {startOptions.map((o) => (
                  <option key={ymKey(o)} value={ymKey(o)}>{formatYM(o)}</option>
                ))}
              </select>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                <span className="text-amber-800">Mart 2028'e kalan</span>
                <span className="text-base font-extrabold text-amber-700">N = {plan.N} ay</span>
              </div>
            </div>

            <div>
              <Label icon={Percent}>
                Peşinat Tutarı <span className="font-normal text-slate-400">(asgari %{FINANCE.minDownPct} = {formatTL(minK)})</span>
              </Label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <MoneyInput
                  valueK={downK}
                  commitOnBlur
                  onDraft={setDraftDown}
                  onChange={(k) => {
                    setDraftDown(null);
                    onDownChange(k);
                  }}
                  className={draftInvalid ? 'border-rose-400 ring-2 ring-rose-300/40' : 'border-slate-300'}
                  aria-label="Peşinat tutarı"
                />
                <span className="rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-bold tabular-nums text-amber-300">
                  {formatPct(downPct)}
                </span>
              </div>
              <input
                type="range"
                min={FINANCE.minDownPct}
                max={100}
                step={0.5}
                value={Math.min(100, Math.max(FINANCE.minDownPct, Number(downPct.toFixed(1))))}
                onChange={(e) => onDownPctChange(Number(e.target.value))}
                className="mt-3 w-full"
                aria-label="Peşinat yüzdesi"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                <span>%40</span><span>%55</span><span>%70</span><span>%85</span><span>%100</span>
              </div>
              {draftInvalid && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <TriangleAlert className="size-4" />
                  {draftDown < minK
                    ? `Peşinat %${FINANCE.minDownPct}'ın altına inemez. Asgari tutar: ${formatTL(minK)} — onaylandığında asgariye çekilecek.`
                    : `Peşinat satış fiyatını aşamaz (${formatTL(saleK)}).`}
                </p>
              )}
              {plan.isFullDown && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <CircleCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>%100 Peşinat uygulandı: Liste fiyatı üzerinden net %15 nakit indirimi ({formatTL(plan.discountK)}) sağlandı. Net ödeme: <b>{formatTL(plan.downK)}</b></span>
                </div>
              )}
            </div>
          </div>

          {/* Mod seçimi */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <Label>Taksit Dağıtım Modu</Label>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <Toggle active={mode === 'equal'} onClick={() => onModeChange('equal')}>
                  <Equal className="size-4" /> Eşit Böl
                </Toggle>
                <Toggle active={mode === 'flex'} onClick={() => onModeChange('flex')}>
                  <SlidersHorizontal className="size-4" /> Serbest Esnaf Modu
                </Toggle>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={onDistribute} disabled={plan.N === 0} className="btn-quick inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40">
                <ArrowDownToLine className="size-4" /> Kalanı Aylara Eşit Dağıt
              </button>
            </div>
          </div>

          {mode === 'equal' && (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label>Taksitlerle ödenecek ana para <span className="font-normal text-slate-400">(kalan: {formatTL(plan.kalanK)})</span></Label>
                <MoneyInput
                  valueK={equalTargetK}
                  commitOnBlur
                  onChange={onEqualTargetChange}
                  className="border-slate-300"
                  aria-label="Taksitlerle ödenecek ana para"
                />
              </div>
              <div className="flex gap-1">
                {[100, 75, 50, 25].map((p) => (
                  <button
                    key={p}
                    onClick={() => onEqualTargetChange(Math.round((plan.kalanK * p) / 100))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 hover:border-amber-500 hover:text-amber-600"
                  >
                    %{p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Aylık eşit taksit: <b className="text-slate-700">{plan.N ? formatTL(plan.rows[0]?.amountK ?? 0) : '—'}</b> × {plan.N} ay.
                Taksitlere dahil edilmeyen bakiye Mart 2028 teslimat / kapanış ödemesine devreder.
              </p>
            </div>
          )}

          {notice && (
            <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${notice.type === 'warn' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {notice.type === 'warn' ? <TriangleAlert className="size-4" /> : <CircleCheck className="size-4" />}
              {notice.text}
            </p>
          )}

          <InstallmentTable plan={plan} editable={mode === 'flex'} onChange={onFlexChange} minInstallmentK={minInstallmentK} />
        </div>
      )}
    </section>
  );
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
        active ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function Label({ icon: Icon, children }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      {Icon && <Icon className="size-3.5" />} {children}
    </label>
  );
}

function Stat({ label, value, tone = 'slate', big }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-800',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300',
  };
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className={`mt-1 font-extrabold tabular-nums ${big ? 'text-xl' : 'text-lg'}`}>{value}</p>
    </div>
  );
}
