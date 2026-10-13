import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import ApartmentGrid from './components/ApartmentGrid';
import ApartmentSummary from './components/ApartmentSummary';
import PaymentPlanner from './components/PaymentPlanner';
import FinancialSummary from './components/FinancialSummary';
import OfferPanel from './components/OfferPanel';
import PrintOffer from './components/PrintOffer';
import FloorPlanModal from './components/FloorPlanModal';
import AdminControlModal from './components/AdminControlModal';
import AdminPinModal from './components/AdminPinModal';
import SaleRecordModal from './components/SaleRecordModal';
import { APARTMENT_DATA, aptId } from './data/apartments';
import {
  salePriceK, minDownK, clampDown, downFromPct, monthsUntilMaturity, scheduleMonths, startMonthOptions,
  equalSplitK, trimInstallmentMap, computeInstallmentPlan, computeCashPlan, sumK, ymKey, minInstallmentForTipK,
} from './lib/finance';
import { formatTL } from './lib/format';
import { FINANCE } from './config/project';

const DEFAULT_BASE_PRICES = {
  '2+1': 6000000,
  '3+1': 8500000,
};

const makeOfferNo = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `YS-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
};

export default function App() {
  const startOptions = useMemo(() => startMonthOptions(), []);

  // ---------- Durum ----------
  const [basePrices, setBasePrices] = useState(() => {
    try {
      const saved = localStorage.getItem('as_yapsat_base_prices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed['2+1'] === 'number' && typeof parsed['3+1'] === 'number') {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_BASE_PRICES;
  });

  // Satış Kayıtları (localStorage)
  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem('as_yapsat_sales');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Yönetici PIN Kodu (localStorage)
  const [adminPin, setAdminPin] = useState(() => {
    try {
      const saved = localStorage.getItem('as_yapsat_admin_pin');
      if (saved) return saved;
    } catch {}
    return '1923';
  });

  // Yönetici Oturumu & Modal Kontrolleri
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [adminControlOpen, setAdminControlOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleTargetApt, setSaleTargetApt] = useState(null);
  const [editingSaleRecord, setEditingSaleRecord] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Baz fiyatlara göre dinamik güncellenen daire verisi
  const apartments = useMemo(() => {
    return APARTMENT_DATA.map((a) => ({
      ...a,
      bazFiyat: basePrices[a.tip] || a.bazFiyat,
    }));
  }, [basePrices]);

  // Satılan dairelerin hızlı eşleşme haritası: { "A-14": saleRecord, ... }
  const soldMap = useMemo(() => {
    return sales.reduce((acc, s) => {
      if (s && s.aptNo) {
        acc[s.aptNo] = s;
      }
      return acc;
    }, {});
  }, [sales]);

  const [block, setBlock] = useState('A');
  const [selectedNo, setSelectedNo] = useState(APARTMENT_DATA[0].no);
  const apt = useMemo(() => {
    return apartments.find((a) => a.no === selectedNo) || apartments[0];
  }, [apartments, selectedNo]);

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
  const minK = minDownK(saleK);
  // Güvenlik Kalkanı: downK hiçbir durumda o anki dairenin asgari %40'ının altına inemez!
  const effectiveDownK = Math.max(downK, minK);

  // DAİRE DEĞİŞİKLİĞİ TAKİBİ: Daire değiştiğinde veya peşinat %40'ın altında kaldığında
  // peşinatı otomatik olarak seçilen yeni dairenin asgari %40'ına eşitle
  const prevAptIdRef = useRef(aptId(apt));
  useEffect(() => {
    const currentId = aptId(apt);
    if (prevAptIdRef.current !== currentId) {
      prevAptIdRef.current = currentId;
      setDownK(minK);
      setEqualTargetK(null);
      setFlexMap({});
    } else if (downK < minK) {
      setDownK(minK);
    }
  }, [apt, saleK, downK, minK]);

  const N = monthsUntilMaturity(start);
  const months = useMemo(() => scheduleMonths(start, N), [start, N]);
  const kalanK = Math.max(0, saleK - effectiveDownK);
  const effectiveEqualK = Math.min(equalTargetK ?? kalanK, kalanK);

  const installmentsK = useMemo(() => {
    if (mode === 'equal') return equalSplitK(effectiveEqualK, N);
    const safe = trimInstallmentMap(flexMap, months, kalanK); // güvenlik: toplam asla kalanı aşmaz
    return months.map((ym) => safe[ymKey(ym)] || 0);
  }, [mode, effectiveEqualK, N, flexMap, months, kalanK]);

  const plan = useMemo(
    () => computeInstallmentPlan({ saleK, downK: effectiveDownK, installmentsK, start }),
    [saleK, effectiveDownK, installmentsK, start]
  );
  const cashPlan = useMemo(() => computeCashPlan(saleK), [saleK]);

  const minInstK = minInstallmentForTipK(apt.tip);

  // ---------- Bildirimler & Yardımcılar ----------
  const notify = (type, text) => {
    clearTimeout(noticeTimer.current);
    setNotice({ type, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  // Yönetici Yetki Doğrulama & Tetikleme
  const requireAdmin = (actionCallback) => {
    if (isAdmin) {
      actionCallback();
    } else {
      setPendingAction(() => actionCallback);
      setPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsAdmin(true);
    setPinModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    } else {
      setAdminControlOpen(true);
    }
    notify('ok', 'Yönetici girişi başarıyla doğrulandı.');
  };

  // Baz Fiyat Kaydet / Sıfırla
  const handleSaveBasePrices = (newPrices) => {
    setBasePrices(newPrices);
    try {
      localStorage.setItem('as_yapsat_base_prices', JSON.stringify(newPrices));
    } catch {}
    notify('ok', 'Baz fiyatlar başarıyla güncellendi ve tüm panellere yansıtıldı.');
  };

  const handleResetBasePrices = () => {
    setBasePrices(DEFAULT_BASE_PRICES);
    try {
      localStorage.removeItem('as_yapsat_base_prices');
    } catch {}
    notify('ok', 'Baz fiyatlar varsayılan değerlere sıfırlandı.');
  };

  // Satış Kaydetme / Düzenleme
  const handleSaveSale = (saleRecord) => {
    setSales((prev) => {
      const filtered = prev.filter((s) => s.aptNo !== saleRecord.aptNo);
      const next = [saleRecord, ...filtered];
      try {
        localStorage.setItem('as_yapsat_sales', JSON.stringify(next));
      } catch {}
      return next;
    });
    notify('ok', `${saleRecord.aptNo} numaralı daire için satış kaydı başarıyla oluşturuldu!`);
  };

  // Satış İptal Et / Sil
  const handleDeleteSale = (aptNo) => {
    setSales((prev) => {
      const next = prev.filter((s) => s.aptNo !== aptNo);
      try {
        localStorage.setItem('as_yapsat_sales', JSON.stringify(next));
      } catch {}
      return next;
    });
    notify('ok', `${aptNo} numaralı dairenin satış kaydı silindi, daire tekrar satışa açıldı.`);
  };

  // PIN Değiştirme
  const handleChangePin = (newPin) => {
    setAdminPin(newPin);
    try {
      localStorage.setItem('as_yapsat_admin_pin', newPin);
    } catch {}
    notify('ok', 'Yönetici PIN kodu başarıyla güncellendi.');
  };

  // Mevcut Teklifi Satışa Dönüştür (Hızlı Aksiyon)
  const handleConvertToSale = (targetApartment) => {
    requireAdmin(() => {
      const target = targetApartment || apt;
      const initialNotes = paymentType === 'cash'
        ? `Peşin Satış Sözleşmesi (%${FINANCE.cashDiscountPct} indirim uygulandı).`
        : `${plan.installmentCount} Ay Vadeli: ${formatTL(effectiveDownK)} peşinat + ${formatTL(plan.totalInstallmentsK)} taksitler toplamı + ${formatTL(plan.balonTotalK)} teslimat kapanış tutarı.`;

      setSaleTargetApt(target);
      setEditingSaleRecord({
        aptNo: target.no,
        customerName: customerName || '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        salePriceK: paymentType === 'cash' ? cashPlan.finalK : saleK,
        paymentType,
        downPaymentK: paymentType === 'cash' ? cashPlan.finalK : effectiveDownK,
        notes: initialNotes,
      });
      setSaleModalOpen(true);
    });
  };

  // Daire Seçimi
  const handleBlockChange = (newBlock) => {
    setBlock(newBlock);
    const firstAptInBlock = apartments.find((a) => a.blok === newBlock);
    if (firstAptInBlock) {
      handleSelect(firstAptInBlock);
    }
  };

  const handleSelect = (a) => {
    setSelectedNo(a.no);
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
    let v = Math.min(Math.max(0, k), maxK);
    
    // Taksit alt sınır uyarısı ve kontrolü (2+1 için 80.000 TL, 3+1 için 120.000 TL)
    if (v > 0 && v < minInstK) {
      notify('warn', `${apt.tip} daireler için taksit tutarı en az ${formatTL(minInstK)} olmalıdır.`);
    }
    if (k > maxK) {
      notify('warn', `Toplam taksit kalan ana parayı aşamaz. Bu ay için azami tutar: ${formatTL(maxK)}`);
    }
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

  const handleExcel = async () => {
    const { exportOfferToExcel } = await import('./lib/exportExcel');
    exportOfferToExcel({ apt, saleK, paymentType, cashPlan, plan, customerName, offerNo });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-100 print:hidden">
        <Header onOpenAdmin={() => requireAdmin(() => setAdminControlOpen(true))} />
        <main className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-2 2xl:grid-cols-[430px_1fr_360px]">
          <div className="space-y-5">
            <ApartmentGrid
              block={block}
              onBlockChange={handleBlockChange}
              selectedId={aptId(apt)}
              onSelect={handleSelect}
              onOpenFloorPlan={() => setFloorPlanOpen(true)}
              apartments={apartments}
              soldMap={soldMap}
            />
            <ApartmentSummary
              apt={apt}
              saleK={saleK}
              saleRecord={soldMap[apt.no]}
              isAdmin={isAdmin}
              onConvertToSale={() => handleConvertToSale(apt)}
              onViewSaleRecord={(rec, a) => {
                requireAdmin(() => {
                  setSaleTargetApt(a);
                  setEditingSaleRecord(rec);
                  setSaleModalOpen(true);
                });
              }}
            />
          </div>

          <div className="lg:row-span-2 2xl:row-span-1">
            <PaymentPlanner
              paymentType={paymentType}
              onPaymentTypeChange={setPaymentType}
              start={start}
              onStartChange={setStart}
              startOptions={startOptions}
              saleK={saleK}
              downK={effectiveDownK}
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
              notice={notice}
              minInstallmentK={minInstK}
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
              isSold={Boolean(soldMap[apt.no])}
              onConvertToSale={() => handleConvertToSale(apt)}
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
        apartments={apartments}
        soldMap={soldMap}
      />

      <FloorPlanModal
        isOpen={floorPlanOpen}
        onClose={() => setFloorPlanOpen(false)}
        selectedApt={apt}
        onSelectApt={handleSelect}
        apartments={apartments}
        soldMap={soldMap}
      />

      <AdminControlModal
        isOpen={adminControlOpen}
        onClose={() => setAdminControlOpen(false)}
        apartments={apartments}
        sales={sales}
        soldMap={soldMap}
        basePrices={basePrices}
        adminPin={adminPin}
        onSaveBasePrices={handleSaveBasePrices}
        onResetBasePrices={handleResetBasePrices}
        onSaveSale={handleSaveSale}
        onDeleteSale={handleDeleteSale}
        onChangePin={handleChangePin}
        onOpenNewSale={(target) => {
          setSaleTargetApt(target || apt);
          setEditingSaleRecord(null);
          setSaleModalOpen(true);
        }}
        onEditSale={(rec, target) => {
          setSaleTargetApt(target || apartments.find((a) => a.no === rec.aptNo));
          setEditingSaleRecord(rec);
          setSaleModalOpen(true);
        }}
      />

      <SaleRecordModal
        isOpen={saleModalOpen}
        onClose={() => {
          setSaleModalOpen(false);
          setEditingSaleRecord(null);
        }}
        targetApt={saleTargetApt || apt}
        initialRecord={editingSaleRecord}
        apartments={apartments}
        onSave={handleSaveSale}
        onDelete={handleDeleteSale}
      />

      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinSuccess}
        currentPin={adminPin}
      />
    </>
  );
}
