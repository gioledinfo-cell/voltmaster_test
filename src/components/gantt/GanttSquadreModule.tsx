import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  HardHat,
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Zap,
  Building2,
  Check,
  X,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AllocazioneRisorsa,
  ConflittoRisorsa,
  FaseGanttCantiere,
  TipoRisorsaGantt,
} from '../../types/ganttAllocazioni';
import {
  INITIAL_FASI_GANTT,
  INITIAL_ALLOCAZIONI,
  ASSET_GANTT_DISPONIBILI,
  detectResourceConflicts,
} from '../../services/ganttAllocazioniService';

export const GanttSquadreModule: React.FC = () => {
  const { cantieri, dipendenti, veicoli, showToast } = useApp();

  // State principale
  const [fasi, setFasi] = useState<FaseGanttCantiere[]>(INITIAL_FASI_GANTT);
  const [allocazioni, setAllocazioni] = useState<AllocazioneRisorsa[]>(INITIAL_ALLOCAZIONI);
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [filterTipoRisorsa, setFilterTipoRisorsa] = useState<'tutte' | TipoRisorsaGantt>('tutte');
  const [timeZoom, setTimeZoom] = useState<'settimana' | 'mese'>('settimana');
  const [searchQuery, setSearchQuery] = useState('');

  // Modali
  const [isNewAllocModalOpen, setIsNewAllocModalOpen] = useState(false);
  const [selectedConflitto, setSelectedConflitto] = useState<ConflittoRisorsa | null>(null);

  // Form nuova allocazione
  const [formCantiereId, setFormCantiereId] = useState(cantieri[0]?.id || 'CNT-01');
  const [formTipoRisorsa, setFormTipoRisorsa] = useState<TipoRisorsaGantt>('attrezzatura');
  const [formRisorsaId, setFormRisorsaId] = useState('PLE-01');
  const [formFase, setFormFase] = useState('Montaggio e posa');
  const [formDataInizio, setFormDataInizio] = useState('2026-10-15');
  const [formDataFine, setFormDataFine] = useState('2026-10-20');
  const [formPriorita, setFormPriorita] = useState<'normale' | 'alta' | 'bloccante'>('alta');

  // Rilevamento conflitti in tempo reale
  const conflitti = useMemo(() => {
    return detectResourceConflicts(allocazioni);
  }, [allocazioni]);

  // Lista date per l'intestazione timeline (Ottobre 2026)
  const timelineDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; dayName: string; isToday: boolean; isWeekend: boolean }[] = [];
    const year = 2026;
    const month = 9; // Ottobre (0-indexed: 9)
    const totalDays = timeZoom === 'settimana' ? 14 : 31;
    const startDay = timeZoom === 'settimana' ? 5 : 1; // Dal 5 Ottobre o dal 1 Ottobre

    for (let d = startDay; d < startDay + totalDays && d <= 31; d++) {
      const dt = new Date(year, month, d);
      const dateStr = `2026-10-${String(d).padStart(2, '0')}`;
      const dayNum = d;
      const dayName = dt.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayOfWeek = dt.getDay();
      days.push({
        dateStr,
        dayNum,
        dayName,
        isToday: dateStr === '2026-10-08',
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return days;
  }, [timeZoom]);

  // Filtraggio allocazioni
  const filteredAllocazioni = useMemo(() => {
    return allocazioni.filter((a) => {
      const matchCantiere = selectedCantiereId === 'tutti' || a.cantiereId === selectedCantiereId;
      const matchTipo = filterTipoRisorsa === 'tutte' || a.tipoRisorsa === filterTipoRisorsa;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.risorsaNome.toLowerCase().includes(q) ||
        a.cantiereTitolo.toLowerCase().includes(q) ||
        a.faseDescrizione.toLowerCase().includes(q);
      return matchCantiere && matchTipo && matchSearch;
    });
  }, [allocazioni, selectedCantiereId, filterTipoRisorsa, searchQuery]);

  // Filtraggio fasi Gantt
  const filteredFasi = useMemo(() => {
    return fasi.filter((f) => {
      return selectedCantiereId === 'tutti' || f.cantiereId === selectedCantiereId;
    });
  }, [fasi, selectedCantiereId]);

  // Handler Creazione Allocazione
  const handleCreateAllocazione = (e: React.FormEvent) => {
    e.preventDefault();
    const cantiereObj = cantieri.find((c) => c.id === formCantiereId) || cantieri[0];
    const assetObj = ASSET_GANTT_DISPONIBILI.find((a) => a.id === formRisorsaId);

    const newAlloc: AllocazioneRisorsa = {
      id: `ALL-${Date.now().toString(36)}`,
      cantiereId: cantiereObj.id,
      cantiereTitolo: cantiereObj.titolo,
      faseDescrizione: formFase,
      tipoRisorsa: formTipoRisorsa,
      risorsaId: formRisorsaId,
      risorsaNome: assetObj?.nome || formRisorsaId,
      risorsaDettaglio: assetObj?.dettaglio,
      dataInizio: formDataInizio,
      dataFine: formDataFine,
      statoAllocazione: 'pianificata',
      priorita: formPriorita,
    };

    const nextAllocazioni = [...allocazioni, newAlloc];
    setAllocazioni(nextAllocazioni);
    setIsNewAllocModalOpen(false);

    // Controlla se questa allocazione genera un conflitto
    const newConflicts = detectResourceConflicts(nextAllocazioni);
    if (newConflicts.length > conflitti.length) {
      showToast(
        `⚠️ Allocazione creata con ALLERTA: Rilevato conflitto/overbooking per "${newAlloc.risorsaNome}"!`,
        'error'
      );
    } else {
      showToast(`Risorsa allocata con successo su "${cantiereObj.titolo}"!`, 'success');
    }
  };

  // Risoluzione Rapida Conflitto: sposta la data o sostituisce con risorsa alternativa
  const handleResolveConflict = (conflitto: ConflittoRisorsa, action: 'shift_date' | 'replace_resource') => {
    if (action === 'shift_date') {
      // Sposta la data dell'allocazione B al termine della A
      const targetAlloc = allocazioni.find((a) => a.id === conflitto.allocazioneB.id);
      if (targetAlloc) {
        const nextStart = '2026-10-16';
        const nextEnd = '2026-10-21';
        setAllocazioni((prev) =>
          prev.map((a) =>
            a.id === targetAlloc.id
              ? { ...a, dataInizio: nextStart, dataFine: nextEnd, priorita: 'normale' }
              : a
          )
        );
        showToast(
          `Conflitto risolto: Date per "${targetAlloc.cantiereTitolo}" posticipate a ${nextStart} ➔ ${nextEnd}.`,
          'success'
        );
      }
    } else if (action === 'replace_resource') {
      // Sostituisce la PLE-01 con la PLE-02 o altro tecnico disponibile
      const targetAlloc = allocazioni.find((a) => a.id === conflitto.allocazioneB.id);
      if (targetAlloc) {
        const alternative = targetAlloc.tipoRisorsa === 'attrezzatura'
          ? { id: 'PLE-02', nome: 'Piattaforma Pantografo Elettrica 10m (PLE-02)' }
          : targetAlloc.tipoRisorsa === 'dipendente'
          ? { id: 'DIP-02', nome: 'Davide Riva (PES/PAV Specializzato)' }
          : { id: 'VEI-02', nome: 'Fiat Doblò Cargo (GF902TL)' };

        setAllocazioni((prev) =>
          prev.map((a) =>
            a.id === targetAlloc.id
              ? {
                  ...a,
                  risorsaId: alternative.id,
                  risorsaNome: alternative.nome,
                  note: `Sostituita automaticamente per risolvere overbooking con cantiere ${conflitto.allocazioneA.cantiereTitolo}`,
                }
              : a
          )
        );
        showToast(
          `Conflitto risolto: Assegnata risorsa alternativa "${alternative.nome}" libera!`,
          'success'
        );
      }
    }

    setSelectedConflitto(null);
  };

  // Helper calcolo posizione barra timeline
  const getBarPosition = (dataInizio: string, dataFine: string) => {
    const firstDateStr = timelineDays[0]?.dateStr || '2026-10-01';
    const firstDate = new Date(firstDateStr).getTime();
    const startDate = new Date(dataInizio).getTime();
    const endDate = new Date(dataFine).getTime();
    const oneDay = 1000 * 60 * 60 * 24;

    const startOffset = Math.max(0, Math.round((startDate - firstDate) / oneDay));
    const duration = Math.max(1, Math.round((endDate - startDate) / oneDay) + 1);

    const leftPercent = (startOffset / timelineDays.length) * 100;
    const widthPercent = Math.min(100 - leftPercent, (duration / timelineDays.length) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(3, widthPercent)}%`,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Cronoprogramma & Gantt di Commessa</span>
            </span>
            {conflitti.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{conflitti.length} Conflitti Overbooking Rilevati!</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nessun Conflitto Risorse</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1.5">
            Diagramma di Gantt & Carico Risorse (PLE, Flotta & Maestranze)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Pianifica l'allocazione temporale di squadre, furgoni e piattaforme aeree con rilevamento automatico delle sovrapposizioni.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => setIsNewAllocModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Allocazione Risorsa</span>
          </button>
        </div>
      </div>

      {/* STRISCIA ALLERTA CONFLITTI DI OVERBOOKING (SE PRESENTI) */}
      {conflitti.length > 0 && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>ATTENZIONE: Rilevata Sovrapposizione di Risorse su Più Cantieri in Contemporanea</span>
            </div>
            <span className="font-mono text-xs font-bold bg-rose-500/20 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full">
              {conflitti.length} collisioni
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conflitti.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-white dark:bg-slate-900 border border-rose-500/30 rounded-xl text-xs space-y-2 shadow-xs"
              >
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <strong>{c.risorsaNome}</strong>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Date: {c.dataConflitto}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Cantiere 1:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{c.allocazioneA.cantiereTitolo}</strong>
                    <span className="text-slate-400 italic">({c.allocazioneA.fase})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Cantiere 2:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{c.allocazioneB.cantiereTitolo}</strong>
                    <span className="text-slate-400 italic">({c.allocazioneB.fase})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveConflict(c, 'replace_resource')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                    title="Assegna una risorsa alternativa libera della stessa categoria"
                  >
                    <Check className="w-3 h-3" />
                    <span>Sostituisci con Risorsa Libera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveConflict(c, 'shift_date')}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                    title="Posticipa la fase di lavoro al termine della prima"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Posticipa Date</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtri & Selezione Visualizzazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cantiere filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCantiereId}
              onChange={(e) => setSelectedCantiereId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="tutti">Tutti i Cantieri Attivi</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titolo}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo risorsa filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg font-semibold">
            <button
              onClick={() => setFilterTipoRisorsa('tutte')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterTipoRisorsa === 'tutte'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Tutte ({allocazioni.length})
            </button>
            <button
              onClick={() => setFilterTipoRisorsa('attrezzatura')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                filterTipoRisorsa === 'attrezzatura'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Wrench className="w-3 h-3 text-amber-500" />
              <span>PLE & Strumenti</span>
            </button>
            <button
              onClick={() => setFilterTipoRisorsa('dipendente')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                filterTipoRisorsa === 'dipendente'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <HardHat className="w-3 h-3 text-cyan-500" />
              <span>Maestranze</span>
            </button>
            <button
              onClick={() => setFilterTipoRisorsa('veicolo')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                filterTipoRisorsa === 'veicolo'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Truck className="w-3 h-3 text-emerald-500" />
              <span>Furgoni</span>
            </button>
          </div>
        </div>

        {/* Time Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Zoom:</span>
          <button
            onClick={() => setTimeZoom('settimana')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              timeZoom === 'settimana'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            14 Giorni
          </button>
          <button
            onClick={() => setTimeZoom('mese')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              timeZoom === 'mese'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Mese Intero
          </button>
        </div>
      </div>

      {/* VISTA TIMELINE GANTT / MATRICE DI CARICO RISORSE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Calendario Temporale & Sovrapposizioni (Ottobre 2026)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Oggi (08 Ott)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Conflitto Overbooking</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header Giorni del Mese */}
            <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 font-semibold text-slate-500">
              <div className="col-span-4 p-3 border-r border-slate-200 dark:border-slate-800">
                Risorsa Assegnata / Fase Lavorativa
              </div>
              <div className="col-span-8 grid relative" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                {timelineDays.map((d) => (
                  <div
                    key={d.dateStr}
                    className={`py-2 text-center border-r border-slate-100 dark:border-slate-800/60 font-mono text-[11px] ${
                      d.isToday
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                        : d.isWeekend
                        ? 'bg-slate-100/50 dark:bg-slate-900/50 text-slate-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-[9px] uppercase">{d.dayName}</div>
                    <div>{d.dayNum}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Righe Allocazioni Risorse */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredAllocazioni.map((alloc) => {
                const isConflict = conflitti.some(
                  (c) => c.allocazioneA.id === alloc.id || c.allocazioneB.id === alloc.id
                );
                const pos = getBarPosition(alloc.dataInizio, alloc.dataFine);

                return (
                  <div key={alloc.id} className="grid grid-cols-12 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Info Risorsa Colonna Sinistra */}
                    <div className="col-span-4 p-3 border-r border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {alloc.tipoRisorsa === 'attrezzatura' ? (
                          <Wrench className="w-4 h-4 text-amber-500" />
                        ) : alloc.tipoRisorsa === 'veicolo' ? (
                          <Truck className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <HardHat className="w-4 h-4 text-cyan-500" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="truncate">{alloc.risorsaNome}</span>
                          {isConflict && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white shrink-0 animate-pulse">
                              OVERBOOKING
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {alloc.cantiereTitolo} · <em>{alloc.faseDescrizione}</em>
                        </div>
                      </div>
                    </div>

                    {/* Barra Timeline Gantt */}
                    <div className="col-span-8 relative flex items-center py-2 px-1">
                      {/* Griglia giorni di sfondo */}
                      <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                        {timelineDays.map((d) => (
                          <div
                            key={d.dateStr}
                            className={`border-r border-slate-100 dark:border-slate-800/40 h-full ${
                              d.isToday ? 'bg-amber-500/5' : d.isWeekend ? 'bg-slate-50/30 dark:bg-slate-950/20' : ''
                            }`}
                          />
                        ))}
                      </div>

                      {/* Barra Grafica Risorsa */}
                      <div
                        style={{ left: pos.left, width: pos.width }}
                        className={`relative z-10 h-7 rounded-lg px-2 flex items-center justify-between text-[11px] font-semibold text-white shadow-xs border transition-all ${
                          isConflict
                            ? 'bg-rose-600 border-rose-400 ring-2 ring-rose-500/40 animate-pulse'
                            : alloc.tipoRisorsa === 'attrezzatura'
                            ? 'bg-amber-600 border-amber-400/60'
                            : alloc.tipoRisorsa === 'veicolo'
                            ? 'bg-emerald-600 border-emerald-400/60'
                            : 'bg-cyan-600 border-cyan-400/60'
                        }`}
                        title={`${alloc.risorsaNome} (${alloc.dataInizio} -> ${alloc.dataFine})`}
                      >
                        <span className="truncate">{alloc.faseDescrizione}</span>
                        <span className="font-mono text-[9px] opacity-90 shrink-0 ml-1">
                          {alloc.dataInizio.substring(8)} ➔ {alloc.dataFine.substring(8)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE CRONOPROGRAMMA FASI DI COMMESSA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Avanzamento Fasi Principali Commesse ({filteredFasi.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Stato di completamento percentuale e tracciamento delle attività operative.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFasi.map((f) => (
            <div
              key={f.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {f.titoloFase}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    Commessa: <strong>{f.cantiereTitolo}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {f.percentualeAvanzamento}%
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {f.dataInizio} ➔ {f.dataFine}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${f.percentualeAvanzamento}%`,
                    backgroundColor: f.coloreBarra || '#f59e0b',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALE NUOVA ALLOCAZIONE RISORSA */}
      {isNewAllocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <button
              onClick={() => setIsNewAllocModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nuova Allocazione Risorsa sul Gantt
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assegna una piattaforma aerea, un furgone o un caposquadra a una fase di lavoro.
              </p>
            </div>

            <form onSubmit={handleCreateAllocazione} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seleziona Commessa / Cantiere
                </label>
                <select
                  value={formCantiereId}
                  onChange={(e) => setFormCantiereId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codice} — {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipologia Risorsa
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipoRisorsa('attrezzatura');
                      setFormRisorsaId('PLE-01');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      formTipoRisorsa === 'attrezzatura'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    🏗️ PLE & Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipoRisorsa('dipendente');
                      setFormRisorsaId('DIP-01');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      formTipoRisorsa === 'dipendente'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    👷 Maestro / Tecnico
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipoRisorsa('veicolo');
                      setFormRisorsaId('VEI-01');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      formTipoRisorsa === 'veicolo'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    🚐 Mezzo / Furgone
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Risorsa Specifica
                </label>
                <select
                  value={formRisorsaId}
                  onChange={(e) => setFormRisorsaId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  {ASSET_GANTT_DISPONIBILI.filter((a) => a.tipo === formTipoRisorsa).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrizione Lavorazione / Attività
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Posa canali cavi su passerelle ad alta quota"
                  value={formFase}
                  onChange={(e) => setFormFase(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inizio
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataInizio}
                    onChange={(e) => setFormDataInizio(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Fine
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataFine}
                    onChange={(e) => setFormDataFine(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAllocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Conferma Allocazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
