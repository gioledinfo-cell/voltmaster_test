import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Building2,
  UserCheck,
  ShoppingBag,
  Wrench,
  Smartphone,
  Truck,
  Warehouse,
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  Trash2,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Euro,
  Star,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImpostazioniTabId } from '../../types/anagrafica';
import { anagraficaExcelService } from '../../services/anagraficaExcelService';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ImportAnagraficaModal } from './ImportAnagraficaModal';
import { CantiereFormModal } from './CantiereFormModal';
import { ClienteFormModal } from './ClienteFormModal';
import { FornitoreFormModal } from './FornitoreFormModal';
import { AttrezzaturaFormModal } from './AttrezzaturaFormModal';
import { DispositivoFormModal } from './DispositivoFormModal';
import { MezzoFormModal } from './MezzoFormModal';
import { MagazzinoFormModal } from './MagazzinoFormModal';
import { OperatoreFormModal } from './OperatoreFormModal';
import { Cantiere, Cliente, Attrezzatura, Veicolo, ArticoloMagazzino, Dipendente } from '../../types';
import { FornitoreAnagrafica } from '../../data/mockOrdini';
import { DispositivoAziendale, SubappaltoAnagrafica } from '../../types/anagrafica';

export const ImpostazioniAmministrazioneModule: React.FC = () => {
  const {
    currentUser,
    setCurrentRole,
    setActiveTab,
    cantieri,
    addCantiere,
    updateCantiere,
    deleteCantiere,
    clienti,
    addCliente,
    updateCliente,
    deleteCliente,
    fornitori,
    addFornitore,
    updateFornitore,
    deleteFornitore,
    attrezzature,
    addAttrezzatura,
    updateAttrezzatura,
    deleteAttrezzatura,
    dispositiviAziendali,
    addDispositivoAziendale,
    updateDispositivoAziendale,
    deleteDispositivoAziendale,
    veicoli,
    addVeicolo,
    updateVeicolo,
    deleteVeicolo,
    magazzino,
    addArticoloMagazzino,
    updateArticoloMagazzino,
    deleteArticoloMagazzino,
    dipendenti,
    addDipendente,
    updateDipendente,
    deleteDipendente,
    subappalti,
    addSubappalto,
    updateSubappalto,
    deleteSubappalto,
    showToast,
  } = useApp();

  // Active Anagrafica Tab
  const [activeAnagraficaTab, setActiveAnagraficaTab] = useState<ImpostazioniTabId>('cantieri');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sub-filter for Operai tab (all, dipendenti, subappalti)
  const [operaiSubFilter, setOperaiSubFilter] = useState<'all' | 'dipendenti' | 'subappalti'>('all');

  // Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: string;
    tab: ImpostazioniTabId | 'subappalti';
  }>({
    isOpen: false,
    id: '',
    name: '',
    type: '',
    tab: 'cantieri',
  });

  // Edit / Create Modals
  const [editingCantiere, setEditingCantiere] = useState<Cantiere | null | 'new'>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null | 'new'>(null);
  const [editingFornitore, setEditingFornitore] = useState<FornitoreAnagrafica | null | 'new'>(null);
  const [editingAttrezzatura, setEditingAttrezzatura] = useState<Attrezzatura | null | 'new'>(null);
  const [editingDispositivo, setEditingDispositivo] = useState<DispositivoAziendale | null | 'new'>(null);
  const [editingMezzo, setEditingMezzo] = useState<Veicolo | null | 'new'>(null);
  const [editingMagazzino, setEditingMagazzino] = useState<ArticoloMagazzino | null | 'new'>(null);
  const [editingOperatore, setEditingOperatore] = useState<{
    isOpen: boolean;
    type: 'dipendente' | 'subappalto';
    dipendente?: Dipendente | null;
    subappalto?: SubappaltoAnagrafica | null;
  }>({
    isOpen: false,
    type: 'dipendente',
  });

  // RBAC Check: Only Administrator or Responsible
  const isAdmin = currentUser.role === 'amministratore' || currentUser.role === 'responsabile';

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Accesso Riservato — Direzione Aziendale
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            La sezione <strong>Impostazioni & Anagrafica Centrale</strong> è riservata agli utenti con profilo Amministratore o Responsabile Generale. Il tuo account attuale è <strong>{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Passa a un profilo Amministratore per accedere:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentRole('amministratore')}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors text-center"
            >
              Accedi come Amministratore (Admin)
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="py-2 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tabs Definitions
  const tabsConfig = [
    { id: 'cantieri' as const, label: 'Cantieri', icon: Building2, count: cantieri.length },
    { id: 'clienti' as const, label: 'Clienti', icon: UserCheck, count: clienti.length },
    { id: 'fornitori' as const, label: 'Fornitori', icon: ShoppingBag, count: fornitori.length },
    { id: 'attrezzature' as const, label: 'Attrezzature', icon: Wrench, count: attrezzature.length },
    { id: 'dispositivi' as const, label: 'Dispositivi IT', icon: Smartphone, count: dispositiviAziendali.length },
    { id: 'mezzi' as const, label: 'Mezzi & Flotta', icon: Truck, count: veicoli.length },
    { id: 'magazzino' as const, label: 'Magazzino', icon: Warehouse, count: magazzino.length },
    { id: 'operai' as const, label: 'Organico & Subappalti', icon: Users, count: dipendenti.length + subappalti.length },
  ];

  // Current tab metadata
  const currentTabDef = tabsConfig.find((t) => t.id === activeAnagraficaTab)!;

  // Generic Exporter
  const handleExport = (format: 'excel' | 'csv') => {
    let dataset: any[] = [];
    switch (activeAnagraficaTab) {
      case 'cantieri': dataset = cantieri; break;
      case 'clienti': dataset = clienti; break;
      case 'fornitori': dataset = fornitori; break;
      case 'attrezzature': dataset = attrezzature; break;
      case 'dispositivi': dataset = dispositiviAziendali; break;
      case 'mezzi': dataset = veicoli; break;
      case 'magazzino': dataset = magazzino; break;
      case 'operai':
        dataset = [
          ...dipendenti.map((d) => ({ tipoRecord: 'dipendente', ...d })),
          ...subappalti.map((s) => ({ tipoRecord: 'subappalto', ...s })),
        ];
        break;
    }

    if (format === 'excel') {
      anagraficaExcelService.exportToExcel(activeAnagraficaTab, dataset);
      showToast(`Esportato file Excel Anagrafica ${currentTabDef.label}`, 'success');
    } else {
      anagraficaExcelService.exportToCsv(activeAnagraficaTab, dataset);
      showToast(`Esportato file CSV Anagrafica ${currentTabDef.label}`, 'success');
    }
  };

  // Commit imported records
  const handleCommitImport = (items: any[]) => {
    switch (activeAnagraficaTab) {
      case 'cantieri':
        items.forEach((c) => {
          const exists = cantieri.some((x) => x.id === c.id || x.codice === c.codice);
          if (exists) updateCantiere(c.id, c);
          else addCantiere(c);
        });
        break;
      case 'clienti':
        items.forEach((c) => {
          const exists = clienti.some((x) => x.id === c.id || (c.partitaIva && x.partitaIva === c.partitaIva));
          if (exists) updateCliente(c.id, c);
          else addCliente(c);
        });
        break;
      case 'fornitori':
        items.forEach((f) => {
          const exists = fornitori.some((x) => x.id === f.id || (f.partitaIva && x.partitaIva === f.partitaIva));
          if (exists) updateFornitore(f.id, f);
          else addFornitore(f);
        });
        break;
      case 'attrezzature':
        items.forEach((a) => {
          const exists = attrezzature.some((x) => x.id === a.id || x.codiceUnivoco === a.codiceUnivoco);
          if (exists) updateAttrezzatura(a.id, a);
          else addAttrezzatura(a);
        });
        break;
      case 'dispositivi':
        items.forEach((d) => {
          const exists = dispositiviAziendali.some((x) => x.id === d.id || x.codice === d.codice);
          if (exists) updateDispositivoAziendale(d.id, d);
          else addDispositivoAziendale(d);
        });
        break;
      case 'mezzi':
        items.forEach((v) => {
          const exists = veicoli.some((x) => x.id === v.id || x.targa === v.targa);
          if (exists) updateVeicolo(v.id, v);
          else addVeicolo(v);
        });
        break;
      case 'magazzino':
        items.forEach((m) => {
          const exists = magazzino.some((x) => x.id === m.id || x.codiceSku === m.codiceSku);
          if (exists) updateArticoloMagazzino(m.id, m);
          else addArticoloMagazzino(m);
        });
        break;
      case 'operai':
        items.forEach((item) => {
          if (item.partitaIva || item.ragioneSociale) {
            const exists = subappalti.some((x) => x.id === item.id || x.partitaIva === item.partitaIva);
            if (exists) updateSubappalto(item.id, item);
            else addSubappalto(item);
          } else {
            const exists = dipendenti.some((x) => x.id === item.id || (item.codiceFiscale && x.codiceFiscale === item.codiceFiscale));
            if (exists) updateDipendente(item.id, item);
            else addDipendente(item);
          }
        });
        break;
    }
    showToast(`Aggiornati/Inseriti ${items.length} record in anagrafica ${currentTabDef.label}!`, 'success');
  };

  // Execute deletion
  const handleExecuteDelete = () => {
    const { id, tab } = deleteModal;
    if (tab === 'cantieri') deleteCantiere(id);
    else if (tab === 'clienti') deleteCliente(id);
    else if (tab === 'fornitori') deleteFornitore(id);
    else if (tab === 'attrezzature') deleteAttrezzatura(id);
    else if (tab === 'dispositivi') deleteDispositivoAziendale(id);
    else if (tab === 'mezzi') deleteVeicolo(id);
    else if (tab === 'magazzino') deleteArticoloMagazzino(id);
    else if (tab === 'operai') deleteDipendente(id);
    else if (tab === 'subappalti') deleteSubappalto(id);
  };

  // Get current dataset for import modal comparison
  const getCurrentDataset = () => {
    switch (activeAnagraficaTab) {
      case 'cantieri': return cantieri;
      case 'clienti': return clienti;
      case 'fornitori': return fornitori;
      case 'attrezzature': return attrezzature;
      case 'dispositivi': return dispositiviAziendali;
      case 'mezzi': return veicoli;
      case 'magazzino': return magazzino;
      case 'operai': return [...dipendenti, ...subappalti];
    }
  };

  // Filtered lists
  const filteredCantieri = useMemo(() => {
    return cantieri.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || c.codice.toLowerCase().includes(q) || c.titolo.toLowerCase().includes(q) || c.clienteNome.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || c.stato === statusFilter;
      return matchQ && matchS;
    });
  }, [cantieri, searchQuery, statusFilter]);

  const filteredClienti = useMemo(() => {
    return clienti.filter((c) => {
      const q = searchQuery.toLowerCase();
      return !q || c.ragioneSociale.toLowerCase().includes(q) || c.partitaIva.includes(q) || c.referente.toLowerCase().includes(q);
    });
  }, [clienti, searchQuery]);

  const filteredFornitori = useMemo(() => {
    return fornitori.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || f.ragioneSociale.toLowerCase().includes(q) || f.partitaIva.includes(q) || f.referente.toLowerCase().includes(q);
      const matchC = statusFilter === 'all' || f.categoria === statusFilter;
      return matchQ && matchC;
    });
  }, [fornitori, searchQuery, statusFilter]);

  const filteredAttrezzature = useMemo(() => {
    return attrezzature.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || a.codiceUnivoco.toLowerCase().includes(q) || a.nome.toLowerCase().includes(q) || a.matricola.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || a.stato === statusFilter;
      return matchQ && matchS;
    });
  }, [attrezzature, searchQuery, statusFilter]);

  const filteredDispositivi = useMemo(() => {
    return dispositiviAziendali.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || d.codice.toLowerCase().includes(q) || d.marcaModello.toLowerCase().includes(q) || d.serialeImei.toLowerCase().includes(q) || d.assegnatarioNome.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || d.stato === statusFilter || d.tipologia === statusFilter;
      return matchQ && matchS;
    });
  }, [dispositiviAziendali, searchQuery, statusFilter]);

  const filteredVeicoli = useMemo(() => {
    return veicoli.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || v.targa.toLowerCase().includes(q) || v.modello.toLowerCase().includes(q) || (v.autistaAssegnatoNome && v.autistaAssegnatoNome.toLowerCase().includes(q));
      const matchS = statusFilter === 'all' || v.stato === statusFilter;
      return matchQ && matchS;
    });
  }, [veicoli, searchQuery, statusFilter]);

  const filteredMagazzino = useMemo(() => {
    return magazzino.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || m.codiceSku.toLowerCase().includes(q) || m.nome.toLowerCase().includes(q) || m.ubicazioneScaffale.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || m.categoria === statusFilter;
      return matchQ && matchS;
    });
  }, [magazzino, searchQuery, statusFilter]);

  const filteredDipendenti = useMemo(() => {
    return dipendenti.filter((d) => {
      const q = searchQuery.toLowerCase();
      return !q || d.nome.toLowerCase().includes(q) || d.cognome.toLowerCase().includes(q) || d.codiceFiscale.toLowerCase().includes(q) || d.ruoloAziendale.toLowerCase().includes(q);
    });
  }, [dipendenti, searchQuery]);

  const filteredSubappalti = useMemo(() => {
    return subappalti.filter((s) => {
      const q = searchQuery.toLowerCase();
      return !q || s.ragioneSociale.toLowerCase().includes(q) || s.partitaIva.includes(q) || s.categoriaLavorazione.toLowerCase().includes(q);
    });
  }, [subappalti, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" /> GESTIONE ANAGRAFICHE AZIENDALI & CONFIGURAZIONE GLOBALE
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Impostazioni Amministrazione
            <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              Accesso Admin
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Piattaforma centrale per la manutenzione e sincronizzazione delle anagrafiche di commesse, committenti, ditte fornitrici, flotta mezzi, strumenti di lavoro, giacenze e risorse umane.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Cantieri Attivi</span>
            <span className="text-sm font-black text-amber-400">{cantieri.filter((c) => c.stato === 'in_corso').length} / {cantieri.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Totale Asset</span>
            <span className="text-sm font-black text-emerald-400">{veicoli.length + attrezzature.length + dispositiviAziendali.length}</span>
          </div>
        </div>
      </div>

      {/* Horizontal Anagrafica Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = activeAnagraficaTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveAnagraficaTab(t.id);
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isActive
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cerca in ${currentTabDef.label} per codice, nome o referente...`}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick Subfilter for Operai tab */}
          {activeAnagraficaTab === 'operai' && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setOperaiSubFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  operaiSubFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Tutti ({dipendenti.length + subappalti.length})
              </button>
              <button
                onClick={() => setOperaiSubFilter('dipendenti')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  operaiSubFilter === 'dipendenti'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Dipendenti ({dipendenti.length})
              </button>
              <button
                onClick={() => setOperaiSubFilter('subappalti')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  operaiSubFilter === 'subappalti'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Subappalti ({subappalti.length})
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons: Add, Import, Download Template, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* New Record Button */}
          <button
            onClick={() => {
              switch (activeAnagraficaTab) {
                case 'cantieri': setEditingCantiere('new'); break;
                case 'clienti': setEditingCliente('new'); break;
                case 'fornitori': setEditingFornitore('new'); break;
                case 'attrezzature': setEditingAttrezzatura('new'); break;
                case 'dispositivi': setEditingDispositivo('new'); break;
                case 'mezzi': setEditingMezzo('new'); break;
                case 'magazzino': setEditingMagazzino('new'); break;
                case 'operai':
                  setEditingOperatore({
                    isOpen: true,
                    type: operaiSubFilter === 'subappalti' ? 'subappalto' : 'dipendente',
                  });
                  break;
              }
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuovo Record
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            Importa Excel / CSV
          </button>

          {/* Download Template */}
          <button
            onClick={() => anagraficaExcelService.downloadTemplate(activeAnagraficaTab)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Scarica foglio Excel di esempio con le intestazioni raccomandate"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Template
          </button>

          {/* Export Excel */}
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>

          {/* Export CSV */}
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Cantieri Table */}
        {activeAnagraficaTab === 'cantieri' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Codice</th>
                  <th className="py-3.5 px-4 font-bold">Titolo / Nome Commessa</th>
                  <th className="py-3.5 px-4 font-bold">Cliente / Committente</th>
                  <th className="py-3.5 px-4 font-bold">Città & Indirizzo</th>
                  <th className="py-3.5 px-4 font-bold">Responsabile</th>
                  <th className="py-3.5 px-4 font-bold">Importo Lavori</th>
                  <th className="py-3.5 px-4 font-bold">Stato</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCantieri.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nessun cantiere trovato per i criteri selezionati.
                    </td>
                  </tr>
                ) : (
                  filteredCantieri.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{c.codice}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{c.titolo}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{c.clienteNome}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.citta}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{c.responsabileNome}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">€ {c.budgetTotale.toLocaleString('it-IT')}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.stato === 'in_corso'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : c.stato === 'completato'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {c.stato.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCantiere(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifica"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: c.id,
                              name: `${c.codice} - ${c.titolo}`,
                              type: 'Cantiere / Commessa',
                              tab: 'cantieri',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Clienti Table */}
        {activeAnagraficaTab === 'clienti' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Ragione Sociale</th>
                  <th className="py-3.5 px-4 font-bold">Partita IVA / CF</th>
                  <th className="py-3.5 px-4 font-bold">Referente</th>
                  <th className="py-3.5 px-4 font-bold">Recapiti</th>
                  <th className="py-3.5 px-4 font-bold">Sede</th>
                  <th className="py-3.5 px-4 font-bold">Codice SDI</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClienti.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Nessun cliente trovato.</td>
                  </tr>
                ) : (
                  filteredClienti.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.ragioneSociale}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{c.partitaIva || c.codiceFiscale}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{c.referente}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="block text-slate-600 dark:text-slate-400">{c.email}</span>
                          <span className="block text-slate-500 font-mono text-[11px]">{c.telefono}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.citta} ({c.provincia || 'MI'})</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{c.codiceUnivocoSdi || '0000000'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCliente(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: c.id,
                              name: c.ragioneSociale,
                              type: 'Cliente Committente',
                              tab: 'clienti',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fornitori Table */}
        {activeAnagraficaTab === 'fornitori' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Ragione Sociale</th>
                  <th className="py-3.5 px-4 font-bold">Partita IVA</th>
                  <th className="py-3.5 px-4 font-bold">Categoria</th>
                  <th className="py-3.5 px-4 font-bold">Referente / Recapiti</th>
                  <th className="py-3.5 px-4 font-bold">Consegna Media</th>
                  <th className="py-3.5 px-4 font-bold">Conformità DURC</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFornitori.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Nessun fornitore trovato.</td>
                  </tr>
                ) : (
                  filteredFornitori.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{f.ragioneSociale}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{f.partitaIva}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {f.categoria.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{f.referente}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{f.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {f.tempoMedioConsegnaGiorni} {f.tempoMedioConsegnaGiorni === 1 ? 'giorno' : 'giorni'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>DURC Regolare</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingFornitore(f)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: f.id,
                              name: f.ragioneSociale,
                              type: 'Fornitore',
                              tab: 'fornitori',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Attrezzature Table */}
        {activeAnagraficaTab === 'attrezzature' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Codice</th>
                  <th className="py-3.5 px-4 font-bold">Nome Strumento</th>
                  <th className="py-3.5 px-4 font-bold">Marca & Modello</th>
                  <th className="py-3.5 px-4 font-bold">Matricola</th>
                  <th className="py-3.5 px-4 font-bold">Stato</th>
                  <th className="py-3.5 px-4 font-bold">Prossima Taratura</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttrezzature.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Nessuna attrezzatura trovata.</td>
                  </tr>
                ) : (
                  filteredAttrezzature.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{a.codiceUnivoco}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{a.nome}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{a.marcaModello}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{a.matricola}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          a.stato === 'disponibile'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : a.stato === 'assegnata'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {a.stato.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {a.prossimaTaratura}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingAttrezzatura(a)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: a.id,
                              name: `${a.codiceUnivoco} - ${a.nome}`,
                              type: 'Attrezzatura',
                              tab: 'attrezzature',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dispositivi IT Table */}
        {activeAnagraficaTab === 'dispositivi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Codice</th>
                  <th className="py-3.5 px-4 font-bold">Tipologia</th>
                  <th className="py-3.5 px-4 font-bold">Marca & Modello</th>
                  <th className="py-3.5 px-4 font-bold">Seriale / IMEI</th>
                  <th className="py-3.5 px-4 font-bold">Assegnatario</th>
                  <th className="py-3.5 px-4 font-bold">SIM / Dati</th>
                  <th className="py-3.5 px-4 font-bold">Stato</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDispositivi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Nessun dispositivo registrato.</td>
                  </tr>
                ) : (
                  filteredDispositivi.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{d.codice}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {d.tipologia.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{d.marcaModello}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{d.serialeImei}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{d.assegnatarioNome}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{d.simNumero || d.pianoDatiGb || 'Wi-Fi'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          d.stato === 'attivo'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : d.stato === 'disponibile_scorta'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {d.stato.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingDispositivo(d)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: d.id,
                              name: `${d.codice} (${d.marcaModello})`,
                              type: 'Dispositivo IT',
                              tab: 'dispositivi',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mezzi Table */}
        {activeAnagraficaTab === 'mezzi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Targa</th>
                  <th className="py-3.5 px-4 font-bold">Modello & Allestimento</th>
                  <th className="py-3.5 px-4 font-bold">Km Attuali</th>
                  <th className="py-3.5 px-4 font-bold">Autista Assegnato</th>
                  <th className="py-3.5 px-4 font-bold">Scadenza Revisione</th>
                  <th className="py-3.5 px-4 font-bold">Scadenza RCA</th>
                  <th className="py-3.5 px-4 font-bold">Stato</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVeicoli.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Nessun veicolo trovato.</td>
                  </tr>
                ) : (
                  filteredVeicoli.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">{v.targa}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{v.modello}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{v.kmAttuali.toLocaleString('it-IT')} km</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{v.autistaAssegnatoNome || 'Non assegnato'}</td>
                      <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400 font-bold">{v.scadenzaRevisione}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{v.scadenzaAssicurazione}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          v.stato === 'in_servizio'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {v.stato.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingMezzo(v)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: v.id,
                              name: `${v.targa} (${v.modello})`,
                              type: 'Veicolo Flotta',
                              tab: 'mezzi',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Magazzino Table */}
        {activeAnagraficaTab === 'magazzino' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">SKU</th>
                  <th className="py-3.5 px-4 font-bold">Descrizione Articolo</th>
                  <th className="py-3.5 px-4 font-bold">Categoria</th>
                  <th className="py-3.5 px-4 font-bold">Giacenza</th>
                  <th className="py-3.5 px-4 font-bold">Scorta Min.</th>
                  <th className="py-3.5 px-4 font-bold">Prezzo Acquisto / Vendita</th>
                  <th className="py-3.5 px-4 font-bold">Scaffale</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMagazzino.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Nessun articolo trovato.</td>
                  </tr>
                ) : (
                  filteredMagazzino.map((m) => {
                    const isLowStock = m.giacenza <= m.scortaMinima;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{m.codiceSku}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{m.nome}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {m.categoria.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
                            {m.giacenza} {m.unitaMisura}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{m.scortaMinima} {m.unitaMisura}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="text-slate-500">€{m.prezzoUnitarioAcquisto.toFixed(2)}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">€{m.prezzoListinoVendita.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{m.ubicazioneScaffale}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingMagazzino(m)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({
                                isOpen: true,
                                id: m.id,
                                name: `${m.codiceSku} - ${m.nome}`,
                                type: 'Articolo Magazzino',
                                tab: 'magazzino',
                              })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Operai & Subappalti Combined Table */}
        {activeAnagraficaTab === 'operai' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Tipo</th>
                  <th className="py-3.5 px-4 font-bold">Nominativo / Ragione Sociale</th>
                  <th className="py-3.5 px-4 font-bold">Qualifica / Lavorazione</th>
                  <th className="py-3.5 px-4 font-bold">Costo Orario / Importo</th>
                  <th className="py-3.5 px-4 font-bold">Patentini / Abilitazioni</th>
                  <th className="py-3.5 px-4 font-bold">Scadenza Idoneità / DURC</th>
                  <th className="py-3.5 px-4 text-right font-bold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Dipendenti Rows */}
                {(operaiSubFilter === 'all' || operaiSubFilter === 'dipendenti') &&
                  filteredDipendenti.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          Dipendente
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div>{d.nome} {d.cognome}</div>
                        <div className="text-[10px] font-mono text-slate-400">{d.codiceFiscale}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div>{d.ruoloAziendale}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{d.reparto.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">€{d.costoOrario.toFixed(2)} /h</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {d.patentini?.map((p, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{d.visitaMedicaScadenza || '2026-12-31'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingOperatore({
                              isOpen: true,
                              type: 'dipendente',
                              dipendente: d,
                            })}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: d.id,
                              name: `${d.nome} ${d.cognome}`,
                              type: 'Dipendente',
                              tab: 'operai',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Subappalti Rows */}
                {(operaiSubFilter === 'all' || operaiSubFilter === 'subappalti') &&
                  filteredSubappalti.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors bg-amber-50/20 dark:bg-amber-950/10">
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          Subappalto
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div>{s.ragioneSociale}</div>
                        <div className="text-[10px] font-mono text-slate-400">P.IVA {s.partitaIva}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div>{s.categoriaLavorazione}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{s.cantiereAssegnatoNome}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">€{s.importoContratto.toLocaleString('it-IT')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>POS: {s.posStato.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <div>{s.durcScadenza}</div>
                        <div className="text-[9px] text-slate-400">{s.durcProtocollo}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingOperatore({
                              isOpen: true,
                              type: 'subappalto',
                              subappalto: s,
                            })}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              id: s.id,
                              name: s.ragioneSociale,
                              type: 'Impresa Subappalto',
                              tab: 'subappalti',
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Elimina Record Anagrafico"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />

      {/* Import Excel Modal */}
      <ImportAnagraficaModal
        isOpen={isImportModalOpen}
        tab={activeAnagraficaTab}
        tabLabel={currentTabDef.label}
        existingData={getCurrentDataset()}
        onCommitImport={handleCommitImport}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Form Modals */}
      <CantiereFormModal
        isOpen={editingCantiere !== null}
        cantiere={editingCantiere === 'new' ? null : editingCantiere}
        onSave={(data) => {
          if (editingCantiere && editingCantiere !== 'new') {
            updateCantiere(editingCantiere.id, data);
            showToast('Cantiere aggiornato con successo!', 'success');
          } else {
            addCantiere(data as any);
          }
        }}
        onClose={() => setEditingCantiere(null)}
      />

      <ClienteFormModal
        isOpen={editingCliente !== null}
        cliente={editingCliente === 'new' ? null : editingCliente}
        onSave={(data) => {
          if (editingCliente && editingCliente !== 'new') {
            updateCliente(editingCliente.id, data);
            showToast('Cliente aggiornato con successo!', 'success');
          } else {
            addCliente(data as any);
          }
        }}
        onClose={() => setEditingCliente(null)}
      />

      <FornitoreFormModal
        isOpen={editingFornitore !== null}
        fornitore={editingFornitore === 'new' ? null : editingFornitore}
        onSave={(data) => {
          if (editingFornitore && editingFornitore !== 'new') {
            updateFornitore(editingFornitore.id, data);
            showToast('Fornitore aggiornato con successo!', 'success');
          } else {
            addFornitore(data as any);
          }
        }}
        onClose={() => setEditingFornitore(null)}
      />

      <AttrezzaturaFormModal
        isOpen={editingAttrezzatura !== null}
        attrezzatura={editingAttrezzatura === 'new' ? null : editingAttrezzatura}
        onSave={(data) => {
          if (editingAttrezzatura && editingAttrezzatura !== 'new') {
            updateAttrezzatura(editingAttrezzatura.id, data);
            showToast('Attrezzatura aggiornata con successo!', 'success');
          } else {
            addAttrezzatura(data as any);
          }
        }}
        onClose={() => setEditingAttrezzatura(null)}
      />

      <DispositivoFormModal
        isOpen={editingDispositivo !== null}
        dispositivo={editingDispositivo === 'new' ? null : editingDispositivo}
        onSave={(data) => {
          if (editingDispositivo && editingDispositivo !== 'new') {
            updateDispositivoAziendale(editingDispositivo.id, data);
            showToast('Dispositivo aggiornato con successo!', 'success');
          } else {
            addDispositivoAziendale(data as any);
          }
        }}
        onClose={() => setEditingDispositivo(null)}
      />

      <MezzoFormModal
        isOpen={editingMezzo !== null}
        veicolo={editingMezzo === 'new' ? null : editingMezzo}
        onSave={(data) => {
          if (editingMezzo && editingMezzo !== 'new') {
            updateVeicolo(editingMezzo.id, data);
            showToast('Dati automezzo aggiornati!', 'success');
          } else {
            addVeicolo(data as any);
          }
        }}
        onClose={() => setEditingMezzo(null)}
      />

      <MagazzinoFormModal
        isOpen={editingMagazzino !== null}
        articolo={editingMagazzino === 'new' ? null : editingMagazzino}
        onSave={(data) => {
          if (editingMagazzino && editingMagazzino !== 'new') {
            updateArticoloMagazzino(editingMagazzino.id, data);
            showToast('Articolo magazzino aggiornato!', 'success');
          } else {
            addArticoloMagazzino(data as any);
          }
        }}
        onClose={() => setEditingMagazzino(null)}
      />

      <OperatoreFormModal
        isOpen={editingOperatore.isOpen}
        type={editingOperatore.type}
        dipendente={editingOperatore.dipendente}
        subappalto={editingOperatore.subappalto}
        onSaveDipendente={(data) => {
          if (editingOperatore.dipendente) {
            updateDipendente(editingOperatore.dipendente.id, data);
            showToast('Scheda dipendente aggiornata!', 'success');
          } else {
            addDipendente(data as any);
          }
        }}
        onSaveSubappalto={(data) => {
          if (editingOperatore.subappalto) {
            updateSubappalto(editingOperatore.subappalto.id, data);
            showToast('Scheda subappalto aggiornata!', 'success');
          } else {
            addSubappalto(data as any);
          }
        }}
        onClose={() => setEditingOperatore({ isOpen: false, type: 'dipendente' })}
      />
    </div>
  );
};
