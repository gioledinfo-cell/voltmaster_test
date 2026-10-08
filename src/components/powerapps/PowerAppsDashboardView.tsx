import React from 'react';
import {
  Building2,
  Truck,
  Fuel,
  Wrench,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Link2,
  Database,
  Users,
  Warehouse,
  History,
  Download,
  UploadCloud,
  Plus,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';

interface PowerAppsDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenQuickRifornimento: () => void;
}

export const PowerAppsDashboardView: React.FC<PowerAppsDashboardViewProps> = ({
  onNavigateTab,
  onOpenQuickRifornimento,
}) => {
  const {
    kpis,
    veicoliEnriched,
    attrezzatureEnriched,
    cantieriEnriched,
    rifornimentiCalcolati,
    exportAllDatasets,
  } = usePowerApps();

  return (
    <div className="space-y-6">
      {/* 4 Core KPI Counters Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cantieri Aperti */}
        <div
          onClick={() => onNavigateTab('data')}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition cursor-pointer shadow-xs dark:shadow-lg relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cantieri Aperti
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.cantieriAperti}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
              / {kpis.cantieriTotali} commesse
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {Math.round((kpis.cantieriAperti / (kpis.cantieriTotali || 1)) * 100)}% Operativi
            </span>
            <span className="text-slate-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition flex items-center gap-0.5">
              <span>Registro_Cantieri</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Veicoli Attivi */}
        <div
          onClick={() => onNavigateTab('flotta')}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition cursor-pointer shadow-xs dark:shadow-lg relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Veicoli Attivi in Servizio
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.veicoliAttivi}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
              / {kpis.veicoliTotali} mezzi
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-300">
              {veicoliEnriched.filter((v) => v.Stato.toLowerCase().includes('manutenzione')).length} in officina
            </span>
            <span className="text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition flex items-center gap-0.5">
              <span>Scheda Flotta</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Litri Totali Erogati */}
        <div
          onClick={() => onNavigateTab('flotta')}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition cursor-pointer shadow-xs dark:shadow-lg relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Litri Totali Erogati
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {kpis.litriTotaliErogati.toLocaleString('it-IT')}
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">L</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-600 dark:text-slate-300">
              {kpis.numeroRifornimentiTotali} erogazioni registrate
            </span>
            <span className="text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition flex items-center gap-0.5">
              <span>Registro_carburante</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Attrezzature con Manutenzione/Garanzia in scadenza */}
        <div
          onClick={() => onNavigateTab('asset')}
          className={`bg-white dark:bg-slate-900/90 border rounded-2xl p-5 transition cursor-pointer shadow-xs dark:shadow-lg relative group overflow-hidden ${
            kpis.attrezzatureManutenzioneInScadenza > 0
              ? 'border-rose-400 dark:border-rose-500/40 hover:border-rose-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Attrezzature in Scadenza
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 font-mono">
              {kpis.attrezzatureManutenzioneInScadenza}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">
              / {kpis.attrezzatureTotali} asset
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Entro 30 giorni o scadute
            </span>
            <span className="text-slate-500 group-hover:text-rose-400 transition flex items-center gap-0.5">
              <span>Inventario Asset</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Relational Foreign Keys Integrity Map */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Integrità Relazionale & Collegamento Foreign Keys (7 Dataset CSV)
              </h3>
              <p className="text-xs text-slate-400">
                Relazioni incrociate normalizzate e gestite in memoria con fallback storage locale
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Relazioni Risolte
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Relazione 1: Veicoli <-> Rifornimenti */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Veicoli ⟷ Rifornimenti</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                FK: ID_Veicolo / Targa
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Collega <strong className="text-slate-900 dark:text-white">{veicoliEnriched.length} veicoli</strong> registrati con le{' '}
              <strong className="text-slate-900 dark:text-white">{rifornimentiCalcolati.length} erogazioni</strong> di carburante, calcolando consumo per tratta (km/l e l/100km).
            </p>
            <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80">
              <span>Tratte calcolate:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {rifornimentiCalcolati.filter((r) => r.deltaKm !== undefined).length} tratte
              </strong>
            </div>
          </div>

          {/* Relazione 2: Operatori <-> Dipendenti */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Operatori ⟷ Dipendenti</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                FK: Matricola / Operatore
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Associa i prelievi cisterna, la guida dei veicoli e la responsabilità degli attrezzi all'organico di{' '}
              <strong className="text-slate-900 dark:text-white">{kpis.dipendentiTotali} dipendenti</strong> (inclusi account Microsoft).
            </p>
            <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80">
              <span>Personale operativo in campo:</span>
              <strong className="text-purple-700 dark:text-purple-300 font-mono">
                {kpis.dipendentiInCampo} dipendenti
              </strong>
            </div>
          </div>

          {/* Relazione 3: Depositi/Cantieri <-> Posizione Attrezzature */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" />
                <span>Depositi / Cantieri ⟷ Asset</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                FK: Posizione
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Traccia la collocazione in tempo reale di{' '}
              <strong className="text-slate-900 dark:text-white">{attrezzatureEnriched.length} strumenti</strong> tra i magazzini centrali, i furgoni flotta e i cantieri attivi.
            </p>
            <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80">
              <span>Posizioni censite:</span>
              <strong className="text-cyan-700 dark:text-cyan-300 font-mono">
                {new Set(attrezzatureEnriched.map((a) => a.Posizione)).size} sedi/mezzi
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Split Row: Cisterna Carburante & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cisterna Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Stato Cisterna Aziendale</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Capacità 5.000 L</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Livello stimato residuo:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {kpis.carburanteCisternaStimatoLitri.toLocaleString('it-IT')} L
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, (kpis.carburanteCisternaStimatoLitri / 5000) * 100))}%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              Calcolato confrontando i carichi fornitori (Registro_Carico_Carburante_2023.csv) con i prelievi veicoli.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={onOpenQuickRifornimento}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Rifornimento Rapido</span>
            </button>
          </div>
        </div>

        {/* Quick Actions & CSV Hub Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Azioni Rapide & Hub 7 CSV</h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Microsoft Power Apps Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateTab('data')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition group flex items-start gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition block">
                  Archivio Completo 7 Tabelle
                </strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualizza, cerca e aggiungi record alle tabelle
                </p>
              </div>
            </button>

            <button
              onClick={exportAllDatasets}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group flex items-start gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition block">
                  Esporta Tutti i 7 CSV Aggiornati
                </strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Con delimitatore ; e UTF-8 BOM per Microsoft Excel
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('flotta')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition group flex items-start gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition block">
                  Schede Dettaglio Flotta & Consumi
                </strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Calcolo km/L, L/100km e verifica totalizzatori
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('asset')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition group flex items-start gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition block">
                  Inventario Asset & Depositi
                </strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtro per magazzino e allarmi scadenze manutenzione
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
