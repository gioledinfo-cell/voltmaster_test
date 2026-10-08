import React from 'react';
import {
  X,
  Truck,
  Fuel,
  Gauge,
  Calendar,
  UserCheck,
  TrendingDown,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { VeicoloEnriched } from '../../types/powerApps';
import { exportToCsv } from '../../services/csvIngestionService';

interface VeicoloDettaglioModalProps {
  veicolo: VeicoloEnriched | null;
  onClose: () => void;
  onOpenRifornimento: (veicoloId: string) => void;
}

export const VeicoloDettaglioModal: React.FC<VeicoloDettaglioModalProps> = ({
  veicolo,
  onClose,
  onOpenRifornimento,
}) => {
  if (!veicolo) return null;

  const handleExportVehicleRifornimenti = () => {
    if (!veicolo.storicoRifornimenti || veicolo.storicoRifornimenti.length === 0) return;
    exportToCsv('rifornimenti', veicolo.storicoRifornimenti, `Rifornimenti_${veicolo.Targa}.csv`);
  };

  const getStatusBadge = (stato: string) => {
    const s = stato.toLowerCase();
    if (s.includes('attivo') || s.includes('servizio')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Attivo in Flotta
        </span>
      );
    }
    if (s.includes('manutenzione') || s.includes('officina')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          In Manutenzione
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        Fermo / Fuori Servizio
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 my-auto">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700/80 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-0.5 rounded-md bg-white text-slate-950 font-mono font-black text-lg tracking-widest border border-slate-300 shadow-sm">
                  {veicolo.Targa}
                </span>
                {getStatusBadge(veicolo.Stato)}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  {veicolo.Euro}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{veicolo.Veicolo}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{veicolo['Modello/Tipologia']}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRifornimento(veicolo.ID)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Nuovo Rifornimento</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Chilometraggio</span>
                <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {veicolo.Km_veicolo_Ultimo_Rifornimento ? `${veicolo.Km_veicolo_Ultimo_Rifornimento.toLocaleString('it-IT')} km` : 'N/D'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">All'ultimo rifornimento</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Carburante Erogato</span>
                <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {veicolo.totaleLitriErogati.toLocaleString('it-IT')} L
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Su {veicolo.storicoRifornimenti.length} rifornimenti</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Consumo Medio</span>
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {veicolo.consumoMedioKmL} km/L
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{veicolo.consumoMedioL100Km} L / 100km</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Autista / Assegnato</span>
                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {veicolo.Assegnato || 'Non assegnato'}
              </p>
              {veicolo.autistaDipendente ? (
                <p className="text-[11px] text-purple-600 dark:text-purple-300 truncate mt-0.5">
                  Matr: {veicolo.autistaDipendente.Matricola} ({veicolo.autistaDipendente.Qualifica})
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Parco comune aziendale</p>
              )}
            </div>
          </div>

          {/* Details Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Data Acquisto:</span>{' '}
              <strong className="text-slate-800 dark:text-slate-200">{veicolo.Data_acquisto || 'N/D'}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Ultimo Prelievo:</span>{' '}
              <strong className="text-slate-800 dark:text-slate-200">{veicolo.Data_Ultimo_Rifornimento || 'N/D'}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Note Flotta:</span>{' '}
              <span className="text-slate-700 dark:text-slate-300 italic">{veicolo.Note || 'Nessuna nota'}</span>
            </div>
          </div>

          {/* Tabella Correlata Storico Erogazioni (Registro_carburante) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Storico Erogazioni Carburante & Calcolo Tratte
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  {veicolo.storicoRifornimenti.length} record
                </span>
              </div>
              {veicolo.storicoRifornimenti.length > 0 && (
                <button
                  onClick={handleExportVehicleRifornimenti}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Esporta CSV Scheda</span>
                </button>
              )}
            </div>

            {veicolo.storicoRifornimenti.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                <Fuel className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nessun rifornimento registrato per questa targa</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Usa il modulo rapido per registrare il primo pieno</p>
                <button
                  onClick={() => onOpenRifornimento(veicolo.ID)}
                  className="mt-3 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registra Ora</span>
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3.5">ID / Data</th>
                        <th className="py-3 px-3">Quantità (L)</th>
                        <th className="py-3 px-3">Km Veicolo</th>
                        <th className="py-3 px-3">Δ Tratta (Km)</th>
                        <th className="py-3 px-3">Consumo Tratta</th>
                        <th className="py-3 px-3">Totalizzatore</th>
                        <th className="py-3 px-3">Operatore</th>
                        <th className="py-3 px-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {veicolo.storicoRifornimenti.map((rif) => (
                        <tr key={rif.ID} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-300 block">{rif.ID}</span>
                            <span className="text-[11px] text-slate-500">{rif['Data/ora creazione']}</span>
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
                            {rif.deltaKm !== undefined ? (
                              <span className="text-cyan-600 dark:text-cyan-400 font-bold">+{rif.deltaKm} km</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {rif.consumoKmL ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-mono font-bold text-[11px]">
                                {rif.consumoKmL} km/L
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 text-[11px]">Primo rilevamento</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {rif.N_totalizzatore || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-900 dark:text-slate-200 font-semibold block">{rif.Operatore}</span>
                            {rif.operatoreDipendente && (
                              <span className="text-[10px] text-slate-500">{rif.operatoreDipendente.Qualifica}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={rif.Note}>
                            {rif.Note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Relazione foreign key ID_Veicolo: <strong className="text-slate-800 dark:text-slate-300">{veicolo.ID}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl transition"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
