// Hesap motoru doğrulama testi:  node --import ./scripts/register.mjs scripts/finance-test.mjs
import assert from 'node:assert/strict';
import * as F from '../src/lib/finance.js';
import { APARTMENT_DATA } from '../src/data/apartments.js';
import { formatTL, parseMoneyToKurus } from '../src/lib/format.js';

assert.equal(APARTMENT_DATA.length, 40);
assert.equal(APARTMENT_DATA.filter((a) => a.blok === 'A').length, 16);
assert.equal(APARTMENT_DATA.filter((a) => a.blok === 'B').length, 24);

// B6-GD: 8.500.000 × 105/100 = 8.925.000
const b6gd = APARTMENT_DATA.find((a) => a.blok === 'B' && a.kat === '6' && a.cephe === 'GD');
const sale = F.salePriceK(b6gd);
assert.equal(sale, 892_500_000);
assert.equal(F.cashPriceK(sale), 758_625_000); // ×0,85
assert.equal(F.minDownK(sale), 357_000_000); // ×0,40

// N: Ekim 2026 → Mart 2028 = 17 ay
const start = { y: 2026, m: 10 };
assert.equal(F.monthsUntilMaturity(start), 17);

// Senaryo: asgari peşinat, kalanın yarısı taksit, yarısı balon
const down = F.minDownK(sale);
const kalan = sale - down; // 535.500.000
const inst = F.equalSplitK(kalan / 2, 17);
assert.equal(F.sumK(inst), kalan / 2);
const p = F.computeInstallmentPlan({ saleK: sale, downK: down, installmentsK: inst, start });
assert.equal(p.balonK, 267_750_000);
assert.equal(p.vadeFarkiK, Math.round(267_750_000 * 17 * 0.025)); // 113.793.750
assert.equal(p.totalK, down + kalan / 2 + p.balonK + p.vadeFarkiK);
assert.equal(p.rows.at(-1).remainingK, p.balonK);
assert.deepEqual(p.rows.at(-1).ym, { y: 2028, m: 3 });

// Tam taksit → vade farkı 0, toplam = satış fiyatı
const full = F.computeInstallmentPlan({ saleK: sale, downK: down, installmentsK: F.equalSplitK(kalan, 17), start });
assert.equal(full.vadeFarkiK, 0);
assert.equal(full.totalK, sale);

// Para ayrıştırma
assert.equal(parseMoneyToKurus('6.240.000,00'), 624_000_000);
assert.equal(parseMoneyToKurus('-5000'), 500_000);
assert.equal(formatTL(624_000_000).replace(/\u00a0/g, ' '), '6.240.000,00 TL');

console.log('Senaryo B6-GD:', formatTL(p.totalK), '| vade farkı', formatTL(p.vadeFarkiK));
console.log('✓ Tüm hesap motoru testleri geçti');
