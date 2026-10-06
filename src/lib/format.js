const numberFmt = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/** Kuruş (tam sayı) → "6.240.000,00" */
export const formatNumber = (kurus) => numberFmt.format((kurus || 0) / 100);

/** Kuruş (tam sayı) → "6.240.000,00 TL" */
export const formatTL = (kurus) => `${formatNumber(kurus)} TL`;

export const formatPct = (value, digits = 2) =>
  `%${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0)}`;

export const formatYM = ({ y, m }) => `${MONTHS_TR[m - 1]} ${y}`;

export const formatDate = (d = new Date()) =>
  d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Kullanıcı girdisinden yalnızca rakam, nokta ve virgül bırakır (negatif işaret engellenir). */
export const sanitizeMoneyText = (text) => String(text ?? '').replace(/[^\d.,]/g, '');

/**
 * Türkçe para metnini kuruşa çevirir.
 * "6.000.000,50" → 600000050 ; "6000000" → 600000000 ; "1.500" → 150000
 */
export function parseMoneyToKurus(text) {
  let t = sanitizeMoneyText(text);
  if (!t) return 0;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.').replace(/,/g, '');
  } else {
    const dotCount = (t.match(/\./g) || []).length;
    if (dotCount > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, '');
  }
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
