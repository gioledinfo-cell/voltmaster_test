import React, { useState, useMemo } from 'react';
import {
  OrdineInterno,
  TipoOrdine,
  StatoOrdine,
  PrioritaOrdine,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { OrdineDetailModal } from './OrdineDetailModal';
import { OrdineFormModal } from './OrdineFormModal';
import { OrdinePrintModal } from './OrdinePrintModal';
import { OrdineAnnullaModal } from './OrdineAnnullaModal';
import { OrdiniKanbanView } from './OrdiniKanbanView';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  ShieldCheck,
  Eye,
  Printer,
  Copy,
  Edit,
  Ban,
  ArrowRight,
  TrendingUp,
  Layers,
  MapPin,
  Send,
  Sparkles,
  AlertCircle,
  BarChart3,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';

interface OrdiniModuleProps {
  embeddedInMagazzino?: boolean;
}

export const OrdiniModule: React.FC<OrdiniModuleProps> = ({ embeddedInMagazzino = false }) => {
  const {
    ordiniInterni,
    fornitori,
    clienti,
    cantieri,
    addOrdineInterno,
    updateOrdineInterno,
    deleteOrdineInterno,
    transizioneStatoOrdine,
    duplicaOrdineInterno,
    addCommentoOrdine,
    showToast,
  } = useApp();

  // Active Tab: 'tutti' | 'fornitori' | 'clienti'
  const [activeTab, setActiveTab] = useState<'tutti' | 'fornitori' | 'clienti'>('tutti');

  // Filters
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterPriorita, setFilterPriorita] = useState<string>('tutti');
  const [filterCantiere, setFilterCantiere] = useState<string>('tutti');
  const [filterDestinatario, setFilterDestinatario] = useState<string>('tutti');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState<'dataOrdine' | 'dataConsegna' | 'numero' | 'importo' | 'destinatario'>('dataOrdine');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View Mode: 'table' | 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Modals state
  const [selectedOrdineDetail, setSelectedOrdineDetail] = useState<OrdineInterno | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<TipoOrdine>('fornitore');
  const [ordineToEdit, setOrdineToEdit] = useState<OrdineInterno | null>(null);
  const [ordineToPrint, setOrdineToPrint] = useState<OrdineInterno | null>(null);
  const [ordineToAnnulla, setOrdineToAnnulla] = useState<OrdineInterno | null>(null);

  // Calculations for KPIs & Alerts
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

  // KPI: Ordini Aperti (non chiusi e non annullati)
  const ordiniAperti = useMemo(() => {
    return ordiniInterni.filter((o) => o.stato !== 'chiuso' && o.stato !== 'annullato');
  }, [ordiniInterni]);

  const ordiniApertiFornitori = ordiniAperti.filter((o) => o.tipo === 'fornitore').length;
  const ordiniApertiClienti = ordiniAperti.filter((o) => o.tipo === 'cliente').length;

  // KPI: Ordini in ritardo di consegna (data consegna prevista < oggi e non ancora consegnato/chiuso/annullato)
  const ordiniInRitardo = useMemo(() => {
    return ordiniInterni.filter(
      (o) =>
        o.stato !== 'consegnato' &&
        o.stato !== 'chiuso' &&
        o.stato !== 'annullato' &&
        o.dataConsegnaPrevista < todayStr
    );
  }, [ordiniInterni, todayStr]);

  // Alert: Ordini non confermati da oltre 3 giorni (inviati da più di 3 gg fa e ancora in stato 'inviato')
  const ordiniNonConfermatiOver3Days = useMemo(() => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
    return ordiniInterni.filter(
      (o) => o.stato === 'inviato' && o.dataOrdine <= threeDaysAgo
    );
  }, [ordiniInterni, now]);

  // Alert: Ordini in scadenza nei prossimi 3 giorni
  const ordiniInScadenza = useMemo(() => {
    return ordiniInterni.filter(
      (o) =>
        o.stato !== 'consegnato' &&
        o.stato !== 'chiuso' &&
        o.stato !== 'annullato' &&
        o.dataConsegnaPrevista >= todayStr &&
        o.dataConsegnaPrevista <= threeDaysAhead
    );
  }, [ordiniInterni, todayStr, threeDaysAhead]);

  // KPI: Valore ordini del mese corrente
  const valoreOrdiniMese = useMemo(() => {
    return ordiniInterni
      .filter((o) => o.dataOrdine.startsWith(currentMonthPrefix) && o.stato !== 'annullato')
      .reduce((sum, o) => sum + o.importoTotale, 0);
  }, [ordiniInterni, currentMonthPrefix]);

  // KPI: Top 5 Destinatari per Volume Economico
  const topDestinatari = useMemo(() => {
    const map = new Map<string, { nome: string; tipo: TipoOrdine; totale: number; count: number }>();
    ordiniInterni.forEach((o) => {
      if (o.stato === 'annullato') return;
      const key = `${o.tipo}_${o.destinatarioRagioneSociale}`;
      const existing = map.get(key) || {
        nome: o.destinatarioRagioneSociale,
        tipo: o.tipo,
        totale: 0,
        count: 0,
      };
      existing.totale += o.importoTotale;
      existing.count += 1;
      map.set(key, existing);
    });

    const list = Array.from(map.values()).sort((a, b) => b.totale - a.totale);
    const maxVal = list[0]?.totale || 1;
    return list.slice(0, 5).map((item) => ({
      ...item,
      percentage: Math.min(100, Math.round((item.totale / maxVal) * 100)),
    }));
  }, [ordiniInterni]);

  // Filtered & Sorted orders list
  const filteredOrdini = useMemo(() => {
    return ordiniInterni.filter((ordine) => {
      // Tab filter
      if (activeTab === 'fornitori' && ordine.tipo !== 'fornitore') return false;
      if (activeTab === 'clienti' && ordine.tipo !== 'cliente') return false;

      // Status filter
      if (filterStato !== 'tutti' && ordine.stato !== filterStato) return false;

      // Priority filter
      if (filterPriorita !== 'tutti' && ordine.priorita !== filterPriorita) return false;

      // Cantiere filter
      if (filterCantiere !== 'tutti') {
        const matchesPrimary = ordine.cantiereRiferimentoId === filterCantiere;
        const matchesSplit = ordine.righe.some((r) =>
          (r.ripartizioniCantieri || []).some((s) => s.cantiereId === filterCantiere)
        );
        if (!matchesPrimary && !matchesSplit) return false;
      }

      // Destinatario filter
      if (filterDestinatario !== 'tutti' && ordine.destinatarioId !== filterDestinatario) {
        return false;
      }

      // Date range filter
      if (dateFrom && ordine.dataOrdine < dateFrom) return false;
      if (dateTo && ordine.dataOrdine > dateTo) return false;

      // Search full-text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = ordine.numero.toLowerCase().includes(q);
        const matchDest = ordine.destinatarioRagioneSociale.toLowerCase().includes(q);
        const matchCant = ordine.cantiereRiferimentoNome.toLowerCase().includes(q);
        const matchRows = ordine.righe.some(
          (r) =>
            r.codice.toLowerCase().includes(q) ||
            r.descrizione.toLowerCase().includes(q)
        );
        const matchNotes = (ordine.noteGenerali || '').toLowerCase().includes(q);
        if (!matchNum && !matchDest && !matchCant && !matchRows && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dataOrdine') {
        comparison = a.dataOrdine.localeCompare(b.dataOrdine);
      } else if (sortBy === 'dataConsegna') {
        comparison = a.dataConsegnaPrevista.localeCompare(b.dataConsegnaPrevista);
      } else if (sortBy === 'numero') {
        comparison = a.numero.localeCompare(b.numero);
      } else if (sortBy === 'importo') {
        comparison = a.importoTotale - b.importoTotale;
      } else if (sortBy === 'destinatario') {
        comparison = a.destinatarioRagioneSociale.localeCompare(b.destinatarioRagioneSociale);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    ordiniInterni,
    activeTab,
    filterStato,
    filterPriorita,
    filterCantiere,
    filterDestinatario,
    dateFrom,
    dateTo,
    search,
    sortBy,
    sortOrder,
  ]);

  // Handlers
  const handleOpenNew = (type: TipoOrdine) => {
    setFormInitialType(type);
    setOrdineToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ordine: OrdineInterno) => {
    setOrdineToEdit(ordine);
    setFormInitialType(ordine.tipo);
    setIsFormOpen(true);
  };

  const handleDuplicate = (id: string) => {
    const dupl = duplicaOrdineInterno(id);
    setSelectedOrdineDetail(dupl);
  };

  const handleOpenPrint = (ordine: OrdineInterno) => {
    setOrdineToPrint(ordine);
  };

  const handleOpenAnnulla = (ordine: OrdineInterno) => {
    setOrdineToAnnulla(ordine);
  };

  const handleConfirmAnnulla = (id: string, motivo: string) => {
    transizioneStatoOrdine(id, 'annullato', undefined, motivo);
    if (selectedOrdineDetail?.id === id) {
      const updated = ordiniInterni.find((o) => o.id === id);
      if (updated) setSelectedOrdineDetail(updated);
    }
  };

  const handleAdvance = (id: string, nextState: StatoOrdine, note?: string) => {
    transizioneStatoOrdine(id, nextState, note);
    if (selectedOrdineDetail?.id === id) {
      const updated = ordiniInterni.find((o) => o.id === id);
      if (updated) setSelectedOrdineDetail(updated);
    }
  };

  const handleSaveForm = (ordineData: Omit<OrdineInterno, 'id' | 'numero' | 'storicoStati' | 'creatoDa'>) => {
    if (ordineToEdit) {
      updateOrdineInterno(ordineToEdit.id, ordineData);
    } else {
      const created = addOrdineInterno(ordineData);
      setSelectedOrdineDetail(created);
    }
  };

  const getStatusBadge = (s: StatoOrdine) => {
    switch (s) {
      case 'bozza':
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
      case 'inviato':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'confermato':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'in_transito':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'consegnato':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'chiuso':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'annullato':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getPriorityBadge = (p: PrioritaOrdine) => {
    switch (p) {
      case 'urgente':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'alta':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'media':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications and Alerts Bar */}
      {(ordiniInRitardo.length > 0 || ordiniNonConfermatiOver3Days.length > 0 || ordiniInScadenza.length > 0) && (
        <div className="space-y-2">
          {ordiniInRitardo.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between flex-wrap gap-2 shadow-xs dark:shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  <strong>Attenzione:</strong> {ordiniInRitardo.length} {ordiniInRitardo.length === 1 ? 'ordine ha' : 'ordini hanno'} superato la data di consegna prevista senza completamento:
                  {' '}
                  <span className="font-mono font-bold text-rose-950 dark:text-white">
                    {ordiniInRitardo.map((o) => `${o.numero} (${o.destinatarioRagioneSociale})`).join(', ')}
                  </span>
                </span>
              </div>
              <button
                onClick={() => {
                  setFilterStato('tutti');
                  setSearch(ordiniInRitardo[0]?.numero || '');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors shadow-xs"
              >
                Ispeziona Ritardi
              </button>
            </div>
          )}

          {ordiniNonConfermatiOver3Days.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between flex-wrap gap-2 shadow-xs dark:shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Alert Conferma:</strong> {ordiniNonConfermatiOver3Days.length} {ordiniNonConfermatiOver3Days.length === 1 ? 'ordine è stato inviato' : 'ordini sono stati inviati'} da oltre 3 giorni ma non risultano ancora confermati:
                  {' '}
                  <span className="font-mono font-bold text-amber-950 dark:text-white">
                    {ordiniNonConfermatiOver3Days.map((o) => `${o.numero} (${o.destinatarioRagioneSociale})`).join(', ')}
                  </span>
                </span>
              </div>
              <button
                onClick={() => setFilterStato('inviato')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-colors shadow-xs"
              >
                Filtra Inviati in Attesa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hero Header & KPI Dashboard Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Gestione Ordini Interni & Logistica Integrata</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Ordini Interni (Fornitori & Clienti)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Piattaforma unificata per emissione, tracciamento stati, suddivisione delle quantità su più cantieri, esportazione PDF ed elaborazione flussi verso fornitori (approvvigionamento) e verso clienti (fornitura/noleggio).
            </p>
          </div>

          {/* New Order Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenNew('fornitore')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuovo Ordine Fornitore</span>
            </button>

            <button
              onClick={() => handleOpenNew('cliente')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuovo Ordine Cliente</span>
            </button>
          </div>
        </div>

        {/* 4 Core KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          {/* KPI 1: Ordini Aperti */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Ordini Aperti
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300">
                IN GESTIONE
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {ordiniAperti.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">{ordiniApertiFornitori} fornitori</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ordiniApertiClienti} clienti</span>
            </div>
          </div>

          {/* KPI 2: Ordini in Ritardo */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Consegne in Ritardo
              </span>
              {ordiniInRitardo.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {ordiniInRitardo.length} CRITICITÀ
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  PUNTUALI
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {ordiniInRitardo.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Data di consegna superata rispetto al programma
            </div>
          </div>

          {/* KPI 3: Valore Ordini Mese */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Valore Mese Corrente
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono">
                SETTEMBRE 2026
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              € {valoreOrdiniMese.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Forniture e approvvigionamenti confermati
            </div>
          </div>

          {/* KPI 4: In Scadenza Imminente */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Scadenze Imminenti
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                PROSSIMI 3 GG
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {ordiniInScadenza.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ordini in arrivo o fornitura entro 72 ore
            </div>
          </div>
        </div>

        {/* Top 5 Destinatari Bar Visualization */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Top 5 Destinatari per Volume Economico
            </span>
            <span className="text-[11px] text-slate-500">Volumi calcolati su fornitori e clienti attivi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {topDestinatari.map((dest, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900 dark:text-slate-200 truncate">{dest.nome}</span>
                  <span className={`text-[9px] px-1 rounded uppercase font-bold ${dest.tipo === 'fornitore' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                    {dest.tipo === 'fornitore' ? 'Forn.' : 'Cli.'}
                  </span>
                </div>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  € {dest.totale.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dest.tipo === 'fornitore' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${dest.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {dest.count} {dest.count === 1 ? 'ordine' : 'ordini'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Subsections Tabs: Tutti | Fornitori | Clienti */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            {
              id: 'tutti',
              label: 'Tutti gli Ordini',
              count: ordiniInterni.length,
              icon: <Layers className="w-4 h-4" />,
            },
            {
              id: 'fornitori',
              label: 'Ordini verso FORNITORI (Approvvigionamento)',
              count: ordiniInterni.filter((o) => o.tipo === 'fornitore').length,
              icon: <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
            },
            {
              id: 'clienti',
              label: 'Ordini verso CLIENTI (Fornitura / Cessione / Noleggio)',
              count: ordiniInterni.filter((o) => o.tipo === 'cliente').length,
              icon: <Building2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? tab.id === 'fornitori'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : tab.id === 'clienti'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id
                    ? 'bg-black/20 text-current font-bold'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per numero, destinatario, cantiere, SKU articolo..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Stato */}
          <div className="lg:col-span-2">
            <select
              value={filterStato}
              onChange={(e) => setFilterStato(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="tutti">Tutti gli Stati</option>
              <option value="bozza">Bozza</option>
              <option value="inviato">Inviato</option>
              <option value="confermato">Confermato</option>
              <option value="in_transito">In Transito</option>
              <option value="consegnato">Consegnato</option>
              <option value="chiuso">Chiuso</option>
              <option value="annullato">Annullato</option>
            </select>
          </div>

          {/* Filter Priorità */}
          <div className="lg:col-span-2">
            <select
              value={filterPriorita}
              onChange={(e) => setFilterPriorita(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="tutti">Tutte le Priorità</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="bassa">Bassa</option>
            </select>
          </div>

          {/* Filter Cantiere */}
          <div className="lg:col-span-2">
            <select
              value={filterCantiere}
              onChange={(e) => setFilterCantiere(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="tutti">Tutti i Cantieri</option>
              <option value="cnt-deposito">Deposito Centrale Milano</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codice} - {c.titolo.slice(0, 25)}...
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="lg:col-span-2 flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="dataOrdine">Data Ordine</option>
              <option value="dataConsegna">Consegna Prevista</option>
              <option value="importo">Importo Totale</option>
              <option value="numero">Numero Ordine</option>
              <option value="destinatario">Destinatario</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={`Inverti ordinamento (${sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Range Sub-Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filtra Date:</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px]">Da:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px]">A:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline ml-1 font-semibold"
              >
                Azzera date
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle (Tabella vs Kanban) */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Vista Tabellare Dettagliata"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabella</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Vista Kanban a Colonne con Drag & Drop"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
            </div>

            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono">
              Visualizzati: <strong className="text-slate-800 dark:text-slate-200">{filteredOrdini.length}</strong> ordini su {ordiniInterni.length} totali
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table or Kanban View */}
      {viewMode === 'kanban' ? (
        <OrdiniKanbanView
          ordini={filteredOrdini}
          onOpenDetail={(ord) => setSelectedOrdineDetail(ord)}
          onAdvanceState={handleAdvance}
          onOpenPrint={handleOpenPrint}
          onDuplicate={handleDuplicate}
          onMoveOrderState={(id, targetState) => {
            transizioneStatoOrdine(id, targetState, 'Avanzamento rapido da lavagna Kanban');
          }}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/70 shadow-sm dark:shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                <th className="py-3.5 px-4">Numero & Priorità</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Destinatario</th>
                <th className="py-3.5 px-4">Cantiere / Destinazione</th>
                <th className="py-3.5 px-4">Date (Emiss. / Consegna)</th>
                <th className="py-3.5 px-4">Stato Workflow</th>
                <th className="py-3.5 px-4 text-right">Importo Netto</th>
                <th className="py-3.5 px-4 text-center">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredOrdini.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-400 text-sm">Nessun ordine trovato con i criteri selezionati.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Prova a rimuovere i filtri o la ricerca testuale.</p>
                  </td>
                </tr>
              ) : (
                filteredOrdini.map((ord) => {
                  const isLate = ord.dataConsegnaPrevista < todayStr && ord.stato !== 'consegnato' && ord.stato !== 'chiuso' && ord.stato !== 'annullato';
                  const hasMultiSplit = ord.righe.some((r) => (r.ripartizioniCantieri || []).length > 0);

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrdineDetail(ord)}
                    >
                      {/* Numero & Priorità */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {ord.numero}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityBadge(ord.priorita)}`}>
                            {ord.priorita}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ord.righe.length} {ord.righe.length === 1 ? 'riga' : 'righe'} · {ord.allegati.length} {ord.allegati.length === 1 ? 'allegato' : 'allegati'}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4">
                        {ord.tipo === 'fornitore' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Building2 className="w-3.5 h-3.5" /> Fornitore
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Building2 className="w-3.5 h-3.5" /> Cliente
                          </span>
                        )}
                      </td>

                      {/* Destinatario */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {ord.destinatarioRagioneSociale}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {ord.destinatarioEmail || ord.destinatarioTelefono || 'Anagrafica censita'}
                        </div>
                      </td>

                      {/* Cantiere & Badge Multi-Split */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-300 font-medium">
                          {ord.cantiereRiferimentoNome}
                        </div>
                        {hasMultiSplit && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            <MapPin className="w-3 h-3" /> Suddiviso su più cantieri
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-600 dark:text-slate-400">
                          Ord: <span className="font-mono text-slate-900 dark:text-slate-200">{ord.dataOrdine}</span>
                        </div>
                        <div className={`mt-0.5 font-mono ${isLate ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          Cons: {ord.dataConsegnaPrevista}
                          {isLate && <span className="text-[10px] ml-1 uppercase">(in ritardo)</span>}
                        </div>
                      </td>

                      {/* Stato */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(ord.stato)}`}>
                          {ord.stato === 'bozza' && <Clock className="w-3 h-3" />}
                          {ord.stato === 'inviato' && <Send className="w-3 h-3" />}
                          {ord.stato === 'confermato' && <CheckCircle2 className="w-3 h-3" />}
                          {ord.stato === 'in_transito' && <Truck className="w-3 h-3" />}
                          {ord.stato === 'consegnato' && <Package className="w-3 h-3" />}
                          {ord.stato === 'chiuso' && <ShieldCheck className="w-3 h-3" />}
                          {ord.stato === 'annullato' && <Ban className="w-3 h-3" />}
                          <span>{ord.stato.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Importo */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                          € {ord.importoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500">+ IVA 22%</div>
                      </td>

                      {/* Azioni Rapide */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()} // Prevents row click
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Visualizza */}
                          <button
                            onClick={() => setSelectedOrdineDetail(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
                            title="Visualizza Dettaglio Completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Stampa PDF */}
                          <button
                            onClick={() => handleOpenPrint(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-600 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                            title="Esporta / Stampa PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Duplica */}
                          <button
                            onClick={() => handleDuplicate(ord.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-600 hover:text-sky-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                            title="Duplica Ordine"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Modifica (se non chiuso/annullato) */}
                          {ord.stato !== 'annullato' && ord.stato !== 'chiuso' && (
                            <button
                              onClick={() => handleEdit(ord)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-600 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                              title="Modifica Ordine"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Annulla (se aperto) */}
                          {ord.stato !== 'annullato' && ord.stato !== 'chiuso' && (
                            <button
                              onClick={() => handleOpenAnnulla(ord)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                              title="Annulla Ordine con Motivazione"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modals */}
      {selectedOrdineDetail && (
        <OrdineDetailModal
          ordine={selectedOrdineDetail}
          isOpen={!!selectedOrdineDetail}
          onClose={() => setSelectedOrdineDetail(null)}
          onOpenPrint={handleOpenPrint}
          onDuplicate={handleDuplicate}
          onOpenAnnulla={handleOpenAnnulla}
          onAdvanceState={handleAdvance}
          onAddComment={addCommentoOrdine}
          onEdit={(ord) => {
            setSelectedOrdineDetail(null);
            handleEdit(ord);
          }}
        />
      )}

      {isFormOpen && (
        <OrdineFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setOrdineToEdit(null);
          }}
          onSave={handleSaveForm}
          initialType={formInitialType}
          editOrder={ordineToEdit}
        />
      )}

      {ordineToPrint && (
        <OrdinePrintModal
          ordine={ordineToPrint}
          onClose={() => setOrdineToPrint(null)}
        />
      )}

      {ordineToAnnulla && (
        <OrdineAnnullaModal
          ordine={ordineToAnnulla}
          isOpen={!!ordineToAnnulla}
          onClose={() => setOrdineToAnnulla(null)}
          onConfirm={handleConfirmAnnulla}
        />
      )}
    </div>
  );
};
