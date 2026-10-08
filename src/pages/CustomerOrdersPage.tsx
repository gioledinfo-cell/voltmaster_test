import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  OrdineInterno,
  StatoOrdine,
  PrioritaOrdine,
  RigaOrdine,
  AllegatoOrdine,
} from '../types';
import {
  Handshake,
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
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
  Sparkles,
  FileCheck,
  FileText,
  DollarSign,
  Package,
  Wrench,
  Truck,
  UserCheck,
  Download,
} from 'lucide-react';
import { OrdineDetailModal } from '../components/ordini/OrdineDetailModal';
import { OrdinePrintModal } from '../components/ordini/OrdinePrintModal';
import { OrdineAnnullaModal } from '../components/ordini/OrdineAnnullaModal';

export const CustomerOrdersPage: React.FC = () => {
  const {
    currentUser,
    ordiniInterni,
    clienti,
    cantieri,
    lavorazioni,
    addOrdineInterno,
    updateOrdineInterno,
    deleteOrdineInterno,
    transizioneStatoOrdine,
    duplicaOrdineInterno,
    addCommentoOrdine,
    showToast,
  } = useApp();

  // Filters State
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterCliente, setFilterCliente] = useState<string>('tutti');
  const [filterCantiere, setFilterCantiere] = useState<string>('tutti');
  const [filterPriorita, setFilterPriorita] = useState<string>('tutti');

  // Modals
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrdineInterno | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrdineInterno | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<OrdineInterno | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrdineInterno | null>(null);

  // Filter Customer Orders
  const customerOrders = useMemo(() => {
    return ordiniInterni.filter((o) => o.tipo === 'cliente');
  }, [ordiniInterni]);

  const filteredOrders = useMemo(() => {
    return customerOrders.filter((ord) => {
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
        (filterStato === 'ricevuto' && (ord.stato === 'bozza' || ord.stato === 'inviato')) ||
        (filterStato === 'in_lavorazione' && (ord.stato === 'confermato' || ord.stato === 'in_transito')) ||
        (filterStato === 'collaudato' && ord.stato === 'consegnato') ||
        (filterStato === 'consegnato_cliente' && ord.stato === 'chiuso');

      const matchCliente = filterCliente === 'tutti' || ord.destinatarioId === filterCliente;
      const matchCantiere = filterCantiere === 'tutti' || ord.cantiereRiferimentoId === filterCantiere;
      const matchPriorita = filterPriorita === 'tutti' || ord.priorita === filterPriorita;

      return matchSearch && matchStato && matchCliente && matchCantiere && matchPriorita;
    });
  }, [customerOrders, search, filterStato, filterCliente, filterCantiere, filterPriorita]);

  // KPIs
  const kpis = useMemo(() => {
    const totale = customerOrders.length;
    const ricevuti = customerOrders.filter((o) => o.stato === 'bozza' || o.stato === 'inviato').length;
    const inLavorazione = customerOrders.filter((o) => o.stato === 'confermato' || o.stato === 'in_transito').length;
    const collaudati = customerOrders.filter((o) => o.stato === 'consegnato').length;
    const consegnatiCliente = customerOrders.filter((o) => o.stato === 'chiuso').length;
    const valoreTotale = customerOrders
      .filter((o) => o.stato !== 'annullato')
      .reduce((acc, o) => acc + o.importoTotale, 0);

    return { totale, ricevuti, inLavorazione, collaudati, consegnatiCliente, valoreTotale };
  }, [customerOrders]);

  // Form State for creating/editing Customer Order
  const [formData, setFormData] = useState<{
    clienteId: string;
    cantiereId: string;
    riferimentoContratto: string;
    cupCig: string;
    dataOrdine: string;
    dataConsegnaPrevista: string;
    priorita: PrioritaOrdine;
    noteGenerali: string;
    righe: Array<{
      id: string;
      descrizione: string;
      codice: string;
      quantita: number;
      unitaMisura: string;
      prezzoUnitario: number;
      faseLavoro: string;
      note?: string;
    }>;
    allegati: AllegatoOrdine[];
    nuovoAllegatoNome: string;
  }>({
    clienteId: clienti[0]?.id || '',
    cantiereId: cantieri[0]?.id || '',
    riferimentoContratto: 'CTR-COMM-2026/14',
    cupCig: 'CIG: 9842109AB1',
    dataOrdine: new Date().toISOString().split('T')[0],
    dataConsegnaPrevista: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    priorita: 'media',
    noteGenerali: 'Lavorazioni conformi a capitolato speciale d’appalto e normative CEI 64-8.',
    righe: [
      {
        id: `r-cust-1`,
        descrizione: 'Quadro Generale di Bassa Tensione Power Center 400A con certificazione',
        codice: 'QDR-BT-400',
        quantita: 1,
        unitaMisura: 'pz',
        prezzoUnitario: 5800,
        faseLavoro: 'Montaggio & Cablaggio Quadri',
        note: 'Collaudo a banco e rilascio DiCo 37/08',
      },
      {
        id: `r-cust-2`,
        descrizione: 'Posa dorsali montanti FG16 5G25 mm² in passerella metallica',
        codice: 'POSA-CAVI-DORS',
        quantita: 180,
        unitaMisura: 'm',
        prezzoUnitario: 22.5,
        faseLavoro: 'Infilaggio Cavi & Dorsali',
        note: 'Compreso staffaggio e capicorda a crimpare',
      },
    ],
    allegati: [
      {
        id: `all-cust-1`,
        nomeFile: 'Contratto_Appalto_Committente_Firmato.pdf',
        tipo: 'preventivo',
        dimensioneKb: 520,
        dataCaricamento: new Date().toISOString().split('T')[0],
        urlSimulato: '/docs/contratto_appalto.pdf',
      },
    ],
    nuovoAllegatoNome: '',
  });

  const handleOpenCreateModal = (editOrd?: OrdineInterno) => {
    if (editOrd) {
      setOrderToEdit(editOrd);
      setFormData({
        clienteId: editOrd.destinatarioId,
        cantiereId: editOrd.cantiereRiferimentoId,
        riferimentoContratto: editOrd.allegati.find((a) => a.tipo === 'preventivo')?.nomeFile || 'CTR-2026-REF',
        cupCig: '',
        dataOrdine: editOrd.dataOrdine,
        dataConsegnaPrevista: editOrd.dataConsegnaPrevista,
        priorita: editOrd.priorita,
        noteGenerali: editOrd.noteGenerali || '',
        righe: editOrd.righe.map((r) => ({
          id: r.id,
          descrizione: r.descrizione,
          codice: r.codice,
          quantita: r.quantitaTotale,
          unitaMisura: r.unitaMisura,
          prezzoUnitario: r.prezzoUnitario || 50,
          faseLavoro: 'Installazione & Posa Cantiere',
          note: r.note,
        })),
        allegati: editOrd.allegati,
        nuovoAllegatoNome: '',
      });
    } else {
      setOrderToEdit(null);
      setFormData({
        clienteId: clienti[0]?.id || '',
        cantiereId: cantieri[0]?.id || '',
        riferimentoContratto: `ORD-COMM-${Date.now().toString().slice(-4)}`,
        cupCig: 'CIG: 8941092F01',
        dataOrdine: new Date().toISOString().split('T')[0],
        dataConsegnaPrevista: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        priorita: 'media',
        noteGenerali: 'Lavorazioni conformi a capitolato speciale d’appalto e normative CEI 64-8.',
        righe: [
          {
            id: `r-${Date.now()}-1`,
            descrizione: 'Realizzazione & Cablaggio Quadro Automazione Pompe e FM',
            codice: 'QDR-AUT-01',
            quantita: 1,
            unitaMisura: 'pz',
            prezzoUnitario: 4200,
            faseLavoro: 'Cablaggio Quadri & Automazione',
            note: 'Include prove strumentali di continuità e isolamento',
          },
          {
            id: `r-${Date.now()}-2`,
            descrizione: 'Posa corpo illuminante LED 60x60 ad alta efficienza IP65',
            codice: 'ILL-LED-60',
            quantita: 24,
            unitaMisura: 'pz',
            prezzoUnitario: 65,
            faseLavoro: 'Posa Terminali & Apparecchi',
            note: 'Con circuito emergenza centralizzato',
          },
        ],
        allegati: [
          {
            id: `all-${Date.now()}-1`,
            nomeFile: 'Capitolato_Tecnico_Commessa.pdf',
            tipo: 'preventivo',
            dimensioneKb: 680,
            dataCaricamento: new Date().toISOString().split('T')[0],
            urlSimulato: '/docs/capitolato_tecnico.pdf',
          },
        ],
        nuovoAllegatoNome: '',
      });
    }
    setIsCreateModalOpen(true);
  };

  const handleSaveCustomerOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cli = clienti.find((c) => c.id === formData.clienteId) || clienti[0];
    const cnt = cantieri.find((c) => c.id === formData.cantiereId) || cantieri[0];

    const righeFinali: RigaOrdine[] = formData.righe.map((r) => {
      const subtot = r.quantita * r.prezzoUnitario;
      return {
        id: r.id,
        tipologia: 'materiale',
        codice: r.codice,
        descrizione: r.descrizione,
        quantitaTotale: r.quantita,
        unitaMisura: r.unitaMisura,
        prezzoUnitario: r.prezzoUnitario,
        subtotale: subtot,
        note: r.note,
        ripartizioniCantieri: [
          {
            cantiereId: cnt.id,
            cantiereNome: `${cnt.codice} - ${cnt.titolo}`,
            quantita: r.quantita,
            note: r.note,
          },
        ],
      };
    });

    const totaleImp = righeFinali.reduce((acc, r) => acc + (r.subtotale || 0), 0);

    if (orderToEdit) {
      updateOrdineInterno(orderToEdit.id, {
        destinatarioId: cli.id,
        destinatarioRagioneSociale: cli.ragioneSociale,
        destinatarioEmail: cli.email,
        destinatarioTelefono: cli.telefono,
        destinatarioIndirizzo: cli.indirizzo,
        cantiereRiferimentoId: cnt.id,
        cantiereRiferimentoNome: `${cnt.codice} - ${cnt.titolo}`,
        dataOrdine: formData.dataOrdine,
        dataConsegnaPrevista: formData.dataConsegnaPrevista,
        priorita: formData.priorita,
        noteGenerali: formData.noteGenerali,
        righe: righeFinali,
        allegati: formData.allegati,
        importoTotale: totaleImp,
      });
      showToast(`Ordine cliente ${orderToEdit.numero} aggiornato con successo!`, 'success');
    } else {
      const created = addOrdineInterno({
        tipo: 'cliente',
        destinatarioId: cli.id,
        destinatarioRagioneSociale: cli.ragioneSociale,
        destinatarioEmail: cli.email,
        destinatarioTelefono: cli.telefono,
        destinatarioIndirizzo: cli.indirizzo,
        cantiereRiferimentoId: cnt.id,
        cantiereRiferimentoNome: `${cnt.codice} - ${cnt.titolo}`,
        dataOrdine: formData.dataOrdine,
        dataConsegnaPrevista: formData.dataConsegnaPrevista,
        priorita: formData.priorita,
        stato: 'confermato', // Cliente orders start confirmed / in lavorazione
        noteGenerali: formData.noteGenerali,
        righe: righeFinali,
        allegati: formData.allegati,
        importoTotale: totaleImp,
        valuta: 'EUR',
      });
      showToast(`Nuovo ordine cliente ${created.numero} registrato per ${cnt.titolo}!`, 'success');
    }

    setIsCreateModalOpen(false);
  };

  // State Transition Helper for Customer Orders:
  // Ricevuto -> In Lavorazione / Cantiere Aperto -> Collaudato -> Consegnato al Cliente
  const handleQuickAdvanceCustomerOrder = (ord: OrdineInterno) => {
    let nextStato: StatoOrdine = 'confermato';
    let label = 'In Lavorazione / Cantiere Aperto';

    if (ord.stato === 'bozza' || ord.stato === 'inviato') {
      nextStato = 'confermato';
      label = 'In Lavorazione / Cantiere Aperto';
    } else if (ord.stato === 'confermato' || ord.stato === 'in_transito') {
      nextStato = 'consegnato';
      label = 'Collaudato con Esito Positivo CEI 64-8';
    } else if (ord.stato === 'consegnato') {
      nextStato = 'chiuso';
      label = 'Consegnato al Cliente con Verbale & DiCo';
    }

    transizioneStatoOrdine(ord.id, nextStato, `Avanzamento commessa cliente: ${label}`);
    showToast(`Ordine ${ord.numero} avanzato a "${label}"`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                  Vendite & Lavorazioni Esterne
                </span>
                <span className="text-xs text-slate-500 font-medium">Accesso Operativo Libero per Capicantiere & Tecnici</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Ordini Clienti & Commesse di Cantiere
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Monitoraggio ordini di lavoro committenti, contratti esecutivi, fornitura quadri e avanzamento milestone di cantiere.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Ordine Cliente / Cantiere</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Stampa Elenco Ordini Clienti"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Totale Commesse Cliente</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
              {kpis.totale}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">In Lavorazione / Cantiere</span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono mt-0.5 block">
              {kpis.inLavorazione}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 block font-medium">Collaudati (CEI 64-8)</span>
            <span className="text-lg font-black text-blue-800 dark:text-blue-300 font-mono mt-0.5 block">
              {kpis.collaudati}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">Consegnati al Cliente</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">
              {kpis.consegnatiCliente}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-purple-700 dark:text-purple-400 block font-medium">Valore Commesse</span>
            <span className="text-lg font-black text-purple-800 dark:text-purple-300 font-mono mt-0.5 block">
              € {kpis.valoreTotale.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per N. Ordine, cliente, cantiere, dispositivo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter Stato */}
          <div>
            <select
              value={filterStato}
              onChange={(e) => setFilterStato(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="ricevuto">Ricevuto / Bozza</option>
              <option value="in_lavorazione">In Lavorazione / Cantiere Aperto</option>
              <option value="collaudato">Collaudato (Esito Positivo)</option>
              <option value="consegnato_cliente">Consegnato al Cliente / Chiuso</option>
              <option value="annullato">Annullato</option>
            </select>
          </div>

          {/* Filter Cliente */}
          <div>
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="tutti">Tutti i committenti</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ragioneSociale}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Cantiere */}
          <div>
            <select
              value={filterCantiere}
              onChange={(e) => setFilterCantiere(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="tutti">Tutti i cantieri</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codice} - {c.titolo}
                </option>
              ))}
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
                <th className="p-3.5">N. Ordine Commessa</th>
                <th className="p-3.5">Committente / Cliente</th>
                <th className="p-3.5">Cantiere di Riferimento</th>
                <th className="p-3.5">Data Ordine</th>
                <th className="p-3.5">Scadenza / Milestone</th>
                <th className="p-3.5">Stato Lavorazioni</th>
                <th className="p-3.5 text-right">Valore Ordine</th>
                <th className="p-3.5 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Nessun ordine cliente o commessa trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* N. Ordine */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {ord.numero}
                          </span>
                          {ord.priorita === 'urgente' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold uppercase">
                              Urgente
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ord.righe.length} voci lavorazione
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Handshake className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ord.destinatarioRagioneSociale}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {ord.destinatarioEmail || 'cliente@committente.it'}
                        </span>
                      </td>

                      {/* Cantiere */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                            {ord.cantiereRiferimentoNome}
                          </span>
                        </div>
                      </td>

                      {/* Data Ordine */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        {ord.dataOrdine}
                      </td>

                      {/* Data Consegna / Milestone */}
                      <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                        {ord.dataConsegnaPrevista}
                      </td>

                      {/* Stato Lavorazioni */}
                      <td className="p-3.5">
                        {(ord.stato === 'bozza' || ord.stato === 'inviato') && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            Ricevuto / Da Avviare
                          </span>
                        )}
                        {(ord.stato === 'confermato' || ord.stato === 'in_transito') && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                            In Lavorazione / Cantiere
                          </span>
                        )}
                        {ord.stato === 'consegnato' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            Collaudato CEI 64-8
                          </span>
                        )}
                        {ord.stato === 'chiuso' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Consegnato al Cliente
                          </span>
                        )}
                        {ord.stato === 'annullato' && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Annullato
                          </span>
                        )}
                      </td>

                      {/* Valore Ordine */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                        € {ord.importoTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Azioni */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Advance Status */}
                          {ord.stato !== 'chiuso' && ord.stato !== 'annullato' && (
                            <button
                              onClick={() => handleQuickAdvanceCustomerOrder(ord)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors"
                              title="Avanza Stato Commessa"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedOrderDetail(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Dettaglio Ordine Cliente"
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
                            title="Stampa Scheda Commessa"
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

      {/* 5. Create / Edit Customer Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Handshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {orderToEdit ? `Modifica Ordine Cliente ${orderToEdit.numero}` : 'Nuovo Ordine Cliente & Commessa di Cantiere'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registrazione commessa cliente, fornitura quadri, posa impianti e milestone SAL contrattuali.
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

            <form onSubmit={handleSaveCustomerOrder} className="space-y-6">
              {/* Cliente & Cantiere */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Committente / Cliente Finale *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {clienti.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ragioneSociale} (P.IVA: {c.partitaIva})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantiere */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cantiere / Commessa di Riferimento *
                  </label>
                  <select
                    value={formData.cantiereId}
                    onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codice} - {c.titolo} ({c.citta})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Riferimenti Contrattuali, Date & Priorità */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rif. Ordine / Contratto
                  </label>
                  <input
                    type="text"
                    value={formData.riferimentoContratto}
                    onChange={(e) => setFormData({ ...formData, riferimentoContratto: e.target.value })}
                    placeholder="es. CTR-2026-081"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Data Ricezione Ordine
                  </label>
                  <input
                    type="date"
                    value={formData.dataOrdine}
                    onChange={(e) => setFormData({ ...formData, dataOrdine: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Scadenza / Milestone Collaudo
                  </label>
                  <input
                    type="date"
                    value={formData.dataConsegnaPrevista}
                    onChange={(e) => setFormData({ ...formData, dataConsegnaPrevista: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Priorità
                  </label>
                  <select
                    value={formData.priorita}
                    onChange={(e) => setFormData({ ...formData, priorita: e.target.value as PrioritaOrdine })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="bassa">Bassa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Tabella Lavorazioni & Dispositivi */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Lavorazioni Esterne, Quadri & Forniture Previste
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
                            descrizione: 'Nuova voce di lavorazione/fornitura',
                            codice: 'LAV-NEW',
                            quantita: 1,
                            unitaMisura: 'corpo',
                            prezzoUnitario: 1000,
                            faseLavoro: 'Installazione & Posa Cantiere',
                            note: '',
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Voce Lavoro</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5">Codice / Rif.</th>
                        <th className="p-2.5">Descrizione Lavorazione / Quadro / Dispositivo</th>
                        <th className="p-2.5 text-center">Q.tà</th>
                        <th className="p-2.5 text-center">U.M.</th>
                        <th className="p-2.5 text-right">Prezzo Convenuto (€)</th>
                        <th className="p-2.5 text-right">Subtotale (€)</th>
                        <th className="p-2.5 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {formData.righe.map((r, idx) => {
                        const subtot = r.quantita * r.prezzoUnitario;
                        return (
                          <tr key={r.id}>
                            <td className="p-2">
                              <input
                                type="text"
                                value={r.codice}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].codice = e.target.value;
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-24 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
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
                                <option value="pz">pz</option>
                                <option value="m">m</option>
                                <option value="ore">ore</option>
                                <option value="corpo">a corpo</option>
                                <option value="kit">kit</option>
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={r.prezzoUnitario}
                                onChange={(e) => {
                                  const updated = [...formData.righe];
                                  updated[idx].prezzoUnitario = Math.max(0, Number(e.target.value));
                                  setFormData({ ...formData, righe: updated });
                                }}
                                className="w-24 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-right text-xs font-bold"
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
                      <span className="text-slate-500">Valore Totale Fornitura / Commessa: </span>
                      <strong className="text-amber-600 dark:text-amber-400 text-sm font-black">
                        € {formData.righe.reduce((acc, r) => acc + r.quantita * r.prezzoUnitario, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note & Allegati */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Note Esecutive & Prescrizioni Sicurezza
                  </label>
                  <textarea
                    rows={3}
                    value={formData.noteGenerali}
                    onChange={(e) => setFormData({ ...formData, noteGenerali: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Specificare prescrizioni del committente, orari di accesso cantiere..."
                  />
                </div>

                {/* Allegati */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Documenti Allegati (Contratto Firmato .pdf, Capitolato, Schemi)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.nuovoAllegatoNome}
                      onChange={(e) => setFormData({ ...formData, nuovoAllegatoNome: e.target.value })}
                      placeholder="es. Contratto_Appalto_Firmato.pdf"
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
                              tipo: 'preventivo',
                              dimensioneKb: 550,
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
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  {orderToEdit ? 'Salva Modifiche Commessa' : 'Registra Ordine Cliente'}
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
