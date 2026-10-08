import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Database,
  Building2,
  Package,
  ExternalLink,
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useApp } from '../context/AppContext';

export const NetworkStatusIndicator: React.FC = () => {
  const status = useNetworkStatus();
  const { showToast, offlineCacheInfo, refreshOfflineCache, openOfflineModal } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);

  // Allow manual toggle for field test simulation (e.g. testing in basement/blind spot)
  const isActuallyOnline = simulatedOffline ? false : status.isOnline;

  const handleTestToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !simulatedOffline;
    setSimulatedOffline(nextState);
    if (nextState) {
      showToast('⚠️ Modalità Cantiere Offline Simulata (Nessun segnale)', 'warning');
    } else {
      showToast('✓ Riconnesso alla rete (Online)', 'success');
    }
  };

  const handleManualCacheRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingCache(true);
    await refreshOfflineCache(true);
    setTimeout(() => {
      setIsRefreshingCache(false);
    }, 500);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${
          isActuallyOnline
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/60 shadow-sm shadow-emerald-950/50'
            : 'bg-rose-950/60 border-rose-500/60 text-rose-200 hover:bg-rose-900/60 hover:border-rose-500 shadow-md shadow-rose-950/70 animate-pulse'
        }`}
        title={
          isActuallyOnline
            ? 'Connessione attiva: ROL e dati sincronizzati in tempo reale'
            : 'ATTENZIONE: Offline / Zona d’ombra! I dati ROL e firme vengono salvati in locale sul dispositivo'
        }
        aria-label={isActuallyOnline ? 'Online' : 'Offline'}
      >
        <span className="relative flex h-2 w-2">
          {isActuallyOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </>
          )}
        </span>

        {isActuallyOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}

        <span className="font-bold tracking-tight text-[11px] uppercase">
          {isActuallyOnline ? 'Online' : 'Offline'}
        </span>

        {status.effectiveType && isActuallyOnline && (
          <span className="hidden xl:inline text-[9px] font-mono text-emerald-400/80 bg-emerald-950/80 px-1 rounded">
            {status.effectiveType.toUpperCase()}
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {/* Connectivity Diagnostics Popover */}
      {showDetails && (
        <div
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3.5 z-50 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200">
              {isActuallyOnline ? (
                <Wifi className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              )}
              <span>Stato Connettività Cantiere</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                isActuallyOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
              }`}
            >
              {isActuallyOnline ? 'Connesso' : 'Disconnesso'}
            </span>
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
            {isActuallyOnline ? (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200/90 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Sincronizzazione in tempo reale attiva:</strong>
                  <div>Rapportini ROL, firme clienti e carichi magazzino vengono inviati all'istante al database centrale.</div>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Modalità Offline Cantiere Protetta:</strong>
                  <div>Puoi continuare a compilare ore ROL, firmare e scansionare QR. I dati sono protetti nella memoria locale (Cache/IndexedDB) e si sincronizzeranno appena torna il segnale.</div>
                </div>
              </div>
            )}

            {/* Offline Local Storage & Cache Summary */}
            <div className="bg-slate-50 dark:bg-slate-950/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  Cache Offline ({offlineCacheInfo.storageEngine})
                </span>
                <button
                  onClick={handleManualCacheRefresh}
                  disabled={isRefreshingCache}
                  className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                  title="Sincronizza ora i dati in locale"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingCache ? 'animate-spin' : ''}`} />
                  <span>Sincronizza</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <div
                  onClick={() => {
                    setShowDetails(false);
                    openOfflineModal('cantieri');
                  }}
                  className="p-1.5 bg-white dark:bg-slate-900/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40 cursor-pointer transition-colors"
                >
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Cantieri Attivi
                  </div>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-300 text-xs mt-0.5">
                    {offlineCacheInfo.activeCantieriCount} salvati
                  </div>
                </div>

                <div
                  onClick={() => {
                    setShowDetails(false);
                    openOfflineModal('materiali');
                  }}
                  className="p-1.5 bg-white dark:bg-slate-900/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/40 cursor-pointer transition-colors"
                >
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Package className="w-3 h-3 text-cyan-500 dark:text-cyan-400" /> Materiali
                  </div>
                  <div className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-xs mt-0.5">
                    {offlineCacheInfo.materialiCount} salvati
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDetails(false);
                  openOfflineModal();
                }}
                className="w-full mt-1 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 rounded font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Esplora Archivio Offline Cantiere</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Technical network details */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Rete Rilevata:</span>
                <span className="text-slate-800 dark:text-slate-200">{status.effectiveType ? status.effectiveType.toUpperCase() : 'Wi-Fi / Mobile'}</span>
              </div>
              {status.downlink && (
                <div className="flex justify-between">
                  <span>Velocità stimata:</span>
                  <span className="text-slate-800 dark:text-slate-200">{status.downlink} Mbps</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ultima sincronizzazione:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{offlineCacheInfo.formattedTime || 'Recente'}</span>
              </div>
            </div>

            {/* Simulation switch for testing underground / basement scenarios */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Test zona cieca / seminterrato:</span>
              <button
                onClick={handleTestToggle}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                  simulatedOffline
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {simulatedOffline ? 'Ripristina Rete Normale' : 'Simula Offline Cantiere'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
