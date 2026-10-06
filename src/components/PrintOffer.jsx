import { PROJECT, FINANCE } from '../config/project';
import { CEPHE_LABELS, katLabel, aptShortCode } from '../data/apartments';
import { formatTL, formatYM, formatDate, formatPct } from '../lib/format';
import logoUrl from '../assets/logo.png';
import kaseUrl from '../assets/kase.png';
import InteractiveFloorPlan from './InteractiveFloorPlan';

/**
 * 2 Sayfalı Resmi Teklif Çıktısı:
 * - Sayfa 1: Teklif Özeti, Finansal Rakamlar, Ödeme Takvimi ve Resmi Kaşe/İmza
 * - Sayfa 2: Sözleşme Eki Kat & Bağımsız Bölüm Yerleşim Şeması (İzometrik Şema + Dinamik İşaretli)
 */
export default function PrintOffer({ apt, saleK, paymentType, plan, cashPlan, customerName, offerNo }) {
  const today = new Date();
  const validUntil = new Date(today.getTime() + PROJECT.offerValidityDays * 86400000);
  const cell = 'border border-slate-300 px-2 py-0.5';

  return (
    <div className="hidden bg-white text-[10px] leading-tight text-slate-900 print:block">
      {/* ========================================================= */}
      {/* 1. SAYFA: RESMİ SATIŞ TEKLİFİ VE ÖDEME PLANI             */}
      {/* ========================================================= */}
      <section
        className="flex min-h-screen flex-col justify-between pb-3"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div>
          {/* ÜST ANTET & LOGO */}
          <div className="flex items-center justify-between border-b-2 border-amber-500 pb-2">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="As İnşaat"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-snug">
                  {PROJECT.company}
                </h1>
                <p className="text-[11px] font-bold text-amber-600">{PROJECT.name}</p>
                <p className="text-[9px] text-slate-500">
                  {PROJECT.address} · Tel: {PROJECT.phone} · E-posta: {PROJECT.email}
                </p>
              </div>
            </div>
            <div className="text-right text-[10px]">
              <div className="rounded bg-slate-900 px-3 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-400">
                SATIŞ TEKLİFİ
              </div>
              <p className="mt-1">Teklif No: <b className="font-mono">{offerNo}</b></p>
              <p>Tarih: <b>{formatDate(today)}</b></p>
              <p>Geçerlilik: <b>{formatDate(validUntil)}</b></p>
            </div>
          </div>

          {/* MÜŞTERİ VE DAİRE BİLGİLERİ */}
          <div className="mt-2.5 grid grid-cols-2 gap-3 text-[10px]">
            <table className="w-full border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className={`${cell} w-1/3 bg-slate-100 font-semibold text-slate-600`}>Müşteri / Alıcı</td>
                  <td className={`${cell} font-bold text-slate-900`}>{customerName || '................................................'}</td>
                </tr>
                <tr>
                  <td className={`${cell} bg-slate-100 font-semibold text-slate-600`}>Teklif Konusu</td>
                  <td className={`${cell} font-medium`}>{PROJECT.name} Bağımsız Bölüm Satışı</td>
                </tr>
                <tr>
                  <td className={`${cell} bg-slate-100 font-semibold text-slate-600`}>Ödeme Modeli</td>
                  <td className={`${cell} font-bold text-amber-700`}>
                    {paymentType === 'cash' ? 'Peşin Satış (%15 İndirimli)' : 'Vadeli / Taksitli Ödeme Planı'}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className={`${cell} w-1/3 bg-slate-100 font-semibold text-slate-600`}>Bağımsız Bölüm No</td>
                  <td className={`${cell} font-black text-slate-950`}>{aptShortCode(apt)}</td>
                </tr>
                <tr>
                  <td className={`${cell} bg-slate-100 font-semibold text-slate-600`}>Blok / Kat / Tip</td>
                  <td className={`${cell}`}>{apt.blok} Blok · {katLabel(apt.kat)} · {apt.tip}</td>
                </tr>
                <tr>
                  <td className={`${cell} bg-slate-100 font-semibold text-slate-600`}>Cephe / Katsayı</td>
                  <td className={`${cell}`}>{apt.cephe} ({CEPHE_LABELS[apt.cephe]}) · Şerefiye: {apt.katsayi}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FİNANSAL TABLO */}
          <div className="mt-2.5">
            <table className="w-full border-collapse border border-slate-300">
              <tbody>
                <SRow c={cell} l="Liste Satış Fiyatı (Şerefiyeli)" v={formatTL(saleK)} />
                {paymentType === 'cash' ? (
                  <>
                    <SRow c={cell} l={`Peşin Ödeme İndirimi (${formatPct(FINANCE.cashDiscountPct)})`} v={`- ${formatTL(cashPlan.discountK)}`} />
                    <SRow c={cell} l="Ödenecek Nihai Peşin Satış Bedeli" v={formatTL(cashPlan.finalK)} strong highlight />
                  </>
                ) : (
                  <>
                    <SRow c={cell} l={`Peşinat (${formatPct(plan.downPct)})`} v={formatTL(plan.downK)} />
                    <SRow c={cell} l="Kalan Ana Para Bakiyesi" v={formatTL(plan.kalanK)} />
                    <SRow c={cell} l={`Taksitler Toplamı (${plan.installmentCount} Ay)`} v={formatTL(plan.totalInstallmentsK)} />
                    <SRow c={cell} l="Teslimat Kapanış Ana Parası (Mart 2028)" v={formatTL(plan.balonK)} />
                    <SRow c={cell} l={`Vade Farkı (Aylık %${FINANCE.monthlyInterestPct} · ${plan.monthsPassed} Ay · %${(plan.monthsPassed * FINANCE.monthlyInterestPct).toFixed(1)})`} v={formatTL(plan.vadeFarkiK)} />
                    <SRow c={cell} l="Teslimat Nihai Kapanış Tutarı (Ana Para + Vade Farkı)" v={formatTL(plan.balonTotalK)} />
                    <SRow c={cell} l="Müşteri Toplam Geri Ödeme Tutarı" v={formatTL(plan.grandTotalK)} strong highlight />
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* VADELİ İSE TAKSİT TABLOSU (SABİT DÜZENLİ SÜTUN GENİŞLİKLERİ) */}
          {paymentType === 'installment' && (
            <div className="mt-2.5">
              <p className="mb-0.5 font-bold text-slate-800 text-[9px] uppercase tracking-wide">
                Ödeme Takvimi ve Taksit Çizelgesi
              </p>
              <table className="w-full table-fixed border-collapse border border-slate-300 text-[8.5px]">
                <colgroup>
                  <col className="w-7" />
                  <col className="w-24" />
                  <col />
                  <col className="w-28" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className={`${cell} text-center`}>#</th>
                    <th className={`${cell} text-center`}>Vade Tarihi</th>
                    <th className={`${cell} text-left`}>Ödeme Kalemi</th>
                    <th className={`${cell} text-right`}>Ödeme Tutarı</th>
                    <th className={`${cell} text-right`}>Kalan Borç</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-50/70 font-semibold">
                    <td className={`${cell} text-center`}>0</td>
                    <td className={`${cell} text-center font-bold`}>{formatYM(plan.start)}</td>
                    <td className={cell}>Peşinat {plan.isFullDown ? '(%15 Nakit İndirimli)' : '(Sözleşme İmzası)'}</td>
                    <td className={`${cell} text-right`}>{formatTL(plan.downK)}</td>
                    <td className={`${cell} text-right`}>{formatTL(plan.kalanK)}</td>
                  </tr>
                  {plan.rows.map((r) => (
                    <tr key={r.index} className={r.amountK > 0 ? 'bg-white' : 'bg-slate-50/50 text-slate-500'}>
                      <td className={`${cell} text-center`}>{r.index}</td>
                      <td className={`${cell} text-center font-medium`}>{formatYM(r.ym)}</td>
                      <td className={cell}>{r.index}. Taksit</td>
                      <td className={`${cell} text-right font-semibold`}>{formatTL(r.amountK)}</td>
                      <td className={`${cell} text-right`}>{formatTL(r.remainingK)}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50 font-bold text-indigo-950">
                    <td className={`${cell} text-center`}>★</td>
                    <td className={`${cell} text-center font-extrabold text-indigo-900`}>{formatYM(plan.maturity)}</td>
                    <td className={cell}>
                      Teslimat Kapanış Tutarı (Ana Para: {formatTL(plan.balonK)} + Faiz: {formatTL(plan.vadeFarkiK)})
                    </td>
                    <td className={`${cell} text-right text-[9.5px] text-indigo-700`}>{formatTL(plan.balonTotalK)}</td>
                    <td className={`${cell} text-right`}>{formatTL(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* GENEL ŞARTLAR */}
          <div className="mt-2.5 rounded border border-slate-200 bg-slate-50/80 p-2 text-[8px] text-slate-600">
            <p className="font-bold text-slate-800">Teklif Koşulları ve Teslimat Hükümleri:</p>
            <div className="mt-0.5 space-y-1">
              <div className="grid grid-cols-2 gap-x-4">
                <p>1. Teklif {formatDate(validUntil)} tarihine kadar geçerli olup satış vaadi sözleşmesinin resmi ekidir.</p>
                <p>2. Ödenen taksitler ana paradan mahsup edilir; taksit tutarlarına vade farkı eklenmez.</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <p>3. Teslimat bakiyesine başlangıçtan itibaren geçen ay sayısı kadar aylık %2,5 basit vade farkı uygulanır.</p>
                <p>4. Ek 2'de yer alan izometrik kat şeması bağımsız bölümün kesin cephe ve konumunu belirler.</p>
              </div>
              <div className="border-t border-slate-200 pt-1 text-[7.5px] leading-relaxed text-slate-700">
                <p>
                  5. <b>Erken Teslimat Durumu:</b> Projenin Mart 2028 vade tarihinden önce tamamlanması halinde; Alıcı dairesini erken teslim almak isterse kalan her ay için %2,5 faiz/vade farkı uygulanır. Alıcı dilerse belirtilen resmi vade tarihinde (Mart 2028) teslim almayı tercih ederek bu vade farkından etkilenmeyebilir.
                </p>
                <p className="mt-0.5">
                  6. <b>Gecikme Durumu:</b> İnşaatın mücbir veya operasyonel nedenlerle gecikmesi durumunda, son teslimat/kapanış ödemesi bekletilir ve fiili bağımsız bölüm tapu/anahtar tesliminde tahsil edilir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* İMZA VE KAŞE BLOKLARI (Sayfa 1) */}
        <div className="mt-3 grid grid-cols-2 gap-8 text-center text-[9px]">
          <div>
            <p className="font-extrabold text-slate-800">SATICI / YÜKLENİCİ</p>
            <p className="text-[8px] text-slate-600">{PROJECT.company}</p>
            <div className="mt-1 relative flex h-20 items-center justify-center rounded border border-slate-300 bg-white p-1">
              <img
                src={kaseUrl}
                alt="As İnşaat Kaşe & İmza"
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            </div>
          </div>
          <div>
            <p className="font-extrabold text-slate-800">ALICI / MÜŞTERİ</p>
            <p className="text-[8px] text-slate-600">{customerName || 'Ad Soyad'}</p>
            <div className="mt-1 flex h-20 items-center justify-center rounded border border-dashed border-slate-400 bg-slate-50/40 text-[8.5px] text-slate-400">
              MÜŞTERİ İMZA
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SAYFA: SÖZLEŞME EKİ İZOMETRİK KAT ŞEMASI DİNAMİK VURGU */}
      {/* ========================================================= */}
      <section
        className="flex min-h-screen flex-col justify-between pt-1 pb-3"
        style={{
          pageBreakBefore: 'always',
          breakBefore: 'page',
          pageBreakAfter: 'avoid',
          breakAfter: 'avoid',
        }}
      >
        <div>
          {/* ÜST BAŞLIK */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="As İnşaat" className="h-10 w-10 object-contain" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{PROJECT.company}</h2>
                <p className="text-xs font-bold text-amber-600">
                  {PROJECT.name} · SÖZLEŞME EKİ: KAT VE BAĞIMSIZ BÖLÜM YERLEŞİM ŞEMASI
                </p>
              </div>
            </div>
            <div className="text-right text-[9px] text-slate-500">
              <p>Teklif No: <b className="font-mono text-slate-800">{offerNo}</b></p>
              <p>Tarih: <b>{formatDate(today)}</b></p>
            </div>
          </div>

          {/* SEÇİLEN DAİRE BİLGİ KUTUSU */}
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-amber-500 px-4 py-2 text-slate-950 shadow-sm">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-900">
                Sözleşmeye Konu Bağımsız Bölüm
              </p>
              <p className="text-lg font-black leading-tight">
                Seçilen: [{aptShortCode(apt)} NUMARALI DAİRE]
              </p>
            </div>
            <div className="text-right text-[9.5px]">
              <p className="font-bold">[{apt.blok} Blok {katLabel(apt.kat)}]</p>
              <p className="font-medium">[{apt.cephe} Cephe ({CEPHE_LABELS[apt.cephe]}) - {apt.tip}]</p>
            </div>
          </div>

          {/* MERKEZ: GERÇEK İZOMETRİK ŞEMA ÜZERİNDE DİNAMİK VURGU */}
          <div className="mt-2 flex justify-center">
            <InteractiveFloorPlan
              selectedApt={apt}
              isPrint={true}
              maxWidth="max-w-[520px]"
            />
          </div>

          {/* AKS VE CADDE BİLGİLENDİRME NOTLARI */}
          <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-[8px] text-slate-600">
            <p className="font-bold text-slate-800 mb-0.5">Cadde ve Aks Bilgilendirmesi:</p>
            <div className="grid grid-cols-2 gap-2 leading-relaxed">
              <p>
                • <b>A Blok (Sol Blok):</b> Zemin katta A-1 ve A-2'den başlar, 7. katta A-15 ve A-16'da biter (16 daire, 2+1). Aks: <b>Yeni Vali Konağı Sokak</b>.
              </p>
              <p>
                • <b>B Blok (Sağ Blok):</b> Zemin katta B-1, B-2, B-3'ten başlar, 7. katta B-22, B-23, B-24'te biter (24 daire). Aks: <b>Türkerler Sokak</b>.
              </p>
            </div>
          </div>
        </div>

        {/* TARAFLARIN İMZA VE KAŞE BLOKLARI (Sayfa 1 İle Birebir Aynı Boyut: h-20, p-1) */}
        <div className="mt-3 grid grid-cols-2 gap-8 text-center text-[9px]">
          <div>
            <p className="font-extrabold text-slate-800">SATICI / YÜKLENİCİ MUTABAKATI</p>
            <p className="text-[8px] text-slate-600">{PROJECT.company}</p>
            <div className="mt-1 relative flex h-20 items-center justify-center rounded border border-slate-300 bg-white p-1">
              <img
                src={kaseUrl}
                alt="As İnşaat Kaşe & İmza"
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            </div>
          </div>
          <div>
            <p className="font-extrabold text-slate-800">ALICI / MÜŞTERİ MUTABAKATI</p>
            <p className="text-[8px] text-slate-600">
              {customerName ? `${customerName} (Daire konumu teyit edilmiştir)` : 'Daire konumu ve cephesi teyit edilmiştir'}
            </p>
            <div className="mt-1 flex h-20 items-center justify-center rounded border border-dashed border-slate-400 bg-slate-50/40 text-[8.5px] text-slate-400">
              MÜŞTERİ İMZA
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SRow({ c, l, v, strong, highlight }) {
  return (
    <tr className={highlight ? 'bg-amber-100/80 font-bold' : strong ? 'bg-slate-50 font-bold' : ''}>
      <td className={c}>{l}</td>
      <td className={`${c} w-44 text-right tabular-nums`}>{v}</td>
    </tr>
  );
}
