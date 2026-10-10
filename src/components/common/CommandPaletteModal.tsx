import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Building2,
  PackagePlus,
  Truck,
  Calculator,
  ShieldCheck,
  HardHat,
  Clock,
  CheckSquare,
  MapPin,
  Warehouse,
  ShoppingCart,
  Handshake,
  Fuel,
  Wrench,
  FileSpreadsheet,
  Users,
  FolderLock,
  FileText,
  Calendar,
  X,
  ChevronRight,
  Sparkles,
  Command,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { isItemVisible, AccessControlRule } from '../../utils/accessControl';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrganigramma?: () => void;
  onOpenFlussoCantiere?: () => void;
}

interface CommandItem extends AccessControlRule {
  id: string;
  category: 'Cantiere & Operazioni' | 'Logistica & Flotta' | 'Contabilità & SAL' | 'Sicurezza & Compliance' | 'Azioni Rapide';
  title: string;
  subtitle?: string;
  keywords: string;
  tab?: NavigationTab;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenOrganigramma,
  onOpenFlussoCantiere,
}) => {
  const {
    setActiveTab,
    cantieri,
    magazzino,
    ddts,
    ordiniInterni,
    scadenze,
    rols,
    currentUser,
    interfaceMode,
  } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Key listener for CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled externally or toggled
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command items catalog
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // 1. Cantiere & Operazioni
      {
        id: 'nav-cantieri',
        category: 'Cantiere & Operazioni',
        title: 'Commesse & Cantieri',
        subtitle: 'Anagrafica cantieri attivi, clienti e avanzamento %',
        keywords: 'cantieri commesse clienti cantiere indirizzo pos',
        tab: 'cantieri',
        icon: Building2,
        badge: `${cantieri.filter((c) => c.stato === 'in_corso').length} attivi`,
      },
      {
        id: 'nav-richieste-materiali',
        category: 'Cantiere & Operazioni',
        title: 'Richieste Materiali & Campo',
        subtitle: 'Invio ordini prelievo materiali dal cantiere al magazzino',
        keywords: 'richieste materiali cantiere allestimento ddt furgone',
        tab: 'richieste_materiali',
        icon: PackagePlus,
      },
      {
        id: 'nav-presenze',
        category: 'Cantiere & Operazioni',
        title: 'Presenze & Timesheet Cantiere',
        subtitle: 'Timbrature giornaliere operai, verifiche DPI e export LUL paghe',
        keywords: 'presenze timbrature timesheet badge operai ore',
        tab: 'presenze_cantiere',
        icon: HardHat,
      },
      {
        id: 'nav-rol',
        category: 'Cantiere & Operazioni',
        title: 'Rapportini Operativi (ROL)',
        subtitle: 'Rapporti ore lavorate, trasferte, foto cantiere e firma cliente',
        keywords: 'rol rapportini rapporto ore straordinari trasferta firma',
        tab: 'rol',
        icon: Clock,
        badge: `${rols.filter((r) => r.stato === 'inviato').length} da approvare`,
      },
      {
        id: 'nav-lavorazioni',
        category: 'Cantiere & Operazioni',
        title: 'Pianificazione Fasi & WBS',
        subtitle: 'Suddivisione lavorazioni, posa tubi e collaudo CEI 64-8',
        keywords: 'lavorazioni wbs fasi posa cavi collaudo',
        tab: 'lavorazioni',
        icon: CheckSquare,
      },
      {
        id: 'nav-gantt',
        category: 'Cantiere & Operazioni',
        title: 'Gantt & Carico Squadre (PLE)',
        subtitle: 'Cronoprogramma risorse, sovrapposizioni e mezzi di sollevamento',
        keywords: 'gantt cronoprogramma squadre ple furgoni allocazioni',
        tab: 'gantt_squadre',
        icon: Calendar,
      },

      // 2. Logistica & Flotta
      {
        id: 'nav-portale-magazzino',
        category: 'Logistica & Flotta',
        title: 'Portale Magazzino Centrale',
        subtitle: 'Giacenze a scaffale, ubicazioni, sottoscorta e barcode EAN',
        keywords: 'magazzino giacenze scaffale ubicazione cavi',
        tab: 'portale_magazzino',
        icon: Warehouse,
        badge: `${magazzino.filter((m) => m.giacenza <= m.scortaMinima).length} alert`,
      },
      {
        id: 'nav-ordini-fornitori',
        category: 'Logistica & Flotta',
        title: 'Ordini Fornitori (Listino RemaTarlazzi)',
        subtitle: 'Ordini di acquisto ditte fornitrici con codici netti e listini',
        keywords: 'ordini fornitori acquisti rematarlazzi listino furgone',
        tab: 'ordini_fornitori',
        icon: ShoppingCart,
      },
      {
        id: 'nav-ddt',
        category: 'Logistica & Flotta',
        title: 'DDT Trasporto & Spedizioni',
        subtitle: 'Documenti di trasporto DPR 472/96 con scarico magazzino live',
        keywords: 'ddt trasporto spedizioni consegna furgone scarico',
        tab: 'ddt_trasporto',
        icon: Truck,
        badge: `${ddts.filter((d) => d.stato === 'in_viaggio').length} in viaggio`,
      },
      {
        id: 'nav-flotta',
        category: 'Logistica & Flotta',
        title: 'Hub Flotta & Rifornimenti Fuel',
        subtitle: 'Tracciamento km/litro veicoli, carte carburante e tagliandi',
        keywords: 'flotta carburante rifornimenti km furgoni',
        tab: 'powerapps_flotta_asset',
        icon: Fuel,
      },

      // 3. Contabilità & SAL
      {
        id: 'nav-sal',
        category: 'Contabilità & SAL',
        title: 'SAL & Libretto Misure',
        subtitle: 'Stati avanzamento lavori, ritenuta garanzia 0.5% e certificati pagamento',
        keywords: 'sal avanzamento lavori libretto misure garanzia certificato',
        tab: 'sal_cantiere',
        icon: Calculator,
      },
      {
        id: 'nav-preventivi',
        category: 'Contabilità & SAL',
        title: 'Preventivi & Computi',
        subtitle: 'Emissione offerte, computi metrici e conversione in cantiere',
        keywords: 'preventivi offerte computi margine',
        tab: 'preventivi',
        icon: FileSpreadsheet,
      },
      {
        id: 'nav-fatturazione',
        category: 'Contabilità & SAL',
        title: 'Fatturazione Elettronica SDI',
        subtitle: 'Integrazione tracciati XML per cantiere e cessione materiali',
        keywords: 'fatturazione elettronica sdi xml fatturapa',
        tab: 'fatturazione_elettronica',
        icon: FileText,
      },

      // 4. Sicurezza & Compliance
      {
        id: 'nav-sicurezza',
        category: 'Sicurezza & Compliance',
        title: 'Sicurezza & Compliance D.Lgs 81/08',
        subtitle: 'Fascicolo cantiere, DURC, POS, PSC e tesserini di riconoscimento',
        keywords: 'sicurezza durc pos psc visite mediche d.lgs 81 08 tesserini dpi',
        tab: 'sicurezza_cantiere',
        icon: ShieldCheck,
      },
      {
        id: 'nav-scadenziario',
        category: 'Sicurezza & Compliance',
        title: 'Scadenziario Visivo a Semaforo',
        subtitle: 'Scadenze normative DURC, patentini PES/PAV, revisioni e polizze CAR',
        keywords: 'scadenziario semaforo durc patentini revisioni bollo',
        tab: 'scadenziario',
        icon: Clock,
        badge: `${scadenze.length} scadenze`,
      },

      // 5. Azioni Rapide
      {
        id: 'act-flusso',
        category: 'Azioni Rapide',
        title: 'Schema Flusso & Roles Matrix',
        subtitle: 'Visualizza diagramma a blocchi permessi e workflow aziendale',
        keywords: 'schema flusso organigramma ruoli permessi',
        action: () => {
          if (onOpenFlussoCantiere) onOpenFlussoCantiere();
        },
        icon: Sparkles,
      },
      {
        id: 'act-organigramma',
        category: 'Azioni Rapide',
        title: 'Organigramma Aziendale VoltMaster',
        subtitle: 'Mappa 18 dipendenti e mansionario reparti aziendali',
        keywords: 'organigramma dipendenti mansioni staff',
        action: () => {
          if (onOpenOrganigramma) onOpenOrganigramma();
        },
        icon: Users,
      },
    ];

    // Aggiungi risultati dinamici di ricerca per i cantieri reali
    cantieri.forEach((c) => {
      list.push({
        id: `cantiere-${c.id}`,
        category: 'Cantiere & Operazioni',
        title: `Cantiere: ${c.codice} - ${c.titolo}`,
        subtitle: `Cliente: ${c.clienteNome} (${c.citta}) · Avanzamento: ${c.avanzamentoPercentuale}%`,
        keywords: `${c.codice} ${c.titolo} ${c.clienteNome} ${c.citta}`,
        tab: 'cantieri',
        icon: Building2,
        badge: c.stato.toUpperCase(),
      });
    });

    return list;
  }, [cantieri, magazzino, ddts, ordiniInterni, scadenze, rols, onOpenFlussoCantiere, onOpenOrganigramma]);

  // Filtra le voci accessibili in base a ruolo e reparto (RBAC)
  const allowedCommands = useMemo(() => {
    return items.filter((item) => {
      const rule: AccessControlRule = {
        allowedRoles: item.allowedRoles,
        allowedReparti: item.allowedReparti,
        modes: item.modes,
      };
      return isItemVisible(rule, currentUser, interfaceMode);
    });
  }, [items, currentUser, interfaceMode]);

  // Filtraggio live
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allowedCommands.slice(0, 12);
    const q = query.toLowerCase().trim();
    return allowedCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [allowedCommands, query]);

  if (!isOpen) return null;

  const handleSelectItem = (item: CommandItem) => {
    if (item.action) {
      item.action();
    } else if (item.tab) {
      setActiveTab(item.tab);
    }
    onClose();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelectItem(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3 shrink-0">
          <Command className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Cerca qualsiasi funzione, cantiere, ordine, DDT, ROL o scadenziario... (es: 'SAL', 'RemaTarlazzi', 'POS')"
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
            ESC per chiudere
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              Nessun risultato corrispondente a "{query}".
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold truncate text-xs sm:text-sm">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isSelected
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-slate-900 opacity-90' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Usa <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">↓</kbd> per navigare</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono font-bold">INVIO</kbd> per selezionare</span>
          </div>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">VoltMaster Command Palette</span>
        </div>
      </div>
    </div>
  );
};
