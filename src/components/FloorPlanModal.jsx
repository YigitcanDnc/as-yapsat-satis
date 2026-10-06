import { Layers, X, CheckCircle2 } from 'lucide-react';
import InteractiveFloorPlan from './InteractiveFloorPlan';
import { aptShortCode } from '../data/apartments';

/**
 * Kat Planı & Blok Yerleşim Şeması Modal / Önizleme Bileşeni
 * Gerçek izometrik şema üzerinden interaktif daire seçimini ve vurgulamayı sunar.
 */
export default function FloorPlanModal({ isOpen, onClose, selectedApt, onSelectApt }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500 text-slate-900 shadow-sm">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Kat ve Bağımsız Bölüm Yerleşim Şeması
                </h3>
                {selectedApt && (
                  <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-black text-amber-900">
                    Seçili: {aptShortCode(selectedApt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Yeni Vali Konağı Sk. (A Blok) · Türkerler Sk. (B Blok) · 40 Bağımsız Bölüm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-auto bg-slate-100 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-amber-500 p-3 text-slate-950 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-slate-900" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Şu Anda Seçili Olan Daire</p>
                  <p className="text-lg font-black">
                    {aptShortCode(selectedApt)} No'lu Bağımsız Bölüm ({selectedApt?.blok} Blok · {selectedApt?.kat === 'Z' ? 'Zemin Kat' : `${selectedApt?.kat}. Kat`} · {selectedApt?.cephe})
                  </p>
                </div>
              </div>
              <div className="text-right text-xs font-bold">
                {selectedApt?.tip} Daire · Şerefiye: ×{selectedApt?.katsayi}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col items-center">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                💡 Şema üzerindeki herhangi bir daireye tıklayarak hızlıca seçebilirsiniz.
              </p>
              <InteractiveFloorPlan
                selectedApt={selectedApt}
                onSelectApt={onSelectApt}
                maxWidth="max-w-[660px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>
            📋 Bu şema resmi satış teklifi çıktınızın 2. sayfası olarak seçilen daire işaretli şekilde otomatik eklenir.
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 font-bold text-white transition hover:bg-slate-800"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
