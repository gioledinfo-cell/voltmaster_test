import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  FileText,
  Wrench,
  Truck,
  Users,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import {
  ScadenzaItem,
  CategoriaScadenza,
  SemaforoStato,
  calcolaSemaforoScadenza,
  getBadgeColorSemaforo,
} from '../../types/scadenze';
import { ScadenzaRinnovoModal } from './ScadenzaRinnovoModal';
import { ScadenzaFormModal } from './ScadenzaFormModal';
import { ScadenzaDetailModal } from './ScadenzaDetailModal';
import { ScadenziarioPrintModal } from './ScadenziarioPrintModal';
import { exportScadenziarioExcel } from '../../utils/scadenzeExportService';

export const ScadenziarioModule: React.FC = () => {
  const {
    scadenze,
    addScadenza,
    rinnovaScadenza,
    deleteScadenza,
    notifiche,
    segnaTutteNotificheLette,
    showToast,
  } = useApp();

  // Filtri e visualizzazione
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaScadenza | 'tutte'>('tutte');
  const [filtroSemaforo, setFiltroSemaforo] = useState<SemaforoStato | 'tutti'>('tutti');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modali attive
  const [scadenzaForDetail, setScadenzaForDetail] = useState<ScadenzaItem | null>(null);
  const [scadenzaForRinnovo, setScadenzaForRinnovo] = useState<ScadenzaItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Calcola semaforo per tutte le scadenze
  const scadenzeConSemaforo = useMemo(() => {
    return scadenze.map((s) => {
      const calc = calcolaSemaforoScadenza(s.dataScadenza);
      const badge = getBadgeColorSemaforo(calc.stato);
      return {
        ...s,
        calc,
        badge,
      };
    });
  }, [scadenze]);

  // Conteggi KPI Semaforo
  const kpiStats = useMemo(() => {
    const scaduti = scadenzeConSemaforo.filter((s) => s.calc.stato === 'scaduto');
    const urgenti15 = scadenzeConSemaforo.filter((s) => s.calc.stato === 'urgente_15gg');
    const attenzione30 = scadenzeConSemaforo.filter((s) => s.calc.stato === 'attenzione_30gg');
    const regolari = scadenzeConSemaforo.filter((s) => s.calc.stato === 'regolare');

    return {
      totale: scadenze.length,
      scaduti: scaduti.length,
      urgenti15: urgenti15.length,
      attenzione30: attenzione30.length,
      regolari: regolari.length,
    };
  }, [scadenzeConSemaforo, scadenze.length]);

  // Filtraggio lista
  const filteredScadenze = useMemo(() => {
    return scadenzeConSemaforo.filter((item) => {
      // Filtro categoria
      if (filtroCategoria !== 'tutte' && item.categoria !== filtroCategoria) {
        return false;
      }

      // Filtro semaforo
      if (filtroSemaforo !== 'tutti' && item.calc.stato !== filtroSemaforo) {
        return false;
      }

      // Ricerca full-text
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.titolo.toLowerCase().includes(query);
        const matchSoggetto = item.soggetto.toLowerCase().includes(query);
        const matchRuolo = item.ruoloORipartizione?.toLowerCase().includes(query);
        const matchProt = item.protocolloONumero?.toLowerCase().includes(query);
        const matchNote = item.note?.toLowerCase().includes(query);
        if (!matchTitle && !matchSoggetto && !matchRuolo && !matchProt && !matchNote) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => a.calc.giorniRimanenti - b.calc.giorniRimanenti);
  }, [scadenzeConSemaforo, filtroCategoria, filtroSemaforo, searchTerm]);

  // Gestione Icona Categoria
  const getCategoryIcon = (cat: CategoriaScadenza) => {
    switch (cat) {
      case 'durc':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'taratura_cei64':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'revisione_veicoli':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'patentini_sicurezza':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'cantieri_sicurezza':
      default:
        return <Building2 className="w-4 h-4 text-rose-400" />;
    }
  };

  const getCategoryLabel = (cat: CategoriaScadenza) => {
    switch (cat) {
      case 'durc':
        return 'DURC & Regolarità';
      case 'taratura_cei64':
        return 'Strumenti CEI 64-8';
      case 'revisione_veicoli':
        return 'Revisioni & Flotta';
      case 'patentini_sicurezza':
        return 'Patentini & Personale';
      case 'cantieri_sicurezza':
      default:
        return 'Cantieri & POS';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs dark:shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                D.Lgs 81/08 · CEI 64-8 · CEI 11-27 · MCTC
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {scadenze.length} voci sotto monitoraggio
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                <Bell className="w-5 h-5" />
              </span>
              Centro Notifiche & Scadenziario Visivo a Semaforo
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Sistema di controllo tempestivo e semaforico per{' '}
              <strong className="text-slate-800 dark:text-slate-200">DURC aziendale e subappalti</strong>,{' '}
              <strong className="text-slate-800 dark:text-slate-200">tarature strumenti CEI 64-8 Accredia</strong>,{' '}
              <strong className="text-slate-800 dark:text-slate-200">revisioni furgoni e polizze</strong>, e{' '}
              <strong className="text-slate-800 dark:text-slate-200">patentini PES/PAV e visite mediche 81/08</strong>,
              con allerte preventive a 30gg e 15gg per la massima continuità operativa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => exportScadenziarioExcel(scadenze)}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Scarica Registro Completo in formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Esporta Excel</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Stampa Registro Ufficiale per RSPP / Datore di Lavoro"
            >
              <Printer className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Stampa Registro A4</span>
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Scadenza</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Semaforo KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* SEMAFORO ROSSO: SCADUTO */}
        <button
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'scaduto' ? 'tutti' : 'scaduto')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            filtroSemaforo === 'scaduto'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                🔴 SCADUTO
              </span>
            </div>
            <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
              Blocco Operativo
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {kpiStats.scaduti}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
              {filtroSemaforo === 'scaduto' ? 'Filtro attivo ✓' : 'Clicca per filtrare'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            DURC subappalto, Fluke 435, PLE Ghezzi
          </p>
        </button>

        {/* SEMAFORO ARANCIONE: URGENTE <= 15 GG */}
        <button
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'urgente_15gg' ? 'tutti' : 'urgente_15gg')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            filtroSemaforo === 'urgente_15gg'
              ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/40 shadow-lg shadow-orange-950/50'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-orange-700 dark:text-orange-300">
                🟠 ALERT 15 GG
              </span>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">
              Urgente
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400">
              {kpiStats.urgenti15}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
              {filtroSemaforo === 'urgente_15gg' ? 'Filtro attivo ✓' : 'Clicca per filtrare'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            DURC VoltMaster (12gg), Pinza F407, PES/PAV Bianchi
          </p>
        </button>

        {/* SEMAFORO GIALLO: ATTENZIONE <= 30 GG */}
        <button
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'attenzione_30gg' ? 'tutti' : 'attenzione_30gg')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            filtroSemaforo === 'attenzione_30gg'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                🟡 ALERT 30 GG
              </span>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              Pianificazione
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {kpiStats.attenzione30}
            </span>
            <span className="text-[11px] text-slate-400 group-hover:text-amber-300 transition-colors">
              {filtroSemaforo === 'attenzione_30gg' ? 'Filtro attivo ✓' : 'Clicca per filtrare'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            Revisione Daily (29gg), Flir E6, Visita Riva
          </p>
        </button>

        {/* SEMAFORO VERDE: REGOLARE */}
        <button
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'regolare' ? 'tutti' : 'regolare')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            filtroSemaforo === 'regolare'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                🟢 REGOLARE
              </span>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              Conforme
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {kpiStats.regolari}
            </span>
            <span className="text-[11px] text-slate-400 group-hover:text-emerald-300 transition-colors">
              {filtroSemaforo === 'regolare' ? 'Filtro attivo ✓' : 'Clicca per filtrare'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            HT Combi G3, Ford Transit, DURC Schneider
          </p>
        </button>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per risorsa, dipendente, targa, strumento CEI 64-8, DURC, protocollo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Semaforo quick pill dropdown or button group */}
          <div className="flex items-center gap-2">
            <select
              value={filtroSemaforo}
              onChange={(e) => setFiltroSemaforo(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="tutti">Tutti i Semafori</option>
              <option value="scaduto">🔴 Solo Scaduti (Critici)</option>
              <option value="urgente_15gg">🟠 Alert 15 Giorni</option>
              <option value="attenzione_30gg">🟡 Alert 30 Giorni</option>
              <option value="regolare">🟢 Regolari</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Vista Tabella"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Vista a Griglia"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider pr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Categoria:
          </span>

          <button
            onClick={() => setFiltroCategoria('tutte')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filtroCategoria === 'tutte'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Tutte ({scadenze.length})
          </button>

          <button
            onClick={() => setFiltroCategoria('durc')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroCategoria === 'durc'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>DURC & Regolarità</span>
          </button>

          <button
            onClick={() => setFiltroCategoria('taratura_cei64')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroCategoria === 'taratura_cei64'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Strumenti CEI 64-8</span>
          </button>

          <button
            onClick={() => setFiltroCategoria('revisione_veicoli')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroCategoria === 'revisione_veicoli'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Revisioni & Flotta Mezzi</span>
          </button>

          <button
            onClick={() => setFiltroCategoria('patentini_sicurezza')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroCategoria === 'patentini_sicurezza'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Patentini & Personale 81/08</span>
          </button>

          <button
            onClick={() => setFiltroCategoria('cantieri_sicurezza')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtroCategoria === 'cantieri_sicurezza'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cantieri, POS & CAR</span>
          </button>
        </div>
      </div>

      {/* 4. Content Area (Table or Grid) */}
      {filteredScadenze.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">
            Nessuna scadenza trovata con i filtri applicati
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Prova a modificare i filtri semaforici o il termine di ricerca per visualizzare altre voci.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFiltroCategoria('tutte');
              setFiltroSemaforo('tutti');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            Azzera Filtri
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  <th className="py-3.5 px-4 w-36">Semaforo</th>
                  <th className="py-3.5 px-4">Adempimento & Oggetto</th>
                  <th className="py-3.5 px-4">Risorsa Coinvolta</th>
                  <th className="py-3.5 px-4 text-center">Data Scadenza</th>
                  <th className="py-3.5 px-4">Protocollo / Attestato</th>
                  <th className="py-3.5 px-4">Ente / Laboratorio</th>
                  <th className="py-3.5 px-4 text-right">Azioni Rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredScadenze.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-850/60 transition-colors group ${
                      item.calc.stato === 'scaduto'
                        ? 'bg-rose-950/15'
                        : item.calc.stato === 'urgente_15gg'
                        ? 'bg-orange-950/10'
                        : ''
                    }`}
                  >
                    {/* Semaforo Badge */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${item.badge.bg} ${item.badge.border} ${item.badge.text}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${item.badge.iconBg} ${
                              item.calc.stato === 'scaduto' || item.calc.stato === 'urgente_15gg'
                                ? 'animate-pulse'
                                : ''
                            }`}
                          />
                          {item.badge.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            item.calc.giorniRimanenti < 0
                              ? 'text-rose-400'
                              : item.calc.giorniRimanenti <= 15
                              ? 'text-orange-400'
                              : item.calc.giorniRimanenti <= 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.calc.giorniRimanenti < 0
                            ? `-${Math.abs(item.calc.giorniRimanenti)} gg (scaduto)`
                            : `tra ${item.calc.giorniRimanenti} gg`}
                        </span>
                      </div>
                    </td>

                    {/* Titolo e Categoria */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
                          {getCategoryIcon(item.categoria)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {getCategoryLabel(item.categoria)}
                        </span>
                      </div>
                      <h4
                        onClick={() => setScadenzaForDetail(item)}
                        className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors cursor-pointer leading-snug"
                      >
                        {item.titolo}
                      </h4>
                      {item.note && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm">
                          {item.note}
                        </p>
                      )}
                    </td>

                    {/* Soggetto */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{item.soggetto}</div>
                      {item.ruoloORipartizione && (
                        <div className="text-[10px] text-amber-400 font-mono">
                          {item.ruoloORipartizione}
                        </div>
                      )}
                    </td>

                    {/* Data Scadenza */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-extrabold text-slate-200 text-xs">
                        {item.dataScadenza}
                      </span>
                      {item.dataUltimoRinnovo && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ultimo: {item.dataUltimoRinnovo}
                        </div>
                      )}
                    </td>

                    {/* Protocollo */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.protocolloONumero ? (
                        <span className="bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400">
                          {item.protocolloONumero}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Non registrato</span>
                      )}
                    </td>

                    {/* Ente */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="truncate block max-w-[140px]" title={item.enteRilascio}>
                        {item.enteRilascio || '-'}
                      </span>
                    </td>

                    {/* Azioni Rapide */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setScadenzaForRinnovo(item)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Rinnova scadenza con nuova data"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Rinnova</span>
                        </button>

                        <button
                          onClick={() => setScadenzaForDetail(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          title="Dettaglio completo e sollecito"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredScadenze.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                item.calc.stato === 'scaduto'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/50 hover:border-rose-400'
                  : item.calc.stato === 'urgente_15gg'
                  ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-500/50 hover:border-orange-400'
                  : item.calc.stato === 'attenzione_30gg'
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 hover:border-amber-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                {/* Header card with category and badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {getCategoryIcon(item.categoria)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      {getCategoryLabel(item.categoria)}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${item.badge.bg} ${item.badge.border} ${item.badge.text}`}
                  >
                    {item.badge.label}
                  </span>
                </div>

                <h4
                  onClick={() => setScadenzaForDetail(item)}
                  className="font-bold text-slate-900 dark:text-slate-100 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer text-sm leading-snug line-clamp-2"
                >
                  {item.titolo}
                </h4>

                <p className="text-xs font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {item.soggetto} {item.ruoloORipartizione && `· ${item.ruoloORipartizione}`}
                </p>

                {item.note && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                    {item.note}
                  </p>
                )}

                {/* Expiry Details Box */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Scadenza</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.dataScadenza}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tempo Rimanente</span>
                    <span
                      className={`font-mono font-bold ${
                        item.calc.giorniRimanenti < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : item.calc.giorniRimanenti <= 15
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.calc.giorniRimanenti < 0
                        ? `Scaduto (${Math.abs(item.calc.giorniRimanenti)}gg)`
                        : `${item.calc.giorniRimanenti} giorni`}
                    </span>
                  </div>
                </div>

                {item.protocolloONumero && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between mb-3">
                    <span>Protocollo / N°:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {item.protocolloONumero}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => setScadenzaForDetail(item)}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Dettagli
                </button>

                <button
                  onClick={() => setScadenzaForRinnovo(item)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rinnova</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Modal Rinnovo */}
      {scadenzaForRinnovo && (
        <ScadenzaRinnovoModal
          scadenza={scadenzaForRinnovo}
          onClose={() => setScadenzaForRinnovo(null)}
          onConfirm={(id, nuovaData, note, nuovoProt, costo) => {
            rinnovaScadenza(id, nuovaData, note, nuovoProt, costo);
          }}
        />
      )}

      {/* 2. Modal Dettaglio & Sollecito */}
      {scadenzaForDetail && (
        <ScadenzaDetailModal
          scadenza={scadenzaForDetail}
          onClose={() => setScadenzaForDetail(null)}
          onOpenRinnovo={(s) => {
            setScadenzaForDetail(null);
            setScadenzaForRinnovo(s);
          }}
        />
      )}

      {/* 3. Modal Nuova Scadenza */}
      {isFormModalOpen && (
        <ScadenzaFormModal
          onClose={() => setIsFormModalOpen(false)}
          onSave={(nuova) => {
            addScadenza(nuova);
          }}
        />
      )}

      {/* 4. Modal Stampa A4 */}
      {isPrintModalOpen && (
        <ScadenziarioPrintModal
          scadenze={filteredScadenze}
          onClose={() => setIsPrintModalOpen(false)}
          filtroCategoria={filtroCategoria}
          filtroSemaforo={filtroSemaforo}
        />
      )}
    </div>
  );
};
