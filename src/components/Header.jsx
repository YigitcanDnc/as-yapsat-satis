import { CalendarDays } from 'lucide-react';
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
            className="h-12 w-12 rounded-xl bg-white p-1 object-contain shadow-md"
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
              className="rounded-lg p-2 text-slate-700 hover:text-slate-400 hover:bg-slate-800/60 transition"
              aria-label="Yönetici Paneli"
            >
              <svg className="size-3.5 opacity-40 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
