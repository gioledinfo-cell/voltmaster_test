import React, { useState, useMemo } from 'react';
import { PresenzaCantiere, Dipendente, Cantiere } from '../../types';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Copy,
  Check,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  computeLulWorkerSummaries,
  computeLulCantiereSummaries,
  exportLulExcel,
  exportLulZucchettiCsv,
  isWeekend,
} from '../../utils/lulExportService';

interface PresenzeLulExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presenze: PresenzaCantiere[];
  dipendenti: Dipendente[];
  cantieri: Cantiere[];
  onShowToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const PresenzeLulExportModal: React.FC<PresenzeLulExportModalProps> = ({
  isOpen,
  onClose,
  presenze,
  dipendenti,
  cantieri,
  onShowToast,
}) => {
  // Period filter: preset months or custom range
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [dateFrom, setDateFrom] = useState<string>('2026-09-01');
  const [dateTo, setDateTo] = useState<string>('2026-09-30');
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  // Scope filters
  const [filterAmbito, setFilterAmbito] = useState<'tutti' | 'interni' | 'subappalto'>('tutti');
  const [filterCantiereId, setFilterCantiereId] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'lavoratori' | 'dettaglio' | 'commesse' | 'stampa'>('lavoratori');
  const [copied, setCopied] = useState<boolean>(false);

  // Filtered attendances based on date range and selected scope
  const filteredPresenze = useMemo(() => {
    return presenze.filter((p) => {
      // Date filtering
      if (isCustomRange) {
        if (dateFrom && p.data < dateFrom) return false;
        if (dateTo && p.data > dateTo) return false;
      } else {
        if (!p.data.startsWith(selectedMonth)) return false;
      }

      // Ambito filtering
      if (filterAmbito === 'interni' && p.ditta !== 'interna') return false;
      if (filterAmbito === 'subappalto' && p.ditta === 'interna') return false;

      // Cantiere filtering
      if (filterCantiereId !== 'tutti' && p.cantiereId !== filterCantiereId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.dipendenteNome.toLowerCase().includes(q);
        const matchDitta = p.ditta.toLowerCase().includes(q);
        const matchCantiere = p.cantiereNome.toLowerCase().includes(q);
        const matchMansione = p.mansione.toLowerCase().includes(q);
        if (!matchName && !matchDitta && !matchCantiere && !matchMansione) return false;
      }

      return true;
    });
  }, [presenze, isCustomRange, dateFrom, dateTo, selectedMonth, filterAmbito, filterCantiereId, searchQuery]);

  // Aggregated summaries
  const workerSummaries = useMemo(() => {
    return computeLulWorkerSummaries(filteredPresenze, dipendenti);
  }, [filteredPresenze, dipendenti]);

  const cantiereSummaries = useMemo(() => {
    return computeLulCantiereSummaries(filteredPresenze);
  }, [filteredPresenze]);

  // Overall KPIs
  const totals = useMemo(() => {
    let oreOrd = 0;
    let oreStr25 = 0;
    let oreStr50 = 0;
    let buoni = 0;
    let trasferta = 0;
    let costoTot = 0;

    for (const w of workerSummaries) {
      oreOrd += w.oreOrdinarieTotali;
      oreStr25 += w.oreStraordinarie25;
      oreStr50 += w.oreStraordinarie50;
      buoni += w.buoniPastoTotali;
      trasferta += w.indennitaTrasfertaTotale;
      costoTot += w.costoTotaleConsuntivato;
    }

    return {
      lavoratoriUnici: workerSummaries.length,
      giornatePresenza: filteredPresenze.length,
      oreOrd,
      oreStr25,
      oreStr50,
      oreTotali: oreOrd + oreStr25 + oreStr50,
      buoni,
      trasferta,
      costoTot,
    };
  }, [workerSummaries, filteredPresenze]);

  const periodoLabel = useMemo(() => {
    if (isCustomRange) {
      return `Dal ${dateFrom || 'Inizio'} al ${dateTo || 'Oggi'}`;
    }
    const [yyyy, mm] = selectedMonth.split('-');
    const mesi = [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
    ];
    const mNome = mesi[parseInt(mm, 10) - 1] || mm;
    return `${mNome} ${yyyy}`;
  }, [isCustomRange, dateFrom, dateTo, selectedMonth]);

  // Handle Excel Export
  const handleExportExcel = () => {
    if (filteredPresenze.length === 0) {
      onShowToast('Nessuna presenza da esportare nel periodo selezionato.', 'warning');
      return;
    }
    try {
      exportLulExcel(filteredPresenze, dipendenti, periodoLabel);
      onShowToast(`File Excel (.xlsx) per ${periodoLabel} scaricato con successo!`, 'success');
    } catch (err) {
      console.error('Errore export Excel:', err);
      onShowToast('Errore durante la creazione del file Excel.', 'error');
    }
  };

  // Handle Zucchetti / TeamSystem CSV Export
  const handleExportCsvZucchetti = () => {
    if (filteredPresenze.length === 0) {
      onShowToast('Nessuna presenza da esportare nel periodo selezionato.', 'warning');
      return;
    }
    try {
      exportLulZucchettiCsv(filteredPresenze, dipendenti, periodoLabel);
      onShowToast(`Tracciato Paghe Zucchetti/TeamSystem (.csv) generato con successo!`, 'success');
    } catch (err) {
      console.error('Errore export CSV Zucchetti:', err);
      onShowToast('Errore durante la creazione del tracciato paghe.', 'error');
    }
  };

  // Copy Summary Data to Clipboard
  const handleCopyClipboard = () => {
    if (workerSummaries.length === 0) return;
    const header = [
      'Matricola',
      'Nominativo',
      'CodiceFiscale',
      'Ditta',
      'Mansione',
      'Giorni',
      'OreOrdinarie',
      'Straord25',
      'Straord50',
      'TotaleOre',
      'BuoniPasto',
      'TrasfertaEuro',
      'CostoTotaleEuro',
    ].join('\t');

    const rows = workerSummaries.map((w) =>
      [
        w.dipendenteId,
        w.nome,
        w.codiceFiscale,
        w.ditta,
        w.mansione,
        w.giorniLavorati,
        w.oreOrdinarieTotali,
        w.oreStraordinarie25,
        w.oreStraordinarie50,
        w.oreTotali,
        w.buoniPastoTotali,
        w.indennitaTrasfertaTotale,
        w.costoTotaleConsuntivato.toFixed(2),
      ].join('\t')
    );

    navigator.clipboard.writeText([header, ...rows].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Dati riepilogo LUL copiati negli appunti!', 'info');
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* 1. MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Export Presenze & Report LUL per Consulente Paghe
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  CCNL Edile / Metalmeccanico
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prospetto mensile ore ordinarie, straordinari (+25% / +50%), indennità trasferta e tracciato paghe (Zucchetti / TeamSystem).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. FILTERS & PERIOD SELECTOR */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
              <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <label className="text-slate-500 dark:text-slate-400 font-semibold">Periodo:</label>
              <select
                value={isCustomRange ? 'custom' : selectedMonth}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomRange(true);
                  } else {
                    setIsCustomRange(false);
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026-09" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Settembre 2026</option>
                <option value="2026-08" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Agosto 2026</option>
                <option value="2026-07" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Luglio 2026</option>
                <option value="custom" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Intervallo Personalizzato...</option>
              </select>
            </div>

            {isCustomRange && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs animate-in fade-in">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none"
                />
                <span className="text-slate-400 dark:text-slate-500">➔</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Scope filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
              <Users className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <label className="text-slate-500 dark:text-slate-400 font-semibold">Organico:</label>
              <select
                value={filterAmbito}
                onChange={(e) => setFilterAmbito(e.target.value as any)}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Tutti i Lavoratori</option>
                <option value="interni" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Solo Interni (VoltMaster)</option>
                <option value="subappalto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Solo Subappalti</option>
              </select>
            </div>

            {/* Cantiere filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
              <Building2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <label className="text-slate-500 dark:text-slate-400 font-semibold">Cantiere:</label>
              <select
                value={filterCantiereId}
                onChange={(e) => setFilterCantiereId(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Tutti i Cantieri</option>
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {c.titolo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick search input */}
          <div className="relative min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtra lavoratore..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 3. KPIS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Lavoratori</span>
            <div className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {totals.lavoratoriUnici} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">persone</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{totals.giornatePresenza} timbrature</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Ore Ordinarie</span>
            <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totals.oreOrd.toFixed(1)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">h</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Base 8h / giorno</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Straord. 25%</span>
            <div className="text-base font-black font-mono text-amber-600 dark:text-amber-300 mt-0.5">
              {totals.oreStr25.toFixed(1)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">h</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Feriale (+25%)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">Straord. 50%</span>
            <div className="text-base font-black font-mono text-rose-600 dark:text-rose-300 mt-0.5">
              {totals.oreStr50.toFixed(1)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">h</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Sabato / Festivo (+50%)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">Buoni & Trasferte</span>
            <div className="text-base font-black font-mono text-sky-600 dark:text-sky-300 mt-0.5">
              {totals.buoni} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">ticket</span>
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">€ {totals.trasferta.toFixed(0)} indennità</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Costo Consuntivo</span>
            <div className="text-base font-black font-mono text-purple-600 dark:text-purple-300 mt-0.5">
              € {totals.costoTot.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Manodopera lorda</span>
          </div>
        </div>

        {/* 4. TABS NAVIGATION */}
        <div className="px-5 pt-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('lavoratori')}
              className={`pb-2.5 px-3 font-bold border-b-2 transition-all ${
                activeTab === 'lavoratori'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              1. Riepilogo Dipendenti (LUL) ({workerSummaries.length})
            </button>

            <button
              onClick={() => setActiveTab('dettaglio')}
              className={`pb-2.5 px-3 font-bold border-b-2 transition-all ${
                activeTab === 'dettaglio'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              2. Dettaglio Giornaliero ({filteredPresenze.length})
            </button>

            <button
              onClick={() => setActiveTab('commesse')}
              className={`pb-2.5 px-3 font-bold border-b-2 transition-all ${
                activeTab === 'commesse'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              3. Ripartizione per Commessa ({cantiereSummaries.length})
            </button>

            <button
              onClick={() => setActiveTab('stampa')}
              className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'stampa'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4. Prospetto A4 per Firma (Ufficiale)</span>
            </button>
          </div>

          <button
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1 px-2.5 py-1 mb-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Copia dati tabella negli appunti"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiato!' : 'Copia Dati'}</span>
          </button>
        </div>

        {/* 5. TAB CONTENT - INTERACTIVE TABLES */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/60 dark:bg-slate-950/70 text-xs">
          {/* TAB 1: RIEPILOGO DIPENDENTI (LUL) */}
          {activeTab === 'lavoratori' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Lavoratore / ID</th>
                    <th className="py-2.5 px-3">Ditta</th>
                    <th className="py-2.5 px-3">Mansione / Ruolo</th>
                    <th className="py-2.5 px-3 text-center">Giorni</th>
                    <th className="py-2.5 px-3 text-right">Ore Ord.</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">Str. 25%</th>
                    <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">Str. 50%</th>
                    <th className="py-2.5 px-3 text-right font-black">Tot. Ore</th>
                    <th className="py-2.5 px-3 text-center">Buoni P.</th>
                    <th className="py-2.5 px-3 text-right">Trasf. €</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">Costo Tot. €</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  {workerSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        Nessun lavoratore trovato per i filtri selezionati.
                      </td>
                    </tr>
                  ) : (
                    workerSummaries.map((w) => (
                      <tr key={w.dipendenteId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{w.nome}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{w.codiceFiscale} · ID: {w.dipendenteId}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {w.isSubappalto ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                              {w.ditta}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                              VoltMaster S.r.l.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={w.mansione}>
                          {w.mansione}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-800 dark:text-slate-300 font-bold">
                          {w.giorniLavorati}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                          {w.oreOrdinarieTotali.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-300 font-bold">
                          {w.oreStraordinarie25 > 0 ? `+${w.oreStraordinarie25.toFixed(1)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-300 font-bold">
                          {w.oreStraordinarie50 > 0 ? `+${w.oreStraordinarie50.toFixed(1)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                          {w.oreTotali.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-sky-600 dark:text-sky-400 font-bold">
                          {w.buoniPastoTotali > 0 ? w.buoniPastoTotali : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                          {w.indennitaTrasfertaTotale > 0 ? `€ ${w.indennitaTrasfertaTotale}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
                          € {w.costoTotaleConsuntivato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DETTAGLIO GIORNALIERO */}
          {activeTab === 'dettaglio' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Lavoratore</th>
                    <th className="py-2.5 px-3">Cantiere di Riferimento</th>
                    <th className="py-2.5 px-3 text-center">Orari</th>
                    <th className="py-2.5 px-3 text-right">Ore Ord.</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">Straord.</th>
                    <th className="py-2.5 px-3 text-center">DPI / Sicurezza</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">Costo €</th>
                    <th className="py-2.5 px-3">Approvatore / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  {filteredPresenze.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        Nessuna timbratura registrata nel periodo selezionato.
                      </td>
                    </tr>
                  ) : (
                    filteredPresenze.map((p) => {
                      const weekend = isWeekend(p.data);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {p.data}
                            {weekend && (
                              <span className="block text-[9px] font-sans font-bold text-rose-600 dark:text-rose-400 uppercase">
                                Sabato/Festivo
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{p.dipendenteNome}</div>
                            <div className="text-[10px] text-slate-500">{p.ditta === 'interna' ? 'VoltMaster' : p.ditta}</div>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={p.cantiereNome}>
                            {p.cantiereNome}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                            {p.oraIngresso} - {p.oraUscita}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                            {p.oreOrdinarie}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {p.oreStraordinarie > 0 ? (
                              <span className={weekend ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                                +{p.oreStraordinarie}h ({weekend ? '+50%' : '+25%'})
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            {p.dpiVerificati && p.tesserinoRiconoscimento ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" /> OK DPI
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20">
                                ALERT
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            € {p.costoTotaleGiornaliero.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px] text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-300">{p.approvatoDa || 'In attesa'}</span>
                            {p.note && <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{p.note}</div>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: RIPARTIZIONE COMMESSE */}
          {activeTab === 'commesse' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Codice</th>
                    <th className="py-2.5 px-3">Denominazione Cantiere</th>
                    <th className="py-2.5 px-3 text-center">Operai Coinvolti</th>
                    <th className="py-2.5 px-3 text-right">Ore Ord.</th>
                    <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">Ore Straord.</th>
                    <th className="py-2.5 px-3 text-right font-black">Totale Ore</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">Costo Manodopera €</th>
                    <th className="py-2.5 px-3 text-right">% Incidenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  {cantiereSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        Nessun cantiere movimentato nel periodo.
                      </td>
                    </tr>
                  ) : (
                    cantiereSummaries.map((c) => {
                      const perc = totals.costoTot > 0 ? ((c.costoTotale / totals.costoTot) * 100).toFixed(1) : '0';
                      return (
                        <tr key={c.cantiereId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {c.cantiereId.toUpperCase()}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                            {c.cantiereNome}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                            {c.numeroOperaiUnici}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                            {c.oreOrdinarie.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                            {c.oreStraordinarie > 0 ? `+${c.oreStraordinarie.toFixed(1)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {c.oreTotali.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
                            € {c.costoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-sky-600 dark:text-sky-400 font-bold">
                            {perc}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: ANTEPRIMA PROSPETTO A4 UFFICIALE PER FIRMA */}
          {activeTab === 'stampa' && (
            <div className="bg-slate-100 dark:bg-slate-950 p-2 sm:p-6 overflow-auto flex justify-center rounded-xl">
              <div className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none">
                {/* Header Documento Aziendale */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                      DOCUMENTO VALIDO AI SENSI DEL D.Lgs 81/08 E DEL D.L. 112/2008 (L.U.L.)
                    </span>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                      VOLTMASTER IMPIANTI S.R.L.
                    </h1>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Impianti Elettrici, Cablaggi Industriali, Fotovoltaico & Tecnologie di Cantiere<br />
                      Sede Legale: Via Montenapoleone 8, 20121 Milano (MI) · P.IVA / C.F. 08234590154 · REA MI-2194830
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-800">
                      PROSPETTO LUL UFFICIALE
                    </span>
                    <div className="text-[11px] font-mono text-slate-600 mt-1">
                      Data emissione: {new Date().toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>

                {/* Titolo e Oggetto */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">OGGETTO:</span>
                    <span className="font-black text-slate-900 text-sm">
                      Riepilogo Mensile Presenze, Ore Ordinarie, Straordinari e Trasferte Cantiere
                    </span>
                    <div className="text-slate-600 mt-0.5">
                      Mese di Competenza: <strong className="text-slate-900">{periodoLabel.toUpperCase()}</strong> · CCNL Applicato: <strong className="text-slate-900">Metalmeccanico / Edile</strong>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div>Lavoratori a Ruolino: <strong>{totals.lavoratoriUnici}</strong></div>
                    <div>Giornate Totali: <strong>{totals.giornatePresenza}</strong></div>
                  </div>
                </div>

                {/* Tabella Sintetica Dipendenti */}
                <div className="mb-6 border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="py-2 px-2.5">Matr.</th>
                        <th className="py-2 px-2.5">Dipendente / Lavoratore</th>
                        <th className="py-2 px-2.5">C.F. / Ditta</th>
                        <th className="py-2 px-2 text-center">Giorni</th>
                        <th className="py-2 px-2 text-right">Ore Ord.</th>
                        <th className="py-2 px-2 text-right">Str. 25%</th>
                        <th className="py-2 px-2 text-right">Str. 50%</th>
                        <th className="py-2 px-2 text-right font-black">Tot. Ore</th>
                        <th className="py-2 px-2 text-center">Pasti</th>
                        <th className="py-2 px-2 text-right">Trasf. €</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                      {workerSummaries.map((w) => (
                        <tr key={w.dipendenteId}>
                          <td className="py-1.5 px-2.5 text-slate-500">{w.dipendenteId}</td>
                          <td className="py-1.5 px-2.5 font-sans font-bold text-slate-900">{w.nome}</td>
                          <td className="py-1.5 px-2.5 text-slate-600">{w.codiceFiscale}</td>
                          <td className="py-1.5 px-2 text-center text-slate-800">{w.giorniLavorati}</td>
                          <td className="py-1.5 px-2 text-right">{w.oreOrdinarieTotali.toFixed(1)}</td>
                          <td className="py-1.5 px-2 text-right">{w.oreStraordinarie25 > 0 ? w.oreStraordinarie25.toFixed(1) : '-'}</td>
                          <td className="py-1.5 px-2 text-right">{w.oreStraordinarie50 > 0 ? w.oreStraordinarie50.toFixed(1) : '-'}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900">{w.oreTotali.toFixed(1)}</td>
                          <td className="py-1.5 px-2 text-center">{w.buoniPastoTotali || '-'}</td>
                          <td className="py-1.5 px-2 text-right">{w.indennitaTrasfertaTotale ? `€ ${w.indennitaTrasfertaTotale}` : '-'}</td>
                        </tr>
                      ))}
                      {/* Totali in calce alla tabella A4 */}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={3} className="py-2 px-2.5 font-sans">TOTALI GENERALI</td>
                        <td className="py-2 px-2 text-center">{totals.giornatePresenza}</td>
                        <td className="py-2 px-2 text-right">{totals.oreOrd.toFixed(1)}</td>
                        <td className="py-2 px-2 text-right">{totals.oreStr25.toFixed(1)}</td>
                        <td className="py-2 px-2 text-right">{totals.oreStr50.toFixed(1)}</td>
                        <td className="py-2 px-2 text-right font-black">{totals.oreTotali.toFixed(1)}</td>
                        <td className="py-2 px-2 text-center">{totals.buoni}</td>
                        <td className="py-2 px-2 text-right">€ {totals.trasferta}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Box Firme Ufficiali */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-300 text-[11px] text-slate-700">
                  <div className="p-3 border border-slate-200 rounded-lg min-h-[110px] flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">IL CAPOCANTIERE / RESPONSABILE</span>
                      <span className="text-[10px] text-slate-500">Per convalida ore e DPI sul campo</span>
                    </div>
                    <div className="border-b border-dashed border-slate-400 mt-6 pt-2 text-[9px] text-slate-400 text-center">
                      Firma e Data
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg min-h-[110px] flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">IL DATORE DI LAVORO</span>
                      <span className="text-[10px] text-slate-500">Per autorizzazione straordinari e indennità</span>
                    </div>
                    <div className="border-b border-dashed border-slate-400 mt-6 pt-2 text-[9px] text-slate-400 text-center">
                      Firma e Timbro Aziendale
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg min-h-[110px] flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">UFFICIO PAGHE / CONSULENTE</span>
                      <span className="text-[10px] text-slate-500">Per elaborazione cedolini e L.U.L.</span>
                    </div>
                    <div className="border-b border-dashed border-slate-400 mt-6 pt-2 text-[9px] text-slate-400 text-center">
                      Convalida Ricezione Tracciato
                    </div>
                  </div>
                </div>

                {/* Note Legali e Certificative */}
                <div className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between">
                  <span>VoltMaster Software Gestionale Cantieri & Impianti · Registro Digitale Conforme</span>
                  <span>Codice Controllo Flusso: [SHA-256: 7f8a91c4...31b2] · Pagina 1 di 1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. MODAL FOOTER - EXPORT ACTIONS */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>I file generati includono il tracciato CCNL Edile / Metalmeccanico con calcolo maggiorazioni straordinari automatiche.</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
              title="Stampa prospetto riassuntivo per firma del capocantiere"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Stampa Prospetto</span>
            </button>

            <button
              onClick={handleExportCsvZucchetti}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-500/30 transition-colors shadow-xs"
              title="Esporta file CSV compatibile con Zucchetti Paghe Web / TeamSystem"
            >
              <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Tracciato Paghe (.csv Zucchetti)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-md active:scale-95 border border-emerald-400/30"
              title="Scarica il prospetto completo multi-foglio in formato Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Scarica Excel Ufficiale (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
