import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Lavorazione, LavorazioneStato, Priorita } from '../types';

export const LavorazioniModule: React.FC = () => {
  const {
    lavorazioni,
    cantieri,
    dipendenti,
    addLavorazione,
    updateLavorazione,
    showToast,
    currentUser,
  } = useApp();

  const [selectedCantiereFilter, setSelectedCantiereFilter] = useState<string>('tutti');
  const [selectedStatoFilter, setSelectedStatoFilter] = useState<string>('tutti');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Lavorazione form
  const [newTitolo, setNewTitolo] = useState('');
  const [newDescrizione, setNewDescrizione] = useState('');
  const [newCantiereId, setNewCantiereId] = useState(cantieri[0]?.id || '');
  const [newFase, setNewFase] = useState('Infilaggio cavi e linee dorsali');
  const [newPriorita, setNewPriorita] = useState<Priorita>('alta');
  const [newOreStimate, setNewOreStimate] = useState(24);
  const [newScadenza, setNewScadenza] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const filteredLavorazioni = lavorazioni.filter((l) => {
    const matchesCantiere = selectedCantiereFilter === 'tutti' || l.cantiereId === selectedCantiereFilter;
    const matchesStato = selectedStatoFilter === 'tutti' || l.stato === selectedStatoFilter;
    return matchesCantiere && matchesStato;
  });

  const handleCreateLavorazione = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addLavorazione({
      cantiereId: newCantiereId,
      titolo: newTitolo,
      descrizione: newDescrizione,
      fase: newFase,
      priorita: newPriorita,
      stato: 'da_fare',
      operatoriAssegnatiIds: ['usr-op1'],
      oreStimate: newOreStimate,
      oreLavorate: 0,
      dataScadenza: newScadenza,
    });

    setIsNewModalOpen(false);
    setNewTitolo('');
    setNewDescrizione('');
  };

  const handleToggleState = (lav: Lavorazione) => {
    let nextStato: LavorazioneStato = 'in_corso';
    if (lav.stato === 'da_fare') nextStato = 'in_corso';
    else if (lav.stato === 'in_corso') nextStato = 'completata';
    else if (lav.stato === 'completata') nextStato = 'da_fare';

    updateLavorazione(lav.id, {
      stato: nextStato,
      completataIl: nextStato === 'completata' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const getPriorityBadge = (p: Priorita) => {
    switch (p) {
      case 'urgente':
        return <span className="text-rose-400 font-bold font-mono text-[10px]">URGENTE</span>;
      case 'alta':
        return <span className="text-amber-400 font-semibold font-mono text-[10px]">ALTA</span>;
      default:
        return <span className="text-slate-400 font-mono text-[10px]">{p.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Lavorazioni & Avanzamento Attività
          </h1>
          <p className="text-xs text-slate-400">
            Pianificazione fasi cantieri, assegnazione tecnici e controllo ore consuntivate
          </p>
        </div>

        {currentUser.role !== 'cliente' && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuova Lavorazione
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filtra per Cantiere:</span>
          <select
            value={selectedCantiereFilter}
            onChange={(e) => setSelectedCantiereFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:border-amber-500"
          >
            <option value="tutti">Tutti i cantieri attivi</option>
            {cantieri.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice} - {c.titolo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xs">
          {['tutti', 'da_fare', 'in_corso', 'completata'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatoFilter(st)}
              className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                selectedStatoFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban / Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['da_fare', 'in_corso', 'completata'] as LavorazioneStato[]).map((stato) => {
          const tasksInColumn = filteredLavorazioni.filter((l) => l.stato === stato);
          const title =
            stato === 'da_fare'
              ? 'Da Pianificare / Fare'
              : stato === 'in_corso'
              ? 'In Corso di Esecuzione'
              : 'Completate & Collaudate';

          const titleColor =
            stato === 'da_fare'
              ? 'text-slate-500 dark:text-slate-400'
              : stato === 'in_corso'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400';

          return (
            <div key={stato} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col h-full min-h-[450px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
                  {title}
                </span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  {tasksInColumn.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {tasksInColumn.length > 0 ? (
                  tasksInColumn.map((lav) => {
                    const cantiere = cantieri.find((c) => c.id === lav.cantiereId);
                    const progressHours = Math.min(100, Math.round((lav.oreLavorate / (lav.oreStimate || 1)) * 100));

                    return (
                      <div
                        key={lav.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg p-3.5 shadow-xs space-y-2.5 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            {cantiere?.codice || 'CNT'}
                          </span>
                          {getPriorityBadge(lav.priorita)}
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                          {lav.titolo}
                        </h4>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-2 rounded border border-slate-200 dark:border-slate-800/60">
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Fase Tecnica:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{lav.fase}</span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {lav.descrizione}
                        </p>

                        {/* Hours progress */}
                        <div className="pt-1">
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                            <span>Ore consuntivate (da ROL)</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {lav.oreLavorate} / {lav.oreStimate} h ({progressHours}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progressHours >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressHours}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Scad: {lav.dataScadenza}</span>

                          {currentUser.role !== 'cliente' && (
                            <button
                              onClick={() => handleToggleState(lav)}
                              className="text-amber-400 hover:text-amber-300 font-semibold"
                            >
                              {stato === 'da_fare' && 'Inizia →'}
                              {stato === 'in_corso' && 'Completa ✓'}
                              {stato === 'completata' && 'Riapri ↺'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-600 text-xs italic">
                    Nessuna attività in questa colonna.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE LAVORAZIONE MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Nuova Lavorazione Cantiere</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pianifica una nuova attività per i tecnici sul campo
            </p>

            <form onSubmit={handleCreateLavorazione} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cantiere di Riferimento:</label>
                <select
                  value={newCantiereId}
                  onChange={(e) => setNewCantiereId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.codice}] {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Titolo dell'Attività:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Montaggio e cablaggio prese CEE 32A reparto CNC"
                  value={newTitolo}
                  onChange={(e) => setNewTitolo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fase Tecnica:</label>
                  <input
                    type="text"
                    value={newFase}
                    onChange={(e) => setNewFase(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priorità:</label>
                  <select
                    value={newPriorita}
                    onChange={(e) => setNewPriorita(e.target.value as Priorita)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  >
                    <option value="bassa">Bassa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ore Stimate:</label>
                  <input
                    type="number"
                    value={newOreStimate}
                    onChange={(e) => setNewOreStimate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Data Scadenza Prevista:</label>
                  <input
                    type="date"
                    value={newScadenza}
                    onChange={(e) => setNewScadenza(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Istruzioni e Note Tecniche:</label>
                <textarea
                  rows={2}
                  value={newDescrizione}
                  onChange={(e) => setNewDescrizione(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Dettagli di montaggio, schemi da consultare..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Salva Lavorazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
