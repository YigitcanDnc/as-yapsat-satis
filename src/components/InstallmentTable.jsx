import MoneyInput from './MoneyInput';
import { formatTL, formatYM } from '../lib/format';

export default function InstallmentTable({ plan, editable, onChange }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 text-xs uppercase tracking-wide text-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left">#</th>
              <th className="px-3 py-2.5 text-left">Ay / Yıl</th>
              <th className="px-3 py-2.5 text-left">Kalem</th>
              <th className="px-3 py-2.5 text-right">
                Taksit Tutarı {editable && <span className="ml-1 rounded bg-amber-500 px-1 text-[9px] text-slate-900">DÜZENLENEBİLİR</span>}
              </th>
              <th className="px-3 py-2.5 text-right">Kalan Ana Para</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="bg-amber-50/60">
              <td className="px-3 py-2 text-slate-400">0</td>
              <td className="px-3 py-2 font-medium text-slate-700">{formatYM(plan.start)}</td>
              <td className="px-3 py-2 text-slate-600">
                Peşinat (sözleşme)
                {plan.isFullDown && (
                  <span className="ml-2 inline-block rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    %15 Nakit İndirimli
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">{formatTL(plan.downK)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500">{formatTL(plan.kalanK)}</td>
            </tr>
            {plan.rows.map((r, i) => (
              <tr key={`${r.ym.y}-${r.ym.m}`} className="hover:bg-slate-50">
                <td className="px-3 py-1.5 text-slate-400">{r.index}</td>
                <td className="px-3 py-1.5 font-medium text-slate-700">{formatYM(r.ym)}</td>
                <td className="px-3 py-1.5 text-slate-500">{r.index}. Taksit</td>
                <td className="w-56 px-3 py-1.5 text-right">
                  {editable ? (
                    <MoneyInput
                      valueK={r.amountK}
                      onChange={(k) => onChange(i, k)}
                      showZeroAsEmpty
                      className="border-slate-200 py-1.5 text-sm"
                      aria-label={`${formatYM(r.ym)} taksit tutarı`}
                    />
                  ) : (
                    <span className="font-semibold tabular-nums text-slate-800">{formatTL(r.amountK)}</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{formatTL(r.remainingK)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td colSpan={3} className="px-3 py-2 font-bold text-slate-700">Taksitlerle Ödenen Toplam Ana Para</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-800">{formatTL(plan.paidK)}</td>
              <td />
            </tr>
            <tr className="bg-indigo-50">
              <td className="px-3 py-2 text-indigo-400">★</td>
              <td className="px-3 py-2 font-bold text-indigo-800">{formatYM(plan.maturity)}</td>
              <td className="px-3 py-2 text-indigo-700">
                Kapanış / Teslimat Ana Parası + Vade Farkı (%{plan.interestPct.toLocaleString('tr-TR')})
                <div className="text-[11px] text-indigo-500">
                  {formatTL(plan.balonK)} + {formatTL(plan.vadeFarkiK)}
                </div>
              </td>
              <td className="px-3 py-2 text-right text-base font-extrabold tabular-nums text-indigo-800">{formatTL(plan.balonTotalK)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500">{formatTL(0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
