import React, { useState } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Filter,
  Truck,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Mail,
  Smartphone,
  Building2,
  User,
  ArrowRight,
  ExternalLink,
  Layers,
  Wrench,
  FileText,
  Calendar,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RichiestaMateriali, PrioritaRichiesta, StatoRichiestaMateriali } from '../../types/richiestaMateriali';
import { NuovaRichiestaMaterialiModal } from './NuovaRichiestaMaterialiModal';
import { RichiestaDetailModal } from './RichiestaDetailModal';
import { EmailNotificationModal } from './EmailNotificationModal';
import { RichiestaPickListPrintModal } from './RichiestaPickListPrintModal';
import { GeneraDdtModal } from './GeneraDdtModal';

export const RichiesteMaterialiModule: React.FC = () => {
  const { richiesteMateriali, aggiornaStatoRichiesta, setActiveTab, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterPriorita, setFilterPriorita] = useState<string>('tutte');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRichiestaId, setSelectedRichiestaId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [emailModalRichiesta, setEmailModalRichiesta] = useState<RichiestaMateriali | null>(null);
  const [printModalRichiesta, setPrintModalRichiesta] = useState<RichiestaMateriali | null>(null);
  const [generaDdtRichiesta, setGeneraDdtRichiesta] = useState<RichiestaMateriali | null>(null);

  // Calcoli Statistiche
  const totalCount = richiesteMateriali.length;
  const inAttesaCount = richiesteMateriali.filter((r) => r.stato === 'inviata').length;
  const inPreparazioneCount = richiesteMateriali.filter((r) => r.stato === 'in_preparazione').length;
  const evaseDdtCount = richiesteMateriali.filter((r) => r.stato === 'ddt_emesso').length;
  const fermoCantiereCount = richiesteMateriali.filter(
    (r) => r.priorita === 'bloccante_fermo_cantiere' && r.stato !== 'ddt_emesso'
  ).length;

  // Filtraggio
  const filteredRichieste = richiesteMateriali.filter((r) => {
    const matchesSearch =
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      r.cantiereTitolo.toLowerCase().includes(search.toLowerCase()) ||
      r.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      r.richiedenteNome.toLowerCase().includes(search.toLowerCase()) ||
      r.righe.some(
        (rg) =>
          rg.descrizione.toLowerCase().includes(search.toLowerCase()) ||
          rg.codice.toLowerCase().includes(search.toLowerCase())
      );

    const matchesStato = filterStato === 'tutti' || r.stato === filterStato;
    const matchesPriorita = filterPriorita === 'tutte' || r.priorita === filterPriorita;

    return matchesSearch && matchesStato && matchesPriorita;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Hero Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Logistica Cantiere Live · Canale Push & Email
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Collegato al Magazzino Centrale & Emissione DDT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
                <PackagePlus className="w-6 h-6" />
              </span>
              <span>Richieste Materiali & Attrezzature Cantiere</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              I tecnici sul campo compilano la lista delle forniture necessarie. L&apos;azione genera una
              notifica istantanea via push ed email al magazziniere, che predispone l&apos;occorrente e pianifica
              l&apos;invio tramite Documento di Trasporto (DDT).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Nuova Richiesta da Campo</span>
            </button>

            <button
              onClick={() => setActiveTab('ddt_trasporto')}
              className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Truck className="w-4 h-4 text-cyan-600" />
              <span>Registro DDT Trasporto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Totale Richieste</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Storico campo</div>
        </div>

        {/* KPI 2: In Attesa */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-xs font-bold">1. In Attesa Prelievo</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {inAttesaCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nuove da verificare</div>
        </div>

        {/* KPI 3: In Allestimento */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-xs font-bold">2. In Allestimento</span>
            <Warehouse className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {inPreparazioneCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Colli in preparazione</div>
        </div>

        {/* KPI 4: Evase con DDT */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-1">
            <span className="text-xs font-bold">3. Evase con DDT</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
            {evaseDdtCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In viaggio / Consegnate</div>
        </div>

        {/* KPI 5: Fermi Cantiere / Urgenze */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-xs font-bold">🚨 Fermi Cantiere</span>
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {fermoCantiereCount}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Priorità massima</div>
        </div>
      </div>

      {/* 3. Filtri e Ricerca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Barra Ricerca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca per cantiere, tecnico, codice materiale, matricola o numero richiesta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Filtro Priorità */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Urgenza:</span>
            <select
              value={filterPriorita}
              onChange={(e) => setFilterPriorita(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              <option value="tutte">Tutte le Priorità</option>
              <option value="bloccante_fermo_cantiere">🚨 Fermo Cantiere</option>
              <option value="urgente">🟡 Urgente (24h)</option>
              <option value="normale">🟢 Normale (2-3gg)</option>
            </select>
          </div>
        </div>

        {/* Tab Filtri Stato */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'tutti', label: 'Tutte le Richieste', count: totalCount },
            { id: 'inviata', label: 'Inviate da Campo (Da Preparare)', count: inAttesaCount },
            { id: 'in_preparazione', label: 'In Allestimento', count: inPreparazioneCount },
            { id: 'ddt_emesso', label: 'Evase con DDT', count: evaseDdtCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStato(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterStato === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Lista Card Richieste */}
      <div className="space-y-4">
        {filteredRichieste.length > 0 ? (
          filteredRichieste.map((r) => {
            const isFermo = r.priorita === 'bloccante_fermo_cantiere';
            const isDdtEmesso = r.stato === 'ddt_emesso';

            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                  isFermo
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                      {r.numero}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isFermo
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                          : r.priorita === 'urgente'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {r.priorita === 'bloccante_fermo_cantiere' ? '🚨 FERMO CANTIERE' : r.priorita.toUpperCase()}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isDdtEmesso
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : r.stato === 'in_preparazione'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {r.stato.replace('_', ' ').toUpperCase()}
                    </span>

                    {/* Badge Notifica Push & Email */}
                    <button
                      type="button"
                      onClick={() => setEmailModalRichiesta(r)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                      title="Clicca per visualizzare l'anteprima della notifica push e della email recapitata al magazziniere"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Notifica Push & Email Inviata</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Richiesta del: <strong>{r.dataRichiesta}</strong></span>
                  </div>
                </div>

                {/* Info Cantiere e Richiedente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{r.cantiereTitolo}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Destinazione: {r.indirizzoConsegna}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Committente: {r.clienteNome}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tecnico: <strong>{r.richiedenteNome}</strong> ({r.richiedenteRuolo})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tel: {r.richiedenteTelefono}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        Consegna desiderata: <strong>{r.dataPrevistaConsegna}</strong> ({r.orarioPreferito})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voci Richieste (Anteprima rapida) */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 my-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>Articoli e Strumenti Richiesti ({r.righe.length} voci):</span>
                    <span className="text-slate-500 font-normal">Giacenza magazzino verificata</span>
                  </div>

                  <div className="space-y-1.5">
                    {r.righe.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-xs flex items-center justify-between gap-2">
                        <div className="truncate flex-1">
                          <span className="font-mono text-[10px] font-bold text-slate-500 mr-1.5">[{item.codice}]</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.descrizione}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.quantitaDisponibileMagazzino !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                item.quantitaDisponibileMagazzino >= item.quantitaRichiesta
                                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                                  : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 font-bold'
                              }`}
                            >
                              Giacenza: {item.quantitaDisponibileMagazzino} {item.unitaMisura}
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.quantitaRichiesta} {item.unitaMisura}
                          </span>
                        </div>
                      </div>
                    ))}

                    {r.righe.length > 3 && (
                      <div className="text-[11px] text-slate-400 italic pt-1">
                        + altri {r.righe.length - 3} articoli inclusi nella richiesta...
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRichiestaId(r.id);
                        setDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Dettaglio Completo
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintModalRichiesta(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Scheda Prelievo A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailModalRichiesta(r)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold transition-colors"
                      title="Visualizza notifica push e testo email inviata"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Log Notifica</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.stato === 'inviata' && (
                      <button
                        type="button"
                        onClick={() => aggiornaStatoRichiesta(r.id, 'in_preparazione')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>Prendi in Carico</span>
                      </button>
                    )}

                    {!isDdtEmesso ? (
                      <button
                        type="button"
                        onClick={() => setGeneraDdtRichiesta(r)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Genera DDT di Trasporto</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('ddt_trasporto')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:underline"
                      >
                        <span>DDT {r.ddtCollegatoNumero} Emesso</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <PackagePlus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Nessuna richiesta materiale trovata
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Non ci sono richieste corrispondenti ai filtri impostati. Clicca su &quot;+ Nuova Richiesta da Campo&quot; per inviare una distinta.
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuova Richiesta</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Modals */}
      <NuovaRichiestaMaterialiModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <RichiestaDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRichiestaId(null);
        }}
        richiestaId={selectedRichiestaId}
      />

      <EmailNotificationModal
        isOpen={!!emailModalRichiesta}
        onClose={() => setEmailModalRichiesta(null)}
        richiesta={emailModalRichiesta}
        onGeneraDdt={() => {
          if (emailModalRichiesta) {
            setGeneraDdtRichiesta(emailModalRichiesta);
            setEmailModalRichiesta(null);
          }
        }}
      />

      <RichiestaPickListPrintModal
        isOpen={!!printModalRichiesta}
        onClose={() => setPrintModalRichiesta(null)}
        richiesta={printModalRichiesta}
      />

      <GeneraDdtModal
        isOpen={!!generaDdtRichiesta}
        onClose={() => setGeneraDdtRichiesta(null)}
        richiesta={generaDdtRichiesta}
      />
    </div>
  );
};
