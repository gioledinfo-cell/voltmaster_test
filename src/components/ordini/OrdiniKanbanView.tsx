import React, { useState } from 'react';
import { OrdineInterno, StatoOrdine } from '../../types';
import {
  Truck,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  Package,
  AlertTriangle,
  ArrowRight,
  Eye,
  Printer,
  Copy,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface OrdiniKanbanViewProps {
  ordini: OrdineInterno[];
  onOpenDetail: (ordine: OrdineInterno) => void;
  onAdvanceState: (ordineId: string, newState: StatoOrdine) => void;
  onOpenPrint: (ordine: OrdineInterno) => void;
  onDuplicate: (ordineId: string) => void;
  onMoveOrderState: (ordineId: string, targetState: StatoOrdine) => void;
}

interface ColumnConfig {
  id: StatoOrdine;
  label: string;
  color: string;
  headerBg: string;
  badgeBg: string;
  icon: React.ReactNode;
}

export const OrdiniKanbanView: React.FC<OrdiniKanbanViewProps> = ({
  ordini,
  onOpenDetail,
  onAdvanceState,
  onOpenPrint,
  onDuplicate,
  onMoveOrderState,
}) => {
  const [dragOverCol, setDragOverCol] = useState<StatoOrdine | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const columns: ColumnConfig[] = [
    {
      id: 'bozza',
      label: 'Bozza',
      color: 'border-slate-300 dark:border-slate-700',
      headerBg: 'bg-slate-100 dark:bg-slate-900',
      badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
    },
    {
      id: 'inviato',
      label: 'Inviato',
      color: 'border-blue-500/40',
      headerBg: 'bg-blue-950/40',
      badgeBg: 'bg-blue-500/20 text-blue-300',
      icon: <Send className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'confermato',
      label: 'Confermato',
      color: 'border-indigo-500/40',
      headerBg: 'bg-indigo-950/40',
      badgeBg: 'bg-indigo-500/20 text-indigo-300',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'in_transito',
      label: 'In Transito',
      color: 'border-cyan-500/40',
      headerBg: 'bg-cyan-950/40',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      icon: <Truck className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'consegnato',
      label: 'Consegnato',
      color: 'border-emerald-500/40',
      headerBg: 'bg-emerald-950/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'chiuso',
      label: 'Chiuso & Archiviato',
      color: 'border-teal-500/40',
      headerBg: 'bg-teal-950/40',
      badgeBg: 'bg-teal-500/20 text-teal-300',
      icon: <Package className="w-4 h-4 text-teal-400" />,
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(id);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: StatoOrdine) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onMoveOrderState(id, colId);
    }
    setDragOverCol(null);
    setDraggedOrderId(null);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgente':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'alta':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'media':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Helper Banner */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shadow-xs">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Trascina le schede ordine tra le colonne per avanzare lo stato del workflow in tempo reale.</span>
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          Totale ordini visualizzati: <strong>{ordini.length}</strong>
        </span>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {columns.map((col) => {
          const colOrders = ordini.filter((o) => o.stato === col.id);
          const colSum = colOrders.reduce((acc, o) => acc + o.importoTotale, 0);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border transition-all flex flex-col min-h-[500px] ${col.color} ${
                isOver ? 'bg-amber-50/80 dark:bg-slate-800/80 ring-2 ring-amber-500 shadow-xl' : 'bg-slate-100/60 dark:bg-slate-950/70'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3 rounded-t-2xl border-b border-slate-200 dark:border-slate-800/80 ${col.headerBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-200">
                    {col.icon}
                    <span>{col.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.badgeBg}`}>
                    {colOrders.length}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                  Valore: <strong className="text-slate-900 dark:text-slate-200">€ {colSum.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</strong>
                </div>
              </div>

              {/* Cards List */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                {colOrders.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-600 text-[11px] italic">
                    Nessun ordine
                  </div>
                ) : (
                  colOrders.map((ord) => {
                    const isLate =
                      ord.stato !== 'consegnato' &&
                      ord.stato !== 'chiuso' &&
                      ord.dataConsegnaPrevista < todayStr;

                    return (
                      <div
                        key={ord.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ord.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onOpenDetail(ord)}
                        className={`p-3 rounded-xl border bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-amber-500/50 transition-all cursor-grab active:cursor-grabbing shadow-xs flex flex-col justify-between space-y-2.5 ${
                          draggedOrderId === ord.id ? 'opacity-40 scale-95' : 'opacity-100'
                        } ${isLate ? 'border-rose-400 dark:border-rose-500/40' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        {/* Top: Numero & Tipo */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {ord.numero}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              ord.tipo === 'fornitore'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {ord.tipo === 'fornitore' ? 'Fornitore' : 'Cliente'}
                          </span>
                        </div>

                        {/* Destinatario & Cantiere */}
                        <div>
                          <div className="font-semibold text-xs text-slate-200 line-clamp-1">
                            {ord.destinatarioRagioneSociale}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{ord.cantiereRiferimentoNome}</span>
                          </div>
                        </div>

                        {/* Righe & Priorità */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            {ord.righe.length} {ord.righe.length === 1 ? 'riga' : 'righe'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${getPriorityBadge(ord.priorita)}`}>
                            {ord.priorita}
                          </span>
                        </div>

                        {/* Data Consegna */}
                        <div className="text-[10px] flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{ord.dataConsegnaPrevista}</span>
                          </span>
                          {isLate && (
                            <span className="text-rose-400 font-bold flex items-center gap-0.5 text-[9px]">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>RITARDO</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom: Importo & Quick Actions */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="font-mono font-black text-amber-400">
                            € {ord.importoTotale.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenPrint(ord)}
                              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Stampa PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenDetail(ord)}
                              className="p-1 rounded text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Dettaglio Ordine"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
