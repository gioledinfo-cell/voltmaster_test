import React from 'react';
import {
  Building2,
  Calendar,
  User,
  HardHat,
  AlertTriangle,
  FileClock,
  Camera,
  Wrench,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { CantiereDashboardData } from '../../types/cantiereDashboard';

interface CantiereHeaderKPIProps {
  cantiere: CantiereDashboardData['cantiere'];
  kpi: CantiereDashboardData['kpi'];
}

export const CantiereHeaderKPI: React.FC<CantiereHeaderKPIProps> = ({ cantiere, kpi }) => {
  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'in_corso':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            In Esecuzione
          </span>
        );
      case 'collaudo':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Fase di Collaudo CEI
          </span>
        );
      case 'completato':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Completato & Certificato
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {stato}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Site Identity & Progress */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                {cantiere.codice}
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              {getStatusBadge(cantiere.stato)}
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {cantiere.clienteNome}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {cantiere.titolo}
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>{cantiere.indirizzo}, {cantiere.citta}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                PM: <strong>{cantiere.responsabilePM}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-300">
                <HardHat className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Capocantiere: <strong>{cantiere.capocantiereNome}</strong>
              </span>
            </div>
          </div>

          {/* Progress Bar & Financials */}
          <div className="lg:w-72 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Avanzamento Globale
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {kpi.avanzamentoPercentuale}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, kpi.avanzamentoPercentuale))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/80">
              <span>Ore lavorate: <strong className="text-slate-800 dark:text-slate-300 font-mono">{kpi.oreLavorateTotali}h</strong></span>
              <span>Spesa: <strong className="text-slate-800 dark:text-slate-300 font-mono">€{kpi.costoConsuntivato.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Rapid Counter KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Materiali in Esaurimento */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          kpi.materialiInEsaurimentoCount > 0
            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Scorte Sottosoglia</span>
            <AlertTriangle className={`w-4 h-4 ${kpi.materialiInEsaurimentoCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${kpi.materialiInEsaurimentoCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {kpi.materialiInEsaurimentoCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">in esaurimento</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpi.materialiInEsaurimentoCount > 0 ? 'Richiesto reintegro urgente' : 'Giacenze in cantiere sufficienti'}
          </div>
        </div>

        {/* Card 2: Documenti in Scadenza */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          kpi.documentiInScadenzaCount > 0
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Doc. in Scadenza</span>
            <FileClock className={`w-4 h-4 ${kpi.documentiInScadenzaCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${kpi.documentiInScadenzaCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {kpi.documentiInScadenzaCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">da rinnovare</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpi.documentiInScadenzaCount > 0 ? 'Attenzione: POS o permessi' : 'Tutti i documenti conformi'}
          </div>
        </div>

        {/* Card 3: Foto Caricate Oggi */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Foto Caricate Oggi</span>
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-300">
              {kpi.fotoCaricateOggiCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">scatti odierni</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tracciamento fotografico avanzamento
          </div>
        </div>

        {/* Card 4: Attrezzature Operative */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Attrezzature in Uso</span>
            <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {kpi.attrezzatureOperativeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ {kpi.attrezzatureTotaliCount} collaudate</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Strumenti CEI 64-8 e macchinari
          </div>
        </div>
      </div>
    </div>
  );
};
