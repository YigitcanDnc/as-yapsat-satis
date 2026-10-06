import ExcelJS from 'exceljs';
import { PROJECT, FINANCE } from '../config/project';
import { CEPHE_LABELS, katLabel, aptShortCode } from '../data/apartments';
import { formatYM, formatDate } from './format';

const tl = (k) => Math.round(k || 0) / 100;

export async function exportOfferToExcel(payload) {
  const { apt, saleK, paymentType, cashPlan, plan, customerName, offerNo } = payload;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = PROJECT.company;
  workbook.created = new Date();

  // Renk Paleti (Kurumsal Lacivert & Altın Amber)
  const NAVY = '1E293B'; // Slate 800
  const DARK_NAVY = '0F172A'; // Slate 900
  const AMBER_GOLD = 'F59E0B'; // Amber 500
  const SOFT_AMBER = 'FEF3C7'; // Amber 100
  const LIGHT_GRAY = 'F8FAFC'; // Slate 50
  const BORDER_COLOR = 'CBD5E1'; // Slate 300
  const TEXT_MUTED = '64748B'; // Slate 500

  // ========================================================
  // SAYFA 1: TEKLİF VE FİNANSAL ÖZET
  // ========================================================
  const ws1 = workbook.addWorksheet('Teklif Özeti', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  ws1.columns = [
    { width: 3 },  // A (Boşluk)
    { width: 34 }, // B
    { width: 38 }, // C
  ];

  // Başlık Bölümü
  ws1.mergeCells('B2:C2');
  const titleCell = ws1.getCell('B2');
  titleCell.value = PROJECT.company.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_NAVY}` } };
  ws1.getRow(2).height = 34;

  ws1.mergeCells('B3:C3');
  const subTitle = ws1.getCell('B3');
  subTitle.value = `${PROJECT.name} · RESMİ SATIŞ TEKLİFİ VE ÖDEME PLANI`;
  subTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };
  subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  subTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  ws1.getRow(3).height = 22;

  // İletişim Alt Satırı
  ws1.mergeCells('B4:C4');
  const infoRow = ws1.getCell('B4');
  infoRow.value = `${PROJECT.address}  |  Tel: ${PROJECT.phone}  |  E-posta: ${PROJECT.email}`;
  infoRow.font = { name: 'Calibri', size: 9, italic: true, color: { argb: `FF${TEXT_MUTED}` } };
  infoRow.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(4).height = 20;

  let r = 6;

  // Bilgi Tablosu Yardımcısı
  const addSectionHeader = (title) => {
    ws1.mergeCells(`B${r}:C${r}`);
    const cell = ws1.getCell(`B${r}`);
    cell.value = title;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    ws1.getRow(r).height = 24;
    r++;
  };

  const addDataRow = (label, val, fmt = null, isBold = false, isHighlight = false) => {
    const c1 = ws1.getCell(`B${r}`);
    const c2 = ws1.getCell(`C${r}`);
    c1.value = label;
    c2.value = val;

    c1.font = { name: 'Calibri', size: 10, color: { argb: 'FF334155' } };
    c2.font = { name: 'Calibri', size: 10, bold: isBold, color: { argb: isBold ? 'FF0F172A' : 'FF334155' } };

    if (fmt === 'TL') {
      c2.numFmt = '#,##0.00 "TL"';
      c2.alignment = { horizontal: 'right' };
    } else if (fmt === 'PCT') {
      c2.numFmt = '0.00"%"';
      c2.alignment = { horizontal: 'right' };
    } else {
      c2.alignment = { horizontal: 'left' };
    }

    const bg = isHighlight ? `FF${SOFT_AMBER}` : (r % 2 === 0 ? `FF${LIGHT_GRAY}` : 'FFFFFFFF');
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };

    const borderThin = { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } };
    c1.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
    c2.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

    ws1.getRow(r).height = 21;
    r++;
  };

  // 1. TEKLİF VE MÜŞTERİ BİLGİLERİ
  addSectionHeader('1. TEKLİF & MÜŞTERİ BİLGİLERİ');
  addDataRow('Teklif Numarası', offerNo, null, true);
  addDataRow('Teklif Tarihi', formatDate());
  addDataRow('Teklif Geçerlilik', `${PROJECT.offerValidityDays} Gün (${formatDate(new Date(Date.now() + PROJECT.offerValidityDays * 86400000))})`);
  addDataRow('Müşteri Adı Soyadı', customerName || 'Belirtilmedi', null, true);
  r++;

  // 2. DAİRE KÜNYESİ
  addSectionHeader('2. DAİRE VE ŞEREFİYE KÜNYESİ');
  addDataRow('Daire Kodu', aptShortCode(apt), null, true);
  addDataRow('Blok / Kat', `${apt.blok} Blok · ${katLabel(apt.kat)}`);
  addDataRow('Cephe', `${apt.cephe} (${CEPHE_LABELS[apt.cephe]})`);
  addDataRow('Daire Tipi', apt.tip);
  addDataRow('Şerefiye Katsayısı', apt.katsayi);
  addDataRow('Baz Fiyat', tl(apt.bazFiyat * 100), 'TL');
  addDataRow('Nihai Liste Satış Fiyatı', tl(saleK), 'TL', true, true);
  r++;

  // 3. FİNANSAL VE ÖDEME PLANI ÖZETİ
  addSectionHeader('3. FİNANSAL VE ÖDEME ÖZETİ');
  if (paymentType === 'cash') {
    addDataRow('Ödeme Türü', `Peşin (%${FINANCE.cashDiscountPct} Nakit İndirimli)`, null, true);
    addDataRow('Liste Satış Fiyatı', tl(cashPlan.saleK), 'TL');
    addDataRow('Nakit İndirim Oranı', cashPlan.discountPct, 'PCT');
    addDataRow('Nakit İndirim Tutarı', tl(cashPlan.discountK), 'TL', true);
    addDataRow('TOPLAM PEŞİN SATIŞ BEDELİ', tl(cashPlan.cashK), 'TL', true, true);
  } else {
    addDataRow('Ödeme Türü', plan.isFullDown ? 'Vadeli (%100 Peşinat / %15 İndirimli)' : 'Vadeli / Taksitli', null, true);
    addDataRow('Sözleşme Başlangıç Ayı', formatYM(plan.start));
    addDataRow('Vade Bitiş / Teslim Ayı', formatYM(plan.maturity));
    addDataRow('Vade Süresi (N)', `${plan.N} Ay`);
    addDataRow('Liste Satış Fiyatı', tl(plan.saleK), 'TL');

    if (plan.isFullDown) {
      addDataRow('Nakit İndirim Oranı', plan.discountPct, 'PCT');
      addDataRow('Nakit İndirim Tutarı', tl(plan.discountK), 'TL', true);
      addDataRow('Ödenen Net Peşinat (%100)', tl(plan.downK), 'TL', true, true);
    } else {
      addDataRow('Alınan Peşinat Tutarı', tl(plan.downK), 'TL', true);
      addDataRow('Peşinat Oranı', Number(plan.downPct.toFixed(2)), 'PCT');
    }

    addDataRow('Kalan Ana Para Borcu', tl(plan.kalanK), 'TL');
    addDataRow('Taksitlerle Ödenen Ana Para', tl(plan.paidK), 'TL');
    addDataRow(`${formatYM(plan.maturity)} Kapanış Ana Para Bakiyesi`, tl(plan.balonK), 'TL', true);
    addDataRow(`Uygulanan Vade Farkı (Aylık %2,5 × ${plan.N} Ay)`, plan.interestPct, 'PCT');
    addDataRow('Vade Farkı Tutarı', tl(plan.vadeFarkiK), 'TL', true);
    addDataRow(`${formatYM(plan.maturity)} Nihai Kapanış / Teslimat Ödemesi`, tl(plan.balonTotalK), 'TL', true, true);
    addDataRow('PROJE GENEL TOPLAM MALİYETİ', tl(plan.totalK), 'TL', true, true);
  }

  // Dipnot İmza Alanı
  r += 2;
  ws1.mergeCells(`B${r}:C${r}`);
  const signNote = ws1.getCell(`B${r}`);
  signNote.value = 'İşbu ödeme planı ve teklif özeti satış vaadi sözleşmesinin ayrılmaz bir parçasıdır.';
  signNote.font = { name: 'Calibri', size: 9, italic: true, color: { argb: `FF${TEXT_MUTED}` } };
  signNote.alignment = { horizontal: 'center' };

  // ========================================================
  // SAYFA 2: DETAYLI AY AY ÖDEME ÇİZELGESİ
  // ========================================================
  const ws2 = workbook.addWorksheet('Ödeme Çizelgesi', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  ws2.columns = [
    { width: 2 },  // A
    { width: 7 },  // B: No
    { width: 17 }, // C: Vade Tarihi
    { width: 29 }, // D: Kalem Açıklaması
    { width: 21 }, // E: Tutar (TL)
    { width: 22 }, // F: Kalan Ana Para (TL)
  ];

  // Tablo Başlığı
  ws2.mergeCells('B2:F2');
  const title2 = ws2.getCell('B2');
  title2.value = `${aptShortCode(apt)} DAİRESİ AY AY DETAYLI ÖDEME PLANI VE BAKİYE ÇİZELGESİ`;
  title2.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_NAVY}` } };
  ws2.getRow(2).height = 30;

  // Kolon Başlıkları
  const headers = ['#', 'Vade (Ay/Yıl)', 'Ödeme Kalemi', 'Ödeme Tutarı', 'Kalan Ana Para Bakiyesi'];
  const headerRow = ws2.getRow(4);
  headerRow.height = 24;

  ['B', 'C', 'D', 'E', 'F'].forEach((col, idx) => {
    const c = ws2.getCell(`${col}4`);
    c.value = headers[idx];
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
    c.alignment = { horizontal: idx >= 3 ? 'right' : 'center', vertical: 'middle' };
  });

  let rowIdx = 5;
  const borderThin = { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } };

  const addScheduleLine = (num, dateStr, label, amount, balance, isHighlight = false, isLast = false) => {
    const rCurrent = ws2.getRow(rowIdx);
    rCurrent.height = 20;

    const cells = [
      ws2.getCell(`B${rowIdx}`),
      ws2.getCell(`C${rowIdx}`),
      ws2.getCell(`D${rowIdx}`),
      ws2.getCell(`E${rowIdx}`),
      ws2.getCell(`F${rowIdx}`),
    ];

    cells[0].value = num;
    cells[1].value = dateStr;
    cells[2].value = label;
    cells[3].value = amount;
    cells[4].value = balance;

    cells[0].alignment = { horizontal: 'center', vertical: 'middle' };
    cells[1].alignment = { horizontal: 'center', vertical: 'middle' };
    cells[2].alignment = { horizontal: 'left', vertical: 'middle' };
    cells[3].alignment = { horizontal: 'right', vertical: 'middle' };
    cells[4].alignment = { horizontal: 'right', vertical: 'middle' };

    cells[3].numFmt = '#,##0.00 "TL"';
    cells[4].numFmt = '#,##0.00 "TL"';

    const bg = isLast ? 'FFE0E7FF' : (isHighlight ? `FF${SOFT_AMBER}` : (rowIdx % 2 === 0 ? `FF${LIGHT_GRAY}` : 'FFFFFFFF'));

    cells.forEach((c) => {
      c.font = { name: 'Calibri', size: 9.5, bold: isHighlight || isLast, color: { argb: isLast ? 'FF3730A3' : 'FF1E293B' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
    });

    rowIdx++;
  };

  if (paymentType === 'cash') {
    addScheduleLine(1, formatDate(), 'Peşin Ödeme (İndirimli)', tl(cashPlan.cashK), 0, true, true);
  } else {
    // Peşinat Satırı
    addScheduleLine(
      0,
      formatYM(plan.start),
      plan.isFullDown ? 'Peşinat (%100 Nakit İndirimli)' : 'Peşinat (Sözleşme İmzası)',
      tl(plan.downK),
      tl(plan.kalanK),
      true
    );

    // Taksit Satırları
    plan.rows.forEach((row) => {
      addScheduleLine(
        row.index,
        formatYM(row.ym),
        `${row.index}. Taksit`,
        tl(row.amountK),
        tl(row.remainingK)
      );
    });

    // Kapanış / Teslimat Balon Satırı
    addScheduleLine(
      '★',
      formatYM(plan.maturity),
      `Teslimat Ana Parası (${tl(plan.balonK).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL) + Vade Farkı (${tl(plan.vadeFarkiK).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL)`,
      tl(plan.balonTotalK),
      0,
      true,
      true
    );

    // Toplam Satırı
    rowIdx++;
    ws2.mergeCells(`B${rowIdx}:D${rowIdx}`);
    const totLabel = ws2.getCell(`B${rowIdx}`);
    totLabel.value = 'GENEL TOPLAM MALİYET';
    totLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    totLabel.alignment = { horizontal: 'center', vertical: 'middle' };
    totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_NAVY}` } };

    const totVal = ws2.getCell(`E${rowIdx}`);
    totVal.value = tl(plan.totalK);
    totVal.numFmt = '#,##0.00 "TL"';
    totVal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    totVal.alignment = { horizontal: 'right', vertical: 'middle' };
    totVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };

    const emptyF = ws2.getCell(`F${rowIdx}`);
    emptyF.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK_NAVY}` } };
    ws2.getRow(rowIdx).height = 26;
  }

  // İndirme
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeCode = aptShortCode(apt).replace(/[^\w-]/g, '');
  a.download = `Teklif_${offerNo}_${safeCode}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
