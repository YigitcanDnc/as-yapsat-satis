/** Firma / proje künyesi (teklif antetinde kullanılır) */
export const PROJECT = {
  name: 'YAPSAT KONUT PROJESİ',
  company: 'As İnşaat Enerji Makine Madencilik Taşımacılık Tic.Ltd.Şti.',
  address: 'Proje Satış Ofisi',
  phone: '+90 507 935 72 09',
  email: 'info@as-insaat.com.tr',
  offerValidityDays: 15,
};

/**
 * Finansal parametreler. Kuruş hassasiyetinde tam sayı aritmetiği için
 * oranlar tam sayı (yüzde / binde) olarak tutulur.
 */
export const FINANCE = {
  cashDiscountPct: 15, // Peşin indirim: %15
  minDownPct: 40, // Asgari peşinat: %40
  monthlyInterestPermille: 25, // Aylık basit faiz: %2,5 = binde 25
  maturity: { y: 2028, m: 3 }, // Vade bitişi: Mart 2028
};
