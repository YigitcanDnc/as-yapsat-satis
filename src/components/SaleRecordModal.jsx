import { useState, useEffect } from 'react';
import { X, CheckCircle2, User, Phone, Calendar, Banknote, FileText, Building2, Trash2 } from 'lucide-react';
import MoneyInput from './MoneyInput';
import { formatTL } from '../lib/format';
import { salePriceK } from '../lib/finance';
import { aptShortCode, katLabel, CEPHE_LABELS } from '../data/apartments';

export default function SaleRecordModal({
  isOpen,
  onClose,
  targetApt,
  initialRecord = null,
  apartments = [],
  onSave,
  onDelete = null,
}) {
  const [selectedNo, setSelectedNo] = useState(targetApt?.no || apartments[0]?.no || 'A-1');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [priceK, setPriceK] = useState(0);
  const [paymentType, setPaymentType] = useState('installment');
  const [downK, setDownK] = useState(0);
  const [notes, setNotes] = useState('');

  const currentApt = apartments.find((a) => a.no === selectedNo) || targetApt || apartments[0];
  const listPriceK = currentApt ? salePriceK(currentApt) : 0;

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        setSelectedNo(initialRecord.aptNo);
        setCustomerName(initialRecord.customerName || '');
        setPhone(initialRecord.phone || '');
        setDate(initialRecord.date || new Date().toISOString().split('T')[0]);
        setPriceK(initialRecord.salePriceK || 0);
        setPaymentType(initialRecord.paymentType || 'installment');
        setDownK(initialRecord.downPaymentK || 0);
        setNotes(initialRecord.notes || '');
      } else {
        const apt = targetApt || apartments[0];
        setSelectedNo(apt?.no || 'A-1');
        setCustomerName('');
        setPhone('');
        setDate(new Date().toISOString().split('T')[0]);
        const pK = apt ? salePriceK(apt) : 0;
        setPriceK(pK);
        setPaymentType('installment');
        setDownK(Math.round(pK * 0.4));
        setNotes('');
      }
    }
  }, [isOpen, initialRecord, targetApt, apartments]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Lütfen müşteri adını ve soyadını giriniz.');
      return;
    }

    const record = {
      id: initialRecord?.id || `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      aptNo: selectedNo,
      customerName: customerName.trim(),
      phone: phone.trim(),
      date,
      salePriceK: priceK,
      paymentType,
      downPaymentK: downK,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(record);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && initialRecord) {
      if (window.confirm(`${selectedNo} numaralı dairenin satış kaydını silmek ve daireyi tekrar "Satışa Açık / Müsait" durumuna getirmek istediğinize emin misiniz?`)) {
        onDelete(initialRecord.aptNo);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-600 text-white shadow-sm">
              <Building2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialRecord ? 'Satış Kaydını Düzenle' : 'Daireyi Satıldı Olarak İşaretle & Satış Kaydet'}
              </h3>
              <p className="text-xs text-slate-300">
                Resmi satış sözleşmesi ve müşteri kayıt yönetimi
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Daire Seçimi & Bilgi Kartı */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Bağımsız Bölüm (Daire)
              </label>
              <select
                value={selectedNo}
                onChange={(e) => {
                  const no = e.target.value;
                  setSelectedNo(no);
                  const a = apartments.find((apt) => apt.no === no);
                  if (a && !initialRecord) {
                    const p = salePriceK(a);
                    setPriceK(p);
                    setDownK(Math.round(p * 0.4));
                  }
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
              >
                {apartments.map((a) => (
                  <option key={a.no} value={a.no}>
                    {a.no} ({a.blok} Blok {katLabel(a.kat)} {a.cephe} - {a.tip})
                  </option>
                ))}
              </select>
            </div>

            {currentApt && (
              <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/80 pt-2 mt-2">
                <span>
                  {currentApt.blok} Blok · {katLabel(currentApt.kat)} · {currentApt.cephe} ({CEPHE_LABELS[currentApt.cephe]}) · {currentApt.tip}
                </span>
                <span className="font-bold text-slate-900">
                  Liste Fiyatı: {formatTL(listPriceK)}
                </span>
              </div>
            )}
          </div>

          {/* Müşteri Adı ve Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <User className="size-3.5 text-slate-400" /> Alıcı / Müşteri Adı Soyadı *
              </label>
              <input
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Phone className="size-3.5 text-slate-400" /> İletişim / Telefon (Opsiyonel)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: 0532 123 45 67"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Satış Tarihi ve Ödeme Tipi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Calendar className="size-3.5 text-slate-400" /> Satış / Sözleşme Tarihi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Banknote className="size-3.5 text-slate-400" /> Ödeme Şekli
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="installment">Vadeli (Taksitli & Kapanış Ödemeli)</option>
                <option value="cash">Peşin Ödeme</option>
              </select>
            </div>
          </div>

          {/* Anlaşılan Satış Bedeli & Peşinat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Anlaşılan Nihai Satış Bedeli (TL)
              </label>
              <MoneyInput
                valueK={priceK}
                onChange={setPriceK}
                commitOnBlur
                className="border-slate-300 font-bold text-slate-900"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Tutar: {formatTL(priceK)}
              </span>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Tahsil Edilen / Anlaşılan Peşinat (TL)
              </label>
              <MoneyInput
                valueK={downK}
                onChange={setDownK}
                commitOnBlur
                className="border-slate-300 font-bold text-slate-900"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Peşinat: {formatTL(downK)}
              </span>
            </div>
          </div>

          {/* Notlar & Ödeme Detayı */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <FileText className="size-3.5 text-slate-400" /> Satış Notları ve Ödeme Mutabakatı Detayı
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 18 ay 80.000 TL taksit, kalan 2.450.000 TL Mart 2028 tapu tesliminde ödenecek. Sözleşme imzalandı."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Footer Butonları */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
            {initialRecord && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <Trash2 className="size-3.5 text-rose-600" /> Satışı İptal Et / Sil
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
              >
                <CheckCircle2 className="size-4 text-emerald-400" />
                {initialRecord ? 'Güncelle' : 'Satışı Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
