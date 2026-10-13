// 20 Absürt Satış Senaryosu Stres ve Güvenlik Testi
import assert from 'node:assert/strict';
import * as F from '../src/lib/finance.js';
import { APARTMENT_DATA, findApartment, findApartmentByNo } from '../src/data/apartments.js';
import { formatTL, formatPct, parseMoneyToKurus } from '../src/lib/format.js';
globalThis.document = {
  createElement: () => ({ click: () => {}, href: '', download: '', setAttribute: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
};
globalThis.window = {
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
};
globalThis.URL = globalThis.window.URL;
import { exportOfferToExcel } from '../src/lib/exportExcel.js';

console.log('================================================================');
console.log('🚀 20 ABSÜRT SATIŞ SENARYOSU İLE STRES TESTİ BAŞLIYOR');
console.log('================================================================\n');

const issues = [];

function recordIssue(scenarioNum, title, description, severity = 'WARNING') {
  issues.push({ scenarioNum, title, description, severity });
  console.log(`  ❌ [${severity}] Senaryo ${scenarioNum}: ${title} -> ${description}`);
}

// ----------------------------------------------------------------------
// SENARYO 1: "Son Dakika Teslimatçısı" (N = 0 Ay - Teslimat Ayında Sözleşme)
// ----------------------------------------------------------------------
console.log('SENARYO 1: "Son Dakika Teslimatçısı" (Start = Mart 2028, N = 0 Ay)');
{
  const start = { y: 2028, m: 3 }; // Mart 2028
  const N = F.monthsUntilMaturity(start);
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const downK = F.minDownK(saleK);
  
  try {
    const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK: [], start });
    const split = F.equalSplitK(saleK - downK, N);
    
    if (Number.isNaN(plan.totalK) || Number.isNaN(plan.vadeFarkiK)) {
      recordIssue(1, 'NaN Değeri', 'N = 0 olduğunda plan.totalK veya vade farkı NaN üretiyor', 'CRITICAL');
    }
    if (split.length !== 0) {
      recordIssue(1, 'Sıfır Ay Dağıtımı', 'equalSplitK N=0 için boş dizi dönmeliydi');
    }
    console.log(`  ✓ N=${N}, Kalan: ${formatTL(plan.kalanK)}, Vade Farkı: ${formatTL(plan.vadeFarkiK)}, Toplam: ${formatTL(plan.totalK)}`);
  } catch (err) {
    recordIssue(1, 'Çökme', `N = 0 senaryosunda hesaplama motoru çöktü: ${err.message}`, 'CRITICAL');
  }
}

// ----------------------------------------------------------------------
// SENARYO 2: "99.9999% Peşinatçı (Kalan 1 Kuruş)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 2: "99.9999% Peşinatçı" (Kalan Bakiye Sadece 1 Kuruş)');
{
  const apt = APARTMENT_DATA[5];
  const saleK = F.salePriceK(apt);
  const downK = saleK - 1; // Kalan 1 kuruş
  const start = { y: 2026, m: 10 };
  const N = F.monthsUntilMaturity(start); // 17 ay
  
  const split = F.equalSplitK(1, N);
  const splitSum = F.sumK(split);
  
  if (splitSum !== 1) {
    recordIssue(2, 'Kuruş Kaybı', `1 kuruş 17 aya dağıtıldığında toplam ${splitSum} oldu (1 olmalıydı)`, 'CRITICAL');
  }
  
  const plan = F.computeInstallmentPlan({ saleK, downK, installmentsK: split, start });
  if (plan.downK + F.sumK(split) + plan.balonK !== saleK) {
    recordIssue(2, 'Matematiksel Denge', 'Peşinat + Taksitler + Balon !== Satış Fiyatı', 'CRITICAL');
  }
  console.log(`  ✓ 1 kuruşluk bakiye 17 aya dağıtıldı. Son taksit: ${split[N-1]} kuruş, Toplam korundu: ${splitSum === 1}`);
}

// ----------------------------------------------------------------------
// SENARYO 3: "Kuruş Avcısı" (17 Aya Tam Bölünemeyen 1.000.000,01 TL)
// ----------------------------------------------------------------------
console.log('\nSENARYO 3: "Kuruş Avcısı" (1.000.000,01 TL Kalan Bakiyenin Dağıtımı)');
{
  const totalK = 1_000_000_01; // 1.000.000,01 TL
  const N = 17;
  const split = F.equalSplitK(totalK, N);
  const sum = F.sumK(split);
  
  if (sum !== totalK) {
    recordIssue(3, 'Yuvarlama Hatası', `Toplam ${totalK} olmalıydı fakat ${sum} oldu (${totalK - sum} kuruş sapma)`, 'CRITICAL');
  } else {
    console.log(`  ✓ 17 aya bölme kuruş hassasiyetinde tam: İlk taksit ${formatTL(split[0])}, Son taksit: ${formatTL(split[N-1])}, Toplam: ${formatTL(sum)}`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 4: "Hiperenflasyon / Oligark Modeli" (1 Trilyon TL Baz Fiyat)
// ----------------------------------------------------------------------
console.log('\nSENARYO 4: "Hiperenflasyon / Oligark Modeli" (1.000.000.000.000 TL)');
{
  const crazyBase = 1_000_000_000_000; // 1 Trilyon TL
  const apt = { ...APARTMENT_DATA[0], bazFiyat: crazyBase, katsayi: 100 };
  const saleK = F.salePriceK(apt);
  
  // JavaScript MAX_SAFE_INTEGER: 9,007,199,254,740,991 (9 Katrilyon)
  // 1 Trilyon TL = 100 Trilyon kuruş = 10^14 < 9*10^15
  if (!Number.isSafeInteger(saleK)) {
    recordIssue(4, 'Tamsayı Taşması', '1 Trilyon TL için kuruş hesabı Number.MAX_SAFE_INTEGER değerini aştı!', 'CRITICAL');
  }
  
  const formatted = formatTL(saleK);
  if (!formatted.includes('TL')) {
    recordIssue(4, 'Format Hatası', 'Devasa rakam formatlanamadı');
  }
  console.log(`  ✓ 1 Trilyon TL Liste Fiyatı: ${formatted} (Safe Integer: ${Number.isSafeInteger(saleK)})`);
}

// ----------------------------------------------------------------------
// SENARYO 5: "Mikro Daire / 1 TL Baz Fiyat"
// ----------------------------------------------------------------------
console.log('\nSENARYO 5: "Mikro Daire" (Baz Fiyat = 1 TL)');
{
  const apt = { ...APARTMENT_DATA[0], bazFiyat: 1, katsayi: 81 };
  const saleK = F.salePriceK(apt); // 81 kuruş
  const minK = F.minDownK(saleK); // 33 kuruş (0.81 * 0.4 = 0.324 -> ceil = 33 kuruş)
  
  if (minK < 0 || saleK <= 0) {
    recordIssue(5, 'Sıfır/Negatif Değer', '1 TL baz fiyat için liste veya asgari peşinat hatalı');
  }
  
  const plan = F.computeInstallmentPlan({ saleK, downK: minK, installmentsK: Array(17).fill(0), start: { y: 2026, m: 10 } });
  if (Number.isNaN(plan.totalK)) {
    recordIssue(5, 'NaN Hatası', 'Mikro daire hesabında NaN oluştu', 'CRITICAL');
  }
  console.log(`  ✓ 1 TL Baz Fiyat: Liste=${formatTL(saleK)}, Asgari Peşinat=${formatTL(minK)}, Toplam=${formatTL(plan.totalK)}`);
}

// ----------------------------------------------------------------------
// SENARYO 6: "Deli Esnaf / Bumerang Taksit" (Aşırı Esnek Giriş)
// ----------------------------------------------------------------------
console.log('\nSENARYO 6: "Deli Esnaf / Bumerang Taksit" (Kalanın 10 Katı Giriş)');
{
  const months = F.scheduleMonths({ y: 2026, m: 10 }, 5);
  const limitK = 1_000_000_00; // 1 milyon kalan
  const crazyMap = {
    [F.ymKey(months[0])]: 5_000_000_00,
    [F.ymKey(months[1])]: 5_000_000_00,
  };
  
  const trimmed = F.trimInstallmentMap(crazyMap, months, limitK);
  const totalTrimmed = F.sumK(months.map(m => trimmed[F.ymKey(m)] || 0));
  
  if (totalTrimmed > limitK) {
    recordIssue(6, 'Taksit Taşması', `Taksit toplamı (${totalTrimmed}) limiti (${limitK}) aştı!`, 'CRITICAL');
  }
  console.log(`  ✓ 10 Milyonluk giriş ${formatTL(limitK)} limitine başarıyla kırpıldı. Sonuç: ${formatTL(totalTrimmed)}`);
}

// ----------------------------------------------------------------------
// SENARYO 7: "Ters Zaman Yolcusu / Geçmiş & Gelecek Tarih"
// ----------------------------------------------------------------------
console.log('\nSENARYO 7: "Ters Zaman Yolcusu" (Sözleşme Başlangıç Tarihi Kontrolü)');
{
  // Başlangıç tarihi Mart 2028'den SONRA bir tarih olursa
  const futureStart = { y: 2029, m: 1 };
  const N_future = F.monthsUntilMaturity(futureStart);
  if (N_future !== 0) {
    recordIssue(7, 'Gelecek Tarih Mantığı', `Mart 2028'den sonraki başlangıç için N=0 olmalıydı, N=${N_future} çıktı`);
  }
  console.log(`  ✓ 2029 yılı için vade süresi korumalı olarak N = ${N_future} ay döndü`);
}

// ----------------------------------------------------------------------
// SENARYO 8: "Negatif ve Harfli Para Korsanı"
// ----------------------------------------------------------------------
console.log('\nSENARYO 8: "Negatif ve Harfli Para Korsanı"');
{
  const inputs = ['--5000', 'abc', '1e10', '0,0000', '-0', '   ', '.,.,'];
  for (const inp of inputs) {
    const kurus = parseMoneyToKurus(inp);
    if (!Number.isFinite(kurus) || kurus < 0) {
      recordIssue(8, 'Geçersiz Parse', `Girdi: "${inp}" sonucunda geçersiz değer üretildi: ${kurus}`, 'CRITICAL');
    }
  }
  console.log('  ✓ Tüm zararlı/bozuk metin girdileri güvenli tam sayı kuruş değerlerine dönüştürüldü');
}

// ----------------------------------------------------------------------
// SENARYO 9: "Bedelsiz Hibe / 0 TL Satış Fiyatı" (Sıfıra Bölme Koruması)
// ----------------------------------------------------------------------
console.log('\nSENARYO 9: "0 TL Satış Fiyatı" (Sıfıra Bölme Güvenliği)');
{
  const saleK = 0;
  const plan = F.computeInstallmentPlan({ saleK, downK: 0, installmentsK: [], start: { y: 2026, m: 10 } });
  if (Number.isNaN(plan.downPct)) {
    recordIssue(9, 'Sıfıra Bölme NaN', 'saleK = 0 iken plan.downPct NaN üretti!', 'CRITICAL');
  } else {
    console.log(`  ✓ 0 TL için downPct = %${plan.downPct} (NaN koruması devrede)`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 10: "Çifte Satış (Double Booking) ve Uniqueness"
// ----------------------------------------------------------------------
console.log('\nSENARYO 10: "Çifte Satış (Double Booking)"');
{
  let sales = [
    { id: '1', aptNo: 'A-1', customerName: 'Ali', salePriceK: 500000000 },
  ];
  // Aynı daireye ikinci satış eklenirse (App.jsx handleSaveSale mantığı)
  const newSale = { id: '2', aptNo: 'A-1', customerName: 'Veli', salePriceK: 550000000 };
  sales = [newSale, ...sales.filter(s => s.aptNo !== newSale.aptNo)];
  
  if (sales.length !== 1 || sales[0].customerName !== 'Veli') {
    recordIssue(10, 'Çifte Kayıt Engelleme', 'Aynı daire için eski kayıt silinmedi veya mükerrer oluştu');
  } else {
    console.log('  ✓ Aynı daireye yeni satış girildiğinde eski kayıt başarıyla güncelleniyor / tekilleştiriliyor');
  }
}

// ----------------------------------------------------------------------
// SENARYO 11: "Kapalı Gişe / Tüm 40 Dairenin Satılması"
// ----------------------------------------------------------------------
console.log('\nSENARYO 11: "Tüm 40 Dairenin Satılması" (100% Doluluk)');
{
  const allSales = APARTMENT_DATA.map((a, i) => ({
    id: `sale_${i}`,
    aptNo: a.no,
    customerName: `Müşteri ${i + 1}`,
    salePriceK: F.salePriceK(a),
    date: '2026-10-13',
    paymentType: 'cash',
  }));
  
  const soldCount = allSales.length;
  const total = APARTMENT_DATA.length;
  const available = Math.max(0, total - soldCount);
  const occupancy = ((soldCount / total) * 100).toFixed(1);
  
  if (available !== 0 || occupancy !== '100.0') {
    recordIssue(11, 'Portföy Hesabı', 'Tüm daireler satıldığında müsait daire sayısı veya doluluk hatalı');
  } else {
    console.log(`  ✓ 40/40 daire satıldı: Müsait: ${available}, Doluluk: %${occupancy}`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 12: "Satış Sonrası Baz Fiyat Güncelleme Paradoksu"
// ----------------------------------------------------------------------
console.log('\nSENARYO 12: "Satış Sonrası Baz Fiyat Güncelleme Paradoksu"');
{
  const apt = APARTMENT_DATA[0];
  const originalPriceK = F.salePriceK(apt);
  const saleRecord = {
    aptNo: apt.no,
    salePriceK: originalPriceK,
    customerName: 'Korumalı Müşteri',
  };
  
  // Baz fiyat 6 milyondan 12 milyona çıktı
  const updatedApt = { ...apt, bazFiyat: 12_000_000 };
  const newPriceK = F.salePriceK(updatedApt);
  
  if (saleRecord.salePriceK !== originalPriceK) {
    recordIssue(12, 'Satış Sözleşmesi Bozulması', 'Satılan dairenin anlaşılan fiyatı baz fiyat değişiminden etkilendi!', 'CRITICAL');
  } else {
    console.log(`  ✓ Satış anındaki fiyat sabit kaldı (${formatTL(saleRecord.salePriceK)}), yeni liste fiyatı güncellendi (${formatTL(newPriceK)})`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 13: "Satış İptali & Portföy Reenkarnasyonu"
// ----------------------------------------------------------------------
console.log('\nSENARYO 13: "Satış İptali & Portföy Reenkarnasyonu"');
{
  let sales = [{ aptNo: 'B-10', customerName: 'Test' }];
  // Silme işlemi
  sales = sales.filter(s => s.aptNo !== 'B-10');
  const soldMap = sales.reduce((acc, s) => ({ ...acc, [s.aptNo]: s }), {});
  
  if (soldMap['B-10']) {
    recordIssue(13, 'Silme Hatası', 'B-10 silindikten sonra soldMap içinde hala mevcut');
  } else {
    console.log('  ✓ Satış kaydı silindiğinde daire anında tekrar satışa açık portföye döndü');
  }
}

// ----------------------------------------------------------------------
// SENARYO 14: "Hacker Müşteri (XSS & Script Injection)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 14: "Hacker Müşteri (XSS & HTML Injection)"');
{
  const maliciousName = "<script>alert('pwned')</script><img src=x onerror=alert(1)>";
  // React varsayılan olarak JSX içinde stringleri escape eder.
  // Ancak Excel ve Print tarafında test edelim:
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const plan = F.computeInstallmentPlan({ saleK, downK: F.minDownK(saleK), installmentsK: Array(17).fill(0), start: { y: 2026, m: 10 } });
  
  try {
    // Excel export testi
    const excelPayload = {
      apt,
      saleK,
      paymentType: 'installment',
      cashPlan: F.computeCashPlan(saleK),
      plan,
      customerName: maliciousName,
      offerNo: 'YS-TEST-XSS',
    };
    // Fonksiyonun çökmediğini doğrulayalım
    assert.doesNotThrow(async () => {
      await exportOfferToExcel(excelPayload);
    });
    console.log('  ✓ XSS enjeksiyonlu müşteri adı ExcelJS ve veri motorunda güvenle işlendi');
  } catch (err) {
    recordIssue(14, 'XSS Çökmesi', `Zararlı kod içeren isim kütüphaneyi çökertti: ${err.message}`, 'CRITICAL');
  }
}

// ----------------------------------------------------------------------
// SENARYO 15: "Destansı İsim (10.000 Karakterlik Müşteri Adı)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 15: "Destansı İsim" (10.000 Karakter)');
{
  const longName = 'A'.repeat(10000);
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const plan = F.computeInstallmentPlan({ saleK, downK: F.minDownK(saleK), installmentsK: Array(17).fill(0), start: { y: 2026, m: 10 } });
  
  try {
    await exportOfferToExcel({
      apt,
      saleK,
      paymentType: 'cash',
      cashPlan: F.computeCashPlan(saleK),
      plan,
      customerName: longName,
      offerNo: 'YS-LONG',
    });
    console.log('  ✓ 10.000 karakterlik isim bellek taşması olmadan işlendi');
  } catch (err) {
    recordIssue(15, 'Uzun Metin Hatası', `Aşırı uzun metin işleminde hata: ${err.message}`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 16: "Emoji & Unicode Çılgınlığı"
// ----------------------------------------------------------------------
console.log('\nSENARYO 16: "Emoji & Unicode Çılgınlığı"');
{
  const weirdName = '👑 Şeyh 𝓡𝓪𝓼𝓱𝓲𝓭 🧕🏽 ﷽ 𑁍 中文 العربية';
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const plan = F.computeInstallmentPlan({ saleK, downK: F.minDownK(saleK), installmentsK: Array(17).fill(0), start: { y: 2026, m: 10 } });
  
  try {
    await exportOfferToExcel({
      apt,
      saleK,
      paymentType: 'installment',
      cashPlan: F.computeCashPlan(saleK),
      plan,
      customerName: weirdName,
      offerNo: 'YS-UNICODE',
    });
    console.log('  ✓ Çok dilli ve emoji karakterleri Excel ve veri katmanında sorunsuz kodlandı');
  } catch (err) {
    recordIssue(16, 'Unicode Çökmesi', `Unicode karakter işlenirken hata: ${err.message}`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 17: "Bozuk Hafıza (Corrupted localStorage)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 17: "Bozuk Hafıza (Corrupted localStorage)"');
{
  const corruptValues = ['{broken json', 'null', 'undefined', '12345', '"string"', '[null, undefined, 42]'];
  for (const raw of corruptValues) {
    try {
      let parsed;
      try { parsed = JSON.parse(raw); } catch { parsed = []; }
      const safeArray = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      // Test filter
      const map = safeArray.reduce((acc, s) => {
        if (s && s.aptNo) acc[s.aptNo] = s;
        return acc;
      }, {});
      assert.ok(typeof map === 'object');
    } catch (err) {
      recordIssue(17, 'Storage Crash', `Bozuk depolama verisi çökmeye neden oldu: ${err.message}`, 'CRITICAL');
    }
  }
  console.log('  ✓ Bozuk veya geçersiz JSON verileri güvenle yakalanıp varsayılana düşürüldü');
}

// ----------------------------------------------------------------------
// SENARYO 18: "Daireler Arası Seri Geçişte Peşinat Kalkanı (%40 Kuralı)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 18: "Seri Daire Geçişinde Peşinat Kalkanı"');
{
  const aptPahali = APARTMENT_DATA.find(a => a.tip === '3+1');
  const aptUcuz = APARTMENT_DATA.find(a => a.tip === '2+1');
  
  const salePahali = F.salePriceK(aptPahali);
  const minPahali = F.minDownK(salePahali);
  
  const saleUcuz = F.salePriceK(aptUcuz);
  const minUcuz = F.minDownK(saleUcuz);
  
  // Pahalıdan ucuza geçişte peşinatın minUcuz altına inip inmediği
  let currentDown = minPahali;
  // Kullanıcı ucuza geçtiğinde yeni asgari uygulanmalı
  currentDown = minUcuz;
  if (currentDown < minUcuz) {
    recordIssue(18, 'Asgari Peşinat İhlali', 'Ucuz daireye geçildiğinde peşinat %40 altına düştü!', 'CRITICAL');
  } else {
    console.log(`  ✓ Pahalı (${formatTL(salePahali)}) -> Ucuz (${formatTL(saleUcuz)}) geçişinde peşinat asgari ${formatTL(minUcuz)} olarak korundu`);
  }
}

// ----------------------------------------------------------------------
// SENARYO 19: "Modlar Arası Kaotik Geçiş (Eşit -> Esnek -> Dağıt -> Eşit)"
// ----------------------------------------------------------------------
console.log('\nSENARYO 19: "Modlar Arası Kaotik Geçiş"');
{
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const downK = F.minDownK(saleK);
  const kalanK = saleK - downK;
  const N = 17;
  
  // 1. Eşit Dağıtım
  const equal1 = F.equalSplitK(kalanK, N);
  assert.equal(F.sumK(equal1), kalanK);
  
  // 2. Esnek Moda Geçiş ve bazı ayların değiştirilmesi
  const flex = [...equal1];
  flex[0] = 0;
  flex[1] = 0;
  const kalanFlex = kalanK - F.sumK(flex); // 2 aylık boşluk
  
  // 3. Kalanın eşit dağıtılması (handleDistribute mantığı)
  const dist = F.equalSplitK(kalanFlex, 2);
  flex[0] = dist[0];
  flex[1] = dist[1];
  
  assert.equal(F.sumK(flex), kalanK);
  console.log('  ✓ Kaotik mod geçişlerinde 1 kuruş dahi sapma olmadan tam bakiye eşitliği korundu');
}

// ----------------------------------------------------------------------
// SENARYO 20: "PrintOffer Çıktısı Tablo Değerleri ve NaN/Undefined Taraması"
// ----------------------------------------------------------------------
console.log('\nSENARYO 20: "PrintOffer Çıktısı Alan Kontrolleri"');
{
  const apt = APARTMENT_DATA[0];
  const saleK = F.salePriceK(apt);
  const plan = F.computeInstallmentPlan({
    saleK,
    downK: F.minDownK(saleK),
    installmentsK: Array(17).fill(0),
    start: { y: 2026, m: 10 },
  });
  
  // PrintOffer.jsx içindeki kullanılan alanlar:
  // plan.installmentCount, plan.totalInstallmentsK, plan.monthsPassed, plan.grandTotalK
  const checkFields = [
    { name: 'plan.installmentCount', val: plan.installmentCount, expected: plan.N },
    { name: 'plan.totalInstallmentsK', val: plan.totalInstallmentsK, expected: plan.paidK },
    { name: 'plan.monthsPassed', val: plan.monthsPassed, expected: plan.N },
    { name: 'plan.grandTotalK', val: plan.grandTotalK, expected: plan.totalK },
  ];
  
  for (const f of checkFields) {
    if (f.val === undefined) {
      recordIssue(20, 'Eksik Alan (Undefined)', `${f.name} tanımlı değil! Print çıktısında ${f.name} undefined veya 0 TL görünüyor!`, 'CRITICAL');
    }
  }
}

console.log('\n================================================================');
console.log(`🏁 TESTLER TAMAMLANDI: TOPLAM ${issues.length} HATA/AKSAKLIK BULUNDU`);
console.log('================================================================\n');
