import React, { useState } from 'react';
import { OrdineInterno, StatoOrdine } from '../../types';
import { useFilePreview } from '../../context/FilePreviewContext';
import { PreviewableFile } from '../../types/preview';
import {
  X,
  Printer,
  Copy,
  Ban,
  CheckCircle2,
  Clock,
  Truck,
  Send,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Package,
  Wrench,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';

interface OrdineDetailModalProps {
  ordine: OrdineInterno | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint: (ordine: OrdineInterno) => void;
  onDuplicate: (id: string) => void;
  onOpenAnnulla: (ordine: OrdineInterno) => void;
  onAdvanceState: (id: string, nextState: StatoOrdine, note?: string) => void;
  onAddComment: (ordineId: string, text: string) => void;
  onEdit?: (ordine: OrdineInterno) => void;
}

const STATI_WORKFLOW: { id: StatoOrdine; label: string; icon: any }[] = [
  { id: 'bozza', label: 'Bozza', icon: Clock },
  { id: 'inviato', label: 'Inviato', icon: Send },
  { id: 'confermato', label: 'Confermato', icon: CheckCircle2 },
  { id: 'in_transito', label: 'In Transito', icon: Truck },
  { id: 'consegnato', label: 'Consegnato', icon: Package },
  { id: 'chiuso', label: 'Chiuso', icon: ShieldCheck },
];

export const OrdineDetailModal: React.FC<OrdineDetailModalProps> = ({
  ordine,
  isOpen,
  onClose,
  onOpenPrint,
  onDuplicate,
  onOpenAnnulla,
  onAdvanceState,
  onAddComment,
  onEdit,
}) => {
  const { openPreview } = useFilePreview();
  const [newComment, setNewComment] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [targetNextState, setTargetNextState] = useState<StatoOrdine | null>(null);

  if (!isOpen || !ordine) return null;

  const isFornitore = ordine.tipo === 'fornitore';

  // Determine next logical state in the workflow
  const getNextLogicalState = (current: StatoOrdine): StatoOrdine | null => {
    switch (current) {
      case 'bozza':
        return 'inviato';
      case 'inviato':
        return 'confermato';
      case 'confermato':
        return 'in_transito';
      case 'in_transito':
        return 'consegnato';
      case 'consegnato':
        return 'chiuso';
      default:
        return null;
    }
  };

  const nextState = getNextLogicalState(ordine.stato);

  const handleNextClick = () => {
    if (!nextState) return;
    setTargetNextState(nextState);
    setShowNoteInput(true);
  };

  const confirmAdvance = () => {
    if (!targetNextState) return;
    onAdvanceState(ordine.id, targetNextState, transitionNote.trim() || undefined);
    setTransitionNote('');
    setShowNoteInput(false);
    setTargetNextState(null);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(ordine.id, newComment.trim());
    setNewComment('');
  };

  const getPriorityBadge = (p: string) => {
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

  const getStatusBadge = (s: string) => {
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

  const currentStepIndex = STATI_WORKFLOW.findIndex((w) => w.id === ordine.stato);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isFornitore ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {ordine.numero}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${getStatusBadge(ordine.stato)}`}>
                  {ordine.stato.replace('_', ' ')}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${getPriorityBadge(ordine.priorita)}`}>
                  Priorità {ordine.priorita}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                  {isFornitore ? 'Verso Fornitore (Approvvigionamento)' : 'Verso Cliente (Fornitura)'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Destinatario: <strong className="text-slate-900 dark:text-slate-200">{ordine.destinatarioRagioneSociale}</strong> · Cantiere di Riferimento: <strong className="text-slate-900 dark:text-slate-200">{ordine.cantiereRiferimentoNome}</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenPrint(ordine)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
              title="Stampa / Esporta in PDF"
            >
              <Printer className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Stampa PDF</span>
            </button>

            <button
              onClick={() => onDuplicate(ordine.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
              title="Duplica ordine come nuova bozza"
            >
              <Copy className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span>Duplica</span>
            </button>

            {ordine.stato !== 'annullato' && ordine.stato !== 'chiuso' && (
              <button
                onClick={() => onOpenAnnulla(ordine)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200 dark:border-rose-500/30"
                title="Annulla questo ordine con motivazione"
              >
                <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Annulla</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Workflow Interactive States Progress Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Workflow & Avanzamento Stati
              </span>
              {ordine.stato === 'annullato' ? (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30">
                  ORDINE ANNULLATO
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  {nextState && (
                    <button
                      onClick={handleNextClick}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <span>Passa a {nextState.toUpperCase().replace('_', ' ')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {ordine.stato === 'consegnato' && (
                    <button
                      onClick={() => onAdvanceState(ordine.id, 'chiuso', 'Collaudo confermato e ordine chiuso regolarmente')}
                      className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      Chiudi Ordine
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Note input popup before advancing state */}
            {showNoteInput && targetNextState && (
              <div className="mb-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <span>Nota per il cambio di stato a: {targetNextState.toUpperCase().replace('_', ' ')}</span>
                  <button onClick={() => setShowNoteInput(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    placeholder="Es. DDT verificato da magazziniere / Trasmesso a mezzo PEC / In consegna..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={confirmAdvance}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Conferma
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Stepper */}
            {ordine.stato !== 'annullato' ? (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-2">
                {STATI_WORKFLOW.map((step, idx) => {
                  const isCurrent = step.id === ordine.stato;
                  const isPassed = currentStepIndex >= idx;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                          : isPassed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-amber-500 dark:text-amber-400' : isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`} />
                      </div>
                      <span className={`text-xs font-bold block ${isCurrent ? 'text-amber-600 dark:text-amber-400' : isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Passo {idx + 1} di 6
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
                <strong>Motivo Annullamento:</strong>{' '}
                {ordine.storicoStati.find((s) => s.stato === 'annullato')?.motivoAnnullamento || 'Non specificato'}
              </div>
            )}
          </div>

          {/* Destinatario, Cantiere e Dettagli Finanziari Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Anagrafica */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {isFornitore ? 'Fornitore Destinatario' : 'Cliente Destinatario'}
              </span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ordine.destinatarioRagioneSociale}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                {ordine.destinatarioIndirizzo && <p>{ordine.destinatarioIndirizzo}</p>}
                {ordine.destinatarioEmail && <p className="font-mono text-slate-700 dark:text-slate-300">{ordine.destinatarioEmail}</p>}
                {ordine.destinatarioTelefono && <p>{ordine.destinatarioTelefono}</p>}
              </div>
            </div>

            {/* Box 2: Luogo Consegna & Date */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                Cantiere & Tempistiche
              </span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ordine.cantiereRiferimentoNome}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                <p>Data Ordine: <strong className="text-slate-800 dark:text-slate-200">{ordine.dataOrdine}</strong></p>
                <p>
                  Consegna Prevista:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">{ordine.dataConsegnaPrevista}</strong>
                </p>
                {ordine.dataConsegnaEffettiva && (
                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    Consegnato il: {ordine.dataConsegnaEffettiva}
                  </p>
                )}
              </div>
            </div>

            {/* Box 3: Valore & Responsabile */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Valore Economico Totale
                </span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  € {ordine.importoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  + IVA 22%: € {(ordine.importoTotale * 1.22).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 mt-2">
                Operatore: <span className="text-slate-800 dark:text-slate-200 font-semibold">{ordine.creatoDa.name}</span>
              </div>
            </div>
          </div>

          {/* Righe Ordine & Ripartizione Cantieri */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Righe dell'Ordine ({ordine.righe.length}) & Ripartizioni di Cantiere
              </h3>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/60 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Tipologia</th>
                    <th className="py-2.5 px-3">Codice / Matricola</th>
                    <th className="py-2.5 px-3">Descrizione</th>
                    <th className="py-2.5 px-3 text-right">Quantità</th>
                    <th className="py-2.5 px-3 text-center">U.M.</th>
                    <th className="py-2.5 px-3 text-right">Prezzo Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {ordine.righe.map((r, idx) => {
                    const rowSubtotal = r.subtotale || (r.prezzoUnitario ? r.prezzoUnitario * r.quantitaTotale : 0);
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {r.tipologia}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.codice}</td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{r.descrizione}</span>
                            {r.note && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">Note: {r.note}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                            {r.quantitaTotale.toLocaleString('it-IT')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                            {r.unitaMisura}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {r.prezzoUnitario !== undefined
                              ? `€ ${r.prezzoUnitario.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {rowSubtotal > 0
                              ? `€ ${rowSubtotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                        </tr>

                        {/* Ripartizione Multi-Cantiere detail */}
                        {r.ripartizioniCantieri && r.ripartizioniCantieri.length > 0 && (
                          <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/60">
                            <td colSpan={7} className="py-2.5 px-4">
                              <div className="flex items-start gap-2 text-xs">
                                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wider shrink-0 mt-0.5">
                                  Ripartizione su Cantieri:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 flex-1">
                                  {r.ripartizioniCantieri.map((rip, ripIdx) => (
                                    <div
                                      key={ripIdx}
                                      className="p-2 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                          {rip.cantiereNome}
                                        </div>
                                        {rip.note && (
                                          <div className="text-[10px] text-slate-500 italic">{rip.note}</div>
                                        )}
                                      </div>
                                      <div className="text-right ml-2">
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                          {rip.quantita} {r.unitaMisura}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allegati & Note Generali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Note generali */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide block mb-2">
                Note Generali & Istruzioni di Spedizione
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {ordine.noteGenerali || 'Nessuna nota aggiuntiva specificata per questo ordine.'}
              </p>
            </div>

            {/* Allegati Scaricabili */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Allegati dell'Ordine ({ordine.allegati.length})
                </span>
              </div>
              {ordine.allegati.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nessun allegato caricato per questo ordine.</p>
              ) : (
                <div className="space-y-2">
                  {ordine.allegati.map((all) => {
                    const prevFile: PreviewableFile = {
                      id: all.id,
                      nome: all.nomeFile,
                      tipo: all.nomeFile.split('.').pop() || 'pdf',
                      dimensioneKb: all.dimensioneKb,
                      url: all.urlSimulato,
                      dataCaricamento: all.dataCaricamento,
                      autore: ordine.creatoDa.name,
                      categoria: all.tipo as any,
                      cantiereNome: ordine.cantiereRiferimentoNome,
                    };

                    const allOrderFiles: PreviewableFile[] = ordine.allegati.map((a) => ({
                      id: a.id,
                      nome: a.nomeFile,
                      tipo: a.nomeFile.split('.').pop() || 'pdf',
                      dimensioneKb: a.dimensioneKb,
                      url: a.urlSimulato,
                      dataCaricamento: a.dataCaricamento,
                      autore: ordine.creatoDa.name,
                      categoria: a.tipo as any,
                      cantiereNome: ordine.cantiereRiferimentoNome,
                    }));

                    return (
                      <div
                        key={all.id}
                        onClick={() => openPreview(prevFile, allOrderFiles)}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                          <div className="truncate">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {all.nomeFile}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">
                              {all.tipo} · {all.dimensioneKb} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Anteprima</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Storico Cambi Stato & Commenti */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Storico Transizioni di Stato */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide block mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Storico Transizioni degli Stati
              </span>
              <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {ordine.storicoStati.map((st, sIdx) => (
                  <div key={sIdx} className="relative">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900"></div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">
                          {st.stato.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">{st.dataOra}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                        Operatore: <strong className="text-slate-800 dark:text-slate-300">{st.utenteNome}</strong>
                      </p>
                      {st.note && (
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-1.5 rounded border border-slate-200 dark:border-slate-800 text-[11px] mt-1">
                          {st.note}
                        </p>
                      )}
                      {st.motivoAnnullamento && (
                        <p className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded border border-rose-200 dark:border-rose-500/30 text-[11px] mt-1">
                          <strong>Motivo:</strong> {st.motivoAnnullamento}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commenti & Comunicazioni Interne */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide block mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  Commenti & Comunicazioni Interne ({ordine.commenti?.length || 0})
                </span>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(!ordine.commenti || ordine.commenti.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">Nessun commento registrato.</p>
                  ) : (
                    ordine.commenti.map((comm) => (
                      <div key={comm.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {comm.utenteNome} {comm.ruolo ? `(${comm.ruolo})` : ''}
                          </span>
                          <span>{comm.dataOra}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comm.testo}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Nuovo Commento */}
              <form onSubmit={handleSendComment} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Scrivi un aggiornamento o nota interna..."
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  title="Invia commento"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            ID Interno: {ordine.id} · Aggiornato: {ordine.storicoStati[ordine.storicoStati.length - 1]?.dataOra || ordine.dataOrdine}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
