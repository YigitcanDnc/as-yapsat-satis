/**
 * FİNANSAL HESAP MOTORU
 * Tüm tutarlar KURUŞ cinsinden tam sayı olarak işlenir (kayan nokta hatası yok).
 */
import { FINANCE } from '../config/project';

// ---------- Ay / tarih yardımcıları ----------
export const ymKey = ({ y, m }) => y * 12 + (m - 1);
export const fromKey = (k) => ({ y: Math.floor(k / 12), m: (k % 12) + 1 });
export const currentYM = (d = new Date()) => ({ y: d.getFullYear(), m: d.getMonth() + 1 });

/** Başlangıç ayından Mart 2028'e kalan ay sayısı (N) */
export const monthsUntilMaturity = (start) => Math.max(0, ymKey(FINANCE.maturity) - ymKey(start));

/** Taksit ayları: başlangıç ayının ertesi ayından Mart 2028 dahil N ay */
export const scheduleMonths = (start, N) =>
  Array.from({ length: N }, (_, i) => fromKey(ymKey(start) + i + 1));

/** Seçilebilir sözleşme başlangıç ayları: bu aydan Şubat 2028'e kadar */
export function startMonthOptions(from = currentYM()) {
  const last = ymKey(FINANCE.maturity) - 1;
  const first = Math.min(ymKey(from), last);
  const out = [];
  for (let k = first; k <= last; k++) out.push(fromKey(k));
  return out;
}

// ---------- Temel fiyatlar ----------
export const sumK = (arr) => arr.reduce((a, b) => a + (b || 0), 0);

/** Satis_Fiyati = Baz_Fiyat * (Katsayi / 100) */
export const salePriceK = (apt) => Math.round((apt.bazFiyat * 100 * apt.katsayi) / 100);

/** Pesin_Satis_Fiyati = Satis_Fiyati * 0.85 */
export const cashPriceK = (saleK) => Math.round((saleK * (100 - FINANCE.cashDiscountPct)) / 100);

/** Asgari_Pesinat = Satis_Fiyati * 0.40 (kuruş yukarı yuvarlanır → asla %40 altı değil) */
export const minDownK = (saleK) => Math.ceil((saleK * FINANCE.minDownPct) / 100);

/** Yüzdeden peşinat tutarı (asgari sınırın altına düşmez, satış fiyatını aşmaz) */
export const downFromPct = (saleK, pct) =>
  Math.min(saleK, Math.max(minDownK(saleK), Math.round((saleK * pct) / 100)));

/** Peşinatı [asgari, satış fiyatı] aralığına sıkıştırır */
export const clampDown = (saleK, downK) => Math.min(saleK, Math.max(minDownK(saleK), downK || 0));

// ---------- Taksit dağıtımı ----------
/**
 * Tutarı N aya eşit böler. Aylık taksit tam TL'ye yuvarlanır,
 * kuruş/TL farkı son taksite eklenir → toplam birebir korunur.
 */
export function equalSplitK(totalK, N) {
  if (N <= 0) return [];
  if (!totalK || totalK <= 0) return Array(N).fill(0);
  const unit = Math.floor(totalK / N / 100) * 100;
  const arr = Array(N).fill(unit);
  arr[N - 1] = totalK - unit * (N - 1);
  return arr;
}

/**
 * Esnek moddaki taksit haritasını (ymKey → kuruş) verilen limite göre sondan kırpar.
 */
export function trimInstallmentMap(map, months, limitK) {
  const next = { ...map };
  let total = sumK(months.map((ym) => next[ymKey(ym)] || 0));
  for (let i = months.length - 1; i >= 0 && total > limitK; i--) {
    const k = ymKey(months[i]);
    const v = next[k] || 0;
    const cut = Math.min(v, total - limitK);
    next[k] = v - cut;
    total -= cut;
  }
  return next;
}

// ---------- Vadeli plan hesabı ----------
/**
 * @param {object} p
 * @param {number} p.saleK         Şerefiyeli satış fiyatı (kuruş)
 * @param {number} p.downK         Peşinat (kuruş)
 * @param {number[]} p.installmentsK Aylık taksitler (kuruş), uzunluk N
 * @param {{y:number,m:number}} p.start Sözleşme başlangıç ayı
 */
export function computeInstallmentPlan({ saleK, downK, installmentsK, start }) {
  const isFullDown = downK >= saleK;

  if (isFullDown) {
    const cashK = cashPriceK(saleK);
    const discountK = saleK - cashK;
    const N = monthsUntilMaturity(start);
    const months = scheduleMonths(start, N);
    const rows = months.map((ym, i) => ({
      index: i + 1,
      ym,
      amountK: 0,
      remainingK: 0,
    }));

    return {
      N,
      start,
      maturity: FINANCE.maturity,
      saleK,
      downK: cashK, // Net ödenen peşinat %15 indirimli tutar
      rawDownK: downK, // Girilen peşinat
      downPct: 100,
      isFullDown: true,
      discountPct: FINANCE.cashDiscountPct,
      discountK,
      kalanK: 0,
      paidK: 0,
      balonK: 0,
      interestPct: 0,
      vadeFarkiK: 0,
      balonTotalK: 0,
      totalK: cashK,
      extraCostK: -discountK,
      rows,
    };
  }

  const N = monthsUntilMaturity(start);
  const months = scheduleMonths(start, N);
  const kalanK = Math.max(0, saleK - downK); // Kalan_Ana_Para
  const paidK = sumK(installmentsK); // Toplam_Odenen_Taksitler
  const balonK = Math.max(0, kalanK - paidK); // Balon_Ana_Para
  const ratePermille = N * FINANCE.monthlyInterestPermille; // N * %2,5
  const vadeFarkiK = balonK > 0 ? Math.round((balonK * ratePermille) / 1000) : 0; // Vade_Farki
  const balonTotalK = balonK + vadeFarkiK; // Mart_2028_Toplam_Balon_Odeme
  const totalK = downK + paidK + balonTotalK; // Toplam_Odeme

  let remaining = kalanK;
  const rows = months.map((ym, i) => {
    const amountK = installmentsK[i] || 0;
    remaining -= amountK;
    return { index: i + 1, ym, amountK, remainingK: remaining };
  });

  return {
    N,
    start,
    maturity: FINANCE.maturity,
    saleK,
    downK,
    rawDownK: downK,
    downPct: saleK ? (downK / saleK) * 100 : 0,
    isFullDown: false,
    discountPct: 0,
    discountK: 0,
    kalanK,
    paidK,
    balonK,
    interestPct: ratePermille / 10,
    vadeFarkiK,
    balonTotalK,
    totalK,
    extraCostK: totalK - saleK,
    rows,
  };
}

/** Peşin plan özeti */
export function computeCashPlan(saleK) {
  const cashK = cashPriceK(saleK);
  return { saleK, cashK, discountK: saleK - cashK, discountPct: FINANCE.cashDiscountPct, totalK: cashK };
}
