import { useState } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  KeyRound,
  X,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  ShieldAlert,
  Edit3,
  Trash2,
  TrendingUp,
  UserCheck,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import MoneyInput from './MoneyInput';
import { formatTL, formatDate } from '../lib/format';
import { salePriceK } from '../lib/finance';
import { katLabel, CEPHE_LABELS } from '../data/apartments';

export default function AdminControlModal({
  isOpen,
  onClose,
  apartments = [],
  sales = [],
  soldMap = {},
  basePrices,
  adminPin,
  onSaveBasePrices,
  onResetBasePrices,
  onSaveSale,
  onDeleteSale,
  onChangePin,
  onOpenNewSale,
  onEditSale,
}) {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'prices' | 'security'
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'sold' | 'available' | 'blockA' | 'blockB'

  // Baz fiyat formu state
  const [prices, setPrices] = useState(basePrices);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // PIN formu state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  // Satış İstatistikleri
  const totalFlats = apartments.length;
  const soldCount = sales.length;
  const availableCount = Math.max(0, totalFlats - soldCount);
  const occupancyRate = totalFlats > 0 ? ((soldCount / totalFlats) * 100).toFixed(1) : 0;
  const totalRevenueK = sales.reduce((sum, s) => sum + (s.salePriceK || 0), 0);

  // Filtreleme
  const filteredApartments = apartments.filter((apt) => {
    const isSold = Boolean(soldMap[apt.no]);
    const sale = soldMap[apt.no];

    // Blok filtresi
    if (filter === 'blockA' && apt.blok !== 'A') return false;
    if (filter === 'blockB' && apt.blok !== 'B') return false;
    if (filter === 'sold' && !isSold) return false;
    if (filter === 'available' && isSold) return false;

    // Arama filtresi
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNo = apt.no.toLowerCase().includes(q);
      const matchCustomer = sale?.customerName?.toLowerCase().includes(q);
      const matchPhone = sale?.phone?.toLowerCase().includes(q);
      const matchBlok = `${apt.blok} blok`.toLowerCase().includes(q);
      if (!matchNo && !matchCustomer && !matchPhone && !matchBlok) return false;
    }

    return true;
  });

  const handlePriceChange = (tip, kurus) => {
    setPrices((prev) => ({
      ...prev,
      [tip]: Math.round(kurus / 100),
    }));
    setPriceSuccess(false);
  };

  const handleSavePrices = () => {
    onSaveBasePrices(prices);
    setPriceSuccess(true);
    setTimeout(() => setPriceSuccess(false), 2000);
  };

  const handleResetPrices = () => {
    if (window.confirm('Baz fiyatları fabrika/varsayılan ayarlarına döndürmek istediğinize emin misiniz?')) {
      onResetBasePrices();
      setPrices({ '2+1': 6000000, '3+1': 8500000 });
      setPriceSuccess(true);
      setTimeout(() => setPriceSuccess(false), 2000);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (oldPin.trim() !== adminPin.trim()) {
      setPinError('Mevcut PIN hatalı!');
      return;
    }
    if (newPin.trim().length < 4) {
      setPinError('Yeni PIN en az 4 haneli olmalıdır.');
      return;
    }
    onChangePin(newPin.trim());
    setPinSuccess(true);
    setPinError('');
    setOldPin('');
    setNewPin('');
    setTimeout(() => setPinSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
              <Building className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yönetici Kontrol Merkezi</h3>
              <p className="text-xs text-slate-400">
                Satış Portföyü · Satılan Daireler · Baz Fiyat Yönetimi · Sistem Güvenliği
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'sales'
                ? 'border-amber-500 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="size-4 text-rose-600" />
            Satış Yönetimi & Portföy ({soldCount}/{totalFlats})
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'prices'
                ? 'border-amber-500 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="size-4 text-emerald-600" />
            Baz Fiyatlar (2+1 / 3+1)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'security'
                ? 'border-amber-500 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="size-4 text-amber-500" />
            PIN & Güvenlik
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {/* TAB 1: SATIŞ YÖNETİMİ & PORTFÖY */}
          {activeTab === 'sales' && (
            <div className="space-y-5">
              {/* Metrik Kartları */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toplam Konut</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{totalFlats} Daire</p>
                  <p className="text-[10px] text-slate-500">16 Adet A + 24 Adet B</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Satılan Daire</p>
                  <p className="mt-1 text-2xl font-black text-rose-600">{soldCount} Daire</p>
                  <p className="text-[10px] text-rose-700 font-semibold">% {occupancyRate} Doluluk Oranı</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Kalan / Müsait</p>
                  <p className="mt-1 text-2xl font-black text-emerald-600">{availableCount} Daire</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Satışa Açık Portföy</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toplam Satış Cirosu</p>
                  <p className="mt-1 text-lg font-black text-slate-900 truncate">{formatTL(totalRevenueK)}</p>
                  <p className="text-[10px] text-slate-500">Gerçekleşen Anlaşmalar</p>
                </div>
              </div>

              {/* Araç Çubuğu (Arama & Filtreler & Yeni Satış Butonu) */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Daire No veya Müşteri Adı Ara (örn: A-14, Ahmet)..."
                      className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                      { key: 'all', label: 'Tümü (40)' },
                      { key: 'sold', label: `Satılanlar (${soldCount})` },
                      { key: 'available', label: `Müsait (${availableCount})` },
                      { key: 'blockA', label: 'A Blok' },
                      { key: 'blockB', label: 'B Blok' },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setFilter(btn.key)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                          filter === btn.key
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenNewSale()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
                >
                  <Plus className="size-4 text-amber-400" /> Yeni Satış Kaydı Ekle
                </button>
              </div>

              {/* Tablo */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 uppercase tracking-wider text-[10.5px]">
                        <th className="py-2.5 px-3">Daire No</th>
                        <th className="py-2.5 px-3">Konum & Tip</th>
                        <th className="py-2.5 px-3">Liste Fiyatı</th>
                        <th className="py-2.5 px-3">Durum</th>
                        <th className="py-2.5 px-3">Müşteri / Alıcı</th>
                        <th className="py-2.5 px-3">Satış Tarihi</th>
                        <th className="py-2.5 px-3">Satış Bedeli</th>
                        <th className="py-2.5 px-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApartments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                            Filtreye uygun daire veya satış kaydı bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredApartments.map((apt) => {
                          const sale = soldMap[apt.no];
                          const isSold = Boolean(sale);
                          const listPrice = salePriceK(apt);

                          return (
                            <tr
                              key={apt.no}
                              className={`transition hover:bg-slate-50/80 ${
                                isSold ? 'bg-rose-50/20' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-black text-slate-900">
                                {apt.no}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span className="font-semibold text-slate-800">{apt.blok} Blok</span> · {katLabel(apt.kat)} · {apt.cephe} ·{' '}
                                <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-700">
                                  {apt.tip}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 tabular-nums font-semibold text-slate-700">
                                {formatTL(listPrice)}
                              </td>
                              <td className="py-2.5 px-3">
                                {isSold ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                    SATILDI
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    MÜSAİT
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {isSold ? (
                                  <div>
                                    <p className="font-bold text-slate-900">{sale.customerName}</p>
                                    {sale.phone && (
                                      <p className="text-[10px] text-slate-500 font-normal">{sale.phone}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 tabular-nums">
                                {isSold && sale.date ? (
                                  formatDate(new Date(sale.date))
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 tabular-nums">
                                {isSold ? (
                                  <div>
                                    <p className="font-bold text-slate-900">{formatTL(sale.salePriceK)}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {sale.paymentType === 'cash' ? 'Peşin' : 'Vadeli'}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {isSold ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => onEditSale(sale, apt)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                                      title="Satış Kaydını Düzenle"
                                    >
                                      <Edit3 className="size-3 text-slate-500" /> Düzenle
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`${apt.no} nolu dairenin satış kaydını iptal etmek istediğinize emin misiniz?`)) {
                                          onDeleteSale(apt.no);
                                        }
                                      }}
                                      className="grid size-6 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 transition"
                                      title="Satışı İptal Et / Sil"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onOpenNewSale(apt)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                                  >
                                    <CheckCircle2 className="size-3" /> Satış Yap
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BAZ FİYATLAR */}
          {activeTab === 'prices' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <b>Gizli Yönetici Parametresi:</b> Bu panel müşterilere veya dış dünyaya görünmez. Değiştirilen baz fiyatlar sistemdeki tüm 40 dairenin şerefiye çarpanlarını, sol paneldeki liste fiyatlarını ve ödeme hesaplamalarını anında günceller.
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    2+1 Daireler Baz Fiyatı (TL)
                  </label>
                  <MoneyInput
                    valueK={prices['2+1'] * 100}
                    onChange={(k) => handlePriceChange('2+1', k)}
                    commitOnBlur
                    className="border-slate-300 font-bold text-slate-900"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Mevcut: {formatTL(prices['2+1'] * 100)}
                  </span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    3+1 Daireler Baz Fiyatı (TL)
                  </label>
                  <MoneyInput
                    valueK={prices['3+1'] * 100}
                    onChange={(k) => handlePriceChange('3+1', k)}
                    commitOnBlur
                    className="border-slate-300 font-bold text-slate-900"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Mevcut: {formatTL(prices['3+1'] * 100)}
                  </span>
                </div>

                {priceSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Baz fiyatlar başarıyla güncellendi ve tüm daire panellerine yansıtıldı!
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={handleResetPrices}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="size-3.5" /> Fabrika Ayarlarına Dön
                  </button>
                  <button
                    onClick={handleSavePrices}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
                  >
                    <Save className="size-3.5 text-amber-400" /> Fiyatları Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GÜVENLİK (PIN DEĞİŞTİRME) */}
          {activeTab === 'security' && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Yönetici PIN Kodu Güncelleme</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Yönetici paneline ve müşteri satış kayıtlarına erişim için kullanılan güvenlik kodunu değiştirin.
                </p>

                <form onSubmit={handlePinSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Mevcut PIN Kodu
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      placeholder="Mevcut PIN (varsayılan: 1923)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Yeni PIN Kodu (En az 4 hane)
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Yeni PIN Kodunu Belirleyin"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {pinError && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <AlertCircle className="size-4" /> {pinError}
                    </div>
                  )}

                  {pinSuccess && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      PIN kodu başarıyla güncellendi!
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
                    >
                      PIN Kodunu Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>
            🔒 Yönetici oturumu aktiftir. Satış temsilcisi ekranında müşteri bilgileri gizli tutulur.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 font-bold text-white transition hover:bg-slate-800"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
