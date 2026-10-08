import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowRight,
  Flag,
  Users,
  HardHat,
  GripHorizontal,
  MoveHorizontal,
  Layers,
  Sparkles,
  Filter,
  Download,
  RotateCcw,
  Zap,
  ShieldCheck,
  Edit3,
  Trash2,
  X,
  Check,
  Info,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Dipendente } from '../../types';
import {
  exportCantiereSchedaExcel,
  exportCantiereSchedaPdf,
} from '../../utils/cantiereSchedaExportService';

export type GanttFaseCategoria =
  | 'sicurezza'
  | 'posa'
  | 'cablaggio'
  | 'quadri'
  | 'fotovoltaico'
  | 'collaudo';

export type GanttFaseStato = 'pianificato' | 'in_corso' | 'completato' | 'in_ritardo';

export interface GanttTask {
  id: string;
  codice: string;
  titolo: string;
  categoria: GanttFaseCategoria;
  dataInizio: string; // YYYY-MM-DD
  dataFine: string; // YYYY-MM-DD
  durataGiorni: number;
  avanzamento: number; // 0-100
  stato: GanttFaseStato;
  responsabileNome: string;
  squadraIds: string[];
  dipendenzaId?: string; // id del task da cui dipende
  isMilestone?: boolean;
  isCritico?: boolean;
  note?: string;
}

interface CantiereGanttSectionProps {
  cantiereId: string;
  cantiereCodice: string;
  cantiereTitolo: string;
  dataInizioCantiere: string;
  dataFineCantiere: string;
}

// Initial mock phases tailored for high-end electrical / industrial jobsite
const getInitialGanttTasks = (cantiereId: string): GanttTask[] => {
  return [
    {
      id: `${cantiereId}-fase-1`,
      codice: 'F-01',
      titolo: 'Allestimento Cantiere & Approvazione POS/PSC',
      categoria: 'sicurezza',
      dataInizio: '2026-09-15',
      dataFine: '2026-09-21',
      durataGiorni: 7,
      avanzamento: 100,
      stato: 'completato',
      responsabileNome: 'Ing. Roberto Fontana',
      squadraIds: ['usr-capo1', 'usr-op1'],
      isCritico: true,
      note: 'DPI anticaduta e verifica idoneità ponti su ruote e quadri cantiere ASC.',
    },
    {
      id: `${cantiereId}-fase-2`,
      codice: 'F-02',
      titolo: 'Posa Canaline Metalliche & Passerelle Portacavi',
      categoria: 'posa',
      dataInizio: '2026-09-22',
      dataFine: '2026-10-06',
      durataGiorni: 15,
      avanzamento: 100,
      stato: 'completato',
      responsabileNome: 'Matteo Bianchi',
      squadraIds: ['usr-capo1', 'usr-op1', 'usr-app1'],
      dipendenzaId: `${cantiereId}-fase-1`,
      isCritico: true,
      note: 'Staffaggio a soffitto e tagliame zincato per dorsali primarie BT.',
    },
    {
      id: `${cantiereId}-mile-1`,
      codice: 'M-01',
      titolo: 'SAL 1: Verifica Canaline & Chiusura Opere Murarie',
      categoria: 'posa',
      dataInizio: '2026-10-06',
      dataFine: '2026-10-06',
      durataGiorni: 1,
      avanzamento: 100,
      stato: 'completato',
      responsabileNome: 'Ing. Roberto Fontana',
      squadraIds: [],
      dipendenzaId: `${cantiereId}-fase-2`,
      isMilestone: true,
      isCritico: true,
      note: 'Verbale congiunto di verifica con Direzione Lavori e CSE.',
    },
    {
      id: `${cantiereId}-fase-3`,
      codice: 'F-03',
      titolo: 'Tiraggio Cavi FG16 & Linee Dorsali BT/MT',
      categoria: 'cablaggio',
      dataInizio: '2026-10-07',
      dataFine: '2026-10-24',
      durataGiorni: 18,
      avanzamento: 75,
      stato: 'in_corso',
      responsabileNome: 'Davide Riva',
      squadraIds: ['usr-op1', 'usr-op2', 'usr-app2'],
      dipendenzaId: `${cantiereId}-mile-1`,
      isCritico: true,
      note: 'Stesura multipolari 4x185 mm² e posa cavi comando schermati.',
    },
    {
      id: `${cantiereId}-fase-4`,
      codice: 'F-04',
      titolo: 'Assemblaggio & Cablaggio Power Center e Quadri BT',
      categoria: 'quadri',
      dataInizio: '2026-10-18',
      dataFine: '2026-11-08',
      durataGiorni: 22,
      avanzamento: 40,
      stato: 'in_corso',
      responsabileNome: 'Matteo Bianchi',
      squadraIds: ['usr-capo1', 'usr-op1'],
      dipendenzaId: `${cantiereId}-fase-3`,
      isCritico: true,
      note: 'Cablaggio sbarre di rame, montaggio interruttori scatolati e prove sganciatori.',
    },
    {
      id: `${cantiereId}-fase-5`,
      codice: 'F-05',
      titolo: 'Posa Moduli Fotovoltaici & Inverter di Stringa',
      categoria: 'fotovoltaico',
      dataInizio: '2026-10-25',
      dataFine: '2026-11-18',
      durataGiorni: 25,
      avanzamento: 15,
      stato: 'in_corso',
      responsabileNome: 'Luca Moretti',
      squadraIds: ['usr-op2', 'usr-app1'],
      dipendenzaId: `${cantiereId}-fase-3`,
      isCritico: false,
      note: 'Fissaggio strutture zavorrate su copertura piana e cablaggio quadri di campo DC.',
    },
    {
      id: `${cantiereId}-mile-2`,
      codice: 'M-02',
      titolo: 'Posa Gruppo di Misura e Allaccio Rete E-Distribuzione',
      categoria: 'collaudo',
      dataInizio: '2026-11-15',
      dataFine: '2026-11-15',
      durataGiorni: 1,
      avanzamento: 0,
      stato: 'pianificato',
      responsabileNome: 'Ing. Roberto Fontana',
      squadraIds: [],
      dipendenzaId: `${cantiereId}-fase-4`,
      isMilestone: true,
      isCritico: true,
      note: 'Intervento programmato con Enel Distribuzione per collaudo allaccio BT.',
    },
    {
      id: `${cantiereId}-fase-6`,
      codice: 'F-06',
      titolo: 'Prove Strumentali CEI 64-8 & Prove di Isolamento',
      categoria: 'collaudo',
      dataInizio: '2026-11-19',
      dataFine: '2026-11-30',
      durataGiorni: 12,
      avanzamento: 0,
      stato: 'pianificato',
      responsabileNome: 'Matteo Bianchi',
      squadraIds: ['usr-capo1', 'usr-op1'],
      dipendenzaId: `${cantiereId}-fase-4`,
      isCritico: true,
      note: 'Misura anello di guasto, resistenza di terra, continuità conduttori di protezione con Eurotest.',
    },
    {
      id: `${cantiereId}-mile-3`,
      codice: 'M-03',
      titolo: 'Collaudo Finale, Chiusura Lavori & Rilascio DiCo DM 37/08',
      categoria: 'collaudo',
      dataInizio: '2026-12-05',
      dataFine: '2026-12-05',
      durataGiorni: 1,
      avanzamento: 0,
      stato: 'pianificato',
      responsabileNome: 'Ing. Roberto Fontana',
      squadraIds: ['usr-capo1'],
      dipendenzaId: `${cantiereId}-fase-6`,
      isMilestone: true,
      isCritico: true,
      note: 'Firma digitale dichiarazione di conformità e consegna fascicolo as-built al committente.',
    },
  ];
};

const CATEGORIA_CONFIG: Record<
  GanttFaseCategoria,
  { label: string; bg: string; border: string; barColor: string; text: string }
> = {
  sicurezza: {
    label: 'Sicurezza & POS',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    barColor: 'from-rose-500 to-red-600',
    text: 'text-rose-600 dark:text-rose-400',
  },
  posa: {
    label: 'Posa Canaline',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    barColor: 'from-amber-500 to-orange-600',
    text: 'text-amber-600 dark:text-amber-400',
  },
  cablaggio: {
    label: 'Tiraggio Cavi',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    border: 'border-sky-500/30',
    barColor: 'from-sky-500 to-blue-600',
    text: 'text-sky-600 dark:text-sky-400',
  },
  quadri: {
    label: 'Cablaggio Quadri',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    barColor: 'from-indigo-500 to-purple-600',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  fotovoltaico: {
    label: 'Fotovoltaico & Inverter',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    barColor: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  collaudo: {
    label: 'Collaudo & DiCo',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    barColor: 'from-purple-500 to-violet-600',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

export const CantiereGanttSection: React.FC<CantiereGanttSectionProps> = ({
  cantiereId,
  cantiereCodice,
  cantiereTitolo,
  dataInizioCantiere,
  dataFineCantiere,
}) => {
  const { dipendenti, cantieri, sals, showToast } = useApp();

  const [tasks, setTasks] = useState<GanttTask[]>(() => getInitialGanttTasks(cantiereId));
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string>('tutti');
  const [showOnlyCritical, setShowOnlyCritical] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<'settimana' | 'mese'>('settimana');

  // Export handlers
  const handleExportGanttExcel = () => {
    const cantiere = cantieri.find((c) => c.id === cantiereId) || {
      id: cantiereId,
      codice: cantiereCodice,
      titolo: cantiereTitolo,
      clienteNome: 'Committente Cantiere',
      indirizzo: 'Sede Cantiere',
      citta: 'Milano',
      stato: 'in_corso',
      dataInizio: dataInizioCantiere,
      dataFinePrevista: dataFineCantiere,
      descrizione: 'Commessa Impianti VoltMaster',
    };
    const siteSals = sals.filter((s) => s.cantiereId === cantiereId);
    exportCantiereSchedaExcel({
      cantiere: cantiere as any,
      ganttTasks: tasks,
      salList: siteSals,
    });
    showToast('Cronoprogramma ed avanzamento SAL esportati in Excel (.xlsx)!', 'success');
  };

  const handleExportGanttPdf = () => {
    const cantiere = cantieri.find((c) => c.id === cantiereId) || {
      id: cantiereId,
      codice: cantiereCodice,
      titolo: cantiereTitolo,
      clienteNome: 'Committente Cantiere',
      indirizzo: 'Sede Cantiere',
      citta: 'Milano',
      stato: 'in_corso',
      dataInizio: dataInizioCantiere,
      dataFinePrevista: dataFineCantiere,
      descrizione: 'Commessa Impianti VoltMaster',
    };
    const siteSals = sals.filter((s) => s.cantiereId === cantiereId);
    exportCantiereSchedaPdf({
      cantiere: cantiere as any,
      ganttTasks: tasks,
      salList: siteSals,
    });
    showToast('Scheda Commessa e Cronoprogramma esportati in PDF (.pdf)!', 'success');
  };

  // Dragging interaction state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragInitialStart, setDragInitialStart] = useState<string>('');
  const [dragInitialEnd, setDragInitialEnd] = useState<string>('');
  const timelineRef = useRef<HTMLDivElement>(null);

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState<Partial<GanttTask>>({
    codice: `F-0${tasks.length + 1}`,
    titolo: '',
    categoria: 'posa',
    dataInizio: '2026-10-15',
    dataFine: '2026-10-30',
    durataGiorni: 15,
    avanzamento: 0,
    stato: 'pianificato',
    responsabileNome: 'Matteo Bianchi',
    squadraIds: [],
    isMilestone: false,
    isCritico: false,
    note: '',
  });

  // Calculate timeline start and end boundaries
  const { timelineStart, timelineEnd, totalDays, weeksArray } = useMemo(() => {
    // Find min and max dates across all tasks
    let minDate = new Date('2026-09-10');
    let maxDate = new Date('2026-12-20');

    tasks.forEach((t) => {
      const dStart = new Date(t.dataInizio);
      const dEnd = new Date(t.dataFine);
      if (dStart < minDate) minDate = dStart;
      if (dEnd > maxDate) maxDate = dEnd;
    });

    // Normalize to start on a Monday and end on a Sunday
    const start = new Date(minDate);
    const dayOfWeek = (start.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - dayOfWeek);

    const end = new Date(maxDate);
    const endDayOfWeek = (end.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - endDayOfWeek));

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Generate weeks
    const weeks: { weekNumber: number; startDate: Date; label: string }[] = [];
    const cur = new Date(start);
    let wIdx = 1;
    while (cur <= end) {
      const dStr = `${cur.getDate().toString().padStart(2, '0')}/${(cur.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      weeks.push({
        weekNumber: wIdx++,
        startDate: new Date(cur),
        label: `Sett. ${wIdx - 1} (${dStr})`,
      });
      cur.setDate(cur.getDate() + 7);
    }

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: Math.max(days, 14),
      weeksArray: weeks,
    };
  }, [tasks]);

  // Convert a date string (YYYY-MM-DD) into horizontal % position
  const getTimelinePosition = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffTime = d.getTime() - timelineStart.getTime();
    const daysFromStart = diffTime / (1000 * 60 * 60 * 24);
    const pct = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
    return pct;
  };

  // Convert a day offset to a YYYY-MM-DD string
  const addDaysToDate = (baseDate: string, days: number): string => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Difference in days between two dates
  const getDaysDiff = (d1: string, d2: string): number => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diff = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesCat = filterCategoria === 'tutti' || t.categoria === filterCategoria;
      const matchesCrit = !showOnlyCritical || t.isCritico;
      return matchesCat && matchesCrit;
    });
  }, [tasks, filterCategoria, showOnlyCritical]);

  // "Today" position indicator
  const todayPosition = useMemo(() => {
    const today = new Date('2026-10-07'); // Current app virtual date
    const diffTime = today.getTime() - timelineStart.getTime();
    const daysFromStart = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  }, [timelineStart, totalDays]);

  // Overall project Gantt stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.avanzamento === 100).length;
    const inProgress = tasks.filter((t) => t.avanzamento > 0 && t.avanzamento < 100).length;
    const avgProgress = Math.round(
      tasks.reduce((acc, t) => acc + t.avanzamento, 0) / (total || 1)
    );
    const milestonesCount = tasks.filter((t) => t.isMilestone).length;
    return { total, completed, inProgress, avgProgress, milestonesCount };
  }, [tasks]);

  // Dragging logic
  const handleMouseDownBar = (
    e: React.MouseEvent,
    task: GanttTask,
    action: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingTaskId(task.id);
    setDragAction(action);
    setDragStartX(e.clientX);
    setDragInitialStart(task.dataInizio);
    setDragInitialEnd(task.dataFine);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingTaskId || !dragAction || !timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const deltaPx = e.clientX - dragStartX;
      const pixelsPerDay = timelineRect.width / totalDays;
      const daysDelta = Math.round(deltaPx / (pixelsPerDay || 10));

      if (daysDelta === 0) return;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== draggingTaskId) return t;

          if (dragAction === 'move') {
            const newStart = addDaysToDate(dragInitialStart, daysDelta);
            const newEnd = addDaysToDate(dragInitialEnd, daysDelta);
            return {
              ...t,
              dataInizio: newStart,
              dataFine: newEnd,
            };
          } else if (dragAction === 'resize-end') {
            const newEnd = addDaysToDate(dragInitialEnd, daysDelta);
            const daysCount = Math.max(1, getDaysDiff(t.dataInizio, newEnd) + 1);
            if (new Date(newEnd) < new Date(t.dataInizio)) return t;
            return {
              ...t,
              dataFine: newEnd,
              durataGiorni: daysCount,
            };
          } else if (dragAction === 'resize-start') {
            const newStart = addDaysToDate(dragInitialStart, daysDelta);
            const daysCount = Math.max(1, getDaysDiff(newStart, t.dataFine) + 1);
            if (new Date(newStart) > new Date(t.dataFine)) return t;
            return {
              ...t,
              dataInizio: newStart,
              durataGiorni: daysCount,
            };
          }
          return t;
        })
      );
    };

    const handleMouseUp = () => {
      if (draggingTaskId) {
        showToast('Timeline aggiornata! Cronoprogramma ricalcolato.', 'success');
      }
      setDraggingTaskId(null);
      setDragAction(null);
    };

    if (draggingTaskId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTaskId, dragAction, dragStartX, dragInitialStart, dragInitialEnd, totalDays, showToast]);

  // Save edited task
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? selectedTask : t)));
    setIsEditModalOpen(false);
    showToast(`Fase "${selectedTask.titolo}" aggiornata con successo!`, 'success');
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setIsEditModalOpen(false);
    showToast('Fase rimossa dal cronoprogramma.', 'info');
  };

  // Add new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.titolo) return;

    const durata = Math.max(
      1,
      getDaysDiff(newTaskForm.dataInizio || '2026-10-15', newTaskForm.dataFine || '2026-10-30') + 1
    );

    const created: GanttTask = {
      id: `${cantiereId}-fase-${Date.now()}`,
      codice: newTaskForm.codice || `F-0${tasks.length + 1}`,
      titolo: newTaskForm.titolo || 'Nuova Fase',
      categoria: (newTaskForm.categoria as GanttFaseCategoria) || 'posa',
      dataInizio: newTaskForm.dataInizio || '2026-10-15',
      dataFine: newTaskForm.dataFine || '2026-10-30',
      durataGiorni: durata,
      avanzamento: Number(newTaskForm.avanzamento) || 0,
      stato: (newTaskForm.stato as GanttFaseStato) || 'pianificato',
      responsabileNome: newTaskForm.responsabileNome || 'Matteo Bianchi',
      squadraIds: newTaskForm.squadraIds || [],
      dipendenzaId: newTaskForm.dipendenzaId || undefined,
      isMilestone: Boolean(newTaskForm.isMilestone),
      isCritico: Boolean(newTaskForm.isCritico),
      note: newTaskForm.note || '',
    };

    setTasks((prev) => [...prev, created]);
    setIsNewTaskModalOpen(false);
    setNewTaskForm({
      codice: `F-0${tasks.length + 2}`,
      titolo: '',
      categoria: 'posa',
      dataInizio: '2026-10-15',
      dataFine: '2026-10-30',
      durataGiorni: 15,
      avanzamento: 0,
      stato: 'pianificato',
      responsabileNome: 'Matteo Bianchi',
      squadraIds: [],
      isMilestone: false,
      isCritico: false,
      note: '',
    });
    showToast(`Nuova fase "${created.titolo}" inserita nel Gantt!`, 'success');
  };

  // Reset to default
  const handleResetSchedule = () => {
    setTasks(getInitialGanttTasks(cantiereId));
    showToast('Cronoprogramma ripristinato alla baseline contrattuale.', 'info');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              Cronoprogramma Lavori & Gantt Interattivo
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {cantiereCodice}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pianificazione sequenziale delle fasi impiantistiche, milestone contrattuali e gestione
            dipendenze fine-inizio (FS). Trascina le barre per riprogrammare.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setShowOnlyCritical((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              showOnlyCritical
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span>Percorso Critico</span>
          </button>

          <button
            type="button"
            onClick={handleExportGanttExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Esporta Cronoprogramma in formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Gantt</span>
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportGanttPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Esporta Scheda Cronoprogramma in formato PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Gantt</span>
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleResetSchedule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            title="Ripristina baseline iniziale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baseline</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Fase / Milestone</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Fasi Totali</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{stats.total}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-mono block">
            Completate
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono block">
            In Corso
          </span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
            {stats.inProgress}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-mono block">
            Milestone SAL
          </span>
          <span className="text-sm font-black text-purple-600 dark:text-purple-400">
            {stats.milestonesCount}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Avanzamento Globale</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {stats.avgProgress}%
          </span>
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Filtro Disciplina:</span>
          <button
            onClick={() => setFilterCategoria('tutti')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filterCategoria === 'tutti'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tutte ({tasks.length})
          </button>
          {(Object.keys(CATEGORIA_CONFIG) as GanttFaseCategoria[]).map((cat) => {
            const cfg = CATEGORIA_CONFIG[cat];
            const count = tasks.filter((t) => t.categoria === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategoria(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterCategoria === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          <span>Oggi: 07 Ottobre 2026</span>
        </div>
      </div>

      {/* 4. GANTT CHART MAIN CONTAINER */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline Header Row */}
            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
              {/* Left Column: Task Info (4 Cols) */}
              <div className="col-span-4 p-3 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="uppercase tracking-wider font-mono text-[11px]">
                  Fase di Lavorazione / WBS
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Durata / Avanzamento</span>
              </div>

              {/* Right Column: Temporal Weeks Timeline (8 Cols) */}
              <div className="col-span-8 relative py-2 px-1 flex">
                {weeksArray.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center border-r border-slate-200 dark:border-slate-800/60 last:border-r-0"
                  >
                    <span className="block text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {w.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800/60 relative">
              {/* Vertical TODAY line overlay */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
                style={{
                  left: `calc(33.333% + (66.666% * ${todayPosition} / 100))`,
                }}
              >
                <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="absolute -top-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-400 text-slate-950 font-mono shadow-xs -translate-x-1/2">
                  OGGI
                </span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nessuna lavorazione corrisponde ai filtri selezionati.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const catCfg = CATEGORIA_CONFIG[task.categoria] || CATEGORIA_CONFIG.posa;
                  const leftPct = getTimelinePosition(task.dataInizio);
                  const rightPct = getTimelinePosition(task.dataFine);
                  const barWidthPct = Math.max(1.5, rightPct - leftPct);

                  const depTask = task.dipendenzaId
                    ? tasks.find((t) => t.id === task.dipendenzaId)
                    : null;

                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors group relative"
                    >
                      {/* Left: Task Details */}
                      <div className="col-span-4 p-2.5 sm:p-3 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                              {task.codice}
                            </span>
                            {task.isMilestone && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                                <Flag className="w-2.5 h-2.5" />
                                MILESTONE
                              </span>
                            )}
                            {task.isCritico && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                CRITICO
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${catCfg.bg} ${catCfg.text}`}
                            >
                              {catCfg.label}
                            </span>
                          </div>

                          <h4
                            onClick={() => {
                              setSelectedTask(task);
                              setIsEditModalOpen(true);
                            }}
                            className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate mt-1 cursor-pointer hover:text-amber-500 transition-colors"
                            title={task.titolo}
                          >
                            {task.titolo}
                          </h4>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <HardHat className="w-3 h-3 text-amber-500" />
                              {task.responsabileNome}
                            </span>
                            {depTask && (
                              <span
                                className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5"
                                title={`Dipende da: ${depTask.titolo}`}
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                                Dipende da {depTask.codice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Badge */}
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                            {task.durataGiorni} gg
                          </span>
                          <span
                            className={`block text-[10px] font-mono font-bold ${
                              task.avanzamento === 100
                                ? 'text-emerald-500'
                                : task.avanzamento > 0
                                ? 'text-amber-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {task.avanzamento}%
                          </span>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Timeline Canvas */}
                      <div
                        ref={timelineRef}
                        className="col-span-8 p-2 sm:p-2.5 relative flex items-center select-none"
                      >
                        {/* Milestone Rendering (Diamond Flag) */}
                        {task.isMilestone ? (
                          <div
                            style={{ left: `${leftPct}%` }}
                            className="absolute -translate-x-1/2 flex items-center gap-1.5 cursor-pointer z-10 group/mile"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <div className="w-7 h-7 bg-purple-600 border-2 border-white dark:border-slate-900 rotate-45 flex items-center justify-center shadow-md shadow-purple-600/30 group-hover/mile:scale-110 transition-transform">
                              <Flag className="w-3.5 h-3.5 text-white -rotate-45" />
                            </div>
                            <span className="hidden xl:inline text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded shadow-xs border border-purple-500/20 truncate max-w-[150px]">
                              {task.titolo}
                            </span>
                          </div>
                        ) : (
                          /* Standard Phase Bar */
                          <div
                            style={{
                              left: `${leftPct}%`,
                              width: `${barWidthPct}%`,
                            }}
                            className={`absolute h-8 sm:h-9 rounded-lg border shadow-sm transition-all flex items-center justify-between px-2 cursor-grab active:cursor-grabbing ${
                              catCfg.bg
                            } ${catCfg.border} ${
                              draggingTaskId === task.id ? 'ring-2 ring-amber-400 scale-[1.02] z-30' : ''
                            }`}
                            onMouseDown={(e) => handleMouseDownBar(e, task, 'move')}
                            onClick={() => {
                              setSelectedTask(task);
                              setIsEditModalOpen(true);
                            }}
                            title={`Trascina per spostare. Inizio: ${task.dataInizio} - Fine: ${task.dataFine}`}
                          >
                            {/* Left resize handle */}
                            <div
                              className="w-2 h-full absolute left-0 top-0 cursor-ew-resize hover:bg-slate-400/30 rounded-l-lg flex items-center justify-center"
                              onMouseDown={(e) => handleMouseDownBar(e, task, 'resize-start')}
                              title="Trascina data inizio"
                            >
                              <div className="w-0.5 h-3 bg-slate-400/60 rounded" />
                            </div>

                            {/* Inner progress fill bar */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 rounded-lg bg-gradient-to-r ${catCfg.barColor} opacity-75 pointer-events-none transition-all`}
                              style={{ width: `${task.avanzamento}%` }}
                            />

                            {/* Bar text label */}
                            <div className="relative z-10 flex items-center justify-between w-full min-w-0 pr-1 pl-1">
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-white truncate drop-shadow-xs">
                                {task.titolo}
                              </span>
                              <span className="font-mono text-[9.5px] font-black text-slate-900 dark:text-white ml-1.5 shrink-0 bg-black/20 px-1 rounded">
                                {task.avanzamento}%
                              </span>
                            </div>

                            {/* Right resize handle */}
                            <div
                              className="w-2 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-slate-400/30 rounded-r-lg flex items-center justify-center"
                              onMouseDown={(e) => handleMouseDownBar(e, task, 'resize-end')}
                              title="Trascina data fine"
                            >
                              <div className="w-0.5 h-3 bg-slate-400/60 rounded" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. GANTT FOOTER INSTRUCTIONS & LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <MoveHorizontal className="w-4 h-4 text-amber-500" />
            <span>Trascina il corpo della barra per spostare le date; le maniglie laterali per variare la durata.</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
            <Flag className="w-3.5 h-3.5" />
            <span>Rombo = Milestone contrattuale SAL / Collaudo</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Timeline: {timelineStart.toISOString().split('T')[0]} → {timelineEnd.toISOString().split('T')[0]} ({totalDays} gg totali)
        </div>
      </div>

      {/* MODAL EDIT TASK / PHASE */}
      {isEditModalOpen && selectedTask && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {selectedTask.codice}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Modifica Fase Cronoprogramma
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Titolo Fase</label>
                <input
                  type="text"
                  value={selectedTask.titolo}
                  onChange={(e) => setSelectedTask({ ...selectedTask, titolo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Categoria Disciplina</label>
                  <select
                    value={selectedTask.categoria}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        categoria: e.target.value as GanttFaseCategoria,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {(Object.keys(CATEGORIA_CONFIG) as GanttFaseCategoria[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORIA_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Stato Esecuzione</label>
                  <select
                    value={selectedTask.stato}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        stato: e.target.value as GanttFaseStato,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="pianificato">Pianificato</option>
                    <option value="in_corso">In Corso</option>
                    <option value="completato">Completato</option>
                    <option value="in_ritardo">In Ritardo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Inizio</label>
                  <input
                    type="date"
                    value={selectedTask.dataInizio}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const durata = Math.max(1, getDaysDiff(newStart, selectedTask.dataFine) + 1);
                      setSelectedTask({
                        ...selectedTask,
                        dataInizio: newStart,
                        durataGiorni: durata,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Fine</label>
                  <input
                    type="date"
                    value={selectedTask.dataFine}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const durata = Math.max(1, getDaysDiff(selectedTask.dataInizio, newEnd) + 1);
                      setSelectedTask({
                        ...selectedTask,
                        dataFine: newEnd,
                        durataGiorni: durata,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between text-slate-500 font-semibold mb-1">
                  <span>Avanzamento Lavorazione</span>
                  <span className="font-mono font-bold text-amber-500">
                    {selectedTask.avanzamento}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedTask.avanzamento}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      avanzamento: Number(e.target.value),
                      stato:
                        Number(e.target.value) === 100
                          ? 'completato'
                          : Number(e.target.value) > 0
                          ? 'in_corso'
                          : 'pianificato',
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Responsabile & Dependency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Responsabile</label>
                  <input
                    type="text"
                    value={selectedTask.responsabileNome}
                    onChange={(e) =>
                      setSelectedTask({ ...selectedTask, responsabileNome: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Dipende da (FS)</label>
                  <select
                    value={selectedTask.dipendenzaId || ''}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        dipendenzaId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Nessuna dipendenza</option>
                    {tasks
                      .filter((t) => t.id !== selectedTask.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.codice} - {t.titolo}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes: Milestone & Critical */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedTask.isMilestone)}
                    onChange={(e) =>
                      setSelectedTask({ ...selectedTask, isMilestone: e.target.checked })
                    }
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">È una Milestone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedTask.isCritico)}
                    onChange={(e) =>
                      setSelectedTask({ ...selectedTask, isCritico: e.target.checked })
                    }
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Percorso Critico</span>
                </label>
              </div>

              {/* Note */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Note Tecniche & Sicurezza</label>
                <textarea
                  rows={2}
                  value={selectedTask.note || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, note: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  placeholder="Specifiche tecniche o prescrizioni CSE..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 font-bold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Elimina
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NEW TASK */}
      {isNewTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsNewTaskModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Aggiungi Nuova Fase o Milestone al Gantt
                </h3>
                <p className="text-xs text-slate-400">
                  Inserisci una lavorazione o una milestone contrattuale per {cantiereCodice}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Codice</label>
                  <input
                    type="text"
                    value={newTaskForm.codice}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, codice: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1">Titolo Fase</label>
                  <input
                    type="text"
                    value={newTaskForm.titolo}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, titolo: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                    placeholder="Es. Collaudo Inverter e Stringhe..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Categoria Disciplina</label>
                  <select
                    value={newTaskForm.categoria}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        categoria: e.target.value as GanttFaseCategoria,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {(Object.keys(CATEGORIA_CONFIG) as GanttFaseCategoria[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORIA_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Responsabile Tecnico</label>
                  <input
                    type="text"
                    value={newTaskForm.responsabileNome}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, responsabileNome: e.target.value })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Inizio</label>
                  <input
                    type="date"
                    value={newTaskForm.dataInizio}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dataInizio: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Fine</label>
                  <input
                    type="date"
                    value={newTaskForm.dataFine}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dataFine: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newTaskForm.isMilestone)}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, isMilestone: e.target.checked })
                    }
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">È una Milestone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newTaskForm.isCritico)}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, isCritico: e.target.checked })
                    }
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Percorso Critico</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Dipendenza Precedente</label>
                <select
                  value={newTaskForm.dipendenzaId || ''}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      dipendenzaId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Nessuna dipendenza</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.codice} - {t.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Note / Prescrizioni</label>
                <textarea
                  rows={2}
                  value={newTaskForm.note}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, note: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  placeholder="DPI richiesti, note orarie o materiali..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs"
                >
                  Inserisci nel Cronoprogramma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
