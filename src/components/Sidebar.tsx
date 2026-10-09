import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  Clock,
  Warehouse,
  Wrench,
  Truck,
  Users,
  FolderLock,
  UserCircle2,
  PlayCircle,
  X,
  Calculator,
  Workflow,
  ShoppingCart,
  HardHat,
  Bell,
  Fuel,
  MapPin,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Folder,
  FolderOpen,
  ChevronsUpDown,
  Sparkles,
  Handshake,
  Lock,
  PackagePlus,
  Monitor,
  Maximize,
  Calendar,
  FileCode,
  FileCheck,
} from 'lucide-react';
import { useApp, NavigationTab } from '../context/AppContext';
import { usePowerApps } from '../context/PowerAppsContext';
import { calcolaSemaforoScadenza } from '../types/scadenze';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenFlussoCantiere: () => void;
  onOpenOrganigramma: () => void;
}

export type MacroFolderId =
  | 'cantiere_operazioni'
  | 'logistica_flotta'
  | 'contabilita_sal'
  | 'sicurezza_amministrazione';

interface NavItemDef {
  tab?: NavigationTab;
  href?: string;
  target?: string;
  label: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  modes: string[];
}

interface MacroFolderDef {
  id: MacroFolderId;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  activeColor: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  onOpenFlussoCantiere,
  onOpenOrganigramma,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    interfaceMode,
    rols,
    cantieri,
    veicoli,
    magazzino,
    ordiniInterni,
    presenze,
    sals,
    scadenze,
    ddts,
    richiesteMateriali,
    gpsScans,
  } = useApp();

  const { kpis } = usePowerApps();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  // Badges calculation
  const pendingRichiesteCount = richiesteMateriali.filter((r) => r.stato === 'inviata' || r.stato === 'in_preparazione').length;
  const urgentRichiesteCount = richiesteMateriali.filter((r) => (r.stato === 'inviata' || r.stato === 'in_preparazione') && (r.priorita === 'bloccante_fermo_cantiere' || r.priorita === 'urgente')).length;
  const pendingRolsCount = rols.filter((r) => r.stato === 'inviato').length;
  const lowStockCount = magazzino.filter((m) => m.giacenza <= m.scortaMinima).length;
  const activeCantieriCount = cantieri.filter((c) => c.stato === 'in_corso').length;
  const inViaggioDdtCount = ddts.filter((d) => d.stato === 'in_viaggio').length;
  const supplierOrdersCount = ordiniInterni.filter((o) => o.tipo === 'fornitore' && o.stato !== 'chiuso' && o.stato !== 'annullato').length;
  const customerOrdersCount = ordiniInterni.filter((o) => o.tipo === 'cliente' && o.stato !== 'chiuso' && o.stato !== 'annullato').length;
  const todayPresenzeCount = presenze.filter((p) => p.data === new Date().toISOString().split('T')[0]).length;
  const activeSalsCount = sals.filter((s) => s.stato !== 'liquidato').length;
  const criticalScadenzeCount = scadenze.filter((s) => {
    const c = calcolaSemaforoScadenza(s.dataScadenza);
    return c.stato === 'scaduto' || c.stato === 'urgente_15gg';
  }).length;

  const isAuthorizedForSuppliers =
    currentUser.role === 'amministratore' ||
    currentUser.role === 'responsabile' ||
    currentUser.reparto === 'contabilita' ||
    currentUser.reparto === 'ufficio_tecnico' ||
    interfaceMode === 'magazzino_portale' ||
    interfaceMode === 'contabilita' ||
    interfaceMode === 'ufficio_tecnico';

  const isClient = interfaceMode === 'cliente_portal';
  const isContabilita = interfaceMode === 'contabilita';
  const isCampo = interfaceMode === 'cantiere_mobile';

  // Macro Folders Configuration
  const macroFolders: MacroFolderDef[] = useMemo(
    () => [
      {
        id: 'cantiere_operazioni',
        title: 'Cantiere & Operazioni',
        shortTitle: 'Cantiere',
        icon: HardHat,
        colorClass: 'text-amber-500 dark:text-amber-400',
        bgClass: 'bg-amber-500/10 dark:bg-amber-950/40',
        borderClass: 'border-amber-500/20 dark:border-amber-500/30',
        activeColor: 'text-amber-600 dark:text-amber-300',
        items: [
          {
            tab: 'cantieri',
            label: isContabilita ? 'Commesse & Cantieri' : 'Clienti & Cantieri (22+)',
            keywords: 'cantieri commesse clienti indirizzo pos cantieri attivi',
            icon: Building2,
            badge: activeCantieriCount > 0 ? `${activeCantieriCount} attivi` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'cliente_portal'],
          },
          {
            tab: 'sicurezza_cantiere',
            label: 'Sicurezza & D.Lgs 81/08',
            keywords: 'sicurezza durc pos psc visite mediche idoneita pes pav cse d.lgs 81 08 tesserini dpi subappalti',
            icon: ShieldCheck,
            badge: 'DURC / POS',
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'richieste_materiali',
            label: isCampo ? 'Richiesta Materiali Campo' : 'Richieste Materiali & Campo',
            keywords: 'richieste materiali attrezzature cantiere lista ordine campo urgente prelievo ddt furgone',
            icon: PackagePlus,
            badge: pendingRichiesteCount > 0 ? `${pendingRichiesteCount} da evadere` : undefined,
            badgeColor: urgentRichiesteCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse' : 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'ordini_clienti',
            label: 'Ordini Clienti / Cantieri',
            keywords: 'ordini clienti cantieri commesse vendite lavorazioni esterne forniture',
            icon: Handshake,
            badge: customerOrdersCount > 0 ? `${customerOrdersCount} attivi` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'cliente_portal'],
          },
          {
            tab: 'presenze_cantiere',
            label: 'Presenze & Timesheet',
            keywords: 'presenze timbrature badge timesheet operai dipendenti ore',
            icon: HardHat,
            badge: todayPresenzeCount > 0 ? `${todayPresenzeCount} oggi` : undefined,
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'rol',
            label: isCampo ? 'I Miei Rapportini (ROL)' : 'ROL - Rapporto Ore',
            keywords: 'rol rapporto ore lavorate rapportini straordinari firma cliente trasferta viaggio',
            icon: Clock,
            badge: pendingRolsCount > 0 ? `${pendingRolsCount} da val.` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'cliente_portal'],
          },
          {
            tab: 'lavorazioni',
            label: 'Pianificazione Fasi & WBS',
            keywords: 'lavorazioni fasi cronoprogramma wbs posa cavi quadri collaudo',
            icon: CheckSquare,
            modes: ['ufficio_tecnico', 'cantiere_mobile'],
          },
          {
            tab: 'giornale_lavori',
            label: 'Giornale dei Lavori Digitale',
            keywords: 'giornale lavori verbale capocantiere direzione lavori dl meteo maestranze foto verbale firmato dm 49 2018',
            icon: FileCheck,
            badge: 'Certificato DL',
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'gantt_squadre',
            label: 'Gantt & Carico Squadre (PLE)',
            keywords: 'gantt cronoprogramma carico risorse squadre ple piattaforme aeree furgoni conflitti sovrapposizione allocazioni',
            icon: Calendar,
            badge: 'Timeline Live',
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'mappa_gps',
            label: 'Mappa Cantieri & GPS Live',
            keywords: 'mappa gps geolocalizzazione cantieri posizioni percorsi furgoni',
            icon: MapPin,
            badge: `${gpsScans.length} GPS`,
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'dashboard',
            label: 'Dashboard Impianti & KPI',
            keywords: 'dashboard statistiche metriche panoramica kpi stato avanzamento',
            icon: LayoutDashboard,
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            href: '/tv',
            target: '_blank',
            label: 'Schermo TV Sede',
            keywords: 'schermo tv sede monitor wallboard kiosk officina grande schermo cantieri settimanale tabellone',
            icon: Monitor,
            badge: '1080p KIOSK',
            badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
        ],
      },
      {
        id: 'logistica_flotta',
        title: 'Logistica & Flotta',
        shortTitle: 'Logistica',
        icon: Truck,
        colorClass: 'text-cyan-600 dark:text-cyan-400',
        bgClass: 'bg-cyan-500/10 dark:bg-cyan-950/40',
        borderClass: 'border-cyan-500/20 dark:border-cyan-500/30',
        activeColor: 'text-cyan-600 dark:text-cyan-300',
        items: [
          {
            tab: 'portale_magazzino',
            label: 'Portale Magazzino Centrale',
            keywords: 'magazzino centrale giacenze scaffali ubicazione articoli cavi',
            icon: Warehouse,
            badge: lowStockCount > 0 ? `! ${lowStockCount} alert` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold animate-pulse',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'richieste_materiali',
            label: 'Richieste da Campo',
            keywords: 'richieste materiali cantiere allestimento ddt spedizione prelievo',
            icon: PackagePlus,
            badge: pendingRichiesteCount > 0 ? `${pendingRichiesteCount} da evadere` : undefined,
            badgeColor: urgentRichiesteCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse' : 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'ordini_fornitori',
            label: 'Ordini Fornitori (Acquisti)',
            keywords: 'ordini fornitori acquisti materiale ditte approvvigionamento furgone',
            icon: ShoppingCart,
            badge: !isAuthorizedForSuppliers ? '🔒 Riservato' : (supplierOrdersCount > 0 ? `${supplierOrdersCount} in corso` : undefined),
            badgeColor: !isAuthorizedForSuppliers ? 'text-rose-600 dark:text-rose-400 font-mono font-bold' : 'text-cyan-600 dark:text-cyan-400 font-bold',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'ordini_clienti',
            label: 'Ordini Clienti / Cantieri',
            keywords: 'ordini clienti cantieri vendite commesse forniture',
            icon: Handshake,
            badge: customerOrdersCount > 0 ? `${customerOrdersCount}` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'ddt_trasporto',
            label: 'DDT Trasporto & Spedizioni',
            keywords: 'ddt documento trasporto consegna furgone scarico cantiere viaggio',
            icon: Truck,
            badge: inViaggioDdtCount > 0 ? `${inViaggioDdtCount} in viaggio` : undefined,
            badgeColor: 'text-amber-500 font-bold animate-pulse',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'powerapps_flotta_asset',
            label: 'Hub Flotta & Carburante',
            keywords: 'flotta rifornimenti carburante tessere carburante chilometri manutenzione depositi asset',
            icon: Fuel,
            badge: `${kpis.veicoliAttivi} mezzi`,
            badgeColor: 'text-cyan-600 dark:text-cyan-400 font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'veicoli',
            label: 'Anagrafica Veicoli & Mezzi',
            keywords: 'veicoli furgoni targa tagliando assicurazione revisione autista',
            icon: Truck,
            badge: `${veicoli.length}`,
            badgeColor: 'text-slate-500 font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'attrezzature',
            label: 'Strumenti CEI 64-8 & Tarature',
            keywords: 'attrezzature strumenti misura isolamento taratura matricola megger pinza amperometrica',
            icon: Wrench,
            modes: ['ufficio_tecnico', 'cantiere_mobile'],
          },
          {
            tab: 'magazzino',
            label: 'Giacenze Rapide & Furgone',
            keywords: 'magazzino furgone materiale scorte minime cavi magnetotermici',
            icon: Warehouse,
            modes: ['ufficio_tecnico', 'cantiere_mobile'],
          },
        ],
      },
      {
        id: 'contabilita_sal',
        title: 'Contabilità & SAL',
        shortTitle: 'Contabilità',
        icon: Calculator,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        borderClass: 'border-emerald-500/20 dark:border-emerald-500/30',
        activeColor: 'text-emerald-600 dark:text-emerald-300',
        items: [
          {
            tab: 'sal_cantiere',
            label: 'SAL & Contabilità Cantiere',
            keywords: 'sal stato avanzamento lavori contabilità liquidazione certificato pagamento computo',
            icon: FileSpreadsheet,
            badge: activeSalsCount > 0 ? `${activeSalsCount} attivi` : undefined,
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'contabilita_kpi',
            label: 'Controllo ROL, Margini & Costi',
            keywords: 'margini redditività controllo gestione costi manodopera ricavi bilancio commessa',
            icon: Calculator,
            badge: pendingRolsCount > 0 ? `${pendingRolsCount} ROL` : undefined,
            badgeColor: 'text-amber-500 font-bold',
            modes: ['contabilita'],
          },
          {
            tab: 'preventivi',
            label: 'Preventivi & Computi Elettrici',
            keywords: 'preventivi offerte computo metrico quadri impianti quadro economico',
            icon: FileSpreadsheet,
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'fatturazione_elettronica',
            label: 'Fattura Elettronica XML (SDI)',
            keywords: 'fattura elettronica xml agenzia entrate sdi ddt rol fatture ciclo attivo aliquota iva reverse charge',
            icon: FileCode,
            badge: 'SDI v1.8',
            badgeColor: 'text-blue-600 dark:text-blue-400 font-mono font-bold',
            modes: ['ufficio_tecnico', 'contabilita'],
          },
        ],
      },
      {
        id: 'sicurezza_amministrazione',
        title: 'Sicurezza & Amministrazione',
        shortTitle: 'Sicurezza & HR',
        icon: ShieldCheck,
        colorClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        borderClass: 'border-indigo-500/20 dark:border-indigo-500/30',
        activeColor: 'text-indigo-600 dark:text-indigo-300',
        items: [
          {
            tab: 'scadenziario',
            label: 'Scadenziario & Semafori Normativi',
            keywords: 'scadenziario durc dvr pos tarature patentini revisioni visite mediche formazione',
            icon: Bell,
            badge: criticalScadenzeCount > 0 ? `${criticalScadenzeCount} alert` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold animate-pulse',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'documenti',
            label: 'Schemi CEI & Fascicolo Tecnico',
            keywords: 'documenti schemi elettrici dm 37 08 pos certificati conformità di.co dichiarazione',
            icon: FolderLock,
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'cliente_portal'],
          },
          {
            tab: 'dipendenti',
            label: 'Organico & Dipendenti (20)',
            keywords: 'dipendenti personale organico operai elettricisti ruoli mansioni formazione pes pav',
            icon: Users,
            badge: '20',
            badgeColor: 'text-indigo-600 dark:text-indigo-400 font-mono font-bold',
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'cliente_portal',
            label: 'Area Committente & Portale',
            keywords: 'cliente portale committente visualizzazione report avanzamento verbali',
            icon: UserCircle2,
            modes: ['cliente_portal', 'ufficio_tecnico'],
          },
        ],
      },
    ],
    [
      isContabilita,
      isCampo,
      activeCantieriCount,
      todayPresenzeCount,
      pendingRolsCount,
      gpsScans.length,
      lowStockCount,
      supplierOrdersCount,
      customerOrdersCount,
      isAuthorizedForSuppliers,
      inViaggioDdtCount,
      kpis.veicoliAttivi,
      veicoli.length,
      activeSalsCount,
      criticalScadenzeCount,
    ]
  );

  // Determine which folder contains activeTab
  const activeFolderId = useMemo(() => {
    for (const folder of macroFolders) {
      if (folder.items.some((item) => item.tab === activeTab)) {
        return folder.id;
      }
    }
    return 'cantiere_operazioni';
  }, [activeTab, macroFolders]);

  // Folder open/collapsed state (all open by default or active folder)
  const [openFolders, setOpenFolders] = useState<Record<MacroFolderId, boolean>>({
    cantiere_operazioni: true,
    logistica_flotta: true,
    contabilita_sal: true,
    sicurezza_amministrazione: true,
  });

  // Ensure active folder is opened whenever activeTab changes
  useEffect(() => {
    setOpenFolders((prev) => ({
      ...prev,
      [activeFolderId]: true,
    }));
  }, [activeFolderId]);

  const toggleFolder = (folderId: MacroFolderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const toggleAllFolders = () => {
    const allOpen = Object.values(openFolders).every(Boolean);
    const nextState = !allOpen;
    setOpenFolders({
      cantiere_operazioni: nextState,
      logistica_flotta: nextState,
      contabilita_sal: nextState,
      sicurezza_amministrazione: nextState,
    });
  };

  // Filtered structure based on interfaceMode and search query
  const filteredFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return macroFolders
      .map((folder) => {
        // Filter items by active mode
        const modeItems = folder.items.filter((item) => item.modes.includes(interfaceMode));

        if (!query) {
          return {
            ...folder,
            visibleItems: modeItems,
          };
        }

        // Search in title, tab name, label and keywords
        const matchingItems = modeItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            (item.tab && item.tab.toLowerCase().includes(query)) ||
            item.keywords.toLowerCase().includes(query) ||
            folder.title.toLowerCase().includes(query)
        );

        return {
          ...folder,
          visibleItems: matchingItems,
        };
      })
      .filter((folder) => folder.visibleItems.length > 0);
  }, [macroFolders, interfaceMode, searchQuery]);

  const totalMatchingItems = useMemo(
    () => filteredFolders.reduce((acc, f) => acc + f.visibleItems.length, 0),
    [filteredFolders]
  );

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (tab === 'ordini_fornitori') {
      window.history.pushState({}, '', '/ordini-fornitori');
    } else if (tab === 'ordini_clienti') {
      window.history.pushState({}, '', '/ordini-clienti');
    }
    onCloseMobile();
  };

  // Calculate folder alert badge
  const getFolderBadge = (folderId: MacroFolderId) => {
    switch (folderId) {
      case 'cantiere_operazioni':
        return pendingRolsCount > 0 ? `${pendingRolsCount} ROL` : activeCantieriCount > 0 ? `${activeCantieriCount}` : null;
      case 'logistica_flotta':
        return lowStockCount > 0
          ? `! ${lowStockCount}`
          : inViaggioDdtCount > 0
          ? `${inViaggioDdtCount} DDT`
          : null;
      case 'contabilita_sal':
        return activeSalsCount > 0 ? `${activeSalsCount} SAL` : null;
      case 'sicurezza_amministrazione':
        return criticalScadenzeCount > 0 ? `! ${criticalScadenzeCount}` : null;
      default:
        return null;
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800/80 w-72 select-none transition-colors duration-200 shadow-sm">
      {/* Mobile top close */}
      <div className="p-3.5 lg:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Menu Gestionale Cantiere
          </span>
        </div>
        <button
          onClick={onCloseMobile}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Mode & Profile Header */}
      <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                interfaceMode === 'contabilita'
                  ? 'bg-purple-500 dark:bg-purple-400 animate-pulse'
                  : interfaceMode === 'cantiere_mobile'
                  ? 'bg-cyan-500 dark:bg-cyan-400 animate-pulse'
                  : interfaceMode === 'cliente_portal'
                  ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                  : 'bg-amber-500 dark:bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              {interfaceMode === 'contabilita'
                ? 'Vista Amministrazione'
                : interfaceMode === 'ufficio_tecnico'
                ? 'Ufficio Tecnico'
                : interfaceMode === 'cantiere_mobile'
                ? 'Vista Campo & Mobile'
                : 'Portale Committente'}
            </span>
          </div>

          <button
            onClick={onOpenOrganigramma}
            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-mono font-bold flex items-center gap-1"
            title="Visualizza organigramma e ruoli aziendali"
          >
            <span>20 Tecnici</span>
          </button>
        </div>

        <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 truncate flex items-center justify-between">
          <span className="truncate">{currentUser.name}</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            {currentUser.reparto === 'contabilita'
              ? 'Amministrazione'
              : currentUser.reparto === 'ufficio_tecnico'
              ? 'PM Tecnico'
              : currentUser.reparto === 'operaio'
              ? 'Operaio Spec.'
              : currentUser.reparto === 'apprendista'
              ? 'Apprendista'
              : currentUser.role}
          </span>
        </div>
      </div>

      {/* QUICK SEARCH BAR IN SIDEBAR */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Ricerca rapida moduli (es. ROL, DDT, SAL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              title="Cancella ricerca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2 text-[9px] font-mono text-slate-400 dark:text-slate-600 pointer-events-none">
              /
            </span>
          )}
        </div>

        {/* Quick Search meta status bar */}
        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span>
            {searchQuery ? (
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {totalMatchingItems} {totalMatchingItems === 1 ? 'modulo trovato' : 'moduli trovati'}
              </strong>
            ) : (
              '4 Aree Tematiche Ordinate'
            )}
          </span>

          <button
            type="button"
            onClick={toggleAllFolders}
            className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium flex items-center gap-0.5"
            title="Espandi o comprimi tutte le cartelle"
          >
            <ChevronsUpDown className="w-2.5 h-2.5" />
            <span>{Object.values(openFolders).every(Boolean) ? 'Comprimi' : 'Espandi'}</span>
          </button>
        </div>
      </div>

      {/* THEMATIC FOLDERS NAVIGATION ACCORDION */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
        {filteredFolders.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 my-2">
            <Search className="w-5 h-5 mx-auto text-slate-400 opacity-60" />
            <p>Nessun modulo corrisponde a "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-1 text-[11px] rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
            >
              Reimposta ricerca
            </button>
          </div>
        ) : (
          filteredFolders.map((folder) => {
            const isOpen = searchQuery ? true : !!openFolders[folder.id];
            const hasActiveChild = folder.visibleItems.some((item) => item.tab === activeTab);
            const FolderIcon = folder.icon;
            const folderBadge = getFolderBadge(folder.id);

            return (
              <div
                key={folder.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  hasActiveChild
                    ? `${folder.borderClass} ${folder.bgClass} shadow-xs`
                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                {/* Folder Header Trigger */}
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-xs font-bold text-left transition-colors ${
                    hasActiveChild
                      ? `${folder.activeColor}`
                      : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${
                        hasActiveChild
                          ? 'bg-white dark:bg-slate-900 border-amber-500/30 text-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <FolderIcon className={`w-3.5 h-3.5 ${folder.colorClass}`} />
                    </div>
                    <div className="truncate">
                      <div className="truncate text-xs font-bold leading-snug">{folder.title}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-normal">
                        {folder.visibleItems.length} {folder.visibleItems.length === 1 ? 'modulo' : 'moduli'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {folderBadge && !isOpen && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-500 text-slate-950 shadow-xs">
                        {folderBadge}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform" />
                    )}
                  </div>
                </button>

                {/* Sub-items in Folder */}
                {isOpen && (
                  <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-slate-200/80 dark:border-slate-800/60 animate-in fade-in duration-150">
                    {folder.visibleItems.map((item) => {
                      const isActive = item.tab && activeTab === item.tab;
                      const ItemIcon = item.icon;

                      if (item.href) {
                        return (
                          <a
                            key={item.label}
                            href={item.href}
                            target={item.target || '_blank'}
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-slate-400 dark:text-slate-400 group-hover:text-amber-500 transition-colors">
                                <ItemIcon className="w-3.5 h-3.5" />
                              </span>
                              <span className="truncate text-[11px] font-semibold">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`text-[9px] font-mono tabular-nums px-1.5 py-0.2 rounded shrink-0 ${
                                  item.badgeColor || 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </a>
                        );
                      }

                      return (
                        <button
                          key={item.tab || item.label}
                          onClick={() => item.tab && handleNavClick(item.tab)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-400'}>
                              <ItemIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="truncate text-[11px]">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono tabular-nums px-1.5 py-0.2 rounded shrink-0 ${
                                isActive
                                  ? 'bg-slate-950 text-amber-400 font-bold'
                                  : `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
                                      item.badgeColor || 'text-slate-600 dark:text-slate-400'
                                    }`
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer trigger to Organigramma or Field Mode */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60 space-y-2">
        <button
          onClick={() => {
            onOpenOrganigramma();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
        >
          <Workflow className="w-4 h-4 text-amber-500" />
          <span>Schemi Ruoli & Organico (20)</span>
        </button>

        {!isClient && (
          <button
            onClick={() => {
              onOpenFlussoCantiere();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow transition-all active:scale-[0.99]"
          >
            <PlayCircle className="w-4 h-4 fill-slate-950" />
            <span>Flusso Rapido Campo</span>
          </button>
        )}

        <div className="text-[10px] text-center text-slate-600 dark:text-slate-400 pt-0.5">
          VoltMaster · 4 Aree Tematiche
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full z-50">{content}</div>
        </div>
      )}
    </>
  );
};
