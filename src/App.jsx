import { useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import ApartmentGrid from './components/ApartmentGrid';
import ApartmentSummary from './components/ApartmentSummary';
import PaymentPlanner from './components/PaymentPlanner';
import FinancialSummary from './components/FinancialSummary';
import OfferPanel from './components/OfferPanel';
import PrintOffer from './components/PrintOffer';
import FloorPlanModal from './components/FloorPlanModal';
import { APARTMENT_DATA, aptId } from './data/apartments';
import {
  salePriceK, minDownK, clampDown, downFromPct, monthsUntilMaturity, scheduleMonths, startMonthOptions,
  equalSplitK, trimInstallmentMap, computeInstallmentPlan, computeCashPlan, sumK, ymKey,
} from './lib/finance';
import { formatTL } from './lib/format';
import { FINANCE } from './config/project';

const makeOfferNo = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `YS-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
};

export default function App() {
  const startOptions = useMemo(() => startMonthOptions(), []);

  // ---------- Durum ----------
  const [block, setBlock] = useState('A');
  const [apt, setApt] = useState(APARTMENT_DATA[0]);
  const [paymentType, setPaymentType] = useState('installment');
  const [start, setStart] = useState(startOptions[0]);
  const [downK, setDownK] = useState(() => minDownK(salePriceK(APARTMENT_DATA[0])));
  const [mode, setMode] = useState('equal');
  const [equalTargetK, setEqualTargetK] = useState(null); // null = kalan ana paranın tamamı
  const [flexMap, setFlexMap] = useState({}); // ymKey → kuruş
  const [customerName, setCustomerName] = useState('');
  const [offerNo, setOfferNo] = useState(makeOfferNo);
  const [notice, setNotice] = useState(null);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const noticeTimer = useRef();

  // ---------- Türetilmiş değerler ----------
  const saleK = salePriceK(apt);
  const N = monthsUntilMaturity(start);
  const months = useMemo(() => scheduleMonths(start, N), [start, N]);
  const kalanK = Math.max(0, saleK - downK);
  const effectiveEqualK = Math.min(equalTargetK ?? kalanK, kalanK);

  const installmentsK = useMemo(() => {
    if (mode === 'equal') return equalSplitK(effectiveEqualK, N);
    const safe = trimInstallmentMap(flexMap, months, kalanK); // güvenlik: toplam asla kalanı aşmaz
    return months.map((ym) => safe[ymKey(ym)] || 0);
  }, [mode, effectiveEqualK, N, flexMap, months, kalanK]);

  const plan = useMemo(
    () => computeInstallmentPlan({ saleK, downK, installmentsK, start }),
    [saleK, downK, installmentsK, start]
  );
  const cashPlan = useMemo(() => computeCashPlan(saleK), [saleK]);

  // ---------- Yardımcılar ----------
  const notify = (type, text) => {
    clearTimeout(noticeTimer.current);
    setNotice({ type, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  // ---------- Olaylar ----------
  const handleBlockChange = (newBlock) => {
    setBlock(newBlock);
    const firstAptInBlock = APARTMENT_DATA.find((a) => a.blok === newBlock);
    if (firstAptInBlock) {
      handleSelect(firstAptInBlock);
    }
  };

  const handleSelect = (a) => {
    setApt(a);
    if (a.blok !== block) {
      setBlock(a.blok);
    }
    setDownK(minDownK(salePriceK(a)));
    setEqualTargetK(null);
    setFlexMap({});
  };

  const applyDown = (d) => {
    setDownK(d);
    setFlexMap((m) => trimInstallmentMap(m, months, Math.max(0, saleK - d)));
  };

  const handleDownChange = (k) => {
    const d = clampDown(saleK, k);
    if (k < minDownK(saleK)) notify('warn', `Peşinat %${FINANCE.minDownPct}'ın altına inemez. Asgari tutar uygulandı: ${formatTL(d)}`);
    else if (k > saleK) notify('warn', `Peşinat satış fiyatını aşamaz. Azami tutar uygulandı: ${formatTL(d)}`);
    applyDown(d);
  };

  const handleDownPct = (pct) => applyDown(downFromPct(saleK, pct));

  const handleModeChange = (m) => {
    if (m === mode) return;
    if (m === 'flex') {
      // Eşit dağıtımı esnek moda başlangıç değeri olarak aktar
      const map = {};
      months.forEach((ym, i) => { map[ymKey(ym)] = installmentsK[i] || 0; });
      setFlexMap(map);
    }
    setMode(m);
  };

  const handleEqualTarget = (k) => {
    if (k > kalanK) notify('warn', `Taksit toplamı kalan ana parayı (${formatTL(kalanK)}) aşamaz.`);
    setEqualTargetK(Math.min(k, kalanK));
  };

  const handleFlexChange = (i, k) => {
    const others = sumK(installmentsK) - (installmentsK[i] || 0);
    const maxK = Math.max(0, kalanK - others);
    const v = Math.min(Math.max(0, k), maxK);
    if (k > maxK) notify('warn', `Toplam taksit kalan ana parayı aşamaz. Bu ay için azami tutar: ${formatTL(maxK)}`);
    setFlexMap((m) => ({ ...m, [ymKey(months[i])]: v }));
  };

  const handleDistribute = () => {
    if (N === 0) return;
    if (mode === 'equal') {
      setEqualTargetK(null);
      notify('ok', `Kalan ana para ${N} aya eşit dağıtıldı.`);
      return;
    }
    const unallocated = kalanK - sumK(installmentsK);
    if (unallocated <= 0) {
      notify('warn', 'Dağıtılacak bakiye yok — kalan ana paranın tamamı taksitlere dağıtılmış.');
      return;
    }
    let targets = installmentsK.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (targets.length === 0) targets = installmentsK.map((_, i) => i);
    const split = equalSplitK(unallocated, targets.length);
    const map = {};
    months.forEach((ym, i) => { map[ymKey(ym)] = installmentsK[i] || 0; });
    targets.forEach((idx, j) => { map[ymKey(months[idx])] += split[j]; });
    setFlexMap(map);
    notify('ok', `${formatTL(unallocated)} tutarındaki bakiye ${targets.length} aya eşit dağıtıldı.`);
  };

  const handleClear = () => {
    if (mode === 'equal') setEqualTargetK(0);
    else setFlexMap({});
    notify('ok', `Taksitler sıfırlandı — kalan ana paranın tamamı Mart 2028 kapanış bakiyesine devretti.`);
  };

  const handleExcel = async () => {
    const { exportOfferToExcel } = await import('./lib/exportExcel');
    exportOfferToExcel({ apt, saleK, paymentType, cashPlan, plan, customerName, offerNo });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-100 print:hidden">
        <Header />
        <main className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-2 2xl:grid-cols-[430px_1fr_360px]">
          <div className="space-y-5">
            <ApartmentGrid
              block={block}
              onBlockChange={handleBlockChange}
              selectedId={aptId(apt)}
              onSelect={handleSelect}
              onOpenFloorPlan={() => setFloorPlanOpen(true)}
            />
            <ApartmentSummary apt={apt} saleK={saleK} />
          </div>

          <div className="lg:row-span-2 2xl:row-span-1">
            <PaymentPlanner
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              start={start}
              onStartChange={setStart}
              startOptions={startOptions}
              saleK={saleK}
              downK={downK}
              onDownChange={handleDownChange}
              onDownPctChange={handleDownPct}
              mode={mode}
              onModeChange={handleModeChange}
              equalTargetK={effectiveEqualK}
              onEqualTargetChange={handleEqualTarget}
              plan={plan}
              cashPlan={cashPlan}
              onFlexChange={handleFlexChange}
              onDistribute={handleDistribute}
              onClear={handleClear}
              notice={notice}
            />
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-5 2xl:self-start">
            <FinancialSummary paymentType={paymentType} plan={plan} cashPlan={cashPlan} />
            <OfferPanel
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              offerNo={offerNo}
              onOfferNoChange={setOfferNo}
              onExcel={handleExcel}
              onPrint={() => window.print()}
            />
          </aside>
        </main>
      </div>

      <PrintOffer
        apt={apt}
        saleK={saleK}
        paymentType={paymentType}
        plan={plan}
        cashPlan={cashPlan}
        customerName={customerName}
        offerNo={offerNo}
      />

      <FloorPlanModal
        isOpen={floorPlanOpen}
        onClose={() => setFloorPlanOpen(false)}
        selectedApt={apt}
        onSelectApt={(newApt) => {
          setApt(newApt);
          setBlock(newApt.blok);
        }}
      />
    </>
  );
}
