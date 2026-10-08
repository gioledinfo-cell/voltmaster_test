import React, { useState } from 'react';
import {
  Database,
  BarChart3,
  Truck,
  Fuel,
  Wrench,
  Download,
  Sparkles,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { PowerAppsDashboardView } from './PowerAppsDashboardView';
import { FlottaRifornimentiView } from './FlottaRifornimentiView';
import { AssetDepositiView } from './AssetDepositiView';
import { DataIngestionTableView } from './DataIngestionTableView';
import { ModuloRapidoRifornimento } from './ModuloRapidoRifornimento';

export type PowerAppsSubTab = 'dashboard' | 'flotta' | 'asset' | 'data' | 'rifornimento';

export const PowerAppsModule: React.FC = () => {
  const { kpis, exportAllDatasets } = usePowerApps();

  const [activeTab, setActiveTab] = useState<PowerAppsSubTab>('dashboard');
  const [isQuickRifornimentoOpen, setIsQuickRifornimentoOpen] = useState(false);

  const tabs: { id: PowerAppsSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard KPI',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'flotta',
      label: 'Scheda Flotta & Rifornimenti',
      icon: <Truck className="w-4 h-4" />,
      badge: `${kpis.veicoliAttivi}/${kpis.veicoliTotali}`,
    },
    {
      id: 'asset',
      label: 'Gestione Asset & Depositi',
      icon: <Wrench className="w-4 h-4" />,
      badge: kpis.attrezzatureManutenzioneInScadenza > 0 ? `${kpis.attrezzatureManutenzioneInScadenza} in scad.` : undefined,
    },
    {
      id: 'data',
      label: 'Gestione 7 Tabelle',
      icon: <Database className="w-4 h-4" />,
      badge: '7 Dataset',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Integrazione Microsoft Power Apps
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Archivio Reale & Collegamenti Relazionali
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestione Operativa Flotta, Carburante, Asset & Cantieri
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Sistema integrato per i 7 dataset: <strong>Elenco Dipendenti</strong>, <strong>Veicoli</strong>,{' '}
              <strong>Attrezzature</strong>, <strong>Depositi</strong>, <strong>Registro Cantieri</strong>,{' '}
              <strong>Registro Carburante</strong> e <strong>Carico Cisterna</strong> con normalizzazione relazionale, calcolo consumi e sincronizzazione locale.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsQuickRifornimentoOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Fuel className="w-4 h-4" />
              <span>Rifornimento Rapido</span>
            </button>

            <button
              onClick={exportAllDatasets}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
              title="Esporta tutti i 7 file CSV in un click"
            >
              <Download className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Esporta 7 CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-black/20 text-slate-950 font-black'
                        : 'bg-slate-200 dark:bg-slate-800 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && (
        <PowerAppsDashboardView
          onNavigateTab={(tabId) => setActiveTab(tabId as PowerAppsSubTab)}
          onOpenQuickRifornimento={() => setIsQuickRifornimentoOpen(false)}
        />
      )}

      {activeTab === 'flotta' && <FlottaRifornimentiView />}

      {activeTab === 'asset' && <AssetDepositiView />}

      {activeTab === 'data' && <DataIngestionTableView />}

      {/* Modals */}
      <ModuloRapidoRifornimento
        isOpen={isQuickRifornimentoOpen}
        onClose={() => setIsQuickRifornimentoOpen(false)}
      />
    </div>
  );
};
