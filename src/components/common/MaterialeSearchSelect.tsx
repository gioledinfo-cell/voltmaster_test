import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Barcode,
  Layers,
  Warehouse,
  Truck,
  Check,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  DollarSign,
  Tag,
  ScanLine,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArticoloMagazzino } from '../../types';
import { playSuccessChime } from '../../utils/audioChime';

export interface MaterialeSearchSelectProps {
  onSelect: (art: ArticoloMagazzino, quantita: number) => void;
  placeholder?: string;
  variant?: 'modal' | 'dropdown' | 'inline';
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  defaultQuantity?: number;
  minQuantity?: number;
  initialSearch?: string;
  fornitoreFilter?: string;
}

export const CATEGORIE_MERCEOLOGICHE: {
  id: 'tutte' | ArticoloMagazzino['categoria'];
  label: string;
}[] = [
  { id: 'tutte', label: 'Tutte le Categorie' },
  { id: 'cavi_elettrici', label: 'Cavi & Conduttori' },
  { id: 'quadri_modulari', label: 'Quadri & Modulari' },
  { id: 'apparecchi_comando', label: 'Prese & Comandi' },
  { id: 'tubi_canaline', label: 'Tubi, Canali & Scatole' },
  { id: 'illuminazione', label: 'Illuminazione & LED' },
  { id: 'fotovoltaico_accumulo', label: 'FV & Accumulo' },
  { id: 'materiale_vario', label: 'Materiale Vario' },
];

export const MaterialeSearchSelect: React.FC<MaterialeSearchSelectProps> = ({
  onSelect,
  placeholder = 'Cerca per codice SKU/Fornitore, descrizione, marchio o barcode EAN...',
  variant = 'dropdown',
  isOpen = true,
  onClose,
  title = 'Ricerca Universale Articoli & Catalogo',
  subtitle = 'Trova articoli da magazzino centrale o dal listino fornitori RemaTarlazzi',
  defaultQuantity = 1,
  minQuantity = 1,
  initialSearch = '',
  fornitoreFilter,
}) => {
  const { magazzino, openScanner, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutte');
  const [filterStockOnly, setFilterStockOnly] = useState<boolean>(false);
  const [filterFornitore, setFilterFornitore] = useState<string>(fornitoreFilter || 'tutti');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(variant === 'inline' || variant === 'modal');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce per ricerca fluida a 60fps
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside per chiudere dropdown
  useEffect(() => {
    if (variant !== 'dropdown') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  // Focus automatico
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filtraggio articoli
  const filteredArticles = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();

    return magazzino.filter((item) => {
      // Filtro categoria
      if (selectedCategoria !== 'tutte' && item.categoria !== selectedCategoria) {
        return false;
      }

      // Filtro fornitore
      if (filterFornitore !== 'tutti' && item.fornitore.toLowerCase() !== filterFornitore.toLowerCase()) {
        return false;
      }

      // Filtro solo articoli con giacenza > 0
      if (filterStockOnly && item.giacenza <= 0) {
        return false;
      }

      if (!q) return true;

      const matchSku = item.codiceSku.toLowerCase().includes(q);
      const matchName = item.nome.toLowerCase().includes(q);
      const matchBarcode = item.barcodeEan?.toLowerCase().includes(q) || false;
      const matchFornitore = item.fornitore?.toLowerCase().includes(q) || false;
      const matchUbicazione = item.ubicazioneScaffale?.toLowerCase().includes(q) || false;

      return matchSku || matchName || matchBarcode || matchFornitore || matchUbicazione;
    });
  }, [magazzino, debouncedQuery, selectedCategoria, filterStockOnly, filterFornitore]);

  const handleSelectArticle = (art: ArticoloMagazzino) => {
    const qta = quantities[art.id] || defaultQuantity;
    onSelect(art, qta);
    playSuccessChime();
    showToast(`Articolo "${art.codiceSku} - ${art.nome}" selezionato (${qta} ${art.unitaMisura})`, 'success');

    if (variant === 'dropdown') {
      setIsDropdownOpen(false);
      setSearchQuery('');
    } else if (variant === 'modal' && onClose) {
      onClose();
    }
  };

  const handleUpdateQuantity = (artId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [artId]: Math.max(minQuantity, val),
    }));
  };

  // Scansione Barcode rapida
  const handleBarcodeScanClick = () => {
    openScanner();
    showToast('Inquadra il codice a barre o QR code dell\'articolo con la fotocamera', 'info');
  };

  const content = (
    <div className="space-y-4">
      {/* Search Input Bar & Scanner Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 font-sans shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleBarcodeScanClick}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-xs shrink-0 flex items-center gap-1.5 text-xs font-semibold"
          title="Scansiona Barcode EAN o QR Code Articolo"
        >
          <ScanLine className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Barcode</span>
        </button>
      </div>

      {/* Pill Filters: Categories & Quick Toggles */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {CATEGORIE_MERCEOLOGICHE.map((cat) => {
            const isSelected = selectedCategoria === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoria(cat.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors font-medium text-[11px] ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterStockOnly}
                onChange={(e) => setFilterStockOnly(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Solo con giacenza a magazzino (&gt; 0)</span>
            </label>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <div className="flex items-center gap-1">
              <span>Fornitore:</span>
              <select
                value={filterFornitore}
                onChange={(e) => setFilterFornitore(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="tutti">Tutti i Fornitori</option>
                <option value="RemaTarlazzi">RemaTarlazzi</option>
                <option value="Sonepar">Sonepar</option>
                <option value="Comoli Ferrari">Comoli Ferrari</option>
              </select>
            </div>
          </div>

          <div className="font-mono text-xs">
            <strong>{filteredArticles.length}</strong> articoli trovati
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            Nessun articolo corrispondente ai criteri di ricerca.
            <div className="text-[11px] text-slate-400 mt-1">
              Prova a cercare per codice fornitore parziale o rimuovi i filtri categoria.
            </div>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const hasStock = art.giacenza > 0;
            const isLowStock = art.giacenza > 0 && art.giacenza <= art.scortaMinima;
            const qta = quantities[art.id] || defaultQuantity;

            // Badge di Origine / Disponibilità
            const isRema =
              art.fornitore.toLowerCase().includes('rema') ||
              art.codiceSku.startsWith('RT-') ||
              art.ubicazioneScaffale?.toLowerCase().includes('rematarlazzi');

            return (
              <div
                key={art.id}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Info Principali */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] border border-amber-500/20">
                      {art.codiceSku}
                    </span>

                    {/* Source Badge */}
                    {hasStock ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLowStock
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <Warehouse className="w-3 h-3" />
                        <span>Magazzino: {art.giacenza} {art.unitaMisura}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <Truck className="w-3 h-3" />
                        <span>{isRema ? 'Catalogo RemaTarlazzi (Da Ordinare)' : 'Giacenza 0 - Da Ordinare'}</span>
                      </span>
                    )}

                    {art.barcodeEan && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <Barcode className="w-3 h-3" />
                        {art.barcodeEan}
                      </span>
                    )}

                    {art.ubicazioneScaffale && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Scaffale: {art.ubicazioneScaffale}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {art.nome}
                  </h4>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="capitalize">{art.categoria.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>Fornitore: <strong>{art.fornitore}</strong></span>
                  </div>
                </div>

                {/* Prezzi, Selettore Quantità e Azione */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      € {art.prezzoUnitarioAcquisto.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-500">/ {art.unitaMisura} (Acq.)</span>
                    </div>
                    {art.prezzoListinoVendita > 0 && (
                      <div className="text-[10px] text-slate-400">
                        Listino: € {art.prezzoListinoVendita.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Quantità */}
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(art.id, qta - 1)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={minQuantity}
                      value={qta}
                      onChange={(e) => handleUpdateQuantity(art.id, Number(e.target.value))}
                      className="w-12 text-center text-xs font-bold bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(art.id, qta + 1)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>

                  {/* Pulsante Selezione */}
                  <button
                    type="button"
                    onClick={() => handleSelectArticle(art)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Se Variante Modale
  if (variant === 'modal') {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{content}</div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
            <span>Seleziona un articolo per aggiungerlo direttamente al documento.</span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Chiudi
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Se Variante Dropdown o Inline
  return (
    <div ref={containerRef} className="relative w-full">
      {content}
    </div>
  );
};
