import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Warehouse, MapPin, X, Plus, PackageCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArticoloMagazzino } from '../../types';
import { playSuccessChime } from '../../utils/audioChime';

interface MagazzinoSearchSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (art: ArticoloMagazzino, quantita: number) => void;
  defaultQuantity?: number;
}

export const MagazzinoSearchSelectModal: React.FC<MagazzinoSearchSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  defaultQuantity = 10,
}) => {
  const { magazzino, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [soloDisponibili, setSoloDisponibili] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filtraggio esclusivo articoli magazzino interno
  const filteredMateriali = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return magazzino.filter((m) => {
      if (soloDisponibili && m.giacenza <= 0) return false;
      if (!q) return true;
      const matchSku = m.codiceSku.toLowerCase().includes(q);
      const matchNome = m.nome.toLowerCase().includes(q);
      const matchScaffale = m.ubicazioneScaffale?.toLowerCase().includes(q) || false;
      return matchSku || matchNome || matchScaffale;
    });
  }, [magazzino, searchTerm, soloDisponibili]);

  if (!isOpen) return null;

  const handleConfirmSelect = (art: ArticoloMagazzino) => {
    const qta = quantities[art.id] || defaultQuantity;
    onSelect(art, qta);
    playSuccessChime();
    showToast(`Aggiunto da Magazzino: ${art.codiceSku} (${qta} ${art.unitaMisura})`, 'success');
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
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header Modal - Stile Blu Magazzino */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold shrink-0">
              <Warehouse className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-400/30 text-blue-100 border border-blue-300/30 font-mono">
                  MAGAZZINO INTERNO
                </span>
                <span className="text-xs text-blue-100 hidden sm:inline">
                  Articoli presenti a scaffale
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Aggiungi Materiale da Magazzino
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Search & Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per codice SKU interno, descrizione articolo o scaffale..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={soloDisponibili}
                onChange={(e) => setSoloDisponibili(e.target.checked)}
                className="accent-blue-600 rounded w-4 h-4"
              />
              <span>Mostra solo articoli con giacenza disponibile (&gt; 0 pz)</span>
            </label>

            <span className="font-mono text-[11px]">
              Trovati: <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredMateriali.length}</strong> articoli
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-white dark:bg-slate-900">
          {filteredMateriali.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Warehouse className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Nessun articolo trovato in magazzino interno.
              </p>
              <p className="text-[11px] text-slate-400">
                Prova a deselezionare "Mostra solo giacenza disponibile" oppure seleziona l'opzione "Aggiungi da Listino RemaTarlazzi".
              </p>
            </div>
          ) : (
            filteredMateriali.map((art) => {
              const qta = quantities[art.id] || defaultQuantity;
              const hasStock = art.giacenza > 0;

              return (
                <div
                  key={art.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded text-[11px] border border-blue-500/20">
                        SKU: {art.codiceSku}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          hasStock
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <PackageCheck className="w-3 h-3" />
                        <span>Giacenza: {art.giacenza} {art.unitaMisura}</span>
                      </span>

                      {art.ubicazioneScaffale && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          Scaffale: {art.ubicazioneScaffale}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {art.nome}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="capitalize">{art.categoria.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>Fornitore originario: {art.fornitore}</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Button */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(art.id, qta - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qta}
                        onChange={(e) => handleUpdateQty(art.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center py-1 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(art.id, qta + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 w-6">
                      {art.unitaMisura}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleConfirmSelect(art)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
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
          <span>Mostra articoli registrati nel magazzino centrale VoltMaster.</span>
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
