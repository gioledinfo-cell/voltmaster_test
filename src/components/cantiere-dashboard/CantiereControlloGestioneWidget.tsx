import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calculator,
  Clock,
  Truck,
  FileSpreadsheet,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  PieChart,
  BarChart3,
  Sliders,
  ShieldAlert,
  Info,
  Building2,
  Calendar,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Cantiere, Preventivo } from '../../types';
import { ROL } from '../../types';
import { DocumentoDiTrasporto } from '../../types/ddt';
import { StatoAvanzamentoLavori } from '../../types/sal';

interface CantiereControlloGestioneWidgetProps {
  cantiereId: string;
}

export const CantiereControlloGestioneWidget: React.FC<CantiereControlloGestioneWidgetProps> = ({
  cantiereId,
}) => {
  const {
    cantieri,
    preventivi,
    rols,
    ddts,
    sals,
    magazzino,
    dipendenti,
    showToast,
  } = useApp();

  // Active sub-tab inside the widget
  const [activeTab, setActiveTab] = useState<'sintesi' | 'manodopera_rol' | 'materiali_ddt' | 'confronto_budget'>('sintesi');
  
  // Customizable labor hourly rate simulator
  const [customHourlyRate, setCustomHourlyRate] = useState<number>(35);
  const [useEmployeeSpecificRates, setUseEmployeeSpecificRates] = useState<boolean>(true);
  const [overheadPercent, setOverheadPercent] = useState<number>(8); // Spese generali di cantiere

  // Target Cantiere
  const cantiere = useMemo(() => {
    return cantieri.find((c) => c.id === cantiereId) || cantieri[0];
  }, [cantieri, cantiereId]);

  // Target Preventivo collegato
  const preventivoCollegato = useMemo<Preventivo | undefined>(() => {
    if (!cantiere) return undefined;
    return (
      preventivi.find((p) => p.cantiereIdCreato === cantiere.id) ||
      preventivi.find((p) => p.clienteId === cantiere.clienteId && p.stato === 'accettato') ||
      preventivi.find((p) => p.clienteId === cantiere.clienteId) ||
      preventivi[0]
    );
  }, [preventivi, cantiere]);

  // 1. MANODOPERA DA ROL
  const siteRols = useMemo(() => {
    if (!cantiere) return [];
    return rols.filter(
      (r) =>
        r.cantiereId === cantiere.id ||
        (r.cantiereTitolo && r.cantiereTitolo.toLowerCase().includes(cantiere.titolo.toLowerCase()))
    );
  }, [rols, cantiere]);

  const manodoperaStats = useMemo(() => {
    let oreOrdinarie = 0;
    let oreStraordinarie = 0;
    let oreViaggio = 0;
    let costoTotale = 0;

    const operatoriMap = new Map<string, { nome: string; ore: number; costo: number; rolCount: number }>();

    siteRols.forEach((r) => {
      const hOrd = r.oreOrdinarie || r.hoursWork || (r.oreTotali - (r.oreStraordinarie || 0) - (r.hoursTravel || 0));
      const hStr = r.oreStraordinarie || 0;
      const hVia = r.hoursTravel || 0;
      const hTot = r.oreTotali || (hOrd + hStr + hVia);

      oreOrdinarie += hOrd;
      oreStraordinarie += hStr;
      oreViaggio += hVia;

      // Lookup operator cost
      const dip = dipendenti.find(
        (d) => d.id === r.operatoreId || `${d.nome} ${d.cognome}`.toLowerCase() === r.operatoreNome.toLowerCase()
      );
      const baseRate = useEmployeeSpecificRates && dip?.costoOrario ? dip.costoOrario : customHourlyRate;
      
      // Straordinari +25%, Viaggio 100%
      const costRol = hOrd * baseRate + hStr * (baseRate * 1.25) + hVia * baseRate;
      costoTotale += costRol;

      const opKey = r.operatoreId || r.operatoreNome;
      const existing = operatoriMap.get(opKey) || {
        nome: r.operatoreNome,
        ore: 0,
        costo: 0,
        rolCount: 0,
      };
      existing.ore += hTot;
      existing.costo += costRol;
      existing.rolCount += 1;
      operatoriMap.set(opKey, existing);
    });

    const oreTotali = oreOrdinarie + oreStraordinarie + oreViaggio;

    return {
      siteRols,
      oreTotali,
      oreOrdinarie,
      oreStraordinarie,
      oreViaggio,
      costoTotale,
      operatoriList: Array.from(operatoriMap.values()),
    };
  }, [siteRols, dipendenti, useEmployeeSpecificRates, customHourlyRate]);

  // 2. MATERIALI DA DDT
  const siteDdts = useMemo(() => {
    if (!cantiere) return [];
    return ddts.filter(
      (d) =>
        d.cantiereId === cantiere.id ||
        (d.cantiereNome && d.cantiereNome.toLowerCase().includes(cantiere.titolo.toLowerCase()))
    );
  }, [ddts, cantiere]);

  const materialiStats = useMemo(() => {
    let costoTotaleMateriali = 0;
    let numeroArticoliTotali = 0;
    const righeDettaglio: Array<{
      ddtNumero: string;
      ddtData: string;
      sku: string;
      descrizione: string;
      quantita: number;
      unitaMisura: string;
      prezzoUnitarioAcquisto: number;
      costoTotaleRiga: number;
    }> = [];

    siteDdts.forEach((ddt) => {
      (ddt.righe || []).forEach((riga) => {
        // Match with warehouse for real purchase price
        const mat = magazzino.find(
          (m) =>
            m.id === riga.articoloId ||
            m.codiceSku.toLowerCase() === riga.sku.toLowerCase() ||
            m.nome.toLowerCase().includes(riga.descrizione.toLowerCase())
        );

        const unitCost = mat?.prezzoUnitarioAcquisto || 18.5; // realistic fallback per unit
        const lineCost = riga.quantita * unitCost;

        costoTotaleMateriali += lineCost;
        numeroArticoliTotali += riga.quantita;

        righeDettaglio.push({
          ddtNumero: ddt.numeroDdt,
          ddtData: ddt.dataEmissione,
          sku: riga.sku,
          descrizione: riga.descrizione,
          quantita: riga.quantita,
          unitaMisura: riga.unitaMisura,
          prezzoUnitarioAcquisto: unitCost,
          costoTotaleRiga: lineCost,
        });
      });
    });

    // Se non ci sono DDT associati nel mock, integriamo i materiali assegnati al cantiere
    if (righeDettaglio.length === 0 && cantiere?.materialiAssegnati) {
      cantiere.materialiAssegnati.forEach((m, idx) => {
        const globalMat = magazzino.find((g) => g.id === m.materialeId);
        const unitCost = globalMat?.prezzoUnitarioAcquisto || 24.0;
        const lineCost = m.quantita * unitCost;
        costoTotaleMateriali += lineCost;
        numeroArticoliTotali += m.quantita;
        righeDettaglio.push({
          ddtNumero: `DDT-ASS-${idx + 1}`,
          ddtData: m.dataAssegnazione || '2026-09-20',
          sku: globalMat?.codiceSku || `MAT-${idx + 1}`,
          descrizione: m.nome,
          quantita: m.quantita,
          unitaMisura: m.unitaMisura,
          prezzoUnitarioAcquisto: unitCost,
          costoTotaleRiga: lineCost,
        });
      });
    }

    return {
      siteDdts,
      costoTotaleMateriali,
      numeroArticoliTotali,
      righeDettaglio,
    };
  }, [siteDdts, cantiere, magazzino]);

  // 3. RICAVI MATURATI DA SAL
  const siteSals = useMemo(() => {
    if (!cantiere) return [];
    return sals.filter((s) => s.cantiereId === cantiere.id);
  }, [sals, cantiere]);

  const salStats = useMemo(() => {
    const sorted = [...siteSals].sort((a, b) => b.numeroSal - a.numeroSal);
    const ultimoSal = sorted[0];

    const budgetContrattuale =
      ultimoSal?.importoContrattualeTotale ||
      cantiere?.budgetTotale ||
      preventivoCollegato?.imponibile ||
      55000;

    const totaleLavoriMaturati =
      ultimoSal?.totaleLavoriCumulati ||
      (cantiere?.avanzamentoPercentuale ? (cantiere.avanzamentoPercentuale / 100) * budgetContrattuale : 28500);

    const totaleCertificatiEmessi = siteSals.reduce((acc, s) => {
      return acc + (s.certificatoPagamento?.totaleLordoLiquidare || 0);
    }, 0);

    const totaleLiquidato = siteSals
      .filter((s) => s.certificatoPagamento?.stato === 'pagato')
      .reduce((acc, s) => acc + (s.certificatoPagamento?.totaleLordoLiquidare || 0), 0);

    const percentualeAvanzamento =
      budgetContrattuale > 0 ? (totaleLavoriMaturati / budgetContrattuale) * 100 : 0;

    return {
      siteSals: sorted,
      ultimoSal,
      budgetContrattuale,
      totaleLavoriMaturati,
      totaleCertificatiEmessi,
      totaleLiquidato,
      percentualeAvanzamento,
    };
  }, [siteSals, cantiere, preventivoCollegato]);

  // 4. BUDGET PREVENTIVO INIZIALE SUDDIVISO
  const budgetPreventivo = useMemo(() => {
    let budgetManodopera = 0;
    let budgetMateriali = 0;
    let budgetSpeseOneri = 0;
    let totaleImponibile = preventivoCollegato?.imponibile || salStats.budgetContrattuale;

    if (preventivoCollegato && preventivoCollegato.voci.length > 0) {
      preventivoCollegato.voci.forEach((v) => {
        if (v.categoria === 'manodopera') {
          budgetManodopera += v.totale;
        } else if (v.categoria === 'materiale') {
          budgetMateriali += v.totale;
        } else {
          budgetSpeseOneri += v.totale;
        }
      });
    } else {
      // Standard benchmark for electrical systems (40% Manodopera, 45% Materiali, 15% Margine)
      budgetManodopera = totaleImponibile * 0.38;
      budgetMateriali = totaleImponibile * 0.42;
      budgetSpeseOneri = totaleImponibile * 0.05;
    }

    const margineAttesoEuro = totaleImponibile - (budgetManodopera + budgetMateriali + budgetSpeseOneri);
    const margineAttesoPercent = totaleImponibile > 0 ? (margineAttesoEuro / totaleImponibile) * 100 : 15;

    return {
      totaleImponibile,
      budgetManodopera,
      budgetMateriali,
      budgetSpeseOneri,
      margineAttesoEuro,
      margineAttesoPercent,
    };
  }, [preventivoCollegato, salStats.budgetContrattuale]);

  // 5. MARGINE REALE & CONTROLLO DI GESTIONE
  const financials = useMemo(() => {
    const costoManodoperaReale = manodoperaStats.costoTotale;
    const costoMaterialiReale = materialiStats.costoTotaleMateriali;
    const speseGeneraliReali = (costoManodoperaReale + costoMaterialiReale) * (overheadPercent / 100);
    const costiTotaliConsuntivati = costoManodoperaReale + costoMaterialiReale + speseGeneraliReali;

    const ricaviMaturati = salStats.totaleLavoriMaturati;
    const margineRealeEuro = ricaviMaturati - costiTotaliConsuntivati;
    const margineRealePercent = ricaviMaturati > 0 ? (margineRealeEuro / ricaviMaturati) * 100 : 0;

    // Estimate At Completion (EAC / Proiezione Fine Lavori)
    const prog = Math.max(salStats.percentualeAvanzamento, 5) / 100;
    const costoFinaleStimato = costiTotaliConsuntivati / prog;
    const margineFinaleStimatoEuro = salStats.budgetContrattuale - costoFinaleStimato;
    const margineFinaleStimatoPercent =
      salStats.budgetContrattuale > 0 ? (margineFinaleStimatoEuro / salStats.budgetContrattuale) * 100 : 0;

    // Variance vs Budget proporzionato all'avanzamento
    const budgetManodoperaMaturato = budgetPreventivo.budgetManodopera * prog;
    const deltaManodopera = costoManodoperaReale - budgetManodoperaMaturato; // >0 extra-costo, <0 risparmio

    const budgetMaterialiMaturato = budgetPreventivo.budgetMateriali * prog;
    const deltaMateriali = costoMaterialiReale - budgetMaterialiMaturato;

    const deltaMarginePunti = margineRealePercent - budgetPreventivo.margineAttesoPercent;

    // Status Health Indicator
    let statoSalute: 'ottimale' | 'monitoraggio' | 'critico' = 'ottimale';
    if (margineRealePercent < 8 || deltaManodopera > 3000) {
      statoSalute = 'critico';
    } else if (margineRealePercent < 18 || deltaMarginePunti < -3) {
      statoSalute = 'monitoraggio';
    }

    return {
      costoManodoperaReale,
      costoMaterialiReale,
      speseGeneraliReali,
      costiTotaliConsuntivati,
      ricaviMaturati,
      margineRealeEuro,
      margineRealePercent,
      costoFinaleStimato,
      margineFinaleStimatoEuro,
      margineFinaleStimatoPercent,
      deltaManodopera,
      deltaMateriali,
      deltaMarginePunti,
      statoSalute,
    };
  }, [manodoperaStats, materialiStats, salStats, budgetPreventivo, overheadPercent]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-6">
      {/* 1. Header with Health Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              financials.statoSalute === 'ottimale'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : financials.statoSalute === 'monitoraggio'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Controllo di Gestione & Margine di Commessa Reale
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider border ${
                  financials.statoSalute === 'ottimale'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                    : financials.statoSalute === 'monitoraggio'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700 animate-pulse'
                }`}
              >
                {financials.statoSalute === 'ottimale' && '● Redditività Ottimale (In Linea col Budget)'}
                {financials.statoSalute === 'monitoraggio' && '▲ Margine Sotto Pressione'}
                {financials.statoSalute === 'critico' && '⚠ Rischio Extra-Costo / Erosione Margine'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Incrocio in tempo reale tra <strong>Costi Manodopera (ROL)</strong>, <strong>Costi Materiali (DDT)</strong> e <strong>Ricavi Maturati (SAL)</strong> vs Budget Preventivo Iniziale.
            </p>
          </div>
        </div>

        {/* Action Controls & Simulator */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tariffa Base:</span>
            <input
              type="number"
              value={customHourlyRate}
              onChange={(e) => setCustomHourlyRate(Math.max(15, Number(e.target.value)))}
              className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs text-right font-bold text-slate-900 dark:text-slate-100"
            />
            <span className="text-slate-500">€/h</span>
          </div>

          <button
            onClick={() => {
              window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Stampa Report Controllo di Gestione"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Stampa Prospetto</span>
          </button>
        </div>
      </div>

      {/* 2. Primary 4-Way KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ricavi SAL */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/70 dark:border-blue-800/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              1. Ricavi Maturati (SAL)
            </span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              € {financials.ricaviMaturati.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Avanzamento SAL:</span>
            <span className="font-bold font-mono text-blue-700 dark:text-blue-300">
              {salStats.percentualeAvanzamento.toFixed(1)}% di € {salStats.budgetContrattuale.toLocaleString('it-IT')}
            </span>
          </div>
        </div>

        {/* Card 2: Costi Consuntivati (ROL + DDT) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50/40 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/70 dark:border-rose-800/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              2. Costi Reali Consuntivati
            </span>
            <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
              € {financials.costiTotaliConsuntivati.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Manodopera + DDT:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              € {financials.costoManodoperaReale.toLocaleString('it-IT', { maximumFractionDigits: 0 })} + € {financials.costoMaterialiReale.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Card 3: Margine Attuale Reale */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            financials.margineRealeEuro >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/70 dark:border-emerald-800/50'
              : 'bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/30 dark:to-red-950/20 border-rose-200/70 dark:border-rose-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              3. Margine Reale Corrente
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                financials.margineRealeEuro >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              € {financials.margineRealeEuro.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-sm font-black font-mono px-2 py-0.5 rounded-md ${
                financials.margineRealePercent >= 18
                  ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                  : financials.margineRealePercent >= 8
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                  : 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
              }`}
            >
              {financials.margineRealePercent.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Target Preventivo:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {budgetPreventivo.margineAttesoPercent.toFixed(1)}% ({financials.deltaMarginePunti >= 0 ? '+' : ''}{financials.deltaMarginePunti.toFixed(1)} pt)
            </span>
          </div>
        </div>

        {/* Card 4: Proiezione a Fine Lavori (Forecast / EAC) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50/40 dark:from-purple-950/30 dark:to-violet-950/20 border border-purple-200/70 dark:border-purple-800/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              4. Proiezione Fine Cantiere
            </span>
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-800 dark:text-purple-300">
              € {financials.margineFinaleStimatoEuro.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
              ({financials.margineFinaleStimatoPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Costo Totale Previsto:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              € {financials.costoFinaleStimato.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sintesi')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sintesi'
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sintesi & Grafici di Redditività</span>
        </button>

        <button
          onClick={() => setActiveTab('manodopera_rol')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'manodopera_rol'
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dettaglio Manodopera ROL ({manodoperaStats.oreTotali}h · €{manodoperaStats.costoTotale.toLocaleString('it-IT', { maximumFractionDigits: 0 })})</span>
        </button>

        <button
          onClick={() => setActiveTab('materiali_ddt')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'materiali_ddt'
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Dettaglio Materiali DDT ({materialiStats.righeDettaglio.length} voci · €{materialiStats.costoTotaleMateriali.toLocaleString('it-IT', { maximumFractionDigits: 0 })})</span>
        </button>

        <button
          onClick={() => setActiveTab('confronto_budget')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'confronto_budget'
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Analisi Scostamenti (Preventivo vs Reale)</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === 'sintesi' && (
        <div className="space-y-6">
          {/* Confronto a Barre: Budget Preventivato vs Consuntivo Reale */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Ripartizione Costi & Margine: Preventivo Iniziale vs Consuntivo a Oggi
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Avanzamento SAL: {salStats.percentualeAvanzamento.toFixed(1)}%
              </span>
            </div>

            {/* Manodopera Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Manodopera (ROL registrati)
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">€ {financials.costoManodoperaReale.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</strong> consuntivati / € {budgetPreventivo.budgetManodopera.toLocaleString('it-IT', { maximumFractionDigits: 0 })} a budget
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    financials.deltaManodopera > 0 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      (financials.costoManodoperaReale / Math.max(budgetPreventivo.budgetManodopera, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Materiali Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Materiali Forniti (DDT scaricati)
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">€ {financials.costoMaterialiReale.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</strong> scaricati / € {budgetPreventivo.budgetMateriali.toLocaleString('it-IT', { maximumFractionDigits: 0 })} a budget
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (financials.costoMaterialiReale / Math.max(budgetPreventivo.budgetMateriali, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Margine Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Margine Operativo Cantiere
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  <strong className="text-emerald-600 dark:text-emerald-400">€ {financials.margineRealeEuro.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</strong> ({financials.margineRealePercent.toFixed(1)}%) / Target: € {budgetPreventivo.margineAttesoEuro.toLocaleString('it-IT', { maximumFractionDigits: 0 })} ({budgetPreventivo.margineAttesoPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.max((financials.margineRealeEuro / Math.max(budgetPreventivo.margineAttesoEuro, 1)) * 100, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Key Insights & Variance Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Efficienza Manodopera ROL</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {manodoperaStats.oreTotali} ore registrate su {siteRols.length} ROL ({manodoperaStats.oreOrdinarie}h ordinarie, {manodoperaStats.oreStraordinarie}h straordinarie, {manodoperaStats.oreViaggio}h viaggio).
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Scostamento: <strong className={financials.deltaManodopera <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                  {financials.deltaManodopera <= 0 ? 'Risparmio ' : 'Extra-costo '}€ {Math.abs(financials.deltaManodopera).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Assorbimento Materiali DDT</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {materialiStats.numeroArticoliTotali} articoli consegnati tramite {siteDdts.length || 'DDT di carico'} per un controvalore di acquisto pari a € {materialiStats.costoTotaleMateriali.toLocaleString('it-IT', { maximumFractionDigits: 0 })}.
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Incidenza sul maturato: <strong>{((materialiStats.costoTotaleMateriali / Math.max(financials.ricaviMaturati, 1)) * 100).toFixed(1)}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Margine & Fatturazione SAL</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {siteSals.length} SAL emessi. Certificati di pagamento approvati per € {salStats.totaleCertificatiEmessi.toLocaleString('it-IT', { maximumFractionDigits: 0 })} di cui € {salStats.totaleLiquidato.toLocaleString('it-IT', { maximumFractionDigits: 0 })} già incassati.
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Liquidità maturata: <strong>{((salStats.totaleCertificatiEmessi / Math.max(salStats.budgetContrattuale, 1)) * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dettaglio Manodopera ROL */}
      {activeTab === 'manodopera_rol' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span>Totale ROL: <strong>{siteRols.length}</strong></span>
              <span>Ore Totali: <strong>{manodoperaStats.oreTotali}h</strong></span>
              <span>Ordinarie: <strong>{manodoperaStats.oreOrdinarie}h</strong></span>
              <span>Straordinarie: <strong>{manodoperaStats.oreStraordinarie}h</strong></span>
              <span>Viaggio/Trasferta: <strong>{manodoperaStats.oreViaggio}h</strong></span>
            </div>
            <div className="text-right">
              <span>Costo Totale Manodopera: <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">€ {manodoperaStats.costoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>

          {/* Tabella ROL */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5">Protocollo ROL</th>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Operatore</th>
                  <th className="p-2.5">Attività / Fase</th>
                  <th className="p-2.5 text-center">Ore Lavoro</th>
                  <th className="p-2.5 text-center">Straord.</th>
                  <th className="p-2.5 text-center">Viaggio</th>
                  <th className="p-2.5 text-center">Ore Totali</th>
                  <th className="p-2.5 text-right">Costo Reale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {siteRols.map((r) => {
                  const dip = dipendenti.find((d) => d.id === r.operatoreId || `${d.nome} ${d.cognome}` === r.operatoreNome);
                  const rate = useEmployeeSpecificRates && dip?.costoOrario ? dip.costoOrario : customHourlyRate;
                  const hOrd = r.oreOrdinarie || r.hoursWork || (r.oreTotali - (r.oreStraordinarie || 0) - (r.hoursTravel || 0));
                  const hStr = r.oreStraordinarie || 0;
                  const hVia = r.hoursTravel || 0;
                  const rCost = hOrd * rate + hStr * (rate * 1.25) + hVia * rate;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400">{r.numero}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.data}</td>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">{r.operatoreNome}</td>
                      <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {r.lavorazioneTitolo || r.attivitaLibera || r.subActivity || 'Attività ordinaria'}
                      </td>
                      <td className="p-2.5 text-center text-slate-700 dark:text-slate-300">{hOrd}h</td>
                      <td className="p-2.5 text-center text-amber-600">{hStr ? `${hStr}h` : '-'}</td>
                      <td className="p-2.5 text-center text-blue-600">{hVia ? `${hVia}h` : '-'}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 dark:text-slate-100">{r.oreTotali}h</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        € {rCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Dettaglio Materiali DDT */}
      {activeTab === 'materiali_ddt' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span>DDT Registrati: <strong>{siteDdts.length || 1}</strong></span>
              <span>Righe Merci: <strong>{materialiStats.righeDettaglio.length}</strong></span>
              <span>Totale Quantità: <strong>{materialiStats.numeroArticoliTotali} un.</strong></span>
            </div>
            <div className="text-right">
              <span>Costo Totale Materiali: <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">€ {materialiStats.costoTotaleMateriali.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5">Rif. DDT</th>
                  <th className="p-2.5">Data Consegna</th>
                  <th className="p-2.5">Codice Articolo / SKU</th>
                  <th className="p-2.5">Descrizione Prodotto</th>
                  <th className="p-2.5 text-center">Quantità</th>
                  <th className="p-2.5 text-right">Prezzo Unit. Acquisto</th>
                  <th className="p-2.5 text-right">Costo Totale Scaricato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {materialiStats.righeDettaglio.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400">{item.ddtNumero}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{item.ddtData}</td>
                    <td className="p-2.5 text-slate-500 font-semibold">{item.sku}</td>
                    <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100 max-w-[240px] truncate">
                      {item.descrizione}
                    </td>
                    <td className="p-2.5 text-center text-slate-900 dark:text-slate-100">
                      {item.quantita} {item.unitaMisura}
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      € {item.prezzoUnitarioAcquisto.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      € {item.costoTotaleRiga.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Analisi Scostamenti (Preventivo vs Reale) */}
      {activeTab === 'confronto_budget' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Tavola Tripartita: Preventivo di Gara vs SAL Maturati vs Costi Consuntivati
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Analisi di varianza (Variance Analysis) calcolata proporzionalmente allo stato di avanzamento lavori certificato.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Categoria di Spesa</th>
                    <th className="p-3 text-right">Budget Iniziale (Preventivo)</th>
                    <th className="p-3 text-right">Budget Teorico ad Oggi (SAL {salStats.percentualeAvanzamento.toFixed(0)}%)</th>
                    <th className="p-3 text-right">Costo Effettivo Consuntivato</th>
                    <th className="p-3 text-right">Delta / Scostamento</th>
                    <th className="p-3 text-center">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                  {/* Riga Manodopera */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Manodopera Elettrica (ROL)
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      € {budgetPreventivo.budgetManodopera.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      € {(budgetPreventivo.budgetManodopera * (salStats.percentualeAvanzamento / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-400">
                      € {financials.costoManodoperaReale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-bold ${financials.deltaManodopera <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {financials.deltaManodopera <= 0 ? '-' : '+'}€ {Math.abs(financials.deltaManodopera).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${financials.deltaManodopera <= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {financials.deltaManodopera <= 0 ? 'In Budget' : 'Extra-Costo'}
                      </span>
                    </td>
                  </tr>

                  {/* Riga Materiali */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-500" />
                      Materiali & Apparecchiature (DDT)
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      € {budgetPreventivo.budgetMateriali.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                      € {(budgetPreventivo.budgetMateriali * (salStats.percentualeAvanzamento / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700 dark:text-amber-400">
                      € {financials.costoMaterialiReale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-bold ${financials.deltaMateriali <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {financials.deltaMateriali <= 0 ? '-' : '+'}€ {Math.abs(financials.deltaMateriali).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${financials.deltaMateriali <= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {financials.deltaMateriali <= 0 ? 'In Budget' : 'Attenzione'}
                      </span>
                    </td>
                  </tr>

                  {/* Riga Totale & Margine */}
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-bold border-t border-slate-300 dark:border-slate-700">
                    <td className="p-3 font-sans text-slate-900 dark:text-slate-100">
                      MARGINE OPERATIVO COMMESSA
                    </td>
                    <td className="p-3 text-right text-slate-900 dark:text-slate-100">
                      € {budgetPreventivo.margineAttesoEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ({budgetPreventivo.margineAttesoPercent.toFixed(1)}%)
                    </td>
                    <td className="p-3 text-right text-slate-900 dark:text-slate-100">
                      € {(budgetPreventivo.margineAttesoEuro * (salStats.percentualeAvanzamento / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                      € {financials.margineRealeEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ({financials.margineRealePercent.toFixed(1)}%)
                    </td>
                    <td className={`p-3 text-right ${financials.deltaMarginePunti >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {financials.deltaMarginePunti >= 0 ? '+' : ''}{financials.deltaMarginePunti.toFixed(1)} pt. %
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${financials.statoSalute === 'ottimale' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                        {financials.statoSalute === 'ottimale' ? 'Redditizio' : 'Sotto Soglia'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
