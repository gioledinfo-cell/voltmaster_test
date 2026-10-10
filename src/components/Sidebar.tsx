import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  HardHat,
  Truck,
  Calculator,
  Briefcase,
  ShieldCheck,
  Building2,
  Clock,
  CheckSquare,
  Calendar,
  FileCheck,
  MapPin,
  Workflow,
  Warehouse,
  ShoppingCart,
  Handshake,
  PackagePlus,
  Fuel,
  Wrench,
  FileSpreadsheet,
  FileCode,
  Users,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  ChevronsUpDown,
  Command as CommandIcon,
  PlayCircle,
  FolderLock,
} from 'lucide-react';
import { useApp, NavigationTab } from '../context/AppContext';
import { usePowerApps } from '../context/PowerAppsContext';
import { isItemVisible, AccessControlRule } from '../utils/accessControl';
import { calcolaSemaforoScadenza } from '../types/scadenze';
import { INITIAL_USERS } from '../data/mockData';
import { N_REGISTRI_ANAGRAFICHE } from '../constants/anagrafiche';
import { User } from '../types';

export type MacroFolderId =
  | 'direzione_strategia'
  | 'cantiere_operazioni'
  | 'logistica_flotta'
  | 'amministrazione_commerciale'
  | 'anagrafiche_master'
  | 'sicurezza_hr_compliance';

export interface NavItemDef extends AccessControlRule {
  tab?: NavigationTab;
  label: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  action?: () => void;
}

export interface MacroFolderDef extends AccessControlRule {
  id: MacroFolderId;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  // Palette colori: rose (1), amber (2), cyan (3), emerald (4), slate (5), indigo (6)
  colorClass: string;
  bgClass: string;
  borderClass: string;
  activeColor: string;
  badgeColor: string;
  items: NavItemDef[];
}

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenFlussoCantiere: () => void;
  onOpenOrganigramma: () => void;
  onOpenCommandPalette?: () => void;
}

/**
 * Calcola lo stato iniziale di apertura cartelle in base all'utente per contrastare
 * l'Information Overload: apre solo la/e cartella/e di competenza diretta del ruolo/reparto.
 * - Amministratore: tutte aperte (visione d'insieme)
 * - Contabilità: Amministrazione & Commerciale
 * - HR: Sicurezza, HR & Compliance
 * - Cantiere / Operai: Cantiere & Operazioni
 * - Ufficio Tecnico: Cantiere & Operazioni + Logistica & Flotta
 * - Responsabili: include sempre Direzione & Strategia
 */
export function getInitialOpenFolders(user?: User | null): Record<MacroFolderId, boolean> {
  const state: Record<MacroFolderId, boolean> = {
    direzione_strategia: false,
    cantiere_operazioni: false,
    logistica_flotta: false,
    amministrazione_commerciale: false,
    anagrafiche_master: false,
    sicurezza_hr_compliance: false,
  };

  if (!user) {
    state.cantiere_operazioni = true;
    return state;
  }

  // Amministratore generale: tutte aperte
  if (user.role === 'amministratore') {
    return {
      direzione_strategia: true,
      cantiere_operazioni: true,
      logistica_flotta: true,
      amministrazione_commerciale: true,
      anagrafiche_master: true,
      sicurezza_hr_compliance: true,
    };
  }

  // Apertura profilata per reparto
  switch (user.reparto) {
    case 'contabilita':
      state.amministrazione_commerciale = true;
      break;
    case 'hr':
      state.sicurezza_hr_compliance = true;
      break;
    case 'capocantiere':
    case 'operaio':
    case 'apprendista':
      state.cantiere_operazioni = true;
      break;
    case 'ufficio_tecnico':
      state.cantiere_operazioni = true;
      state.logistica_flotta = true;
      break;
    default:
      state.cantiere_operazioni = true;
      break;
  }

  // I responsabili aziendali consultano prioritariamente Direzione & Strategia
  if (user.role === 'responsabile') {
    state.direzione_strategia = true;
  }

  return state;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  onOpenFlussoCantiere,
  onOpenOrganigramma,
  onOpenCommandPalette,
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
    dipendenti,
  } = useApp();
  const { kpis } = usePowerApps();

  const [searchQuery, setSearchQuery] = useState('');

  // Conteggi e Badge dinamici
  const pendingRichiesteCount = richiesteMateriali.filter(
    (r) => r.stato === 'inviata' || r.stato === 'in_preparazione'
  ).length;
  const urgentRichiesteCount = richiesteMateriali.filter(
    (r) =>
      (r.stato === 'inviata' || r.stato === 'in_preparazione') &&
      (r.priorita === 'bloccante_fermo_cantiere' || r.priorita === 'urgente')
  ).length;

  const pendingRolsCount = rols.filter((r) => r.stato === 'inviato').length;
  const lowStockCount = magazzino.filter((m) => m.giacenza <= m.scortaMinima).length;
  const activeCantieriCount = cantieri.filter((c) => c.stato === 'in_corso').length;
  const inViaggioDdtCount = ddts.filter((d) => d.stato === 'in_viaggio').length;
  const supplierOrdersCount = ordiniInterni.filter(
    (o) => o.tipo === 'fornitore' && o.stato !== 'chiuso' && o.stato !== 'annullato'
  ).length;
  const customerOrdersCount = ordiniInterni.filter(
    (o) => o.tipo === 'cliente' && o.stato !== 'chiuso' && o.stato !== 'annullato'
  ).length;
  const todayPresenzeCount = presenze.filter(
    (p) => p.data === new Date().toISOString().split('T')[0]
  ).length;
  const activeSalsCount = sals.filter((s) => s.stato !== 'liquidato').length;
  const criticalScadenzeCount = scadenze.filter((s) => {
    const c = calcolaSemaforoScadenza(s.dataScadenza);
    return c.stato === 'scaduto' || c.stato === 'urgente_15gg';
  }).length;

  // Fix 3: conteggio reale dipendenti interni escludendo i clienti esterni (fallback context/PostgreSQL)
  const internalUsersCount = useMemo(
    () => INITIAL_USERS.filter((u) => u.role !== 'cliente').length,
    []
  );
  const totalDipendentiCount =
    dipendenti && dipendenti.length > 0 ? dipendenti.length : internalUsersCount;

  // Definizione delle 6 Macro-Cartelle (Proposta A - Senza duplicazioni tab)
  const macroFolders: MacroFolderDef[] = useMemo(
    () => [
      // 1. Direzione & Strategia (Rose)
      {
        id: 'direzione_strategia',
        title: '1. Direzione & Strategia',
        shortTitle: 'Direzione',
        icon: TrendingUp,
        allowedRoles: ['responsabile'],
        allowedReparti: ['contabilita', 'ufficio_tecnico'],
        colorClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-500/10 dark:bg-rose-950/40',
        borderClass: 'border-rose-500/20 dark:border-rose-500/30',
        activeColor: 'text-rose-700 dark:text-rose-300',
        badgeColor: 'bg-rose-500 text-white',
        items: [
          {
            tab: 'dashboard',
            label: 'Cruscotto Direzionale (EBITDA)',
            keywords: 'direzione ebitda ricavi costi kpi redditivita bilancio utile',
            icon: TrendingUp,
            modes: ['contabilita', 'ufficio_tecnico'],
          },
          {
            tab: 'contabilita_kpi',
            label: 'Controllo Gestione & Margini',
            keywords: 'margini controllo gestione consuntivo costi orari ricarico',
            icon: Calculator,
            badge: pendingRolsCount > 0 ? `${pendingRolsCount} ROL` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold',
            modes: ['contabilita', 'ufficio_tecnico'],
          },
          {
            tab: 'sal_cantiere',
            label: 'Approvazione SAL & Avanzamenti',
            keywords: 'sal approvazione libretto misure liquidazione stato avanzamento',
            icon: FileSpreadsheet,
            badge: activeSalsCount > 0 ? `${activeSalsCount} attivi` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold',
            modes: ['contabilita', 'ufficio_tecnico'],
          },
        ],
      },

      // 2. Cantiere & Operazioni (Amber)
      {
        id: 'cantiere_operazioni',
        title: '2. Cantiere & Operazioni',
        shortTitle: 'Cantiere',
        icon: HardHat,
        allowedReparti: undefined, // aperta a tutti i reparti interni
        colorClass: 'text-amber-500 dark:text-amber-400',
        bgClass: 'bg-amber-500/10 dark:bg-amber-950/40',
        borderClass: 'border-amber-500/20 dark:border-amber-500/30',
        activeColor: 'text-amber-600 dark:text-amber-300',
        badgeColor: 'bg-amber-500 text-slate-950',
        items: [
          {
            tab: 'cantieri',
            label: 'Commesse & Cantieri',
            keywords: 'cantieri commesse clienti indirizzo pos stato avanzamento',
            icon: Building2,
            badge: activeCantieriCount > 0 ? `${activeCantieriCount} attivi` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'rol',
            label: 'Rapportini ROL',
            keywords: 'rol rapporto ore lavorate rapportini manodopera trasferte firma',
            icon: Clock,
            badge: pendingRolsCount > 0 ? `${pendingRolsCount} da val.` : undefined,
            badgeColor: 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'lavorazioni',
            label: 'WBS & Computo Lavorazioni',
            keywords: 'lavorazioni computo wbs fasi posa cavi cablaggi',
            icon: CheckSquare,
            modes: ['ufficio_tecnico', 'cantiere_mobile'],
          },
          {
            tab: 'gantt_squadre',
            label: 'Gantt Programmazione Squadre',
            keywords: 'gantt squadre pianificazione risorse calendario ple sovrapposizioni',
            icon: Calendar,
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'giornale_lavori',
            label: 'Giornale dei Lavori',
            keywords: 'giornale lavori verbale capocantiere direzione dl meteo certificato',
            icon: FileCheck,
            badge: 'Certificato DL',
            badgeColor: 'text-blue-600 dark:text-blue-400 font-semibold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'mappa_gps',
            label: 'Tracciamento GPS & Mezzi',
            keywords: 'gps tracciamento mezzi geofence posizione furgoni cantiere',
            icon: MapPin,
            badge: 'Live',
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold animate-pulse',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'flusso_cantiere',
            label: 'Workflow & Fasi di Cantiere',
            keywords: 'workflow flusso cantiere diagramma fasi checklist',
            icon: Workflow,
            action: onOpenFlussoCantiere,
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
        ],
      },

      // 3. Logistica & Flotta (Cyan)
      {
        id: 'logistica_flotta',
        title: '3. Logistica & Flotta',
        shortTitle: 'Logistica',
        icon: Truck,
        allowedReparti: ['ufficio_tecnico', 'capocantiere', 'contabilita'],
        colorClass: 'text-cyan-600 dark:text-cyan-400',
        bgClass: 'bg-cyan-500/10 dark:bg-cyan-950/40',
        borderClass: 'border-cyan-500/20 dark:border-cyan-500/30',
        activeColor: 'text-cyan-600 dark:text-cyan-300',
        badgeColor: 'bg-cyan-600 text-white',
        items: [
          {
            tab: 'magazzino',
            label: 'Magazzino Centrale & Scorte',
            keywords: 'magazzino scorte giacenze sottoscorta materiale cavi morsetti',
            icon: Warehouse,
            badge: lowStockCount > 0 ? `! ${lowStockCount}` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold animate-pulse',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'portale_magazzino',
            label: 'Portale Pallet & Pacchi Verde/Giallo',
            keywords: 'portale magazzino pallet pacchi zona verde gialla spedizione picking',
            icon: Warehouse,
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'ddt_trasporto',
            label: 'DDT di Trasporto',
            keywords: 'ddt documento trasporto consegna furgone scarico cantiere',
            icon: Truck,
            badge: inViaggioDdtCount > 0 ? `${inViaggioDdtCount} in viaggio` : undefined,
            badgeColor: 'text-amber-500 font-bold animate-pulse',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'ordini_fornitori',
            label: 'Ordini Fornitori',
            keywords: 'ordini fornitori acquisti rematarlazzi listino fornitura',
            icon: ShoppingCart,
            badge: supplierOrdersCount > 0 ? `${supplierOrdersCount} attivi` : undefined,
            badgeColor: 'text-cyan-600 dark:text-cyan-400 font-bold',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'ordini_interni',
            label: 'Ordini Interni Cantiere/Magazzino',
            keywords: 'ordini interni magazzino cantiere prelievo reintegro furgone',
            icon: Handshake,
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'richieste_materiali',
            label: 'Richieste Materiali da Campo',
            keywords: 'richieste materiali campo cantiere allestimento prelievo urgente',
            icon: PackagePlus,
            badge: pendingRichiesteCount > 0 ? `${pendingRichiesteCount} da evadere` : undefined,
            badgeColor:
              urgentRichiesteCount > 0
                ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                : 'text-amber-600 dark:text-amber-400 font-bold',
            modes: ['magazzino_portale', 'ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'veicoli',
            label: 'Parco Automezzi & Rifornimenti',
            keywords: 'veicoli automezzi flotta targa assicurazione tagliando furgoni',
            icon: Truck,
            badge: `${veicoli.length}`,
            badgeColor: 'text-slate-500 font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'attrezzature',
            label: 'Gestione PLE & Attrezzature',
            keywords: 'attrezzature ple trabattelli strumenti cei 64 8 tarature verifiche',
            icon: Wrench,
            modes: ['ufficio_tecnico', 'cantiere_mobile'],
          },
          {
            tab: 'powerapps_flotta_asset',
            label: 'App Flotta & Asset',
            keywords: 'powerapps flotta asset carburante tessere fuel chilometri',
            icon: Fuel,
            badge: `${kpis.veicoliAttivi} mezzi`,
            badgeColor: 'text-cyan-600 dark:text-cyan-400 font-mono',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
        ],
      },

      // 4. Amministrazione & Commerciale (Emerald)
      {
        id: 'amministrazione_commerciale',
        title: '4. Amministrazione & Commerciale',
        shortTitle: 'Amministrazione',
        icon: Calculator,
        allowedReparti: ['contabilita', 'ufficio_tecnico'],
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        borderClass: 'border-emerald-500/20 dark:border-emerald-500/30',
        activeColor: 'text-emerald-600 dark:text-emerald-300',
        badgeColor: 'bg-emerald-600 text-white',
        items: [
          {
            tab: 'preventivi',
            label: 'Preventivazione & Offerte Clienti',
            keywords: 'preventivi offerte computi metrici quadri quadro economico',
            icon: FileSpreadsheet,
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'ordini_clienti',
            label: 'Ordini Clienti & Contratti',
            keywords: 'ordini clienti contratti vendite commesse capitolato',
            icon: Handshake,
            badge: customerOrdersCount > 0 ? `${customerOrdersCount}` : undefined,
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'fatturazione_elettronica',
            label: 'Fatturazione Elettronica SDI',
            keywords: 'fattura elettronica xml agenzia entrate sdi ddt aliquota reverse charge',
            icon: FileCode,
            badge: 'SDI v1.8',
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-mono font-bold',
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'documenti',
            label: 'Documentazione Fiscale & Contratti',
            keywords: 'documentazione fiscale contratti di.co conformita dm 37 08 schemi',
            icon: FolderLock,
            modes: ['ufficio_tecnico', 'contabilita'],
          },
        ],
      },

      // 5. Anagrafiche Master (Slate) - Fix 1: Unica fonte di verità master, nessuna voce duplicata
      {
        id: 'anagrafiche_master',
        title: '5. Anagrafiche Master',
        shortTitle: 'Anagrafiche',
        icon: Briefcase,
        allowedRoles: ['responsabile'],
        allowedReparti: ['contabilita', 'ufficio_tecnico', 'hr'],
        colorClass: 'text-slate-600 dark:text-slate-300',
        bgClass: 'bg-slate-500/10 dark:bg-slate-800/40',
        borderClass: 'border-slate-400/30 dark:border-slate-600/40',
        activeColor: 'text-slate-900 dark:text-slate-100',
        badgeColor: 'bg-slate-700 text-white',
        items: [
          {
            tab: 'impostazioni_amministrazione',
            label: 'Anagrafiche Master & Tabelle Dati',
            keywords: 'anagrafiche master dati clienti fornitori cantieri listino flotta excel sdi import export',
            icon: SlidersHorizontal,
            badge: `${N_REGISTRI_ANAGRAFICHE} Registri`,
            badgeColor: 'text-slate-700 dark:text-slate-300 font-bold font-mono',
            modes: ['contabilita', 'ufficio_tecnico'],
          },
        ],
      },

      // 6. Sicurezza, HR & Compliance (Indigo)
      {
        id: 'sicurezza_hr_compliance',
        title: '6. Sicurezza, HR & Compliance',
        shortTitle: 'Sicurezza & HR',
        icon: ShieldCheck,
        allowedReparti: ['hr', 'ufficio_tecnico', 'contabilita', 'capocantiere'],
        colorClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        borderClass: 'border-indigo-500/20 dark:border-indigo-500/30',
        activeColor: 'text-indigo-600 dark:text-indigo-300',
        badgeColor: 'bg-indigo-600 text-white',
        items: [
          {
            tab: 'sicurezza_cantiere',
            label: 'Sicurezza Cantiere & D.Lgs 81/08',
            keywords: 'sicurezza d.lgs 81 08 pos psc durc tesserini idoneita cse dpi',
            icon: ShieldCheck,
            badge: 'DURC / POS',
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'presenze_cantiere',
            label: 'Presenze & Timbrature',
            keywords: 'presenze timbrature orari badge operai dipendenti cantiere timesheet',
            icon: HardHat,
            badge: todayPresenzeCount > 0 ? `${todayPresenzeCount} oggi` : undefined,
            badgeColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
          {
            tab: 'dipendenti',
            label: 'Personale & Dipendenti',
            keywords: 'personale dipendenti organico operai hr mansioni contratti pes pav',
            icon: Users,
            badge: `${totalDipendentiCount}`,
            badgeColor: 'text-indigo-600 dark:text-indigo-400 font-mono font-bold',
            modes: ['ufficio_tecnico', 'contabilita'],
          },
          {
            tab: 'scadenziario',
            label: 'Scadenze Patentini & Visite Mediche',
            keywords: 'scadenziario scadenze patentini visite mediche pes pav car durc tarature',
            icon: Bell,
            badge: criticalScadenzeCount > 0 ? `! ${criticalScadenzeCount}` : undefined,
            badgeColor: 'text-rose-600 dark:text-rose-400 font-bold animate-pulse',
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile', 'magazzino_portale'],
          },
          {
            tab: 'organigramma',
            label: 'Organigramma Aziendale',
            keywords: 'organigramma aziendale ruoli gerarchia responsabile reparto',
            icon: Workflow,
            action: onOpenOrganigramma,
            modes: ['ufficio_tecnico', 'contabilita', 'cantiere_mobile'],
          },
        ],
      },
    ],
    [
      pendingRolsCount,
      activeSalsCount,
      activeCantieriCount,
      onOpenFlussoCantiere,
      lowStockCount,
      inViaggioDdtCount,
      supplierOrdersCount,
      pendingRichiesteCount,
      urgentRichiesteCount,
      veicoli.length,
      kpis.veicoliAttivi,
      customerOrdersCount,
      todayPresenzeCount,
      totalDipendentiCount,
      criticalScadenzeCount,
      onOpenOrganigramma,
    ]
  );

  // Filtro unico RBAC sia per cartelle che per voci tramite isItemVisible
  const visibleFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return macroFolders
      .filter((folder) => isItemVisible(folder, currentUser, interfaceMode))
      .map((folder) => {
        // Filtra le voci interne con isItemVisible
        const allowedItems = folder.items.filter((item) =>
          isItemVisible(item, currentUser, interfaceMode)
        );

        if (!query) {
          return {
            ...folder,
            visibleItems: allowedItems,
          };
        }

        // Filtro di ricerca per label, tab, keywords o cartella
        const matchingItems = allowedItems.filter(
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
  }, [macroFolders, currentUser, interfaceMode, searchQuery]);

  // Fix 4: Determina in modo univoco quale cartella contiene activeTab (nessun tab duplicato)
  const activeFolderId = useMemo(() => {
    for (const folder of visibleFolders) {
      if (folder.visibleItems.some((item) => item.tab === activeTab)) {
        return folder.id;
      }
    }
    return visibleFolders[0]?.id || 'cantiere_operazioni';
  }, [activeTab, visibleFolders]);

  // Fix 2: Stato apertura/chiusura cartelle profilato sul ruolo/reparto (anti information overload)
  const [openFolders, setOpenFolders] = useState<Record<MacroFolderId, boolean>>(() =>
    getInitialOpenFolders(currentUser)
  );

  // Traccia il primo render per evitare l'espansione automatica al mount iniziale
  const isFirstRender = useRef(true);

  // Aggiorna lo stato se cambia l'utente attivo (es. switch utente/ruolo o login)
  useEffect(() => {
    setOpenFolders(getInitialOpenFolders(currentUser));
  }, [currentUser?.id, currentUser?.role, currentUser?.reparto]);

  // Esegui l'apertura automatica solo quando activeTab cambia DOPO il primo render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activeFolderId) {
      setOpenFolders((prev) => ({
        ...prev,
        [activeFolderId]: true,
      }));
    }
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
      direzione_strategia: nextState,
      cantiere_operazioni: nextState,
      logistica_flotta: nextState,
      amministrazione_commerciale: nextState,
      anagrafiche_master: nextState,
      sicurezza_hr_compliance: nextState,
    });
  };

  const totalMatchingItems = useMemo(
    () => visibleFolders.reduce((acc, f) => acc + f.visibleItems.length, 0),
    [visibleFolders]
  );

  const handleNavClick = (item: NavItemDef) => {
    if (item.action) {
      item.action();
    } else if (item.tab) {
      setActiveTab(item.tab);
      if (item.tab === 'ordini_fornitori') {
        window.history.pushState({}, '', '/ordini-fornitori');
      } else if (item.tab === 'ordini_clienti') {
        window.history.pushState({}, '', '/ordini-clienti');
      }
    }
    onCloseMobile();
  };

  // Badge riassuntivo cartella quando è chiusa
  const getFolderBadge = (folderId: MacroFolderId) => {
    switch (folderId) {
      case 'direzione_strategia':
        return activeSalsCount > 0 ? `${activeSalsCount} SAL` : null;
      case 'cantiere_operazioni':
        return pendingRolsCount > 0
          ? `${pendingRolsCount} ROL`
          : activeCantieriCount > 0
          ? `${activeCantieriCount}`
          : null;
      case 'logistica_flotta':
        return lowStockCount > 0
          ? `! ${lowStockCount}`
          : inViaggioDdtCount > 0
          ? `${inViaggioDdtCount} DDT`
          : null;
      case 'amministrazione_commerciale':
        return customerOrdersCount > 0 ? `${customerOrdersCount}` : null;
      case 'anagrafiche_master':
        return null;
      case 'sicurezza_hr_compliance':
        return criticalScadenzeCount > 0 ? `! ${criticalScadenzeCount}` : null;
      default:
        return null;
    }
  };

  const handleTriggerCommandPalette = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      // Trigger evento globale da tastiera CMD+K
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
      );
    }
  };

  const isClient = interfaceMode === 'cliente_portal';

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
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                interfaceMode === 'contabilita'
                  ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                  : interfaceMode === 'cantiere_mobile'
                  ? 'bg-amber-500 dark:bg-amber-400 animate-pulse'
                  : interfaceMode === 'cliente_portal'
                  ? 'bg-cyan-500 dark:bg-cyan-400 animate-pulse'
                  : 'bg-indigo-500 dark:bg-indigo-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              {currentUser.reparto === 'hr'
                ? 'Reparto HR & Personale'
                : interfaceMode === 'contabilita'
                ? 'Vista Amministrazione'
                : interfaceMode === 'ufficio_tecnico'
                ? 'Ufficio Tecnico & PM'
                : interfaceMode === 'cantiere_mobile'
                ? 'Vista Campo & Mobile'
                : 'Portale Committente'}
            </span>
          </div>

          <button
            onClick={onOpenOrganigramma}
            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Visualizza organigramma aziendale"
          >
            <span>{totalDipendentiCount} Dipendenti</span>
          </button>
        </div>

        <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 truncate flex items-center justify-between">
          <span className="truncate">{currentUser.name}</span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            {currentUser.reparto === 'hr'
              ? 'HR & Staff'
              : currentUser.reparto === 'contabilita'
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

      {/* COMMAND PALETTE (CMD+K) & SEARCH TRIGGER */}
      <div className="px-3 pt-3 pb-1 space-y-2">
        <button
          type="button"
          onClick={handleTriggerCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 transition-colors shadow-2xs group cursor-pointer"
          title="Apri Command Palette (CMD+K)"
        >
          <div className="flex items-center gap-2">
            <CommandIcon className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-medium">Command Palette</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-amber-600 dark:text-amber-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtra menu (es. ROL, DDT, SAL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
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

        {/* Meta Status Bar */}
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span>
            {searchQuery ? (
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {totalMatchingItems} {totalMatchingItems === 1 ? 'voce' : 'voci'}
              </strong>
            ) : (
              `${visibleFolders.length} Cartelle autorizzate`
            )}
          </span>
          <button
            type="button"
            onClick={toggleAllFolders}
            className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium flex items-center gap-0.5 cursor-pointer"
            title="Espandi o comprimi tutte le cartelle"
          >
            <ChevronsUpDown className="w-2.5 h-2.5" />
            <span>{Object.values(openFolders).every(Boolean) ? 'Comprimi' : 'Espandi'}</span>
          </button>
        </div>
      </div>

      {/* 6 ACCORDION MACRO-CARTELLE */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {visibleFolders.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 my-2">
            <Search className="w-5 h-5 mx-auto text-slate-400 opacity-60" />
            <p>Nessun modulo visibile o corrispondente a "{searchQuery}"</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 text-[11px] rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Reimposta filtro
              </button>
            )}
          </div>
        ) : (
          visibleFolders.map((folder) => {
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
                {/* Header Cartella */}
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-xs font-bold text-left transition-colors cursor-pointer ${
                    hasActiveChild
                      ? `${folder.activeColor}`
                      : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
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
                      {/* Conteggio voci visibili */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {folder.visibleItems.length}{' '}
                        {folder.visibleItems.length === 1 ? 'voce' : 'voci'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {folderBadge && !isOpen && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-amber-500 text-slate-950 shadow-xs">
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

                {/* Sottovoci all'interno della cartella */}
                {isOpen && (
                  <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-slate-200/80 dark:border-slate-800/60 animate-in fade-in duration-150">
                    {folder.visibleItems.map((item) => {
                      const isActive = item.tab && activeTab === item.tab;
                      const ItemIcon = item.icon;

                      return (
                        <button
                          key={item.tab || item.label}
                          onClick={() => handleNavClick(item)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={
                                isActive
                                  ? 'text-slate-950'
                                  : 'text-slate-400 dark:text-slate-400'
                              }
                            >
                              <ItemIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="truncate text-[11px]">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
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

      {/* Footer trigger */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60 space-y-2">
        <button
          onClick={() => {
            onOpenOrganigramma();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
        >
          <Workflow className="w-4 h-4 text-amber-500" />
          <span>Organigramma & Ruoli ({totalDipendentiCount})</span>
        </button>

        {!isClient && (
          <button
            onClick={() => {
              onOpenFlussoCantiere();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow transition-all active:scale-[0.99] cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 fill-slate-950" />
            <span>Flusso Rapido Campo</span>
          </button>
        )}

        <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 pt-0.5">
          VoltMaster · 6 Cartelle Organizzate
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
