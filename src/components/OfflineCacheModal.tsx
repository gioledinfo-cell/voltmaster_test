import React, { useState } from 'react';
import {
  X,
  Database,
  Building2,
  Package,
  Search,
  RefreshCw,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  Cpu,
  Layers,
  HardHat,
  Wifi,
  WifiOff,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Cantiere, ArticoloMagazzino } from '../types';

interface OfflineCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'cantieri' | 'materiali';
}

export const OfflineCacheModal: React.FC<OfflineCacheModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'cantieri',
}) => {
  const {
    cantieri,
    magazzino,
    offlineCacheInfo,
    refreshOfflineCache,
    setSelectedCantiereId,
    setActiveTab,
  } = useApp();

  const networkStatus = useNetworkStatus();
  const [activeTab, setActiveTabLocal] = useState<'cantieri' | 'materiali'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutti');
  const [selectedCantiereDetail, setSelectedCantiereDetail] = useState<Cantiere | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  // Filter active cantieri
  const activeCantieriList = cantieri.filter((c) => c.stato !== 'completato');

  const filteredCantieri = activeCantieriList.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.titolo.toLowerCase().includes(term) ||
      c.codice.toLowerCase().includes(term) ||
      c.clienteNome.toLowerCase().includes(term) ||
      c.citta.toLowerCase().includes(term) ||
      c.indirizzo.toLowerCase().includes(term)
    );
  });

  const filteredMateriali = magazzino.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.nome.toLowerCase().includes(term) ||
      m.codiceSku.toLowerCase().includes(term) ||
      m.ubicazioneScaffale.toLowerCase().includes(term) ||
      m.fornitore.toLowerCase().includes(term);
    const matchesCat = selectedCategoria === 'tutti' || m.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshOfflineCache(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/60">
                  {offlineCacheInfo.storageEngine} Offline Cache
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    networkStatus.isOnline
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {networkStatus.isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Offline (Senza Rete)
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Archivio Locale Cantieri & Materiali per il Campo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
              title="Risincronizza cache locale adesso"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-500 dark:text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Aggiorna Cache</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Info Bar */}
        <div className="px-4 py-2.5 bg-cyan-50 dark:bg-cyan-950/20 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>
                <strong>{offlineCacheInfo.activeCantieriCount}</strong> cantieri attivi e{' '}
                <strong>{offlineCacheInfo.materialiCount}</strong> articoli magazzino disponibili offline
              </span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>Sincronizzato: {offlineCacheInfo.formattedTime || 'Recente'}</span>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTabLocal('cantieri');
                setSelectedCantiereDetail(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'cantieri'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cantieri Attivi ({activeCantieriList.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTabLocal('materiali');
                setSelectedCantiereDetail(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'materiali'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Materiali & Furgone ({magazzino.length})</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'cantieri'
                  ? 'Cerca cantiere per titolo, codice o cliente...'
                  : 'Cerca per nome, SKU o scaffale...'
              }
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'cantieri' && !selectedCantiereDetail && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCantieri.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-slate-500 text-xs">
                  Nessun cantiere trovato con il filtro corrente.
                </div>
              ) : (
                filteredCantieri.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCantiereDetail(c)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/40">
                            {c.codice}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              c.stato === 'in_corso'
                                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                                : c.stato === 'collaudo'
                                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {c.stato.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 font-bold">
                          {c.avanzamentoPercentuale}%
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
                        {c.titolo}
                      </h3>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                        <span className="truncate">
                          {c.indirizzo}, {c.citta}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Committente: <strong className="text-slate-800 dark:text-slate-300">{c.clienteNome}</strong>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>{c.dispositivi?.length || 0} quadri/dispositivi</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{c.materialiAssegnati?.length || 0} materiali</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Dettagli</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Drilldown on selected cantiere */}
          {activeTab === 'cantieri' && selectedCantiereDetail && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCantiereDetail(null)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold"
              >
                ← Torna alla lista cantieri in cache
              </button>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/60 mr-2">
                      {selectedCantiereDetail.codice}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 inline">
                      {selectedCantiereDetail.titolo}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCantiereId(selectedCantiereDetail.id);
                      setActiveTab('cantieri');
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    <span>Apri Scheda Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                      Indirizzo & Cantiere
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCantiereDetail.indirizzo} - {selectedCantiereDetail.citta}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                      Cliente: {selectedCantiereDetail.clienteNome}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                      Responsabile Tecnico
                    </span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCantiereDetail.responsabileNome}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                      Avanzamento: {selectedCantiereDetail.avanzamentoPercentuale}% · Stato:{' '}
                      {selectedCantiereDetail.stato}
                    </div>
                  </div>
                </div>

                {selectedCantiereDetail.noteSicurezza && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-200/90 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Prescrizioni di Sicurezza POS / CEI:</strong>
                      <div>{selectedCantiereDetail.noteSicurezza}</div>
                    </div>
                  </div>
                )}

                {/* Dispositivi & Quadri */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Quadri e Dispositivi Installati ({selectedCantiereDetail.dispositivi?.length || 0})
                  </h4>
                  {selectedCantiereDetail.dispositivi?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCantiereDetail.dispositivi.map((d) => (
                        <div key={d.id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{d.nome}</div>
                          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                            {d.tipo} · {d.codice}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                            <span>Ubicazione: {d.ubicazione}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{d.stato}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nessun dispositivo registrato.</p>
                  )}
                </div>

                {/* Materiali Assegnati */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Materiali Previsti & Assegnati ({selectedCantiereDetail.materialiAssegnati?.length || 0})
                  </h4>
                  {selectedCantiereDetail.materialiAssegnati?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCantiereDetail.materialiAssegnati.map((m, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs flex justify-between items-center">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.nome}</span>
                          <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded">
                            {m.quantita} {m.unitaMisura}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nessun materiale assegnato specificatamente.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Materiali Tab */}
          {activeTab === 'materiali' && (
            <div className="space-y-3">
              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  { id: 'tutti', label: 'Tutti i Materiali' },
                  { id: 'cavi_elettrici', label: 'Cavi & Conduttori' },
                  { id: 'quadri_modulari', label: 'Quadri & Modulari' },
                  { id: 'apparecchi_comando', label: 'Apparecchi Comando' },
                  { id: 'tubi_canaline', label: 'Tubi & Canaline' },
                  { id: 'fotovoltaico_accumulo', label: 'FV & Batterie' },
                  { id: 'illuminazione', label: 'Illuminazione' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoria(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedCategoria === cat.id
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Material Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredMateriali.length === 0 ? (
                  <div className="col-span-3 py-10 text-center text-slate-500 text-xs">
                    Nessun materiale trovato per la ricerca.
                  </div>
                ) : (
                  filteredMateriali.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/40">
                            {item.codiceSku}
                          </span>
                          <span
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              item.giacenza <= item.scortaMinima
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.giacenza} {item.unitaMisura}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mt-1">
                          {item.nome}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] space-y-1 text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between items-center">
                          <span>Ubicazione:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[140px]">
                            {item.ubicazioneScaffale}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Fornitore:</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{item.fornitore}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>
              I dati sono memorizzati nel browser ({offlineCacheInfo.storageEngine}) e accessibili anche in
              gallerie, seminterrati o assenza totale di segnale.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors self-end sm:self-auto"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
