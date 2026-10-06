import { CalendarDays, Lock } from 'lucide-react';
import { PROJECT } from '../config/project';
import { formatDate } from '../lib/format';
import logoUrl from '../assets/logo.png';

export default function Header({ onOpenAdmin }) {
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
          <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
            <CalendarDays className="size-4 text-amber-400" />
            {formatDate()}
          </div>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Yönetici Paneli (Baz Fiyatlar)"
              className="group flex size-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500 hover:bg-slate-800 hover:text-amber-400 transition shadow-sm border border-slate-700/50"
              aria-label="Yönetici Paneli"
            >
              <Lock className="size-3.5 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
