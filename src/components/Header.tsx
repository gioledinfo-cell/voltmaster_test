import React, { useState } from 'react';
import {
  Zap,
  ScanLine,
  ChevronDown,
  RotateCcw,
  PlayCircle,
  Menu,
  Shield,
  Briefcase,
  HardHat,
  User,
  Calculator,
  Laptop,
  Smartphone,
  Building2,
  Users,
  Warehouse,
  Bell,
  Fuel,
  LogOut,
  UserCheck,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppInterfaceMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { NotificheDropdown } from './scadenziario/NotificheDropdown';
import { ThemeToggle } from './ThemeToggle';
import { SwitchUserModal } from './SwitchUserModal';
import { PWAInstallButton } from './common/PWAInstallButton';
import { CommandPaletteModal } from './common/CommandPaletteModal';
import { Search } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenFlussoCantiere: () => void;
  onOpenOrganigramma: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenFlussoCantiere,
  onOpenOrganigramma,
}) => {
  const {
    currentUser: appUser,
    interfaceMode,
    setInterfaceMode,
    activeTab,
    setActiveTab,
    openScanner,
    resetToMockData,
    notifiche,
    isNotificheDropdownOpen,
    setIsNotificheDropdownOpen,
    showToast,
  } = useApp();

  const { currentUser: authUser, logout } = useAuth();
  const activeUser = authUser || appUser;

  const nonLetteCount = notifiche.filter((n) => !n.letta).length;
  const criticheCount = notifiche.filter((n) => n.livello === 'rosso' || n.livello === 'arancione').length;

  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Shortcut CMD+K / CTRL+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    logout();
    showToast('Disconnessione effettuata con successo.', 'info');
  };

  const interfacesList: {
    mode: AppInterfaceMode;
    title: string;
    subtitle: string;
    team: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      mode: 'contabilita',
      title: '1. Amministrazione & Contabilità',
      subtitle: 'Validazione ROL paghe, controllo margini commessa, costi orari',
      team: '3 Addetti Contabili',
      icon: <Calculator className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
      color: 'border-purple-500/50 text-purple-700 dark:text-purple-300',
    },
    {
      mode: 'ufficio_tecnico',
      title: '2. Ufficio Tecnico & PM',
      subtitle: 'Preventivi, pianificazione cantieri, schemi CEI 64-8 e magazzino',
      team: '4 Tecnici / PM',
      icon: <Laptop className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
      color: 'border-amber-500/50 text-amber-700 dark:text-amber-300',
    },
    {
      mode: 'cantiere_mobile',
      title: '3. Campo & Cantiere Mobile',
      subtitle: 'Design smartphone/touch: scan QR, ore ROL rapide, firma cliente touch',
      team: '13 Tecnici (4 Capi + 4 Operai + 5 Apprendisti)',
      icon: <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      color: 'border-cyan-500/50 text-cyan-700 dark:text-cyan-300',
    },
    {
      mode: 'cliente_portal',
      title: '4. Portale Clienti Committenti',
      subtitle: 'Accesso esterno riservato committente, SAL, foto e DiCo 37/08',
      team: '20+ Clienti Attivi',
      icon: <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      mode: 'magazzino_portale',
      title: '5. Portale Magazzino & Flotta',
      subtitle: 'Hub materiali, verifica strumenti CEI 64-8 e gestione parco veicoli',
      team: 'Magazzino & Logistica',
      icon: <Warehouse className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
      color: 'border-amber-500/50 text-amber-700 dark:text-amber-300',
    },
  ];

  const currentModeInfo = interfacesList.find((i) => i.mode === interfaceMode) || interfacesList[1];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Zone 1: Mobile toggle & Brand Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (interfaceMode === 'cliente_portal') setActiveTab('cliente_portal');
            else if (interfaceMode === 'contabilita') setActiveTab('contabilita_kpi');
            else setActiveTab('dashboard');
          }}
          className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:bg-amber-400 transition-colors shrink-0">
            <Zap className="w-5 h-5 fill-slate-950" />
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 hidden min-[400px]:inline">
            Volt<span className="text-amber-500 dark:text-amber-400">Master</span>
          </span>
        </a>

        {/* Organigramma & 20 Dipendenti button */}
        <button
          onClick={onOpenOrganigramma}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-amber-600 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-amber-400 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
          title="Vedi ripartizione dei 20 dipendenti e dei 20+ clienti"
        >
          <Users className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="hidden md:inline">Organigramma (20 Dip. · 20+ Clienti)</span>
          <span className="md:hidden">20 Dip.</span>
        </button>

        {/* Command Palette CMD+K trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[36px] bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          title="Cerca rapida con scorciatoia tastiera CMD+K o CTRL+K"
        >
          <Search className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="hidden lg:inline text-slate-500 dark:text-slate-400">Cerca...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-amber-600 dark:text-amber-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 2: Interface Mode Selector & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Real-time Field Connectivity Status Indicator */}
        <NetworkStatusIndicator />

        {/* THEME TOGGLE (Dark / Light) */}
        <ThemeToggle />

        {/* NOTIFICHE & SCADENZE BELL BUTTON */}
        <div className="relative">
          <button
            onClick={() => setIsNotificheDropdownOpen((prev) => !prev)}
            className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-all ${
              criticheCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-md shadow-rose-950/20'
                : nonLetteCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
            }`}
            title={`Centro Notifiche: ${nonLetteCount} non lette (${criticheCount} critiche/urgenti)`}
          >
            <Bell className="w-4 h-4" />
            {nonLetteCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                {criticheCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 text-[9px] font-black items-center justify-center text-white ${
                    criticheCount > 0 ? 'bg-rose-600' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {nonLetteCount}
                </span>
              </span>
            )}
          </button>

          {isNotificheDropdownOpen && (
            <NotificheDropdown onClose={() => setIsNotificheDropdownOpen(false)} />
          )}
        </div>

        {/* Flotta & Carburante Quick Button */}
        <button
          onClick={() => setActiveTab('powerapps_flotta_asset')}
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          title="Hub Flotta, Carburante & Asset Power Apps"
        >
          <Fuel className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Flotta & Rifornimenti</span>
        </button>

        {/* In-App PWA Install Trigger */}
        <PWAInstallButton className="hidden md:inline-flex" />

        {/* Quick Scanner Action in Header (Hidden on small mobile where bottom bar provides prominent scanner button) */}
        <button
          onClick={openScanner}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          title="Scansiona QR Cantiere o Materiale"
        >
          <ScanLine className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="hidden md:inline">Scanner QR</span>
        </button>

        {/* Guided Field Flow Trigger */}
        {interfaceMode !== 'cliente_portal' && (
          <button
            onClick={onOpenFlussoCantiere}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Flusso Cantiere</span>
          </button>
        )}

        {/* MAIN ARCHITECTURAL INTERFACE MODE SWITCHER (Responsive on mobile) */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 min-h-[44px] bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 rounded-xl text-left transition-all shadow-sm"
            title="Seleziona Interfaccia (Amministrazione, PM, Campo, Portale)"
          >
            <div className="shrink-0">{currentModeInfo.icon}</div>
            <div className="text-left pr-1 hidden sm:block">
              <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[140px] sm:max-w-[190px]">
                {currentModeInfo.title.split('. ')[1] || currentModeInfo.title}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold mt-0.5 truncate max-w-[140px] sm:max-w-[190px]">
                {currentModeInfo.team}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isModeDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs"
              onClick={() => setIsModeDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seleziona Interfaccia (Struttura 20 Persone)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  LIVE
                </span>
              </div>

              <div className="p-2 space-y-1">
                {interfacesList.map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setInterfaceMode(item.mode)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                      interfaceMode === item.mode
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 mt-0.5 shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {item.title}
                        </span>
                        {interfaceMode === item.mode && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black font-mono">
                            ATTIVA
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium mt-0.5">
                        {item.team}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-2 px-3 pb-1 flex items-center justify-between text-[11px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrganigramma();
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Dettagli Organico (20)
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Vuoi ripristinare tutti i dati alle impostazioni iniziali?')) {
                      resetToMockData();
                    }
                  }}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Dati
                </button>
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE & AUTHENTICATION DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm shrink-0">
              {activeUser?.name ? activeUser.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[120px] truncate">
                {activeUser?.name || 'Utente Anagrafica'}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold capitalize leading-none mt-0.5">
                {activeUser?.role || 'operatore'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isProfileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs"
              onClick={() => setIsProfileDropdownOpen(false)}
            >
              {/* Profile Card Header */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md shrink-0">
                    {activeUser?.name ? activeUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {activeUser?.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {activeUser?.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        {activeUser?.role}
                      </span>
                      {activeUser?.reparto && (
                        <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {activeUser.reparto.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {activeUser?.qualifiche && activeUser.qualifiche.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-500" /> Qualification & Certification:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeUser.qualifiche.map((q, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(false);
                    setIsSwitchUserModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>Cambia Ruolo / Utente Rapido</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(false);
                    onOpenOrganigramma();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span>Vedi Organigramma (20 Dipendenti)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(false);
                    setActiveTab('impostazioni_amministrazione');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <span>Impostazioni & Anagrafica (Admin)</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-extrabold transition-colors mt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Disconnetti</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Switch User Modal */}
      {isSwitchUserModalOpen && (
        <SwitchUserModal onClose={() => setIsSwitchUserModalOpen(false)} />
      )}

      {/* Command Palette CMD+K Modal */}
      {isCommandPaletteOpen && (
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenOrganigramma={onOpenOrganigramma}
          onOpenFlussoCantiere={onOpenFlussoCantiere}
        />
      )}
    </header>
  );
};
