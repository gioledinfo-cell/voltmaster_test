import React, { useState } from 'react';
import {
  Truck,
  Fuel,
  Gauge,
  UserCheck,
  TrendingDown,
  Search,
  Filter,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { VeicoloEnriched } from '../../types/powerApps';
import { VeicoloDettaglioModal } from './VeicoloDettaglioModal';
import { ModuloRapidoRifornimento } from './ModuloRapidoRifornimento';
import { ResourceThumbnail } from '../preview/ResourceThumbnail';

export const FlottaRifornimentiView: React.FC = () => {
  const { veicoliEnriched, rifornimentiCalcolati, exportDataset } = usePowerApps();

  const [searchQuery, setSearchQuery] = useState('');
  const [statoFilter, setStatoFilter] = useState<string>('tutti');
  const [selectedVeicolo, setSelectedVeicolo] = useState<VeicoloEnriched | null>(null);
  const [isRifornimentoOpen, setIsRifornimentoOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | null>(null);

  // Filtered vehicles
  const filteredVeicoli = veicoliEnriched.filter((v) => {
    const matchesSearch =
      v.Targa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.Veicolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v['Modello/Tipologia'] && v['Modello/Tipologia'].toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.Assegnato && v.Assegnato.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStato =
      statoFilter === 'tutti' ||
      (statoFilter === 'attivo' && (v.Stato.toLowerCase().includes('attivo') || v.Stato.toLowerCase().includes('servizio'))) ||
      (statoFilter === 'manutenzione' && v.Stato.toLowerCase().includes('manutenzione')) ||
      (statoFilter === 'fermo' && (v.Stato.toLowerCase().includes('fermo') || v.Stato.toLowerCase().includes('dismesso')));

    return matchesSearch && matchesStato;
  });

  const handleOpenRifornimento = (veicoloId: string) => {
    setPreselectedId(veicoloId);
    setIsRifornimentoOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca targa, modello, autista assegnato..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statoFilter}
              onChange={(e) => setStatoFilter(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="tutti">Tutti gli stati ({veicoliEnriched.length})</option>
              <option value="attivo">Attivi in Servizio</option>
              <option value="manutenzione">In Manutenzione</option>
              <option value="fermo">Fermi / Scorta</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDataset('veicoli')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Esporta Veicoli CSV</span>
          </button>

          <button
            onClick={() => {
              setPreselectedId(null);
              setIsRifornimentoOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Rifornimento</span>
          </button>
        </div>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVeicoli.map((veicolo) => {
          const isAttivo = veicolo.Stato.toLowerCase().includes('attivo');
          const isManutenzione = veicolo.Stato.toLowerCase().includes('manutenzione');

          return (
            <div
              key={veicolo.ID}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs dark:shadow-lg relative group"
            >
              {/* Top Row: Plate & Status */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <ResourceThumbnail
                    category="mezzo"
                    alt={veicolo.Veicolo}
                    code={veicolo.Targa}
                    title={veicolo.Veicolo}
                    subtitle={`Autista: ${veicolo.Assegnato || 'In Pool'}`}
                    size="md"
                    clickable={true}
                    details={[
                      { label: 'Targa', value: veicolo.Targa },
                      { label: 'Stato', value: veicolo.Stato },
                      { label: 'Autista', value: veicolo.Assegnato || 'Non assegnato' },
                      { label: 'Km Ultimo Rifornimento', value: veicolo.Km_veicolo_Ultimo_Rifornimento || 0 },
                    ]}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-mono font-black text-xs tracking-wider shadow-xs border border-slate-300 dark:border-slate-800 truncate">
                        {veicolo.Targa}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          isAttivo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : isManutenzione
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {veicolo.Stato}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition truncate">
                      {veicolo.Veicolo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {veicolo['Modello/Tipologia']}
                    </p>
                  </div>
                </div>

                {/* Driver Tag */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="truncate">
                    Autista: <strong className="text-slate-900 dark:text-white">{veicolo.Assegnato || 'Non assegnato'}</strong>
                  </span>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Km Attuali</span>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {veicolo.Km_veicolo_Ultimo_Rifornimento ? `${veicolo.Km_veicolo_Ultimo_Rifornimento.toLocaleString('it-IT')}` : 'N/D'}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Consumo</span>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {veicolo.consumoMedioKmL} km/L
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Erogati</span>
                    <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {veicolo.totaleLitriErogati} L
                    </span>
                  </div>
                </div>

                {/* Last fueling info */}
                {veicolo.Data_Ultimo_Rifornimento && (
                  <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
                    <span>Ultimo rifornimento:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{veicolo.Data_Ultimo_Rifornimento}</span>
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => setSelectedVeicolo(veicolo)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Dettaglio & Storico ({veicolo.storicoRifornimenti.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenRifornimento(veicolo.ID)}
                  title="Registra Rifornimento per questa targa"
                  className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition"
                >
                  <Fuel className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Fuelings Overall Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-lg text-white">Ultime Erogazioni Carburante (Registro_carburante.csv)</h3>
              <p className="text-xs text-slate-400">Storico completo prelievi cisterna con calcolo delta chilometri e consumi per tratta</p>
            </div>
          </div>
          <button
            onClick={() => exportDataset('rifornimenti')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Esporta Registro Carburante CSV</span>
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/60 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3.5">ID / Data</th>
                  <th className="py-3 px-3">Veicolo & Targa</th>
                  <th className="py-3 px-3">Quantità (L)</th>
                  <th className="py-3 px-3">Km Veicolo</th>
                  <th className="py-3 px-3">Δ Km Tratta</th>
                  <th className="py-3 px-3">Consumo Tratta</th>
                  <th className="py-3 px-3">Totalizzatore Pompa</th>
                  <th className="py-3 px-3">Operatore</th>
                  <th className="py-3 px-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {rifornimentiCalcolati.slice(0, 10).map((rif) => (
                  <tr key={rif.ID} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-300 block">{rif.ID}</span>
                      <span className="text-[11px] text-slate-500">{rif['Data/ora creazione']}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-block">
                        {rif.Targa}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate max-w-[180px]">
                        {rif.Modello_Veicolo}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {rif.Quantità_litri} L
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200">
                      {rif.Km_veicolo.toLocaleString('it-IT')} km
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {rif.deltaKm !== undefined && rif.deltaKm > 0 ? (
                        <span className="text-cyan-400 font-bold">+{rif.deltaKm} km</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {rif.consumoKmL ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px]">
                          {rif.consumoKmL} km/L
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {rif.N_totalizzatore || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-200 font-semibold block">{rif.Operatore}</span>
                      {rif.operatoreDipendente && (
                        <span className="text-[10px] text-slate-500">{rif.operatoreDipendente.Qualifica}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={rif.Note}>
                      {rif.Note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VeicoloDettaglioModal
        veicolo={selectedVeicolo}
        onClose={() => setSelectedVeicolo(null)}
        onOpenRifornimento={(id) => {
          setSelectedVeicolo(null);
          handleOpenRifornimento(id);
        }}
      />

      <ModuloRapidoRifornimento
        isOpen={isRifornimentoOpen}
        onClose={() => setIsRifornimentoOpen(false)}
        preselectedVeicoloId={preselectedId}
      />
    </div>
  );
};
