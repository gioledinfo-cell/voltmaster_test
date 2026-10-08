import React from 'react';
import {
  Building2,
  FileSpreadsheet,
  Clock,
  Warehouse,
  Wrench,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  PlayCircle,
  ScanLine,
  FileText,
  ShieldCheck,
  Bell,
  Fuel,
  Database,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePowerApps } from '../context/PowerAppsContext';
import { CantieriProgressChartWidget } from './CantieriProgressChartWidget';
import { calcolaSemaforoScadenza } from '../types/scadenze';

interface DashboardProps {
  onOpenFlussoCantiere: () => void;
  onOpenCreateROL: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenFlussoCantiere,
  onOpenCreateROL,
}) => {
  const {
    cantieri,
    preventivi,
    rols,
    magazzino,
    veicoli,
    attrezzature,
    scadenze,
    setActiveTab,
    openScanner,
    openQRModal,
    setSelectedCantiereId,
    currentUser,
    approveROL,
  } = useApp();

  const { kpis } = usePowerApps();

  // Scadenze & Semaforo Alerts
  const scadutiList = scadenze.filter((s) => calcolaSemaforoScadenza(s.dataScadenza).stato === 'scaduto');
  const urgenti15List = scadenze.filter((s) => calcolaSemaforoScadenza(s.dataScadenza).stato === 'urgente_15gg');
  const attenzione30List = scadenze.filter((s) => calcolaSemaforoScadenza(s.dataScadenza).stato === 'attenzione_30gg');

  // Metrics
  const activeCantieri = cantieri.filter((c) => c.stato === 'in_corso');
  const avgProgress = activeCantieri.length > 0
    ? Math.round(activeCantieri.reduce((acc, c) => acc + c.avanzamentoPercentuale, 0) / activeCantieri.length)
    : 0;

  const totalBudget = cantieri.reduce((acc, c) => acc + c.budgetTotale, 0);
  const totalCosti = cantieri.reduce((acc, c) => acc + c.costiConsuntivati, 0);
  const pendingRols = rols.filter((r) => r.stato === 'inviato');
  const lowStockItems = magazzino.filter((m) => m.giacenza <= m.scortaMinima);
  const sortedVeicoliByScadenza = [...veicoli].sort((a, b) => {
    const dateA = a.scadenzaAssicurazione || a.scadenzaRevisione || '9999';
    const dateB = b.scadenzaAssicurazione || b.scadenzaRevisione || '9999';
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 shadow-xs dark:shadow-xl transition-colors duration-200">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 dark:opacity-40 pointer-events-none overflow-hidden">
          <img
            src="/src/assets/images/electrical_switchboard_tech_1790614449576.jpg"
            alt="Quadro Elettrico Industriale"
            className="w-full h-full object-cover mix-blend-luminosity filter contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Sistema di Controllo Operativo e Amministrativo</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Impianti Elettrici, Cantieri e ROL Digitali
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Monitoraggio centralizzato di commesse, preventivazione rapida, inventario con etichette QR e rendicontazione giornaliera certificata con firma grafometrica.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-5">
            <button
              onClick={onOpenFlussoCantiere}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md shadow-amber-500/20 active:scale-95"
            >
              <PlayCircle className="w-4 h-4 fill-slate-950" />
              Avvia Flusso Cantiere Tecnico
            </button>
            <button
              onClick={openScanner}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-95"
            >
              <ScanLine className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Scansiona QR Elemento
            </button>
            <button
              onClick={() => setActiveTab('mappa_gps')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-95"
            >
              <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Mappa Cantieri & Mezzi Live
            </button>
            <button
              onClick={() => setActiveTab('cantieri')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              Visualizza tutti i cantieri
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Cantieri In Corso</span>
            <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {activeCantieri.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">su {cantieri.length} totali</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Avanzamento medio:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{avgProgress}%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">ROL in Attesa di Valutazione</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {pendingRols.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">giornalieri</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Firmati dal cliente:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {pendingRols.filter((r) => r.firmaClientePresente).length} con firma touch
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Volume Preventivi Attivi</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              € {Math.round(preventivi.reduce((a, p) => a + p.totale, 0)).toLocaleString('it-IT')}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Accettati / In lavorazione:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {preventivi.filter((p) => p.stato === 'accettato').length} commesse
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Contabilità Commesse</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              € {Math.round(totalCosti).toLocaleString('it-IT')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">costi</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Budget allocato:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">€ {Math.round(totalBudget).toLocaleString('it-IT')}</span>
          </div>
        </div>
      </div>

      {/* Action Alerts and Approvals Bar */}
      {pendingRols.length > 0 && currentUser.role !== 'operatore' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {pendingRols.length} Rapporto Ore (ROL) da approvare per la contabilità
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {pendingRols[0]?.numero} di {pendingRols[0]?.operatoreNome} su "{pendingRols[0]?.cantiereTitolo}" con firma del committente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => approveROL(pendingRols[0].id)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                Approva Rapido
              </button>
              <button
                onClick={() => setActiveTab('rol')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Apri Modulo ROL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Recharts Active Cantieri Progress Widget */}
      <CantieriProgressChartWidget />

      {/* Visual Semaforo & Deadlines Alert Strip */}
      {(scadutiList.length > 0 || urgenti15List.length > 0) && (
        <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-rose-300 dark:border-rose-500/40 rounded-2xl p-4 shadow-sm dark:shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Scadenziario a Semaforo:
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      {scadutiList.length} criticità scadute
                    </span>
                    {urgenti15List.length > 0 && (
                      <span className="text-orange-600 dark:text-orange-400 font-bold">
                        · {urgenti15List.length} in scadenza &lt;= 15gg
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-transparent">
                    D.Lgs 81/08 & CEI 64-8
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Attenzione a: {scadutiList[0]?.titolo || urgenti15List[0]?.titolo} ({scadutiList[0]?.soggetto || urgenti15List[0]?.soggetto})
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('scadenziario')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/20 shrink-0"
            >
              <span>Gestisci nello Scadenziario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Power Apps 7 CSV Dataset & Fleet Integration Banner */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xs dark:shadow-xl transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Power Apps Migration
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">7 Dataset CSV Sincronizzati</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Flotta Mezzi, Erogazioni Carburante & Asset Operativi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gestione relazionale con tracciamento consumi tratta (km/L), verifiche totalizzatori e inventario depositi.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs w-full lg:w-auto">
              <div className="px-3 py-2 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-semibold">Cantieri Aperti</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">{kpis.cantieriAperti}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">/ {kpis.cantieriTotali}</span>
                </div>
              </div>
              <div
                onClick={() => setActiveTab('veicoli')}
                className="px-3 py-2 bg-white dark:bg-slate-950/70 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                title="Clicca per aprire la Flotta Veicoli"
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block uppercase tracking-wider font-semibold transition-colors">Veicoli Totali</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="font-mono text-base font-bold text-cyan-600 dark:text-cyan-400">{kpis.veicoliTotali}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({kpis.veicoliAttivi} att.)</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-semibold">Carburante</span>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">{kpis.litriTotaliErogati.toLocaleString('it-IT')}</span>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">L</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-semibold">Attrezzature</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="font-mono text-base font-bold text-purple-600 dark:text-purple-400">{kpis.attrezzatureTotali}</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">({kpis.attrezzatureManutenzioneInScadenza} scad.)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('powerapps_flotta_asset')}
              className="w-full sm:w-auto min-h-[44px] justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 shrink-0 active:scale-95"
            >
              <span>Apri Hub Flotta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Cantieri & Quick Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cantieri in Corso (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Cantieri & Commesse Principali</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stato avanzamento lavori, budget e dispositivi installati</p>
            </div>
            <button
              onClick={() => setActiveTab('cantieri')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium inline-flex items-center gap-1"
            >
              Tutti i cantieri <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cantieri.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{c.codice}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.citta}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{c.clienteNome}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{c.titolo}</h3>
                  </div>

                  <button
                    onClick={() =>
                      openQRModal({
                        title: c.titolo,
                        code: c.qrCode,
                        subtitle: `${c.codice} · ${c.clienteNome}`,
                        type: 'cantiere',
                      })
                    }
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-amber-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Etichetta QR Cantiere"
                  >
                    <ScanLine className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Avanzamento lavori</span>
                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{c.avanzamentoPercentuale}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${c.avanzamentoPercentuale}%` }}
                    />
                  </div>
                </div>

                {/* Quick Meta Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>
                      Dispositivi: <strong className="text-slate-800 dark:text-slate-200">{c.dispositivi.length}</strong>
                    </span>
                    <span>
                      Budget: <strong className="text-slate-800 dark:text-slate-200 font-mono">€ {c.budgetTotale.toLocaleString('it-IT')}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCantiereId(c.id);
                      setActiveTab('cantieri');
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                  >
                    Dettagli scheda &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Fleet, Scadenze & Magazzino Alerts (1 col) */}
        <div className="space-y-6">
          {/* Veicoli & Scadenze */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Scadenze Flotta & Mezzi
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('veicoli')}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Gestione
              </button>
            </div>

            <div className="space-y-2">
              {sortedVeicoliByScadenza.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.targa}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{v.kmAttuali.toLocaleString('it-IT')} km</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">{v.modello}</div>
                  <div className="mt-1.5 flex justify-between text-[10px]">
                    <span className="text-slate-500">Autista: {v.autistaAssegnatoNome?.split(' ')[0]}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Assic: {v.scadenzaAssicurazione}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Magazzino Sottoscorta */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Materiali & Scorte Minime
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('magazzino')}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Magazzino
              </button>
            </div>

            <div className="space-y-2">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs flex justify-between items-center"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.nome}</div>
                      <div className="text-[10px] text-rose-700 dark:text-rose-300 font-mono">
                        Giacenza: {item.giacenza} {item.unitaMisura} (Scorta min: {item.scortaMinima})
                      </div>
                    </div>
                    <span className="text-[10px] bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold shrink-0 border border-rose-300 dark:border-rose-500/30">
                      ORDINA
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                  Tutti i materiali sono sopra la soglia di sicurezza.
                </div>
              )}

              {/* Sample high stock article */}
              {magazzino.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.nome}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{item.codiceSku}</div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 shrink-0">
                    {item.giacenza} {item.unitaMisura}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attrezzature in Dotazione e Tarature CEI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Verifiche Strumenti CEI 64-8
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('attrezzature')}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Tutti
              </button>
            </div>
            {attrezzature.slice(0, 2).map((a) => (
              <div key={a.id} className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-medium text-slate-800 dark:text-slate-200">{a.nome}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between mt-1">
                  <span>Matricola: {a.matricola}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Taratura: {a.prossimaTaratura}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
