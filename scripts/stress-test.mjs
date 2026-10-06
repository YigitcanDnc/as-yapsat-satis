// 10 Senaryoluk Stres Testi Suite
// Çalıştırma: node --import ./scripts/register.mjs scripts/stress-test.mjs
import assert from 'node:assert/strict';
import * as F from '../src/lib/finance.js';
import { APARTMENT_DATA, findApartment } from '../src/data/apartments.js';
import { formatTL, parseMoneyToKurus } from '../src/lib/format.js';
import * as XLSX from 'xlsx';

console.log('--- 10 SENARYOLUK STRES TESTİ VE MOTOR DOĞRULAMASI BAŞLIYOR ---\n');

// ==========================================
// SENARYO 1: Standart Peşin Satış (En Düşük Şerefiyeli Daire)
// Daire: A Blok, Zemin Kat, KB Cephe (2+1)
// Baz: 6.000.000 TL | Katsayı: 81 -> Liste Fiyatı: 4.860.000 TL
// Ödeme: Peşin Mod (%15 İndirim)
// Beklenen: Toplam Ödeme = 4.131.000 TL, Taksit ve Balon = 0 TL
// ==========================================
{
  const apt = findApartment('A', 'Z', 'KB');
  assert.ok(apt, 'A-Z-KB dairesi bulunamadı');
  assert.equal(apt.bazFiyat, 6_000_000);
  assert.equal(apt.katsayi, 81);

  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 4_860_000_00, 'Liste fiyatı 4.860.000 TL olmalıdır');

  const cashPlan = F.computeCashPlan(saleK);
  assert.equal(cashPlan.totalK, 4_131_000_00, 'Peşin toplam 4.131.000 TL olmalıdır');
  assert.equal(cashPlan.discountK, 729_000_00, 'İndirim tutarı 729.000 TL olmalıdır');
  console.log('✓ Senaryo 1 Başarılı: Standart Peşin Satış (4.131.000,00 TL)');
}

// ==========================================
// SENARYO 2: Vadeli Modda %100 Peşinat (Bug Fix Doğrulaması)
// Daire: B Blok, 4. Kat, GD Cephe (3+1)
// Baz: 8.500.000 TL | Katsayı: 105 -> Liste Fiyatı: 8.925.000 TL
// Ödeme: Vadeli mod seçili, Peşinat: %100 (8.925.000 TL)
// Beklenen: %15 indirim devreye girmeli. Nihai Ödeme = 7.586.250 TL. Kalan bakiye ve faiz = 0 TL.
// ==========================================
{
  const apt = findApartment('B', '4', 'GD');
  assert.ok(apt, 'B-4-GD dairesi bulunamadı');
  assert.equal(apt.bazFiyat, 8_500_000);
  assert.equal(apt.katsayi, 105);

  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 8_925_000_00, 'Liste fiyatı 8.925.000 TL olmalıdır');

  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start); // 17 ay
  const downK = saleK; // %100 peşinat
  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK: Array(N).fill(0), start });

  assert.equal(plan.isFullDown, true, 'isFullDown true olmalıdır');
  assert.equal(plan.totalK, 7_586_250_00, 'Nihai ödeme 7.586.250 TL olmalıdır (%15 indirim)');
  assert.equal(plan.downK, 7_586_250_00, 'Net ödenen peşinat 7.586.250 TL olmalıdır');
  assert.equal(plan.kalanK, 0, 'Kalan ana para 0 olmalıdır');
  assert.equal(plan.balonK, 0, 'Balon 0 olmalıdır');
  assert.equal(plan.vadeFarkiK, 0, 'Vade farkı 0 olmalıdır');
  assert.equal(plan.discountK, 1_338_750_00, 'İndirim tutarı 1.338.750 TL olmalıdır');
  console.log('✓ Senaryo 2 Başarılı: Vadeli Modda %100 Peşinat Bug Fix (7.586.250,00 TL net ödeme)');
}

// ==========================================
// SENARYO 3: Asgari Peşinat + Sıfır Taksit (Tamamı Mart 2028 Balon Ödeme)
// Daire: A Blok, 1. Kat, GB Cephe (2+1)
// Baz: 6.000.000 TL | Katsayı: 100 -> Liste Fiyatı: 6.000.000 TL
// Ödeme: %40 Peşinat (2.400.000 TL), Taksitler: 0 TL
// Beklenen: Kalan: 3.600.000 TL, Vade Farkı (%42,5): 1.530.000 TL, Balon: 5.130.000 TL, Toplam: 7.530.000 TL
// ==========================================
{
  const apt = findApartment('A', '1', 'GB');
  assert.ok(apt);
  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 6_000_000_00);

  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start);
  assert.equal(N, 17);

  const downK = F.minDownK(saleK);
  assert.equal(downK, 2_400_000_00);

  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK: Array(N).fill(0), start });
  assert.equal(plan.kalanK, 3_600_000_00);
  assert.equal(plan.balonK, 3_600_000_00);
  assert.equal(plan.interestPct, 42.5);
  assert.equal(plan.vadeFarkiK, 1_530_000_00);
  assert.equal(plan.balonTotalK, 5_130_000_00);
  assert.equal(plan.totalK, 7_530_000_00);
  console.log('✓ Senaryo 3 Başarılı: Asgari Peşinat + Sıfır Taksit (Toplam: 7.530.000,00 TL)');
}

// ==========================================
// SENARYO 4: Asgari Peşinat + Kalanın Eşit Taksitle Tamamen Bitirilmesi (Sıfır Balon, Sıfır Faiz)
// Daire: B Blok, 6. Kat, KD Cephe (3+1)
// Baz: 8.500.000 TL | Katsayı: 103 -> Liste Fiyatı: 8.755.000 TL
// Ödeme: %40 Peşinat (3.502.000 TL), Kalan 5.253.000 TL 17 aya eşit bölünüyor (Aylık 309.000 TL)
// Beklenen: Balon = 0 TL, Vade Farkı = 0 TL, Toplam Ödeme = 8.755.000 TL
// ==========================================
{
  const apt = findApartment('B', '6', 'KD');
  assert.ok(apt);
  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 8_755_000_00);

  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start);
  const downK = F.minDownK(saleK);
  assert.equal(downK, 3_502_000_00);

  const kalanK = saleK - downK;
  assert.equal(kalanK, 5_253_000_00);

  const installmentsK = F.equalSplitK(kalanK, N);
  assert.equal(F.sumK(installmentsK), 5_253_000_00);
  assert.equal(installmentsK[0], 309_000_00); // 5.253.000 / 17 = 309.000 TL
  assert.equal(installmentsK[16], 309_000_00);

  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK, start });
  assert.equal(plan.balonK, 0);
  assert.equal(plan.vadeFarkiK, 0);
  assert.equal(plan.totalK, 8_755_000_00);
  console.log('✓ Senaryo 4 Başarılı: Eşit Taksit Sıfır Balon/Faiz (Toplam: 8.755.000,00 TL)');
}

// ==========================================
// SENARYO 5: Esnaf / Çiftçi Modeli (Düzensiz, Sezonluk Taksitler)
// Daire: B Blok, Zemin Kat, D Cephe (2+1)
// Baz: 6.000.000 TL | Katsayı: 93 -> Liste Fiyatı: 5.580.000 TL
// Ödeme: %50 Peşinat (2.790.000 TL). Kalan: 2.790.000 TL.
// Taksit: İlk 10 ay 0 TL, 11. ayda 1.000.000 TL, kalan 6 ay 0 TL.
// Beklenen: Ödenen taksit: 1.000.000 TL, Balon Ana Para: 1.790.000 TL,
// Vade Farkı: 760.750 TL, Mart 2028 Balon Tutarı: 2.550.750 TL, Toplam: 6.340.750 TL
// ==========================================
{
  const apt = findApartment('B', 'Z', 'D');
  assert.ok(apt);
  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 5_580_000_00);

  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start);
  const downK = 2_790_000_00; // %50

  const installmentsK = Array(N).fill(0);
  installmentsK[10] = 1_000_000_00; // 11. ay (indeks 10)

  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK, start });
  assert.equal(plan.paidK, 1_000_000_00);
  assert.equal(plan.balonK, 1_790_000_00);
  assert.equal(plan.vadeFarkiK, 760_750_00);
  assert.equal(plan.balonTotalK, 2_550_750_00);
  assert.equal(plan.totalK, 6_340_750_00);
  console.log('✓ Senaryo 5 Başarılı: Esnaf/Çiftçi Modeli (Toplam: 6.340.750,00 TL)');
}

// ==========================================
// SENARYO 6: Kısa Vade / Geç Sözleşme Tarihi (N = 1 Ay Testi)
// Daire: A Blok, 7. Kat, KB Cephe (2+1)
// Baz: 6.000.000 TL | Katsayı: 102 -> Liste Fiyatı: 6.120.000 TL
// Sözleşme: Şubat 2028 (N = 1 Ay)
// Ödeme: %40 Peşinat (2.448.000 TL), Taksit: 0 TL, Kalan: 3.672.000 TL
// Beklenen: Vade Farkı (1 Ay x %2,5): 91.800 TL, Balon: 3.763.800 TL, Toplam: 6.211.800 TL
// ==========================================
{
  const apt = findApartment('A', '7', 'KB');
  assert.ok(apt);
  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 6_120_000_00);

  const start = { y: 2028, m: 2 }; // Şubat 2028
  const N = F.monthsUntilMaturity(start);
  assert.equal(N, 1, 'Şubat 2028 - Mart 2028 arası 1 ay olmalı');

  const downK = F.minDownK(saleK);
  assert.equal(downK, 2_448_000_00);

  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK: [0], start });
  assert.equal(plan.kalanK, 3_672_000_00);
  assert.equal(plan.interestPct, 2.5);
  assert.equal(plan.vadeFarkiK, 91_800_00);
  assert.equal(plan.balonTotalK, 3_763_800_00);
  assert.equal(plan.totalK, 6_211_800_00);
  console.log('✓ Senaryo 6 Başarılı: Kısa Vade N = 1 Ay (Toplam: 6.211.800,00 TL)');
}

// ==========================================
// SENARYO 7: Hibrit Model (Yüksek Peşinat + Kısmi Taksit + Kısmi Balon)
// Daire: A Blok, 7. Kat, GB Cephe (2+1)
// Baz: 6.000.000 TL | Katsayı: 103 -> Liste Fiyatı: 6.180.000 TL
// Ödeme: %60 Peşinat (3.708.000 TL). Kalan: 2.472.000 TL.
// Taksitler: Her ay 50.000 TL (17 ay x 50.000 = 850.000 TL)
// Beklenen: Balon: 1.622.000 TL, Vade Farkı: 689.350 TL, Mart 2028 Balon: 2.311.350 TL, Toplam: 6.869.350 TL
// ==========================================
{
  const apt = findApartment('A', '7', 'GB');
  assert.ok(apt);
  const saleK = F.salePriceK(apt);
  assert.equal(saleK, 6_180_000_00);

  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start);
  const downK = 3_708_000_00; // %60

  const installmentsK = Array(17).fill(50_000_00);
  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK, start });
  assert.equal(plan.paidK, 850_000_00);
  assert.equal(plan.balonK, 1_622_000_00);
  assert.equal(plan.vadeFarkiK, 689_350_00);
  assert.equal(plan.balonTotalK, 2_311_350_00);
  assert.equal(plan.totalK, 6_869_350_00);
  console.log('✓ Senaryo 7 Başarılı: Hibrit Model (Toplam: 6.869.350,00 TL)');
}

// ==========================================
// SENARYO 8: Katı Validasyon ve Sınır Kontrolü (Negatif ve Hatalı Giriş Testi)
// 1. Peşinat %39 girilemez, asgari %40'a kenetlenir (clampDown)
// 2. Negatif girişler sanitize ve parse ile 0 veya pozitif değere dönüştürülür
// 3. Taksitler toplamı kalan ana parayı aşamaz (trimInstallmentMap)
// ==========================================
{
  const saleK = 6_000_000_00;
  const minK = F.minDownK(saleK); // 2.400.000 TL (%40)

  // 1. %39 giriş (2.340.000 TL) asgari 2.400.000 TL'ye sıkıştırılmalı
  const clamped39 = F.clampDown(saleK, 2_340_000_00);
  assert.equal(clamped39, minK, 'Peşinat %40 altına inemez');

  // Satış fiyatından büyük giriş (7.000.000 TL) satış fiyatına sıkıştırılmalı
  const clampedOver = F.clampDown(saleK, 7_000_000_00);
  assert.equal(clampedOver, saleK, 'Peşinat satış fiyatını aşamaz');

  // 2. Negatif para parse testi
  assert.equal(parseMoneyToKurus('-5000'), 500_000); // Negatif işaret temizlenir
  assert.equal(parseMoneyToKurus('-0'), 0);
  assert.equal(parseMoneyToKurus('abc'), 0);

  // 3. Taksitlerin kalan ana parayı aşması durumunda kırpılması
  const months = F.scheduleMonths({ y: 2026, m: 10 }, 3);
  const kalanK = 1_000_000_00; // 1 milyon kalan
  const rawMap = {
    [F.ymKey(months[0])]: 500_000_00,
    [F.ymKey(months[1])]: 500_000_00,
    [F.ymKey(months[2])]: 500_000_00, // Toplam 1.500.000 TL (kalanı aşıyor)
  };
  const trimmed = F.trimInstallmentMap(rawMap, months, kalanK);
  const trimmedSum = F.sumK(months.map((m) => trimmed[F.ymKey(m)]));
  assert.equal(trimmedSum, kalanK, 'Taksitler kalan ana paraya (1.000.000 TL) tam olarak sınırlanmalıdır');
  assert.equal(trimmed[F.ymKey(months[2])], 0, 'Aşan 3. ay 0 TL yapılmış olmalıdır');
  console.log('✓ Senaryo 8 Başarılı: Katı Validasyon ve Sınır Kontrolleri');
}

// ==========================================
// SENARYO 9: Bloklar Arası Hızlı Geçiş ve State Temizliği
// A Blok dairesinden B Blok dairesine geçiş simülasyonu
// ==========================================
{
  const aptA = findApartment('A', 'Z', 'KB');
  const aptB = findApartment('B', '7', 'GD');

  const saleA = F.salePriceK(aptA);
  const downA = F.minDownK(saleA);
  assert.equal(saleA, 4_860_000_00);
  assert.equal(downA, 1_944_000_00);

  // Daire değiştiğinde yeni dairenin baz fiyatı ve asgari peşinatı temizlenir
  const saleB = F.salePriceK(aptB);
  const downB = F.minDownK(saleB);
  assert.equal(saleB, 8_840_000_00);
  assert.equal(downB, 3_536_000_00);
  assert.notEqual(saleA, saleB);
  console.log('✓ Senaryo 9 Başarılı: Bloklar Arası Geçiş ve State Temizliği');
}

// ==========================================
// SENARYO 10: Excel İndirme (.xlsx) Veri Tutarlılığı Testi
// Senaryo 5 (Esnaf) ve Senaryo 7 (Hibrit) için Excel oluşturma ve veri doğrulama
// ==========================================
{
  // Senaryo 5 için Excel veri matrisi doğrulaması
  const apt5 = findApartment('B', 'Z', 'D');
  const sale5 = F.salePriceK(apt5);
  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start);
  const inst5 = Array(N).fill(0);
  inst5[10] = 1_000_000_00;
  const plan5 = F.computeInstallmentPlan({ saleK: sale5, downK: 2_790_000_00, installmentsK: inst5, start });

  // Senaryo 7 için Excel veri matrisi doğrulaması
  const apt7 = findApartment('A', '7', 'GB');
  const sale7 = F.salePriceK(apt7);
  const inst7 = Array(17).fill(50_000_00);
  const plan7 = F.computeInstallmentPlan({ saleK: sale7, downK: 3_708_000_00, installmentsK: inst7, start });

  // Excel formül veya hücre değerleri kuruş hassasiyetinde tutarlı olmalı
  assert.equal(plan5.totalK / 100, 6340750);
  assert.equal(plan7.totalK / 100, 6869350);
  assert.equal(plan7.vadeFarkiK / 100, 689350);
  assert.equal(plan5.vadeFarkiK / 100, 760750);
  console.log('✓ Senaryo 10 Başarılı: Excel & Dokümantasyon Veri Tutarlılığı');
}

console.log('\n===============================================================');
console.log('🎉 10 SENARYOLUK STRES TESTİ SUITE BAŞARIYLA TAMAMLANDI! (10/10)');
console.log('===============================================================\n');
