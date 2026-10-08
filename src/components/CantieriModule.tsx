import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  ScanLine,
  Layers,
  Cpu,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Calendar,
  X,
  User,
  Database,
  LayoutDashboard,
  HardHat,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cantiere, CantiereStato, DispositivoInstallato } from '../types';
import { CantiereDashboardView } from './cantiere-dashboard/CantiereDashboardView';
import { PresenzeModule } from './presenze/PresenzeModule';
import { CantiereSalSection } from './cantiere-dashboard/CantiereSalSection';
import { generateUniqueId } from '../utils/idGenerator';

export const CantieriModule: React.FC = () => {
  const {
    cantieri,
    clienti,
    lavorazioni,
    documenti,
    addCantiere,
    updateCantiere,
    openQRModal,
    selectedCantiereId,
    setSelectedCantiereId,
    showToast,
    currentUser,
    offlineCacheInfo,
    openOfflineModal,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [isNewCantiereModalOpen, setIsNewCantiereModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'panoramica' | 'dashboard_360' | 'dispositivi' | 'lavorazioni' | 'materiali' | 'documenti' | 'sal_contabilita'>('dashboard_360');

  // Form state for new Cantiere
  const [newTitolo, setNewTitolo] = useState('');
  const [newClienteId, setNewClienteId] = useState(clienti[0]?.id || '');
  const [newIndirizzo, setNewIndirizzo] = useState('');
  const [newCitta, setNewCitta] = useState('');
  const [newBudget, setNewBudget] = useState(45000);
  const [newDescrizione, setNewDescrizione] = useState('');
  const [newNoteSicurezza, setNewNoteSicurezza] = useState('Obbligo DPI III cat. e rispetto prescrizioni POS/PSC.');

  // Form state for adding device to current cantiere
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [devNome, setDevNome] = useState('');
  const [devCodice, setDevCodice] = useState('');
  const [devTipo, setDevTipo] = useState('Quadro Elettrico Secondario');
  const [devUbicazione, setDevUbicazione] = useState('');
  const [devMatricola, setDevMatricola] = useState('');

  const activeCantiere = cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0];

  const filteredCantieri = cantieri.filter((c) => {
    const matchesSearch =
      c.titolo.toLowerCase().includes(search.toLowerCase()) ||
      c.codice.toLowerCase().includes(search.toLowerCase()) ||
      c.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      c.citta.toLowerCase().includes(search.toLowerCase());

    const matchesStato = filterStato === 'tutti' || c.stato === filterStato;
    return matchesSearch && matchesStato;
  });

  const handleCreateCantiere = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitolo.trim()) {
      showToast('Inserisci il titolo della commessa o cantiere.', 'warning');
      return;
    }
    const cliente = clienti.find((cli) => cli.id === newClienteId);
    if (!cliente) {
      showToast('Seleziona un committente/cliente valido.', 'warning');
      return;
    }

    const nextNum = cantieri.length + 1;
    const codice = `CNT-2026-${String(nextNum).padStart(3, '0')}`;

    const created = addCantiere({
      codice,
      titolo: newTitolo,
      clienteId: cliente.id,
      clienteNome: cliente.ragioneSociale,
      indirizzo: newIndirizzo || cliente.indirizzo,
      citta: newCitta || cliente.citta,
      stato: 'in_corso',
      avanzamentoPercentuale: 10,
      dataInizio: new Date().toISOString().split('T')[0],
      dataFinePrevista: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
      responsabileId: 'usr-resp',
      responsabileNome: 'Ing. Roberto Fontana',
      operatoriAssegnatiIds: ['usr-op1'],
      budgetTotale: newBudget,
      costiConsuntivati: 0,
      descrizione: newDescrizione || 'Nuovo impianto elettrico conforme alle normative CEI 64-8.',
      qrCode: `QR-${codice}`,
      dispositivi: [],
      materialiAssegnati: [],
      noteSicurezza: newNoteSicurezza,
    });

    setIsNewCantiereModalOpen(false);
    setSelectedCantiereId(created.id);
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCantiere || !devNome) return;

    const newDev: DispositivoInstallato = {
      id: generateUniqueId('disp'),
      nome: devNome,
      codice: devCodice || generateUniqueId('DSP').toUpperCase(),
      tipo: devTipo,
      ubicazione: devUbicazione || 'Quadro Principale',
      dataInstallazione: new Date().toISOString().split('T')[0],
      garanziaScadenza: new Date(Date.now() + 730 * 24 * 3600 * 1000).toISOString().split('T')[0],
      matricola: devMatricola || `SN-${Math.floor(Math.random() * 90000 + 10000)}`,
      stato: 'funzionante',
    };

    updateCantiere(activeCantiere.id, {
      dispositivi: [...activeCantiere.dispositivi, newDev],
    });

    setIsAddDeviceOpen(false);
    setDevNome('');
    setDevCodice('');
    setDevMatricola('');
    showToast(`Dispositivo "${newDev.nome}" aggiunto al cantiere.`);
  };

  const getStatusBadge = (stato: CantiereStato) => {
    switch (stato) {
      case 'in_corso':
        return <span className="text-amber-400 font-semibold font-mono text-[11px]">In Corso</span>;
      case 'collaudo':
        return <span className="text-cyan-400 font-semibold font-mono text-[11px]">In Collaudo</span>;
      case 'completato':
        return <span className="text-emerald-400 font-semibold font-mono text-[11px]">Completato</span>;
      case 'in_attesa':
        return <span className="text-slate-400 font-semibold font-mono text-[11px]">In Attesa</span>;
      default:
        return <span className="text-slate-400 font-mono text-[11px]">{stato}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Clienti & Cantieri Elettrici</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestione centralizzata commesse, dispositivi installati, materiali e documentazione
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openOfflineModal('cantieri')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-300 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold rounded-lg transition-colors shadow-sm"
            title="Visualizza i dati cantieri salvati in memoria locale (IndexedDB/LocalStorage) per l'uso offline"
          >
            <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Cache Offline ({offlineCacheInfo.activeCantieriCount})</span>
          </button>

          {currentUser.role !== 'cliente' && (
            <button
              onClick={() => setIsNewCantiereModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuovo Cantiere
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cerca cantiere per codice, titolo, cliente o città..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs">
          {['tutti', 'in_corso', 'collaudo', 'completato'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStato(st)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                filterStato === st
                  ? 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Panel Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cantieri List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
            <span>Commesse identificate ({filteredCantieri.length})</span>
            <span>Ordina per codice</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredCantieri.map((cantiere) => {
              const isSelected = activeCantiere?.id === cantiere.id;
              return (
                <div
                  key={cantiere.id}
                  onClick={() => setSelectedCantiereId(cantiere.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 dark:bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-500 dark:text-amber-400">
                          {cantiere.codCantiere || cantiere.codice}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">·</span>
                        {getStatusBadge(cantiere.stato)}
                        {cantiere.cantiereAperto !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              cantiere.cantiereAperto
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {cantiere.cantiereAperto ? 'Aperto' : 'Chiuso'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {cantiere.cantiere || cantiere.titolo}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{cantiere.cliente || cantiere.clienteNome}</span>
                        {cantiere.codCliente && (
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            ({cantiere.codCliente})
                          </span>
                        )}
                        {(cantiere.assegnato || cantiere.responsabileNome) && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-300/80">
                            · Resp: {cantiere.assegnato || cantiere.responsabileNome}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQRModal({
                          title: cantiere.titolo,
                          code: cantiere.qrCode,
                          subtitle: `${cantiere.codice} · ${cantiere.citta}`,
                          type: 'cantiere',
                        });
                      }}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Mostra QR Cantiere"
                    >
                      <ScanLine className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{cantiere.citta}</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {cantiere.avanzamentoPercentuale}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${cantiere.avanzamentoPercentuale}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cantiere Full Detail Card (7 cols) */}
        <div className="lg:col-span-7">
          {activeCantiere ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 shadow-sm dark:shadow-xl space-y-6">
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-amber-500 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      {activeCantiere.codice}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">·</span>
                    <span className="text-slate-700 dark:text-slate-300">{activeCantiere.citta}</span>
                    <span className="text-slate-400 dark:text-slate-500">·</span>
                    {getStatusBadge(activeCantiere.stato)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{activeCantiere.titolo}</h2>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Committente: <strong className="text-slate-900 dark:text-slate-200">{activeCantiere.clienteNome}</strong> ({activeCantiere.indirizzo})
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => setIsDashboardModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard 360°</span>
                  </button>

                  <button
                    onClick={() =>
                      openQRModal({
                        title: activeCantiere.titolo,
                        code: activeCantiere.qrCode,
                        subtitle: `${activeCantiere.codice} · Committente: ${activeCantiere.clienteNome}`,
                        type: 'cantiere',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <ScanLine className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Etichetta QR
                  </button>
                </div>
              </div>

              {/* Subtabs Selector */}
              <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
                {[
                  { id: 'dashboard_360', label: 'Dashboard Riepilogativa 360°', icon: <LayoutDashboard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> },
                  { id: 'sal_contabilita', label: 'SAL & Contabilità', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
                  { id: 'panoramica', label: 'Panoramica & Costi', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'dispositivi', label: `Dispositivi (${activeCantiere.dispositivi.length})`, icon: <Cpu className="w-3.5 h-3.5" /> },
                  { id: 'lavorazioni', label: 'Lavorazioni', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  { id: 'materiali', label: 'Materiali Assegnati', icon: <Package className="w-3.5 h-3.5" /> },
                  { id: 'documenti', label: 'Documenti & Schemi', icon: <FileText className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeSubTab === tab.id
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* SUBTAB 0: DASHBOARD RIEPILOGATIVA 360° */}
              {activeSubTab === 'dashboard_360' && (
                <CantiereDashboardView cantiereId={activeCantiere.id} />
              )}

              {/* SUBTAB 1: PANORAMICA */}
              {activeSubTab === 'panoramica' && (
                <div className="space-y-5">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {activeCantiere.descrizione}
                  </p>

                  {/* Financials & Dates */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Budget Totale</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                        € {activeCantiere.budgetTotale.toLocaleString('it-IT')}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Costi Consuntivati</span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                        € {activeCantiere.costiConsuntivati.toLocaleString('it-IT')}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Data Inizio</span>
                      <span className="text-xs font-mono text-slate-800 dark:text-slate-200">
                        {activeCantiere.dataInizio}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fine Prevista</span>
                      <span className="text-xs font-mono text-slate-800 dark:text-slate-200">
                        {activeCantiere.dataFinePrevista}
                      </span>
                    </div>
                  </div>

                  {/* Security and Requirements */}
                  {activeCantiere.noteSicurezza && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-start gap-2.5 text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-800 dark:text-amber-300 block">Prescrizioni di Sicurezza POS / CEI:</span>
                        <span className="text-slate-700 dark:text-slate-300">{activeCantiere.noteSicurezza}</span>
                      </div>
                    </div>
                  )}

                  {/* Team */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-300">Staff Assegnato al Cantiere</span>
                      <span className="text-slate-500">Resp: {activeCantiere.responsabileNome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Tecnici operativi abilitati: Matteo Bianchi (PES/PAV), Davide Riva</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: DISPOSITIVI INSTALLATI */}
              {activeSubTab === 'dispositivi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Dispositivi, quadri e apparecchiature tracciate
                    </span>
                    {currentUser.role !== 'cliente' && (
                      <button
                        onClick={() => setIsAddDeviceOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        Aggiungi Dispositivo
                      </button>
                    )}
                  </div>

                  {isAddDeviceOpen && (
                    <form
                      onSubmit={handleAddDevice}
                      className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 text-xs"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
                        Nuovo Dispositivo nel Cantiere
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Nome Dispositivo:</label>
                          <input
                            type="text"
                            required
                            placeholder="es. Quadro Secondario Reparto Torni"
                            value={devNome}
                            onChange={(e) => setDevNome(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Tipo:</label>
                          <select
                            value={devTipo}
                            onChange={(e) => setDevTipo(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                          >
                            <option value="Quadro Elettrico Principale">Quadro Elettrico Principale</option>
                            <option value="Quadro Secondario Reparto">Quadro Secondario Reparto</option>
                            <option value="Inverter Fotovoltaico">Inverter Fotovoltaico</option>
                            <option value="Colonnina Ricarica Veicoli">Colonnina Ricarica Veicoli</option>
                            <option value="Sistema Accumulo Batterie">Sistema Accumulo Batterie</option>
                            <option value="Impianto Domotico KNX">Impianto Domotico KNX</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Ubicazione nel Cantiere:</label>
                          <input
                            type="text"
                            placeholder="es. Cabina MT/BT piano terra"
                            value={devUbicazione}
                            onChange={(e) => setDevUbicazione(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 mb-1">Matricola / Serial Number:</label>
                          <input
                            type="text"
                            placeholder="es. SN-2026-991"
                            value={devMatricola}
                            onChange={(e) => setDevMatricola(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddDeviceOpen(false)}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                        >
                          Annulla
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                        >
                          Salva Dispositivo
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {activeCantiere.dispositivi.length > 0 ? (
                      activeCantiere.dispositivi.map((disp) => (
                        <div
                          key={disp.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg flex items-start justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">{disp.codice}</span>
                              <span className="text-slate-400 dark:text-slate-600">·</span>
                              <span className="text-slate-600 dark:text-slate-400">{disp.tipo}</span>
                              <span className="text-slate-400 dark:text-slate-600">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Stato: {disp.stato}</span>
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-200 mt-1">{disp.nome}</h4>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Ubicazione: <span className="text-slate-700 dark:text-slate-300">{disp.ubicazione}</span> · Matricola: <span className="font-mono text-slate-600 dark:text-slate-400">{disp.matricola}</span>
                            </div>
                          </div>

                          <div className="text-right text-[10px] text-slate-500">
                            <div>Installato: {disp.dataInstallazione}</div>
                            <div className="text-amber-600 dark:text-amber-400">Garanzia fino al: {disp.garanziaScadenza}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-950/40 rounded border border-dashed border-slate-200 dark:border-slate-800 text-center">
                        Nessun dispositivo ancora censito in questo cantiere.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: LAVORAZIONI */}
              {activeSubTab === 'lavorazioni' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Fasi di lavoro e avanzamento attività per questo cantiere</span>
                  </div>

                  <div className="space-y-2">
                    {lavorazioni
                      .filter((l) => l.cantiereId === activeCantiere.id)
                      .map((lav) => (
                        <div
                          key={lav.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-amber-500 dark:text-amber-400 font-bold">
                              Fase: {lav.fase}
                            </span>
                            <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold font-mono">
                              {lav.stato.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{lav.titolo}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{lav.descrizione}</p>
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-900 flex justify-between text-[11px] text-slate-500">
                            <span>Scadenza: {lav.dataScadenza}</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              Ore: {lav.oreLavorate} / {lav.oreStimate} h
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: MATERIALI ASSEGNATI */}
              {activeSubTab === 'materiali' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Materiali scaricati dal magazzino e destinati all'impianto
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[480px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Descrizione Materiale</th>
                            <th className="py-2 px-3 text-right">Assegnato</th>
                            <th className="py-2 px-3 text-right">Utilizzato</th>
                            <th className="py-2 px-3 text-center">Data Assegnazione</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {activeCantiere.materialiAssegnati.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{m.nome}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                {m.quantita} {m.unitaMisura}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                {m.utilizzato} {m.unitaMisura}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                                {m.dataAssegnazione}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 5: DOCUMENTI & SCHEMI */}
              {activeSubTab === 'documenti' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Schemi unifilari, fascicoli tecnici e relazioni di conformità allegate
                  </div>
                  <div className="space-y-2">
                    {documenti
                      .filter((d) => d.cantiereId === activeCantiere.id)
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900 text-amber-500 dark:text-amber-400 rounded">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-200">{doc.titolo}</div>
                              <div className="text-[11px] text-slate-500">
                                Formato {doc.formato.toUpperCase()} · {(doc.dimensioneKb / 1024).toFixed(1)} MB · Caricato il {doc.dataCaricamento}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => showToast(`Download simulato: ${doc.titolo}`)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded border border-slate-200 dark:border-slate-700"
                          >
                            Visualizza
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 6: SAL & CONTABILITÀ */}
              {activeSubTab === 'sal_contabilita' && (
                <CantiereSalSection cantiereId={activeCantiere.id} />
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              Nessun cantiere selezionato.
            </div>
          )}
        </div>
      </div>

      {/* NEW CANTIERE MODAL */}
      {isNewCantiereModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewCantiereModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Apertura Nuovo Cantiere Elettrico</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Generazione automatica codice identificativo e QR Code univoco
            </p>

            <form onSubmit={handleCreateCantiere} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Titolo / Oggetto del Cantiere:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Realizzazione Impianto Cablaggio e Quadri Reparto B"
                  value={newTitolo}
                  onChange={(e) => setNewTitolo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cliente Committente:</label>
                <select
                  value={newClienteId}
                  onChange={(e) => setNewClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  {clienti.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.ragioneSociale} ({cli.citta})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Indirizzo Lavori:</label>
                  <input
                    type="text"
                    placeholder="es. Via Fermi 22"
                    value={newIndirizzo}
                    onChange={(e) => setNewIndirizzo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Città (Provincia):</label>
                  <input
                    type="text"
                    placeholder="es. Monza (MB)"
                    value={newCitta}
                    onChange={(e) => setNewCitta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Budget Totale Offerta (€):</label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Descrizione Lavori:</label>
                <textarea
                  rows={2}
                  value={newDescrizione}
                  onChange={(e) => setNewDescrizione(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  placeholder="Descrivi brevemente lo scopo dell'impianto..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCantiereModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Crea Cantiere
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Dashboard 360 Fullscreen View */}
      {isDashboardModalOpen && (
        <CantiereDashboardView
          cantiereId={activeCantiere.id}
          isModal
          onClose={() => setIsDashboardModalOpen(false)}
        />
      )}
    </div>
  );
};
