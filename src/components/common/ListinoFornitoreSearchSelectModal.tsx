import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Truck, Tag, X, Plus, DollarSign, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArticoloListinoFornitore, LISTINO_REMATARLAZZI } from '../../data/listinoFornitore';
import { playSuccessChime } from '../../utils/audioChime';

interface ListinoFornitoreSearchSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ArticoloListinoFornitore, quantita: number) => void;
  defaultQuantity?: number;
}

export const ListinoFornitoreSearchSelectModal: React.FC<ListinoFornitoreSearchSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  defaultQuantity = 1,
}) => {
  const { listinoFornitore, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [marchioFilter, setMarchioFilter] = useState<string>('tutti');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const catalogToUse = useMemo(() => {
    return listinoFornitore && listinoFornitore.length > 0
      ? listinoFornitore
      : LISTINO_REMATARLAZZI;
  }, [listinoFornitore]);

  // Lista marchi unici disponibili
  const marchiUnici = useMemo(() => {
    const set = new Set<string>();
    catalogToUse.forEach((art) => {
      if (art.marchio) set.add(art.marchio);
    });
    return Array.from(set);
  }, [catalogToUse]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filtraggio ESCLUSIVO nel listino fornitore RemaTarlazzi
  const filteredListino = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return catalogToUse.filter((item) => {
      if (marchioFilter !== 'tutti' && item.marchio !== marchioFilter) {
        return false;
      }
      if (!q) return true;
      const matchCod = item.codiceFornitore.toLowerCase().includes(q);
      const matchDesc = item.descrizione.toLowerCase().includes(q);
      const matchMarchio = item.marchio.toLowerCase().includes(q);
      const matchEan = item.barcodeEan?.toLowerCase().includes(q) || false;
      return matchCod || matchDesc || matchMarchio || matchEan;
    });
  }, [catalogToUse, searchTerm, marchioFilter]);

  if (!isOpen) return null;

  const handleConfirmSelect = (item: ArticoloListinoFornitore) => {
    const qta = quantities[item.id] || defaultQuantity;
    onSelect(item, qta);
    playSuccessChime();
    showToast(
      `Aggiunto da Listino RemaTarlazzi: ${item.codiceFornitore} (${qta} ${item.unitaMisura})`,
      'success'
    );
    onClose();
  };

  const handleUpdateQty = (id: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, val),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header Modal - Stile Arancione Listino RemaTarlazzi */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-950/20 text-slate-950 border border-slate-950/30 font-mono">
                  CATALOGO FORNITORE · REMATARLAZZI
                </span>
                <span className="text-xs text-slate-900 font-semibold hidden sm:inline">
                  Foglio LISRTAXLS (Non in magazzino o da ordinare)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                Aggiungi da Listino RemaTarlazzi
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-950 hover:bg-slate-950/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Search & Brand Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per codice fornitore (AM4003C, GWA1201, ABLM1A24012, CAV...), marca o descrizione..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Produttore:
              </span>
              <select
                value={marchioFilter}
                onChange={(e) => setMarchioFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="tutti">Tutti i Marchi ({catalogToUse.length})</option>
                {marchiUnici.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Cerca nel database precompilato da Excel RemaTarlazzi (Bticino, Gewiss, Schneider, ABB, Cavi...)
              </span>
            </div>
            <span className="font-mono text-[11px]">
              Trovati: <strong className="text-amber-600 dark:text-amber-400 font-bold">{filteredListino.length}</strong> articoli
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-white dark:bg-slate-900">
          {filteredListino.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Nessun articolo trovato nel listino RemaTarlazzi per i criteri cercati.
              </p>
              <p className="text-[11px] text-slate-400">
                Prova ad azzerare i filtri di ricerca per codice o marchio.
              </p>
            </div>
          ) : (
            filteredListino.map((item) => {
              const qta = quantities[item.id] || defaultQuantity;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] border border-amber-500/30">
                        Cod. Fornitore: {item.codiceFornitore}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                        <Tag className="w-3 h-3 text-amber-500" />
                        {item.marchio} ({item.siglaMarchio})
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <Truck className="w-3 h-3" />
                        <span>Fornitore: RemaTarlazzi</span>
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {item.descrizione}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span className="capitalize">{item.categoria.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>UM: <strong className="font-mono">{item.unitaMisura}</strong></span>
                      {item.barcodeEan && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-400">EAN: {item.barcodeEan}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prezzi & Action */}
                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        € {item.prezzoAcquisto.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-slate-500">/ {item.unitaMisura} (Acq. Netto)</span>
                      </div>
                      {item.prezzoListino > 0 && (
                        <div className="text-[10px] text-slate-400 line-through">
                          Listino: € {item.prezzoListino.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, qta - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qta}
                        onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center py-1 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, qta + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmSelect(item)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Conferma</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Catalogo fornito direttamente da RemaTarlazzi per ordini e materiale non presente a scaffale.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
