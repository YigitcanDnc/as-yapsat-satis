import { useState } from 'react';
import { formatNumber, parseMoneyToKurus, sanitizeMoneyText } from '../lib/format';

/**
 * Türk Lirası giriş alanı.
 * - Odakta ham metin düzenlenir, odak dışında "1.234.567,89" biçiminde gösterilir.
 * - Negatif / harf girişleri engellenir.
 * - commitOnBlur=true ise değer yalnızca odak kaybı / Enter ile iletilir (doğrulama gereken alanlar için).
 */
export default function MoneyInput({
  valueK,
  onChange,
  onDraft,
  commitOnBlur = false,
  showZeroAsEmpty = false,
  className = '',
  suffix = 'TL',
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');

  const display = focused ? text : showZeroAsEmpty && !valueK ? '' : formatNumber(valueK);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        placeholder={showZeroAsEmpty ? '0,00' : undefined}
        onFocus={(e) => {
          const el = e.currentTarget;
          setText(valueK ? formatNumber(valueK) : '');
          setFocused(true);
          requestAnimationFrame(() => el.select());
        }}
        onChange={(e) => {
          const t = sanitizeMoneyText(e.target.value);
          setText(t);
          const k = parseMoneyToKurus(t);
          onDraft?.(k);
          if (!commitOnBlur) onChange(k);
        }}
        onBlur={() => {
          if (commitOnBlur) onChange(parseMoneyToKurus(text));
          setFocused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
        }}
        className={`w-full rounded-lg border bg-white py-2 pl-3 pr-10 text-right font-semibold tabular-nums text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 ${className}`}
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
