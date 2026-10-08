import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  HardHat,
  ScanLine,
  Warehouse,
  Menu,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MobileBottomNavProps {
  onToggleMobileSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onToggleMobileSidebar,
}) => {
  const {
    activeTab,
    setActiveTab,
    interfaceMode,
    openScanner,
    pacchiZonaVerde,
  } = useApp();

  const prontiZonaVerdeCount = pacchiZonaVerde.filter(
    (p) => p.statoTransito === 'PRONTO_ZONA_VERDE'
  ).length;

  const isHomeActive =
    (interfaceMode === 'cantiere_mobile' && activeTab === 'rol') ||
    activeTab === 'dashboard';

  const isCantieriActive = activeTab === 'cantieri';
  const isMagazzinoActive =
    activeTab === 'magazzino' || activeTab === 'portale_magazzino';

  return (
    <nav
      aria-label="Navigazione mobile inferiore"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] safe-area-pb select-none transition-colors duration-200"
    >
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {/* 1. Dashboard / Vista Campo */}
        <button
          type="button"
          onClick={() => {
            if (interfaceMode === 'cantiere_mobile') {
              setActiveTab('rol');
            } else {
              setActiveTab('dashboard');
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all ${
            isHomeActive
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
          }`}
          aria-label={interfaceMode === 'cantiere_mobile' ? 'Vista Campo' : 'Dashboard'}
        >
          {interfaceMode === 'cantiere_mobile' ? (
            <Smartphone className="w-5 h-5 mb-0.5" />
          ) : (
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px] leading-tight font-medium">
            {interfaceMode === 'cantiere_mobile' ? 'Campo' : 'Home'}
          </span>
        </button>

        {/* 2. Cantieri */}
        <button
          type="button"
          onClick={() => setActiveTab('cantieri')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all ${
            isCantieriActive
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
          }`}
          aria-label="Cantieri"
        >
          <HardHat className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-medium">Cantieri</span>
        </button>

        {/* 3. Central elevated Scanner QR Button */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={openScanner}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/35 border-[3px] border-white dark:border-slate-950 flex flex-col items-center justify-center active:scale-90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Scansiona QR Code da fotocamera"
            title="Scansiona QR Code"
          >
            <ScanLine className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[8px] font-mono font-black uppercase -mt-0.5 tracking-tighter">
              QR SCAN
            </span>
          </button>
        </div>

        {/* 4. Magazzino & Zona Verde */}
        <button
          type="button"
          onClick={() => setActiveTab('magazzino')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl relative transition-all ${
            isMagazzinoActive
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
          }`}
          aria-label="Magazzino e Zona Verde"
        >
          <div className="relative">
            <Warehouse className="w-5 h-5 mb-0.5" />
            {prontiZonaVerdeCount > 0 && (
              <span
                className="absolute -top-1 -right-2.5 bg-emerald-500 text-white font-mono text-[9px] font-bold px-1 py-0.2 rounded-full leading-none shadow-xs"
                title={`${prontiZonaVerdeCount} pacchi pronti in Zona Verde`}
              >
                {prontiZonaVerdeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight font-medium">Magazzino</span>
        </button>

        {/* 5. Menu Drawer */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all"
          aria-label="Apri menu completo"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};
