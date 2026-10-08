import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Search,
  Users,
  Truck,
  Wrench,
  Warehouse,
  Building2,
  Fuel,
  Package,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { CsvDatasetType } from '../../types/powerApps';
import { CSV_TABLE_CONFIGS } from '../../services/csvIngestionService';
import { AddRecordModal } from './AddRecordModal';

export const DataIngestionTableView: React.FC = () => {
  const {
    dipendenti,
    veicoli,
    attrezzature,
    depositi,
    cantieri,
    rifornimenti,
    carichi_carburante,
    exportDataset,
    exportAllDatasets,
    deleteRecord,
  } = usePowerApps();

  const [activeDataset, setActiveDataset] = useState<CsvDatasetType>('dipendenti');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const datasetMap: Record<CsvDatasetType, any[]> = {
    dipendenti,
    veicoli,
    attrezzature,
    depositi,
    cantieri,
    rifornimenti,
    carichi_carburante,
  };

  const currentConfig = CSV_TABLE_CONFIGS[activeDataset];
  const currentRows = datasetMap[activeDataset];

  // Filtering
  const filteredRows = currentRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const datasetTabs: { type: CsvDatasetType; label: string; icon: React.ReactNode; count: number }[] = [
    { type: 'dipendenti', label: '1. Dipendenti', icon: <Users className="w-4 h-4" />, count: dipendenti.length },
    { type: 'veicoli', label: '2. Veicoli & Flotta', icon: <Truck className="w-4 h-4" />, count: veicoli.length },
    { type: 'attrezzature', label: '3. Attrezzature', icon: <Wrench className="w-4 h-4" />, count: attrezzature.length },
    { type: 'depositi', label: '4. Depositi & Hub', icon: <Warehouse className="w-4 h-4" />, count: depositi.length },
    { type: 'cantieri', label: '5. Cantieri & Commesse', icon: <Building2 className="w-4 h-4" />, count: cantieri.length },
    { type: 'rifornimenti', label: '6. Registro Carburante', icon: <Fuel className="w-4 h-4" />, count: rifornimenti.length },
    { type: 'carichi_carburante', label: '7. Carico Cisterna', icon: <Package className="w-4 h-4" />, count: carichi_carburante.length },
  ];

  const handleTabChange = (t: CsvDatasetType) => {
    setActiveDataset(t);
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Dataset Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {datasetTabs.map((tab) => {
          const isActive = activeDataset === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/50 text-slate-900 dark:text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500'}>{tab.icon}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </div>
              <span className="text-xs font-bold truncate block">{tab.label}</span>
              <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-mono">
                {CSV_TABLE_CONFIGS[tab.type].fileName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Actions & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{currentConfig.title}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-300 font-mono border border-slate-200 dark:border-slate-700">
                {currentConfig.fileName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentConfig.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddRecordOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Record</span>
            </button>

            <button
              onClick={() => exportDataset(activeDataset)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
              title="Esporta tabella attiva in formato CSV standard per Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Esporta CSV</span>
            </button>

            <button
              onClick={exportAllDatasets}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
              title="Scarica tutti e 7 i file CSV separati"
            >
              <Download className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span>Esporta Tutti (7 CSV)</span>
            </button>
          </div>
        </div>

        {/* Search & Meta strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={`Cerca in ${currentConfig.title}...`}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Mostrando <strong className="text-slate-900 dark:text-white">{filteredRows.length}</strong> su{' '}
              <strong className="text-slate-900 dark:text-white">{currentRows.length}</strong> record
            </span>
            <span>•</span>
            <span>PK: <strong className="text-amber-500 dark:text-amber-400 font-mono">{currentConfig.primaryKey}</strong></span>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/60 shadow-xs">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3">#</th>
                  {currentConfig.expectedHeaders.map((header) => (
                    <th key={header} className="py-3 px-3.5 whitespace-nowrap">
                      {header}
                      {header === currentConfig.primaryKey && (
                        <span className="ml-1 text-[10px] text-amber-400 font-mono">(PK)</span>
                      )}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                {paginatedRows.map((row, idx) => {
                  const pkValue = row[currentConfig.primaryKey];
                  const rowIndex = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr key={pkValue || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{rowIndex}</td>
                      {currentConfig.expectedHeaders.map((header) => (
                        <td
                          key={header}
                          className="py-2.5 px-3.5 whitespace-nowrap text-slate-200 max-w-[240px] truncate"
                          title={String(row[header] ?? '')}
                        >
                          {row[header] !== undefined && row[header] !== null && String(row[header]) !== '' ? (
                            String(row[header])
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteRecord(activeDataset, pkValue)}
                          title="Elimina record"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination & Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Pagina <strong className="text-slate-900 dark:text-white">{page}</strong> di <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
              >
                Precedente
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRecordModal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        datasetType={activeDataset}
      />
    </div>
  );
};
