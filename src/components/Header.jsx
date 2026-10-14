import { CalendarDays, Lock, Cloud, CloudOff } from 'lucide-react';
import { PROJECT } from '../config/project';
import { formatDate } from '../lib/format';
import logoUrl from '../assets/logo.png';

export default function Header({ onOpenAdmin, cloudConnected = false }) {
  return (
    <header className="bg-slate-900 text-white print:hidden">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3.5">
          <img
            src={logoUrl}
            alt="As İnşaat Logo"
            className="h-12 w-12 rounded-xl bg-white p-1 object-contain shadow-md select-none"
          />
          <div>
            <h1 className="text-lg font-bold tracking-wide">{PROJECT.name}</h1>
            <p className="text-xs text-slate-400">
              {PROJECT.company} · A Blok (16) + B Blok (24) = 40 Daire
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cloudConnected ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1.5 text-xs text-emerald-300 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold">Bulut Canlı</span>
            </div>
          ) : (
            <button
              onClick={onOpenAdmin}
              title="Bulut Veritabanı Entegrasyonu İçin Tıklayın"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 transition"
            >
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-medium">Yerel Mod</span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
            <CalendarDays className="size-4 text-amber-400" />
            {formatDate()}
          </div>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Yönetici Paneli"
              className="group flex size-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-900 hover:border-slate-800 hover:bg-slate-800 transition cursor-pointer"
              aria-label="Yönetici Paneli"
            >
              <Lock className="size-3.5 text-slate-900 group-hover:text-amber-400 transition" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
