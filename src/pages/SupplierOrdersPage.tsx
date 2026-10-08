import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  OrdineInterno,
  StatoOrdine,
  PrioritaOrdine,
  RigaOrdine,
  AllegatoOrdine,
} from '../types';
import { FornitoreAnagrafica } from '../data/mockOrdini';
import {
  Building2,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Truck,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Printer,
  Copy,
  Trash2,
  Edit,
  Eye,
  X,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Download,
  Upload,
  ChevronRight,
  Package,
  FileCheck,
  ExternalLink,
  Ban,
  Lock,
  Barcode,
} from 'lucide-react';
import { OrdineDetailModal } from '../components/ordini/OrdineDetailModal';
import { OrdinePrintModal } from '../components/ordini/OrdinePrintModal';
import { OrdineAnnullaModal } from '../components/ordini/OrdineAnnullaModal';

export const SupplierOrdersPage: React.FC = () => {
  const {
    currentUser,
    setCurrentRole,
    interfaceMode,
    setInterfaceMode,
    setActiveTab,
    ordiniInterni,
    fornitori,
    cantieri,
    magazzino,
    addOrdineInterno,
    updateOrdineInterno,
    deleteOrdineInterno,
    transizioneStatoOrdine,
    duplicaOrdineInterno,
    addCommentoOrdine,
    showToast,
  } = useApp();

  // 1. PERMISSION CHECK
  // Accessible to: admin / amministratore, responsabile_tecnico / responsabile / ufficio_tecnico / contabilita, responsabile_magazzino / magazzino_portale
  const isAuthorized = useMemo(() => {
    if (currentUser.role === 'amministratore') return true;
    if (currentUser.role === 'responsabile') return true;
    if (currentUser.reparto === 'contabilita' || currentUser.reparto === 'ufficio_tecnico') return true;
    if (interfaceMode === 'magazzino_portale' || interfaceMode === 'contabilita' || interfaceMode === 'ufficio_tecnico') return true;
    return false;
  }, [currentUser, interfaceMode]);

  // Filters State
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterFornitore, setFilterFornitore] = useState<string>('tutti');
  const [filterCentroCosto, setFilterCentroCosto] = useState<string>('tutti');
  const [filterPriorita, setFilterPriorita] = useState<string>('tutti');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrdineInterno | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrdineInterno | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<OrdineInterno | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrdineInterno | null>(null);

  // Filter supplier orders
  const supplierOrders = useMemo(() => {
    return ordiniInterni.filter((o) => o.tipo === 'fornitore');
  }, [ordiniInterni]);

  const filteredOrders = useMemo(() => {
    return supplierOrders.filter((ord) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        ord.numero.toLowerCase().includes(q) ||
        ord.destinatarioRagioneSociale.toLowerCase().includes(q) ||
        ord.cantiereRiferimentoNome.toLowerCase().includes(q) ||
        ord.righe.some((r) => r.descrizione.toLowerCase().includes(q) || r.codice.toLowerCase().includes(q));

      const matchStato =
        filterStato === 'tutti' ||
        ord.stato === filterStato ||
        (filterStato === 'inviato_transito' && (ord.stato === 'inviato' || ord.stato === 'in_transito' || ord.stato === 'confermato')) ||
        (filterStato === 'ricevuta_ddt' && ord.stato === 'consegnato') ||
        (filterStato === 'fatturato' && ord.stato === 'chiuso');

      const matchFornitore = filterFornitore === 'tutti' || ord.destinatarioId === filterFornitore;
      const matchPriorita = filterPriorita === 'tutti' || ord.priorita === filterPriorita;

      const matchCentroCosto =
        filterCentroCosto === 'tutti' ||
        (filterCentroCosto === 'magazzino' && (ord.cantiereRiferimentoId.includes('deposito') || ord.cantiereRiferimentoNome.toLowerCase().includes('magazzino'))) ||
        (filterCentroCosto === 'cantiere' && !ord.cantiereRiferimentoId.includes('deposito') && !ord.cantiereRiferimentoNome.toLowerCase().includes('magazzino'));

      return matchSearch && matchStato && matchFornitore && matchPriorita && matchCentroCosto;
    });
  }, [supplierOrders, search, filterStato, filterFornitore, filterCentroCosto, filterPriorita]);

  // KPIs
  const kpis = useMemo(() => {
    const totale = supplierOrders.length;
    const bozze = supplierOrders.filter((o) => o.stato === 'bozza').length;
    const inViaggio = supplierOrders.filter((o) => o.stato === 'inviato' || o.stato === 'in_transito' || o.stato === 'confermato').length;
    const merceRicevutaDdt = supplierOrders.filter((o) => o.stato === 'consegnato').length;
    const fatturati = supplierOrders.filter((o) => o.stato === 'chiuso').length;
    const totaleImponibile = supplierOrders
      .filter((o) => o.stato !== 'annullato')
      .reduce((acc, o) => acc + o.importoTotale, 0);

    return { totale, bozze, inViaggio, merceRicevutaDdt, fatturati, totaleImponibile };
  }, [supplierOrders]);

  // Form State for creating/editing Supplier Order
  const [formData, setFormData] = useState<{
    fornitoreId: string;
    centroCostoTipo: 'magazzino' | 'cantiere';
    cantiereId: string;
    dataOrdine: string;
    dataConsegnaPrevista: string;
    priorita: PrioritaOrdine;
    riferimentoPreventivoFornitore: string;
    noteGenerali: string;
    righe: Array<{
      id: string;
      codiceFornitore: string;
      descrizione: string;
      quantita: number;
      unitaMisura: string;
      prezzoUnitarioAcquisto: number;
      aliquotaIva: number;
      note?: string;
    }>;
    allegati: AllegatoOrdine[];
    nuovoAllegatoNome: string;
    nuovoAllegatoTipo: AllegatoOrdine['tipo'];
  }>({
    fornitoreId: fornitori[0]?.id || '',
    centroCostoTipo: 'cantiere',
    cantiereId: cantieri[0]?.id || '',
    dataOrdine: new Date().toISOString().split('T')[0],
    dataConsegnaPrevista: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    priorita: 'media',
    riferimentoPreventivoFornitore: '',
    noteGenerali: 'Consegna a mezzo furgone/motrice con sponda idraulica. Scarico previo contatto telefonico.',
    righe: [
      {
        id: `r-init-1`,
        codiceFornitore: magazzino[0]?.codiceSku || 'CAV-FG16-5G16',
        descrizione: magazzino[0]?.nome || 'Cavo FG16OR12 5G16 mm² CPR Cca-s1b,d1,a1',
        quantita: 200,
        unitaMisura: 'm',
        prezzoUnitarioAcquisto: magazzino[0]?.prezzoUnitarioAcquisto || 9.4,
        aliquotaIva: 22,
        note: 'Bobina sigillata IMQ',
      },
    ],
    allegati: [],
    nuovoAllegatoNome: '',
    nuovoAllegatoTipo: 'preventivo',
  });

  const handleOpenCreateModal = (editOrd?: OrdineInterno) => {
    if (editOrd) {
      setOrderToEdit(editOrd);
      const isMag = editOrd.cantiereRiferimentoId.includes('deposito') || editOrd.cantiereRiferimentoNome.toLowerCase().includes('magazzino');
      setFormData({
        fornitoreId: editOrd.destinatarioId,
        centroCostoTipo: isMag ? 'magazzino' : 'cantiere',
        cantiereId: editOrd.cantiereRiferimentoId,
        dataOrdine: editOrd.dataOrdine,
        dataConsegnaPrevista: editOrd.dataConsegnaPrevista,
        priorita: editOrd.priorita,
        riferimentoPreventivoFornitore: editOrd.allegati.find((a) => a.tipo === 'preventivo')?.nomeFile || '',
        noteGenerali: editOrd.noteGenerali || '',
        righe: editOrd.righe.map((r) => ({
          id: r.id,
          codiceFornitore: r.codice,
          descrizione: r.descrizione,
          quantita: r.quantitaTotale,
          unitaMisura: r.unitaMisura,
          prezzoUnitarioAcquisto: r.prezzoUnitario || 10,
          aliquotaIva: 22,
          note: r.note,
        })),
        allegati: editOrd.allegati,
        nuovoAllegatoNome: '',
        nuovoAllegatoTipo: 'preventivo',
      });
    } else {
      setOrderToEdit(null);
      setFormData({
        fornitoreId: fornitori[0]?.id || '',
        centroCostoTipo: 'cantiere',
        cantiereId: cantieri[0]?.id || '',
        dataOrdine: new Date().toISOString().split('T')[0],
        dataConsegnaPrevista: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorita: 'media',
        riferimentoPreventivoFornitore: 'PREV-FORN-2026/89',
        noteGenerali: 'Consegna a mezzo furgone/motrice con sponda idraulica. Scarico previo contatto telefonico.',
        righe: [
          {
            id: `r-${Date.now()}-1`,
            codiceFornitore: magazzino[0]?.codiceSku || 'CAV-FG16-5G16',
            descrizione: magazzino[0]?.nome || 'Cavo FG16OR12 5G16 mm² CPR Cca-s1b,d1,a1',
            quantita: 250,
            unitaMisura: 'm',
            prezzoUnitarioAcquisto: magazzino[0]?.prezzoUnitarioAcquisto || 9.4,
            aliquotaIva: 22,
            note: 'Dorsale quadro principale',
          },
        ],
        allegati: [
          {
            id: `all-${Date.now()}-1`,
            nomeFile: 'Offerta_Fornitore_Firmata.pdf',
            tipo: 'preventivo',
            dimensioneKb: 340,
            dataCaricamento: new Date().toISOString().split('T')[0],
            urlSimulato: '/docs/offerta_fornitore.pdf',
          },
        ],
        nuovoAllegatoNome: '',
        nuovoAllegatoTipo: 'preventivo',
      });
    }
    setIsCreateModalOpen(true);
  };

  const handleSaveSupplierOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const forn = fornitori.find((f) => f.id === formData.fornitoreId) || fornitori[0];
    const cnt = cantieri.find((c) => c.id === formData.cantiereId) || cantieri[0];

    const destCentroCostoId = formData.centroCostoTipo === 'magazzino' ? 'cnt-deposito-centrale' : cnt.id;
    const destCentroCostoNome =
      formData.centroCostoTipo === 'magazzino' ? 'Magazzino Centrale Sede' : `${cnt.codice} - ${cnt.titolo}`;

    const righeFinali: RigaOrdine[] = formData.righe.map((r) => {
      const subtot = r.quantita * r.prezzoUnitarioAcquisto;
      return {
        id: r.id,
        tipologia: 'materiale',
        codice: r.codiceFornitore,
        descrizione: r.descrizione,
        quantitaTotale: r.quantita,
        unitaMisura: r.unitaMisura,
        prezzoUnitario: r.prezzoUnitarioAcquisto,
        subtotale: subtot,
        note: r.note,
        ripartizioniCantieri: [
          {
            cantiereId: destCentroCostoId,
            cantiereNome: destCentroCostoNome,
            quantita: r.quantita,
            note: r.note,
          },
        ],
      };
    });

    const totaleImp = righeFinali.reduce((acc, r) => acc + (r.subtotale || 0), 0);

    if (orderToEdit) {
      updateOrdineInterno(orderToEdit.id, {
        destinatarioId: forn.id,
        destinatarioRagioneSociale: forn.ragioneSociale,
        destinatarioEmail: forn.email,
        destinatarioTelefono: forn.telefono,
        destinatarioIndirizzo: forn.indirizzo,
        cantiereRiferimentoId: destCentroCostoId,
        cantiereRiferimentoNome: destCentroCostoNome,
        dataOrdine: formData.dataOrdine,
        dataConsegnaPrevista: formData.dataConsegnaPrevista,
        priorita: formData.priorita,
        noteGenerali: formData.noteGenerali,
        righe: righeFinali,
        allegati: formData.allegati,
        importoTotale: totaleImp,
      });
      showToast(`Ordine fornitore ${orderToEdit.numero} aggiornato con successo!`, 'success');
    } else {
      const created = addOrdineInterno({
        tipo: 'fornitore',
        destinatarioId: forn.id,
        destinatarioRagioneSociale: forn.ragioneSociale,
        destinatarioEmail: forn.email,
        destinatarioTelefono: forn.telefono,
        destinatarioIndirizzo: forn.indirizzo,
        cantiereRiferimentoId: destCentroCostoId,
        cantiereRiferimentoNome: destCentroCostoNome,
        dataOrdine: formData.dataOrdine,
        dataConsegnaPrevista: formData.dataConsegnaPrevista,
        priorita: formData.priorita,
        stato: 'bozza',
        noteGenerali: formData.noteGenerali,
        righe: righeFinali,
        allegati: formData.allegati,
        importoTotale: totaleImp,
        valuta: 'EUR',
      });
      showToast(`Nuovo ordine fornitore ${created.numero} emesso con successo!`, 'success');
    }

    setIsCreateModalOpen(false);
  };

  // State Transition Helper
  const handleQuickAdvanceStatus = (ord: OrdineInterno) => {
    let nextStato: StatoOrdine = 'inviato';
    let label = 'Inviato a Fornitore';

    if (ord.stato === 'bozza') {
      nextStato = 'inviato';
      label = 'Inviato al fornitore via PEC/Email';
    } else if (ord.stato === 'inviato' || ord.stato === 'confermato' || ord.stato === 'in_transito') {
      nextStato = 'consegnato';
      label = 'Merce ricevuta con DDT fornitore';
    } else if (ord.stato === 'consegnato') {
      nextStato = 'chiuso';
      label = 'Fattura fornitore ricevuta e registrata';
    }

    transizioneStatoOrdine(ord.id, nextStato, `Avanzamento rapido fornitore: ${label}`);
    showToast(`Ordine ${ord.numero} avanzato a "${label}"`, 'success');
  };

  // 403 ACCESS DENIED VIEW FOR UNAUTHORIZED USERS
  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              403 · Accesso Riservato
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Modulo Ordini Fornitori Riservato
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              La sezione <strong>Ordini Fornitori (Acquisti & Approvvigionamento)</strong> è accessibile unicamente alla Direzione Amministrativa, Ufficio Tecnico / PM e Responsabili di Magazzino.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
              <span>Profilo Attuale:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{currentUser.name} ({currentUser.role})</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
              <span>Reparto:</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{currentUser.reparto || 'Cantiere'}</span>
            </div>
          </div>

          {/* Role Switcher for Simulator / Admin verification */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-[11px] text-slate-500">
              Simulazione ruoli per test di abilitazione:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setCurrentRole('amministratore');
                  setInterfaceMode('contabilita');
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
              >
                Passa a Direzione / Amm.
              </button>
              <button
                onClick={() => {
                  setCurrentRole('responsabile');
                  setInterfaceMode('ufficio_tecnico');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
              >
                Passa a Resp. Tecnico / PM
              </button>
              <button
                onClick={() => {
                  setCurrentRole('responsabile');
                  setInterfaceMode('magazzino_portale');
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                Passa a Magazzino
              </button>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
          >
            Torna alla Dashboard Principale
          </button>
        </div>
      </div>
    );
  }

  // AUTHORIZED USER VIEW
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded">
                  Acquisti & Approvvigionamento Esterno
                </span>
                <span className="text-xs text-slate-500 font-medium">Area Riservata Direzione / PM / Magazzino</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Ordini Fornitori & Materiali
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gestione completa acquisti verso ditte fornitrici di materiale elettrico, noleggi e componentistica con imputazione a magazzino o cantiere.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Ordine Fornitore</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Stampa Registro Ordini Fornitori"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Totale Ordini Emessi</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
              {kpis.totale}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">Inviati / In Transito</span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono mt-0.5 block">
              {kpis.inViaggio}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block font-medium">Merce Ricevuta (DDT)</span>
            <span className="text-lg font-black text-cyan-800 dark:text-cyan-300 font-mono mt-0.5 block">
              {kpis.merceRicevutaDdt}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">Fatturati / Chiusi</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">
              {kpis.fatturati}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 block font-medium">Valore Forniture</span>
            <span className="text-lg font-black text-blue-800 dark:text-blue-300 font-mono mt-0.5 block">
              € {kpis.totaleImponibile.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per N. Ordine, fornitore, materiale, SKU..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filter Stato */}
          <div>
            <select
              value={filterStato}
              onChange={(e) => setFilterStato(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="bozza">Bozza</option>
              <option value="inviato_transito">Inviato / In Transito</option>
              <option value="ricevuta_ddt">Merce Ricevuta (DDT)</option>
              <option value="fatturato">Fatturato / Chiuso</option>
              <option value="annullato">Annullato</option>
            </select>
          </div>

          {/* Filter Fornitore */}
          <div>
            <select
              value={filterFornitore}
              onChange={(e) => setFilterFornitore(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="tutti">Tutti i fornitori</option>
              {fornitori.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ragioneSociale}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Centro di Costo */}
          <div>
            <select
              value={filterCentroCosto}
              onChange={(e) => setFilterCentroCosto(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="tutti">Tutte le destinazioni</option>
              <option value="magazzino">Magazzino Centrale</option>
              <option value="cantiere">Cantieri / Commesse</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Orders List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5">N. Ordine</th>
                <th className="p-3.5">Fornitore</th>
                <th className="p-3.5">Centro di Costo / Consegna</th>
                <th className="p-3.5">Data Ordine</th>
                <th className="p-3.5">Consegna Prev.</th>
                <th className="p-3.5">Stato Fornitura</th>
                <th className="p-3.5 text-right">Imponibile</th>
                <th className="p-3.5 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Nessun ordine fornitore trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isMag =
                    ord.cantiereRiferimentoId.includes('deposito') ||
                    ord.cantiereRiferimentoNome.toLowerCase().includes('magazzino');

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* N. Ordine */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                            {ord.numero}
                          </span>
                          {ord.priorita === 'urgente' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold uppercase">
                              Urgente
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ord.righe.length} voci articoli
                        </span>
                      </td>

                      {/* Fornitore */}
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ord.destinatarioRagioneSociale}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {ord.destinatarioEmail || 'ordini@fornitore.it'}
                        </span>
                      </td>

                      {/* Centro di Costo */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {isMag ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              Magazzino Centrale
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              Cantiere
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5 truncate max-w-[200px]">
                          {ord.cantiereRiferimentoNome}
                        </span>
                      </td>

                      {/* Data Ordine */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        {ord.dataOrdine}
                      </td>

                      {/* Consegna Prevista */}
                      <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                        {ord.dataConsegnaPrevista}
                      </td>

                      {/* Stato Fornitura */}
                      <td className="p-3.5">
                        {ord.stato === 'bozza' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            Bozza Interna
                          </span>
                        )}
                        {(ord.stato === 'inviato' || ord.stato === 'confermato' || ord.stato === 'in_transito') && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                            Inviato a Fornitore
                          </span>
                        )}
                        {ord.stato === 'consegnato' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                            Merce Ricevuta (DDT)
                          </span>
                        )}
                        {ord.stato === 'chiuso' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Fatturato & Chiuso
                          </span>
                        )}
                        {ord.stato === 'annullato' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Annullato
                          </span>
                        )}
                      </td>

                      {/* Imponibile */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                        € {ord.importoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Azioni */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick advance status */}
                          {ord.stato !== 'chiuso' && ord.stato !== 'annullato' && (
                            <button
                              onClick={() => handleQuickAdvanceStatus(ord)}
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 transition-colors"
                              title="Avanza Stato Ordine"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedOrderDetail(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Dettaglio Ordine Fornitore"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenCreateModal(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Modifica Ordine"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => setOrderToPrint(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Stampa Buono d'Ordine"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
      </div>

      {/* 5. Create / Edit Supplier Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {orderToEdit ? `Modifica Ordine Fornitore ${orderToEdit.numero}` : 'Nuovo Ordine d’Acquisto Fornitore'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Emissione ordine di fornitura materiali, componentistica e noleggi per cantiere o magazzino.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierOrder} className="space-y-6">
              {/* Fornitore & Centro di Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fornitore */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ditta Fornitrice (Anagrafica) *
                  </label>
                  <select
                    value={formData.fornitoreId}
                    onChange={(e) => setFormData({ ...formData, fornitoreId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.ragioneSociale} (P.IVA: {f.partitaIva})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Centro di Costo Destinazione */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Centro di Costo / Destinazione Merce *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.centroCostoTipo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          centroCostoTipo: e.target.value as 'magazzino' | 'cantiere',
                        })
                      }
                      className="w-1/3 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="cantiere">Cantiere</option>
                      <option value="magazzino">Magazzino</option>
                    </select>

                    {formData.centroCostoTipo === 'cantiere' ? (
                      <select
                        value={formData.cantiereId}
                        onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })}
                        className="w-2/3 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      >
                        {cantieri.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.codice} - {c.titolo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-2/3 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono font-bold flex items-center">
                        Sede Centrale - Hub Stoccaggio
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Priorità */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Data Emissione Ordine
                  </label>
                  <input
                    type="date"
                    value={formData.dataOrdine}
                    onChange={(e) => setFormData({ ...formData, dataOrdine: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Data Consegna Richiesta
                  </label>
                  <input
                    type="date"
                    value={formData.dataConsegnaPrevista}
                    onChange={(e) => setFormData({ ...formData, dataConsegnaPrevista: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Livello Priorità
                  </label>
                  <select
                    value={formData.priorita}
                    onChange={(e) => setFormData({ ...formData, priorita: e.target.value as PrioritaOrdine })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="bassa">Bassa (Ordinaria)</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente (Fermo Cantiere)</option>
                  </select>
                </div>
              </div>

              {/* Tabella Articoli */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Distinta Materiali & Prezzi di Acquisto Concordati
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        righe: [
                          ...formData.righe,
                          {
                            id: `r-${Date.now()}`,
                            codiceFornitore: 'ART-NEW',
                            descrizione: 'Nuovo articolo da ordine',
                            quantita: 10,
                            unitaMisura: 'pz',
                            prezzoUnitarioAcquisto: 15.0,
                            aliquotaIva: 22,
                            note: '',
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Articolo</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5">Codice / SKU</th>
                        <th className="p-2.5">Descrizione Prodotto</th>
                        <th className="p-2.5 text-center">Quantità</th>
                        <th className="p-2.5 text-center">U.M.</th>
                        <th className="p-2.5 text-right">Prezzo Unit. (€)</th>
                        <th className="p-2.5 text-right">Subtotale (€)</th>
                        <th className="p-2.5 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {formData.righe.map((r, idx) => {
                        const subtot = r.quantita * r.prezzoUnitarioAcquisto;
                        return (
                          <tr key={r.id}>
                            <td className="p-2">
                              <input
                                type="text"
                                value={r.codiceFornitore}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].codiceFornitore = e.target.value;
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-28 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                                required
                              />
                            </td>
                            <td className="p-2 font-sans">
                              <input
                                type="text"
                                value={r.descrizione}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].descrizione = e.target.value;
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-full p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                                required
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={r.quantita}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].quantita = Math.max(1, Number(e.target.value));
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-16 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-center text-xs"
                                required
                              />
                            </td>
                            <td className="p-2 text-center">
                              <select
                                value={r.unitaMisura}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].unitaMisura = e.target.value;
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                              >
                                <option value="m">m</option>
                                <option value="pz">pz</option>
                                <option value="kit">kit</option>
                                <option value="kg">kg</option>
                                <option value="conf">conf</option>
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={r.prezzoUnitarioAcquisto}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].prezzoUnitarioAcquisto = Math.max(0, Number(e.target.value));
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-20 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-right text-xs font-bold"
                                required
                              />
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100">
                              € {subtot.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              {formData.righe.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      righe: formData.righe.filter((_, i) => i !== idx),
                                    });
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calcolo Totale Ordine */}
                <div className="flex justify-end pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right space-y-1 font-mono text-xs">
                    <div>
                      <span className="text-slate-500">Totale Imponibile Merce: </span>
                      <strong className="text-slate-900 dark:text-slate-100 text-sm">
                        € {formData.righe.reduce((acc, r) => acc + r.quantita * r.prezzoUnitarioAcquisto, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      IVA Stimata (22%): € {(formData.righe.reduce((acc, r) => acc + r.quantita * r.prezzoUnitarioAcquisto, 0) * 0.22).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Allegati & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Note di Consegna & Istruzioni Scarico
                  </label>
                  <textarea
                    rows={3}
                    value={formData.noteGenerali}
                    onChange={(e) => setFormData({ ...formData, noteGenerali: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Specificare orari di cantiere, autista, recapito capocantiere..."
                  />
                </div>

                {/* Allegati */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Documenti Allegati (Preventivo Fornitore .pdf, Conferma d'Ordine)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.nuovoAllegatoNome}
                      onChange={(e) => setFormData({ ...formData, nuovoAllegatoNome: e.target.value })}
                      placeholder="es. Offerta_Fornitore_Rev1.pdf"
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.nuovoAllegatoNome.trim()) return;
                        setFormData({
                          ...formData,
                          allegati: [
                            ...formData.allegati,
                            {
                              id: `all-${Date.now()}`,
                              nomeFile: formData.nuovoAllegatoNome.trim(),
                              tipo: formData.nuovoAllegatoTipo,
                              dimensioneKb: 450,
                              dataCaricamento: new Date().toISOString().split('T')[0],
                              urlSimulato: `/docs/${formData.nuovoAllegatoNome.trim()}`,
                            },
                          ],
                          nuovoAllegatoNome: '',
                        });
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold rounded-xl"
                    >
                      Allega
                    </button>
                  </div>

                  {formData.allegati.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {formData.allegati.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-cyan-500" />
                            <span className="font-mono text-slate-800 dark:text-slate-200">{a.nomeFile}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                allegati: formData.allegati.filter((x) => x.id !== a.id),
                              })
                            }
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                >
                  {orderToEdit ? 'Salva Modifiche Ordine' : 'Emetti Ordine Fornitore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrderDetail && (
        <OrdineDetailModal
          ordine={selectedOrderDetail}
          isOpen={!!selectedOrderDetail}
          onClose={() => setSelectedOrderDetail(null)}
          onEdit={(ord: OrdineInterno) => {
            setSelectedOrderDetail(null);
            handleOpenCreateModal(ord);
          }}
          onOpenPrint={(ord: OrdineInterno) => {
            setSelectedOrderDetail(null);
            setOrderToPrint(ord);
          }}
          onDuplicate={(id: string) => {
            const duplicated = duplicaOrdineInterno(id);
            setSelectedOrderDetail(null);
            showToast(`Ordine duplicato con successo: ${duplicated.numero}`, 'success');
          }}
          onOpenAnnulla={(ord: OrdineInterno) => {
            setSelectedOrderDetail(null);
            setOrderToCancel(ord);
          }}
          onAdvanceState={(ordId: string, newStato: StatoOrdine, note?: string) => {
            transizioneStatoOrdine(ordId, newStato, note);
            const updated = ordiniInterni.find((o) => o.id === ordId);
            if (updated) setSelectedOrderDetail(updated);
          }}
          onAddComment={(ordId: string, text: string) => {
            addCommentoOrdine(ordId, text);
            const updated = ordiniInterni.find((o) => o.id === ordId);
            if (updated) setSelectedOrderDetail(updated);
          }}
        />
      )}

      {/* Print Modal */}
      {orderToPrint && (
        <OrdinePrintModal
          ordine={orderToPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}

      {/* Annulla Modal */}
      {orderToCancel && (
        <OrdineAnnullaModal
          ordine={orderToCancel}
          isOpen={!!orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onConfirm={(motivo) => {
            transizioneStatoOrdine(orderToCancel.id, 'annullato', undefined, motivo);
            setOrderToCancel(null);
          }}
        />
      )}
    </div>
  );
};
