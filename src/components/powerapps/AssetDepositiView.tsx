import React, { useState } from 'react';
import {
  Wrench,
  Warehouse,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  Box,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { AddRecordModal } from './AddRecordModal';
import { ResourceThumbnail } from '../preview/ResourceThumbnail';

export const AssetDepositiView: React.FC = () => {
  const {
    attrezzatureEnriched,
    depositi,
    cantieri,
    exportDataset,
  } = usePowerApps();

  const [searchQuery, setSearchQuery] = useState('');
  const [posizioneFilter, setPosizioneFilter] = useState('tutti');
  const [scadenzaFilter, setScadenzaFilter] = useState('tutti');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filtered equipment
  const filteredAttrezzature = attrezzatureEnriched.filter((att) => {
    const matchesSearch =
      att.Titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.Attrezzo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att['Cod Matricola'].toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.ID_Attrezzo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (att['Oper. Responsabi'] && att['Oper. Responsabi'].toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPosizione =
      posizioneFilter === 'tutti' || att.Posizione.toLowerCase() === posizioneFilter.toLowerCase();

    let matchesScadenza = true;
    if (scadenzaFilter === 'scadute') {
      matchesScadenza = att.isManutenzioneScaduta || att.isGaranziaScaduta;
    } else if (scadenzaFilter === 'in_scadenza') {
      matchesScadenza = att.isManutenzioneInScadenza;
    } else if (scadenzaFilter === 'regolari') {
      matchesScadenza = !att.isManutenzioneScaduta && !att.isManutenzioneInScadenza;
    }

    return matchesSearch && matchesPosizione && matchesScadenza;
  });

  // Calculate unique locations
  const allLocations = Array.from(new Set(attrezzatureEnriched.map((a) => a.Posizione))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca attrezzo, matricola, fornitore, responsabile..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Posizione Dropdown */}
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={posizioneFilter}
              onChange={(e) => setPosizioneFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="tutti">Tutte le Posizioni ({attrezzatureEnriched.length} attrezzi)</option>
              {allLocations.map((loc) => {
                const count = attrezzatureEnriched.filter((a) => a.Posizione === loc).length;
                return (
                  <option key={loc} value={loc}>
                    {loc} ({count})
                  </option>
                );
              })}
            </select>

            {/* Scadenza Filter */}
            <select
              value={scadenzaFilter}
              onChange={(e) => setScadenzaFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="tutti">Tutte le conformità</option>
              <option value="scadute">🔴 Scadute (Manutenzione/Garanzia)</option>
              <option value="in_scadenza">🟡 In Scadenza (entro 30gg)</option>
              <option value="regolari">🟢 Regolari e Conforme</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportDataset('attrezzature')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Esporta CSV</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Asset / Attrezzo</span>
            </button>
          </div>
        </div>

        {/* Deposito Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 shrink-0 font-semibold">Filtri rapidi:</span>
          <button
            onClick={() => setPosizioneFilter('tutti')}
            className={`px-3 py-1 rounded-lg transition font-medium shrink-0 ${
              posizioneFilter === 'tutti'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Tutti ({attrezzatureEnriched.length})
          </button>
          {depositi.map((dep) => {
            const count = attrezzatureEnriched.filter(
              (a) => a.Posizione.toLowerCase() === dep.Titolo.toLowerCase()
            ).length;
            const isSelected = posizioneFilter.toLowerCase() === dep.Titolo.toLowerCase();
            return (
              <button
                key={dep.Titolo}
                onClick={() => setPosizioneFilter(dep.Titolo)}
                className={`px-3 py-1 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {dep.Tipologia.includes('Furgone') ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : (
                  <Warehouse className="w-3.5 h-3.5" />
                )}
                <span>{dep.Titolo}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-950/40 text-[10px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAttrezzature.map((att) => {
          const isManutScad = att.isManutenzioneScaduta;
          const isManutInScad = att.isManutenzioneInScadenza;
          const isGarScad = att.isGaranziaScaduta;

          return (
            <div
              key={att.ID}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition flex flex-col justify-between shadow-xs dark:shadow-lg relative ${
                isManutScad
                  ? 'border-rose-300 dark:border-rose-500/50 hover:border-rose-400'
                  : isManutInScad
                  ? 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start gap-3 mb-2.5">
                  <ResourceThumbnail
                    category="attrezzatura"
                    alt={att.Titolo}
                    code={att.ID_Attrezzo}
                    title={att.Titolo}
                    subtitle={`Matricola: ${att['Cod Matricola']} · Posizione: ${att.Posizione}`}
                    size="md"
                    clickable={true}
                    details={[
                      { label: 'Matricola', value: att['Cod Matricola'] },
                      { label: 'Posizione', value: att.Posizione },
                      { label: 'Responsabile', value: att['Oper. Responsabi'] || 'Aziendale' },
                      { label: 'Manutenzione', value: att.Data_Manutezione || 'Regolare' },
                    ]}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-mono text-xs font-bold border border-cyan-200 dark:border-slate-700 truncate">
                          {att.ID_Attrezzo}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {att.Tecno_Codice}
                        </span>
                      </div>

                      {isManutScad ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                          Scaduta
                        </span>
                      ) : isManutInScad ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shrink-0">
                          <Clock className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                          {att.giorniAllaManutenzione} gg
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                          Conforme
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{att.Titolo}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium truncate">{att.Attrezzo}</p>
                  </div>
                </div>

                {/* Location Badge */}
                <div className="mt-3 flex items-center gap-2 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Collocazione / Posizione:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{att.Posizione}</strong>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Matricola Seriale</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {att['Cod Matricola'] || 'N/D'}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Contenitore</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {att.Contenitore || 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Scadenze Dates Bar */}
                <div className="mt-3 space-y-1.5 text-xs p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Prossima Manutenzione:
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isManutScad ? 'text-rose-600 dark:text-rose-400' : isManutInScad ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {att.Data_Manutezione || 'N/D'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      Scadenza Garanzia:
                    </span>
                    <span
                      className={`font-mono ${
                        isGarScad ? 'text-rose-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {att['Data Garanzia'] || 'N/D'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsible Worker Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">
                    Resp: <strong className="text-white">{att['Oper. Responsabi'] || 'Non assegnato'}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {att.Fornitore}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAttrezzature.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl text-slate-400">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="font-bold text-base text-slate-200">Nessuna attrezzatura trovata</h3>
          <p className="text-xs text-slate-500 mt-1">Prova a cambiare i parametri di ricerca o il filtro posizione.</p>
        </div>
      )}

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        datasetType="attrezzature"
      />
    </div>
  );
};
