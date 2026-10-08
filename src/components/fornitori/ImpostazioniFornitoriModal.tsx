import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Building2,
  Settings,
  Search,
  Tag,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AggiornaListinoExcelModal } from '../magazzino/AggiornaListinoExcelModal';
import { LISTINO_REMATARLAZZI } from '../../data/listinoFornitore';

interface ImpostazioniFornitoriModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImpostazioniFornitoriModal: React.FC<ImpostazioniFornitoriModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { listinoFornitore, fornitori, showToast } = useApp();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('tutti');

  const catalog = listinoFornitore && listinoFornitore.length > 0 ? listinoFornitore : LISTINO_REMATARLAZZI;

  const brands = Array.from(new Set(catalog.map((item) => item.marchio)));

  const filteredItems = catalog.filter((item) => {
    if (selectedBrand !== 'tutti' && item.marchio !== selectedBrand) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.codiceFornitore.toLowerCase().includes(q) ||
      item.descrizione.toLowerCase().includes(q) ||
      item.marchio.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-500">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Impostazioni / Fornitori
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Gestione anagrafiche e listini d'acquisto
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                Impostazioni Fornitori & Listino Prezzi RemaTarlazzi
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Action Banner */}
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-cyan-500/10 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Aggiorna Listino Prezzi da Excel (RemaTarlazzi)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Carica il foglio <code>LISRTAXLS</code> per aggiornare automaticamente i prezzi netti d'acquisto e listino, o aggiungere nuovi codici materiale in tempo reale.
              </p>
            </div>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Carica Foglio Excel (LISRTAXLS)</span>
            </button>
          </div>

          {/* Anagrafica Fornitori Convenzionati */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Fornitori Principali Registrati ({fornitori.length})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fornitori.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <span>{f.ragioneSociale}</span>
                      {f.ragioneSociale.includes('Rema') && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          PREFERENZIALE
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500">P.IVA: <span className="font-mono">{f.partitaIva}</span></div>
                    <div className="text-slate-500">{f.email || 'ordini@rematarlazzi.it'}</div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Attivo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Catalogo Listino Locale RemaTarlazzi */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Anagrafica Articoli Listino RemaTarlazzi ({catalog.length})</span>
              </h4>

              <div className="flex items-center gap-2">
                {/* Brand Filter */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="tutti">Tutti i Marchi</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cerca codice o descrizione..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Codice Fornitore</th>
                    <th className="p-3">Marchio</th>
                    <th className="p-3">Descrizione Articolo</th>
                    <th className="p-3 text-center">U.M.</th>
                    <th className="p-3 text-right">Prezzo Acquisto (€)</th>
                    <th className="p-3 text-right">Prezzo Listino (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {item.codiceFornitore}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.marchio}
                      </td>
                      <td className="p-3 text-slate-900 dark:text-slate-100">
                        {item.descrizione}
                      </td>
                      <td className="p-3 text-center font-mono font-bold uppercase text-slate-500">
                        {item.unitaMisura}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        € {item.prezzoAcquisto.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500 line-through">
                        € {item.prezzoListino.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Stato listino sincronizzato in locale con local storage VoltMaster.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl"
          >
            Chiudi
          </button>
        </div>
      </div>

      {/* Modal Excel */}
      {isExcelModalOpen && (
        <AggiornaListinoExcelModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
        />
      )}
    </div>
  );
};
