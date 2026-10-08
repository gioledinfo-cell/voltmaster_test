import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  Building2,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  Layers,
  Cpu,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cantiere } from '../types';

interface CantieriProgressChartWidgetProps {
  onSelectCantiere?: (cantiereId: string) => void;
}

export const CantieriProgressChartWidget: React.FC<CantieriProgressChartWidgetProps> = ({
  onSelectCantiere,
}) => {
  const { cantieri, setSelectedCantiereId, setActiveTab } = useApp();

  const [filterMode, setFilterMode] = useState<'in_corso' | 'tutti_attivi' | 'top_budget'>('in_corso');
  const [chartType, setChartType] = useState<'avanzamento' | 'avanzamento_vs_spesa'>('avanzamento');

  // Prepare data for active projects
  const chartData = useMemo(() => {
    let list = cantieri.filter((c) => c.stato !== 'completato' && c.stato !== 'sospeso');

    if (filterMode === 'in_corso') {
      list = list.filter((c) => c.stato === 'in_corso');
    } else if (filterMode === 'top_budget') {
      list = [...list].sort((a, b) => b.budgetTotale - a.budgetTotale);
    }

    // Sort by progress descending by default
    if (filterMode !== 'top_budget') {
      list = [...list].sort((a, b) => b.avanzamentoPercentuale - a.avanzamentoPercentuale);
    }

    return list.slice(0, 8).map((c) => {
      // Calculate financial spend %
      const spesaPercentuale =
        c.budgetTotale > 0 ? Math.min(100, Math.round((c.costiConsuntivati / c.budgetTotale) * 100)) : 0;

      // Clean short label
      const shortName = c.titolo.length > 22 ? c.titolo.slice(0, 22) + '...' : c.titolo;

      return {
        id: c.id,
        raw: c,
        name: shortName,
        fullName: c.titolo,
        codice: c.codice,
        cliente: c.clienteNome,
        citta: c.citta,
        stato: c.stato,
        avanzamento: c.avanzamentoPercentuale,
        spesaPercentuale,
        budget: c.budgetTotale,
        costi: c.costiConsuntivati,
        dispositivi: c.dispositivi?.length || 0,
      };
    });
  }, [cantieri, filterMode]);

  // Overall statistics
  const stats = useMemo(() => {
    const active = cantieri.filter((c) => c.stato === 'in_corso');
    const avg =
      active.length > 0
        ? Math.round(active.reduce((acc, c) => acc + c.avanzamentoPercentuale, 0) / active.length)
        : 0;
    const nearCompletion = active.filter((c) => c.avanzamentoPercentuale >= 75).length;
    const initialPhase = active.filter((c) => c.avanzamentoPercentuale < 30).length;

    return { totalActive: active.length, avgProgress: avg, nearCompletion, initialPhase };
  }, [cantieri]);

  // Color generator based on progress percentage
  const getBarColor = (progress: number) => {
    if (progress >= 75) return '#10b981'; // emerald-500
    if (progress >= 50) return '#06b6d4'; // cyan-500
    if (progress >= 25) return '#f59e0b'; // amber-500
    return '#f97316'; // orange-500
  };

  const handleBarClick = (data: any) => {
    if (data && data.id) {
      setSelectedCantiereId(data.id);
      setActiveTab('cantieri');
      if (onSelectCantiere) onSelectCantiere(data.id);
    }
  };

  // Custom high-contrast tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded text-[10px]">
              {item.codice}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              {item.stato.replace('_', ' ')}
            </span>
          </div>

          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">{item.fullName}</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="truncate">{item.citta} · {item.cliente}</span>
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Avanzamento Lavori:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.avanzamento}%</span>
            </div>
            {chartType === 'avanzamento_vs_spesa' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Costi Consuntivati (SAL):</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.spesaPercentuale}% (€ {item.costi.toLocaleString('it-IT')})</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
              <span>Budget Totale:</span>
              <span className="text-slate-700 dark:text-slate-300">€ {item.budget.toLocaleString('it-IT')}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Quadri & Dispositivi:</span>
              <span className="text-slate-700 dark:text-slate-300">{item.dispositivi} registrati</span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
            <span>Clicca per aprire scheda cantiere</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs dark:shadow-xl space-y-5">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Progresso Lavori Cantieri Attivi</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                Recharts Live
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Percentuale di completamento, avanzamento tecnico e consuntivazione economica in tempo reale
          </p>
        </div>

        {/* Filters and Chart Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Segmented Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterMode('in_corso')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterMode === 'in_corso'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              In Corso ({stats.totalActive})
            </button>
            <button
              onClick={() => setFilterMode('tutti_attivi')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterMode === 'tutti_attivi'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tutti gli Attivi
            </button>
            <button
              onClick={() => setFilterMode('top_budget')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterMode === 'top_budget'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Top Budget
            </button>
          </div>

          {/* Toggle metric */}
          <button
            onClick={() =>
              setChartType((prev) => (prev === 'avanzamento' ? 'avanzamento_vs_spesa' : 'avanzamento'))
            }
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              chartType === 'avanzamento_vs_spesa'
                ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-300'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Confronta avanzamento lavori con i costi consuntivati (SAL)"
          >
            {chartType === 'avanzamento_vs_spesa' ? '✓ Progresso vs SAL' : '+ Mostra SAL %'}
          </button>
        </div>
      </div>

      {/* KPI Mini Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
        <div className="px-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Avanzamento Medio</span>
          <span className="text-base font-extrabold font-mono text-amber-400 mt-0.5 block">
            {stats.avgProgress}%
          </span>
        </div>
        <div className="px-2 border-l border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Fase Conclusiva (&ge;75%)</span>
          <span className="text-base font-extrabold font-mono text-emerald-400 mt-0.5 block">
            {stats.nearCompletion} cantieri
          </span>
        </div>
        <div className="px-2 border-l border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Fase Iniziale (&lt;30%)</span>
          <span className="text-base font-extrabold font-mono text-cyan-400 mt-0.5 block">
            {stats.initialPhase} cantieri
          </span>
        </div>
        <div className="px-2 border-l border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Visualizzazione</span>
            <span className="text-xs font-semibold text-slate-300 mt-0.5 block">
              Primi {chartData.length} cantieri
            </span>
          </div>
          <button
            onClick={() => setActiveTab('cantieri')}
            className="text-amber-400 hover:text-amber-300 p-1"
            title="Vedi tutti i cantieri"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            barGap={4}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload[0]) {
                handleBarClick(state.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
            
            {chartType === 'avanzamento_vs_spesa' && (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-slate-300 text-xs font-medium">
                    {value === 'avanzamento' ? 'Avanzamento Lavori (%)' : 'Spesa Consuntivata SAL (%)'}
                  </span>
                )}
              />
            )}

            {/* Target 100% Reference Line */}
            <ReferenceLine x={100} stroke="#334155" strokeDasharray="3 3" label={{ value: '100% Consegna', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine x={50} stroke="#1e293b" strokeDasharray="2 2" />

            {/* Primary Progress Bar */}
            <Bar
              dataKey="avanzamento"
              name="avanzamento"
              radius={[0, 6, 6, 0]}
              barSize={chartType === 'avanzamento_vs_spesa' ? 12 : 20}
              className="cursor-pointer transition-all hover:opacity-85"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.avanzamento)} />
              ))}
            </Bar>

            {/* Comparison Bar: Spesa / SAL % */}
            {chartType === 'avanzamento_vs_spesa' && (
              <Bar
                dataKey="spesaPercentuale"
                name="spesaPercentuale"
                fill="#38bdf8"
                radius={[0, 6, 6, 0]}
                barSize={12}
                className="cursor-pointer transition-all hover:opacity-85"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Interactive Hint & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-300 text-[11px]">Legenda Avanzamento:</span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>&ge; 75% Fine Lavori</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
            <span>50-74% Intermedio</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>25-49% Posa Cavi/Quadri</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
            <span>&lt; 25% Avvio Cantiere</span>
          </span>
        </div>

        <button
          onClick={() => setActiveTab('cantieri')}
          className="text-amber-400 hover:text-amber-300 text-xs font-semibold inline-flex items-center gap-1 self-end sm:self-auto"
        >
          Gestisci schede cantieri
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
