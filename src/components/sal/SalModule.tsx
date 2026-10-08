import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatoAvanzamentoLavori, StatoSAL } from '../../types/sal';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  FileCheck,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowUpRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SalDetailModal } from './SalDetailModal';
import { SalFormModal } from './SalFormModal';
import { CertificatoPagamentoModal } from './CertificatoPagamentoModal';
import { CongruitaManodoperaPanel } from './CongruitaManodoperaPanel';
import { exportSalExcel } from '../../utils/salExportService';
import { exportSalToExcel, exportFullMasterReportToExcel, generateSalPdf } from '../../services/exportService';
import { calcolaCongruitaManodoperaSAL } from '../../services/congruitaService';

export const SalModule: React.FC = () => {
  const {
    cantieri,
    preventivi,
    lavorazioni,
    rols,
    sals,
    addSal,
    updateSal,
    deleteSal,
    approvaSalDL,
    emettiCertificatoPagamento,
    liquidaSal,
    showToast,
  } = useApp();

  // Top sub-tab switcher
  const [activeSalSubTab, setActiveSalSubTab] = useState<'elenco_sal' | 'congruita_dm143'>('elenco_sal');

  // Filters & State
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterCongruita, setFilterCongruita] = useState<'tutti' | 'congrui' | 'non_congrui'>('tutti');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedSalForDetail, setSelectedSalForDetail] = useState<StatoAvanzamentoLavori | null>(null);
  const [selectedSalForCert, setSelectedSalForCert] = useState<StatoAvanzamentoLavori | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [targetCongruitaSalId, setTargetCongruitaSalId] = useState<string>(sals[0]?.id || '');

  // Filtered SALs
  const filteredSals = useMemo(() => {
    return sals.filter((s) => {
      const matchCantiere = selectedCantiereId === 'tutti' || s.cantiereId === selectedCantiereId;
      const matchStato = filterStato === 'tutti' || s.stato === filterStato;
      
      // Congruità check per filter
      let matchCongruita = true;
      if (filterCongruita !== 'tutti') {
        const cCalc = calcolaCongruitaManodoperaSAL(s, rols, 'OG11_OS30', 35.0);
        if (filterCongruita === 'congrui') matchCongruita = cCalc.isCongruo;
        if (filterCongruita === 'non_congrui') matchCongruita = !cCalc.isCongruo;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.codiceSal.toLowerCase().includes(q) ||
        s.cantiereNome.toLowerCase().includes(q) ||
        s.committenteNome.toLowerCase().includes(q) ||
        s.voci.some((v) => v.descrizione.toLowerCase().includes(q));

      return matchCantiere && matchStato && matchCongruita && matchQuery;
    });
  }, [sals, selectedCantiereId, filterStato, filterCongruita, searchQuery, rols]);

  // Overall KPIs
  const kpis = useMemo(() => {
    let totaleContrattuale = 0;
    let totaleCumulato = 0;
    let certificatiDaIncassare = 0;
    let totaleLiquidato = 0;

    const cantieriVisti = new Set<string>();

    for (const s of sals) {
      if (!cantieriVisti.has(s.cantiereId)) {
        totaleContrattuale += s.importoContrattualeTotale;
        cantieriVisti.add(s.cantiereId);
      }

      if (s.certificatoPagamento) {
        if (s.certificatoPagamento.stato === 'pagato') {
          totaleLiquidato += s.certificatoPagamento.totaleLordoLiquidare;
        } else {
          certificatiDaIncassare += s.certificatoPagamento.totaleLordoLiquidare;
        }
      }
    }

    // Calcolo maturato complessivo (somma ultimi SAL per cantiere)
    const ultimoSalPerCantiere = new Map<string, StatoAvanzamentoLavori>();
    sals.forEach((s) => {
      const existing = ultimoSalPerCantiere.get(s.cantiereId);
      if (!existing || s.numeroSal > existing.numeroSal) {
        ultimoSalPerCantiere.set(s.cantiereId, s);
      }
    });

    ultimoSalPerCantiere.forEach((s) => {
      totaleCumulato += s.totaleLavoriCumulati;
    });

    const percMedia =
      totaleContrattuale > 0 ? Math.round((totaleCumulato / totaleContrattuale) * 100) : 0;

    return {
      totaleContrattuale,
      totaleCumulato,
      percMedia,
      certificatiDaIncassare,
      totaleLiquidato,
    };
  }, [sals]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/40 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-500 dark:text-amber-400 mb-1.5 flex-wrap">
              <FileSpreadsheet className="w-4 h-4" />
              <span>D.Lgs 36/2023 · Contabilità di Cantiere & Libretto delle Misure</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>D.M. 143/2021 Congruità Manodopera</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Stato Avanzamento Lavori (S.A.L.) & Congruità Manodopera
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Quantificazione periodica dei lavori eseguiti a corpo e a misura, gestione del libretto delle misure in contraddittorio, certificati di pagamento e verifica automatica della congruità manodopera D.M. 143/2021 per evitare il blocco dei pagamenti.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportSalToExcel(filteredSals)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              title="Esporta elenco SAL in Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Esporta SAL (.XLSX)</span>
            </button>

            <button
              onClick={() => exportFullMasterReportToExcel(cantieri, rols, sals, useApp().ddts)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition-all shadow-xs"
              title="Esporta Report Generale Multi-Foglio (Cantieri, ROL, SAL, DDT)"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Master Excel Audit</span>
            </button>

            <button
              onClick={() => {
                setActiveSalSubTab('congruita_dm143');
                setTargetCongruitaSalId(sals[0]?.id || '');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verifica Congruità D.M. 143</span>
            </button>

            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Emetti Nuovo SAL</span>
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Valore Contratti Attivi
            </span>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
              € {kpis.totaleContrattuale.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Totale commesse</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Lavori Maturati a Oggi
            </span>
            <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400 mt-1">
              € {kpis.totaleCumulato.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-300/80 mt-0.5 block">Cumulato contabile</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Avanzamento Medio
            </span>
            <div className="text-xl font-mono font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {kpis.percMedia}%
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis.percMedia)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Certificati da Incassare
            </span>
            <div className="text-xl font-mono font-black text-sky-600 dark:text-sky-400 mt-1">
              € {kpis.certificatiDaIncassare.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">In attesa pagamento</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Totale Liquidato / Incassato
            </span>
            <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
              € {kpis.totaleLiquidato.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Convalidato da SDI
            </span>
          </div>
        </div>
      </div>

      {/* TOP VIEW SWITCHER (ELENCO SAL VS VERIFICA CONGRUITA DM 143) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 text-xs">
        <button
          onClick={() => setActiveSalSubTab('elenco_sal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            activeSalSubTab === 'elenco_sal'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Elenco SAL & Libretti delle Misure ({sals.length})</span>
        </button>

        <button
          onClick={() => setActiveSalSubTab('congruita_dm143')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            activeSalSubTab === 'congruita_dm143'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Verifica Congruità Manodopera D.M. 143/2021 & CNCE</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/20 text-white">
            DURC Safe
          </span>
        </button>
      </div>

      {/* VIEW 2: FULL CONGRUITA D.M. 143/2021 PANEL */}
      {activeSalSubTab === 'congruita_dm143' && (
        <div className="space-y-4">
          <CongruitaManodoperaPanel
            initialSalId={targetCongruitaSalId || sals[0]?.id}
            onSelectSal={(id) => setTargetCongruitaSalId(id)}
            standalone={true}
          />
        </div>
      )}

      {/* VIEW 1: ELENCO SAL & TABELLA LIBRETTI */}
      {activeSalSubTab === 'elenco_sal' && (
        <>
          {/* Controls & Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Cantiere:</label>
                <select
                  value={selectedCantiereId}
                  onChange={(e) => setSelectedCantiereId(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutti i Cantieri</option>
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {c.codice} - {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <Filter className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <label className="text-slate-600 dark:text-slate-400 font-semibold">Stato Contabile:</label>
                <select
                  value={filterStato}
                  onChange={(e) => setFilterStato(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutti gli Stati</option>
                  <option value="bozza" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Bozza</option>
                  <option value="inviato_dl" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Inviato a D.L.</option>
                  <option value="approvato_dl" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Approvato D.L.</option>
                  <option value="certificato_emesso" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Certificato Emesso</option>
                  <option value="liquidato" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Liquidato / Incassato</option>
                </select>
              </div>

              {/* Congruità D.M. 143/2021 Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <label className="text-slate-600 dark:text-slate-400 font-semibold">D.M. 143/2021:</label>
                <select
                  value={filterCongruita}
                  onChange={(e) => setFilterCongruita(e.target.value as any)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutte le Congruità</option>
                  <option value="congrui" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">✓ Congrui &gt;= 14% (CNCE Sbloccati)</option>
                  <option value="non_congrui" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">⚠ Non Congrui &lt; 14% (Rischio Blocco)</option>
                </select>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca SAL, cantiere o tariffa..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* SAL Cards List */}
          <div className="space-y-4">
            {filteredSals.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-12 text-center text-slate-500">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-40 text-amber-500" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Nessuno Stato Avanzamento Lavori trovato</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Nessun SAL corrisponde ai filtri selezionati. Clicca su "Emetti Nuovo SAL" per crearne uno.
                </p>
              </div>
            ) : (
              filteredSals.map((sal) => {
                const cp = sal.certificatoPagamento;
                const congruitaSal = calcolaCongruitaManodoperaSAL(sal, rols, 'OG11_OS30', 35.0);

                return (
                  <div
                    key={sal.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info & Site */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {sal.codiceSal}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                            {sal.cantiereNome}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sal.stato === 'liquidato'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : sal.stato === 'certificato_emesso'
                                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                                : sal.stato === 'approvato_dl'
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {sal.stato.replace(/_/g, ' ')}
                          </span>

                          {/* D.M. 143/2021 Congruità Status Badge */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetCongruitaSalId(sal.id);
                              setActiveSalSubTab('congruita_dm143');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono border transition-all cursor-pointer ${
                              congruitaSal.isCongruo
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100 animate-pulse'
                            }`}
                            title="Verifica Congruità Manodopera D.M. 143/2021 (OG11/OS30 14%) e rilascio attestazione CNCE Edilconnect prima della fatturazione finale"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {congruitaSal.isCongruo
                                ? `OG11/OS30: ${congruitaSal.percentualeIncidenzaEffettiva}% (✓ CNCE Sbloccato)`
                                : `OG11/OS30: ${congruitaSal.percentualeIncidenzaEffettiva}% (⛔ Blocco Saldo CNCE <14%)`}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span>Committente: <strong className="text-slate-800 dark:text-slate-200">{sal.committenteNome}</strong></span>
                          <span>·</span>
                          <span>Periodo: <strong className="text-slate-700 dark:text-slate-300">Dal {sal.periodoInizio} al {sal.periodoFine}</strong></span>
                          <span>·</span>
                          <span>Voci: <strong className="text-slate-700 dark:text-slate-300">{sal.voci.length} computi</strong></span>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-1 max-w-md">
                          <div className="flex justify-between text-[11px] mb-1 font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Avanzamento Globale Cantiere:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{sal.percentualeAvanzamentoGlobale.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-800">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, sal.percentualeAvanzamentoGlobale)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Center: Financial Figures */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0 font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Lavori Questo SAL</span>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                            € {sal.totaleLavoriPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Totale Cumulato</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            € {sal.totaleLavoriCumulati.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">Netto Certificato</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {cp ? `€ ${cp.importoNettoLiquidare.toLocaleString('it-IT', { minimumFractionDigits: 0 })}` : 'In attesa'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedSalForDetail(sal)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
                        >
                          <span>Apri Libretto Misure</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setTargetCongruitaSalId(sal.id);
                              setActiveSalSubTab('congruita_dm143');
                            }}
                            className={`p-2 rounded-xl border transition-colors ${
                              congruitaSal.isCongruo
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                            }`}
                            title="Verifica Congruità Manodopera D.M. 143/2021"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {cp && (
                            <button
                              onClick={() => setSelectedSalForCert(sal)}
                              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors"
                              title="Visualizza Certificato di Pagamento A4"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              exportSalExcel(sal);
                              showToast(`Export Excel per ${sal.codiceSal} avviato!`, 'success');
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
                            title="Scarica Foglio Excel (.xlsx)"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedSalForDetail && (
        <SalDetailModal
          isOpen={!!selectedSalForDetail}
          onClose={() => setSelectedSalForDetail(null)}
          sal={selectedSalForDetail}
          onApprovaDL={(id, nomeDL, note) => {
            approvaSalDL(id, nomeDL, note);
            setSelectedSalForDetail((prev) =>
              prev
                ? {
                    ...prev,
                    stato: 'approvato_dl',
                    approvatoDirettoreLavori: {
                      nome: nomeDL,
                      dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
                      note,
                    },
                  }
                : null
            );
          }}
          onEmettiCertificato={(salId, cert) => {
            emettiCertificatoPagamento(salId, cert);
            setSelectedSalForDetail((prev) =>
              prev ? { ...prev, stato: 'certificato_emesso', certificatoPagamento: cert } : null
            );
          }}
          onLiquida={(salId, rifFattura) => {
            liquidaSal(salId, rifFattura);
            setSelectedSalForDetail((prev) =>
              prev
                ? {
                    ...prev,
                    stato: 'liquidato',
                    certificatoPagamento: prev.certificatoPagamento
                      ? { ...prev.certificatoPagamento, stato: 'pagato', riferimentoFattura: rifFattura }
                      : undefined,
                  }
                : null
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* Certificato Modal */}
      {selectedSalForCert && (
        <CertificatoPagamentoModal
          isOpen={!!selectedSalForCert}
          onClose={() => setSelectedSalForCert(null)}
          sal={selectedSalForCert}
          onLiquida={(salId, rifFattura) => {
            liquidaSal(salId, rifFattura);
            setSelectedSalForCert((prev) =>
              prev && prev.certificatoPagamento
                ? {
                    ...prev,
                    stato: 'liquidato',
                    certificatoPagamento: { ...prev.certificatoPagamento, stato: 'pagato', riferimentoFattura: rifFattura },
                  }
                : null
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <SalFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={(nuovoSalData) => {
            const created = addSal(nuovoSalData);
            setIsFormOpen(false);
            showToast(`${created.codiceSal} per ${created.cantiereNome} creato con successo!`, 'success');
          }}
          cantieri={cantieri}
          preventivi={preventivi}
          lavorazioni={lavorazioni}
          existingSals={sals}
        />
      )}
    </div>
  );
};
