import React, { useState, useRef } from 'react';
import {
  Calendar,
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  Snowflake,
  HardHat,
  Users,
  Wrench,
  AlertTriangle,
  Camera,
  Plus,
  FileCheck,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Search,
  Filter,
  Image as ImageIcon,
  Clock,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GiornaleLavoriItem, FotoCantiereGiornale, MaestranzaGiornale, ImprevistoGiornale } from '../types/giornaleLavori';
import { INITIAL_GIORNALI_LAVORI } from '../data/mockGiornaleLavori';
import { VerbaleGiornalieroPrintModal } from './VerbaleGiornalieroPrintModal';
import { ROLMeteo } from '../types';

export const GiornaleLavoriModule: React.FC = () => {
  const { cantieri, currentUser, dipendenti, showToast } = useApp();

  const [giornali, setGiornali] = useState<GiornaleLavoriItem[]>(INITIAL_GIORNALI_LAVORI);
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGiornale, setSelectedGiornale] = useState<GiornaleLavoriItem | null>(giornali[0] || null);

  // Modali
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printModalGiornale, setPrintModalGiornale] = useState<GiornaleLavoriItem | null>(null);
  const [lightboxFoto, setLightboxFoto] = useState<FotoCantiereGiornale | null>(null);

  // Form Nuova Foto
  const [newFotoDidascalia, setNewFotoDidascalia] = useState('');
  const [newFotoCategoria, setNewFotoCategoria] = useState<'impianti' | 'strutture' | 'sicurezza' | 'collaudo'>('impianti');
  const [newFotoUrl, setNewFotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Nuovo Giornale Lavori
  const [formCantiereId, setFormCantiereId] = useState(cantieri[0]?.id || 'CNT-01');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formDLNome, setFormDLNome] = useState('Ing. Roberto Fontana');
  const [formLavorazioni, setFormLavorazioni] = useState('Posa canalizzazioni portacavi e cablaggio quadri di zona.');
  const [formQuantita, setFormQuantita] = useState('50 metri canale zincato');
  const [formAvanzamento, setFormAvanzamento] = useState<number>(50);
  const [formCondizioneMeteo, setFormCondizioneMeteo] = useState<ROLMeteo['condizione']>('sereno');
  const [formTempMin, setFormTempMin] = useState(14);
  const [formTempMax, setFormTempMax] = useState(23);
  const [formNoteMeteo, setFormNoteMeteo] = useState('');
  const [formNoteSicurezza, setFormNoteSicurezza] = useState('Verifica DPI e linea di vita prima del lavoro in quota.');

  // Collaudo e Responsiveness Mobile 360px-400px & Blocco Sicurezza D.Lgs 81/08
  const [mobileTab, setMobileTab] = useState<'elenco' | 'dettaglio'>('elenco');
  const [viewportSimulationGL, setViewportSimulationGL] = useState<'full' | '360px' | '390px'>('full');
  const [isSimulazioneBloccoSicurezzaGL, setIsSimulazioneBloccoSicurezzaGL] = useState<boolean>(false);

  // Filtraggio
  const filteredGiornali = giornali.filter((g) => {
    const matchCantiere = selectedCantiereId === 'tutti' || g.cantiereId === selectedCantiereId;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      g.numeroVerbale.toLowerCase().includes(q) ||
      g.cantiereTitolo.toLowerCase().includes(q) ||
      g.lavorazioniEseguite.toLowerCase().includes(q);
    return matchCantiere && matchQuery;
  });

  // Aggiunta Foto alla Scheda Selezionata
  const handleAddFotoToSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiornale) return;

    const imageUrl =
      newFotoUrl ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

    const nuovaFoto: FotoCantiereGiornale = {
      id: `foto-${Date.now()}`,
      url: imageUrl,
      didascalia: newFotoDidascalia || 'Foto rilievo cantiere',
      oraScatto: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      categoria: newFotoCategoria,
    };

    const updated = giornali.map((g) =>
      g.id === selectedGiornale.id ? { ...g, fotoGalleria: [...g.fotoGalleria, nuovaFoto] } : g
    );

    setGiornali(updated);
    setSelectedGiornale({ ...selectedGiornale, fotoGalleria: [...selectedGiornale.fotoGalleria, nuovaFoto] });
    setNewFotoDidascalia('');
    setNewFotoUrl('');
    showToast('Foto caricata con successo nel Giornale Lavori', 'success');
  };

  // Creazione Nuovo Giornale Lavori
  const handleCreateGiornale = (e: React.FormEvent) => {
    e.preventDefault();
    const cant = cantieri.find((c) => c.id === formCantiereId);

    const nuovoItem: GiornaleLavoriItem = {
      id: `gl-${Date.now()}`,
      numeroVerbale: `GL-2026-${String(giornali.length + 185).padStart(4, '0')}`,
      data: formData,
      cantiereId: formCantiereId,
      cantiereTitolo: cant ? cant.titolo : 'Cantiere VoltMaster',
      clienteNome: cant ? cant.clienteNome : 'Cliente Generico',
      direttoreLavoriNome: formDLNome,
      capocantiereNome: currentUser.name || 'Marco Rossi',
      faseGanttTitolo: 'Lavorazioni di Installazione e Cablaggio',
      meteo: {
        condizione: formCondizioneMeteo,
        temperaturaMin: formTempMin,
        temperaturaMax: formTempMax,
        noteMeteo: formNoteMeteo,
      },
      lavorazioniEseguite: formLavorazioni,
      quantitaPosata: formQuantita,
      avanzamentoPercentuale: formAvanzamento,
      maestranze: [
        {
          id: 'm1',
          nome: currentUser.name || 'Marco Rossi',
          ruolo: 'Capocantiere Elettrico',
          ditta: 'VoltMaster S.r.l.',
          oreSvolte: 8,
          presente: true,
        },
        {
          id: 'm2',
          nome: 'Luca Bianchi',
          ruolo: 'Operaio Specializzato',
          ditta: 'VoltMaster S.r.l.',
          oreSvolte: 8,
          presente: true,
        },
      ],
      imprevisti: [],
      attrezzature: [
        {
          nome: 'Piattaforma Aerea PLE 16m',
          matricolaTarga: 'PLE-16M-HAU',
          oreUtilizzo: 6,
        },
      ],
      fotoGalleria: [
        {
          id: 'f-init',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
          didascalia: 'Inizio lavori di giornata',
          oraScatto: '08:15',
          categoria: 'impianti',
        },
      ],
      noteSicurezzaDL: formNoteSicurezza,
      statoApprovazioneDL: 'in_attesa',
      sigilloDigitaleHash: `sha256-${Math.random().toString(36).substring(2)}`,
    };

    setGiornali([nuovoItem, ...giornali]);
    setSelectedGiornale(nuovoItem);
    setIsNewModalOpen(false);
    showToast(`Giornale Lavori ${nuovoItem.numeroVerbale} creato con successo!`, 'success');
  };

  // Approvazione DL
  const handleApproveDL = (giornaleId: string) => {
    if (isSimulazioneBloccoSicurezzaGL) {
      showToast('🚨 FIRMA BLOCCATA: Rilevata maestranza non idonea ex D.Lgs. 81/08. Risolvere l\'anomalia prima dell\'approvazione del DL.', 'error');
      return;
    }
    const updated = giornali.map((g) =>
      g.id === giornaleId
        ? {
            ...g,
            statoApprovazioneDL: 'approvato_dl' as const,
            firmaDLDataOra: new Date().toISOString(),
          }
        : g
    );
    setGiornali(updated);
    if (selectedGiornale && selectedGiornale.id === giornaleId) {
      setSelectedGiornale({
        ...selectedGiornale,
        statoApprovazioneDL: 'approvato_dl',
        firmaDLDataOra: new Date().toISOString(),
      });
    }
    showToast('Verbale approvato dal Direttore dei Lavori (DL)', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> D.M. 49/2018 — DIREZIONE LAVORI & CONTABILITÀ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Giornale dei Lavori Digitale
            <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              Certificato DL
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Scheda giornaliera di cantiere per il capocantiere: registro meteo, maestranze e subappalti presenti, lavorazioni, imprevisti, galleria foto ed esportazione del verbale firmato dal DL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Nuovo Verbale Giornaliero
          </button>
        </div>
      </div>

      {/* Collaudo QA & Simulatore Schermo Mobile (360px - 390px - Full) & Blocco Sicurezza D.Lgs 81/08 */}
      <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-tight">
              Collaudo Giornale Lavori su Dispositivi Mobili (360–400px)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {viewportSimulationGL === '360px' ? '360px (Compatto)' : viewportSimulationGL === '390px' ? '390px (iPhone)' : 'Schermo Fluido'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Risoluzione:</span>
            <button
              type="button"
              onClick={() => setViewportSimulationGL('360px')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewportSimulationGL === '360px'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              📱 360px
            </button>
            <button
              type="button"
              onClick={() => setViewportSimulationGL('390px')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewportSimulationGL === '390px'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              📱 390px
            </button>
            <button
              type="button"
              onClick={() => setViewportSimulationGL('full')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewportSimulationGL === 'full'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              💻 Fluido
            </button>
          </div>
        </div>

        {/* Toggle Simulazione Blocco Sicurezza Maestranze / Subappalti */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${isSimulazioneBloccoSicurezzaGL ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] text-slate-300">
              Sicurezza Cantiere D.Lgs. 81/08:
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              isSimulazioneBloccoSicurezzaGL ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {isSimulazioneBloccoSicurezzaGL ? '🚨 IRREGOLARITÀ RILEVATA (DURC/Visita Sospesa)' : '✅ MAESTRANZE QUALIFICATE'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isSimulazioneBloccoSicurezzaGL;
              setIsSimulazioneBloccoSicurezzaGL(next);
              showToast(
                next
                  ? '🚨 Simulazione Blocco Sicurezza ATTIVATA: Rilevata maestranza non idonea ex D.Lgs. 81/08.'
                  : '✅ Tutte le maestranze e ditte esterne risultano regolarmente abilitate.',
                next ? 'error' : 'success'
              );
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              isSimulazioneBloccoSicurezzaGL
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isSimulazioneBloccoSicurezzaGL ? '🔓 Ripristina Conformità Cantiere' : '🚨 Simula Blocco Sicurezza Maestranze'}
          </button>
        </div>
      </div>

      {/* Frame wrapper for simulated viewport */}
      <div className={`transition-all duration-300 ${
        viewportSimulationGL === '360px'
          ? 'max-w-[360px] mx-auto border-4 border-slate-800 dark:border-slate-700 rounded-[32px] p-2.5 shadow-2xl bg-slate-50 dark:bg-slate-950 ring-8 ring-slate-900/40 my-2'
          : viewportSimulationGL === '390px'
          ? 'max-w-[390px] mx-auto border-4 border-slate-800 dark:border-slate-700 rounded-[32px] p-2.5 shadow-2xl bg-slate-50 dark:bg-slate-950 ring-8 ring-slate-900/40 my-2'
          : 'w-full'
      }`}>
        {/* Device speaker for 360/390 */}
        {(viewportSimulationGL === '360px' || viewportSimulationGL === '390px') && (
          <div className="w-16 h-1 bg-slate-400 dark:bg-slate-700 rounded-full mx-auto mb-3 opacity-60" />
        )}

        {/* Mobile Tab Switcher (Visible on small screens / mobile) */}
        <div className="lg:hidden flex items-center gap-2 mb-4 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('elenco')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'elenco'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>📋 Elenco Verbali</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-bold">
              {filteredGiornali.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('dettaglio')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'dettaglio'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>📄 Dettaglio Scheda</span>
            {selectedGiornale && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-bold truncate max-w-[80px]">
                {selectedGiornale.numeroVerbale}
              </span>
            )}
          </button>
        </div>

        {/* Main Grid Layout: List Left, Detail Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filter & List */}
          <div className={`lg:col-span-4 space-y-4 ${mobileTab === 'elenco' ? 'block' : 'hidden lg:block'}`}>
            {/* Filters Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Filtra Cantiere
                </label>
                <select
                  value={selectedCantiereId}
                  onChange={(e) => setSelectedCantiereId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="tutti">Tutti i Cantieri Attivi</option>
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca verbale, lavorazione..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* List Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredGiornali.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-xs border border-slate-200">
                  Nessun verbale giornaliero trovato con i filtri correnti.
                </div>
              ) : (
                filteredGiornali.map((g) => {
                  const isSelected = selectedGiornale?.id === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        setSelectedGiornale(g);
                        setMobileTab('dettaglio');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-amber-500 shadow-lg ring-2 ring-amber-500/20'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {g.numeroVerbale}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(g.data).toLocaleDateString('it-IT')}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {g.cantiereTitolo}
                      </h4>

                      <div className="mt-2 text-[11px] line-clamp-2 text-slate-400">
                        {g.lavorazioniEseguite}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/20 flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 uppercase font-semibold">
                          <CloudSun className="w-3 h-3 text-amber-400" /> {g.meteo.condizione}
                        </span>

                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            g.statoApprovazioneDL === 'approvato_dl'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {g.statoApprovazioneDL === 'approvato_dl' ? '✔️ Approvato DL' : '⏳ In attesa DL'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed View */}
          <div className={`lg:col-span-8 ${mobileTab === 'dettaglio' ? 'block' : 'hidden lg:block'}`}>
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-3">
              <button
                type="button"
                onClick={() => setMobileTab('elenco')}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <span>← Torna all'Elenco Verbali</span>
              </button>
            </div>
          {selectedGiornale ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>VERBALE GIORNALIERO: {selectedGiornale.numeroVerbale}</span>
                    <span>·</span>
                    <span>{new Date(selectedGiornale.data).toLocaleDateString('it-IT')}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">{selectedGiornale.cantiereTitolo}</h2>
                  <p className="text-xs text-slate-600">DL: <strong>{selectedGiornale.direttoreLavoriNome}</strong></p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedGiornale.statoApprovazioneDL !== 'approvato_dl' && (
                    isSimulazioneBloccoSicurezzaGL ? (
                      <button
                        type="button"
                        onClick={() => showToast('🚨 FIRMA BLOCCATA: Rilevata maestranza non idonea ex D.Lgs. 81/08. Risolvere l\'anomalia prima dell\'approvazione del DL.', 'error')}
                        className="px-3.5 py-2 bg-rose-700/90 hover:bg-rose-800 text-rose-100 border border-rose-500 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow cursor-not-allowed"
                        title="Firma bloccata per non conformità sicurezza"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-300" /> Firma DL Bloccata (Sicurezza)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveDL(selectedGiornale.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approva DL
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPrintModalGiornale(selectedGiornale)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-lg flex items-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Stampa Verbale DL
                  </button>
                </div>
              </div>

              {/* Banner Anomalia Sicurezza Cantiere D.Lgs. 81/08 */}
              {isSimulazioneBloccoSicurezzaGL && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-950 space-y-1.5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-rose-600">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>🚨 NON CONFORMITÀ D.LGS. 81/08 RILEVATA IN CANTIERE</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                      Firma DL Sospesa
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-900">
                    <strong>Attenzione Direttore dei Lavori (DL):</strong> Il personale o subappalto presente in cantiere presenta irregolarità documentali (DURC non valido ex Art. 90 o visita medica scaduta ex Art. 41). L'approvazione formale del verbale è <strong>interdetta</strong> fino alla regolarizzazione o sgombero del personale non idoneo.
                  </p>
                </div>
              )}

              {/* Status & Meteo Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                {/* Meteo */}
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                    METEO & AGIBILITÀ CANTIERE
                  </span>
                  <div className="text-sm font-bold uppercase text-slate-100 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>{selectedGiornale.meteo.condizione}</span>
                    <span className="text-xs font-mono text-slate-400">
                      ({selectedGiornale.meteo.temperaturaMin}°C/{selectedGiornale.meteo.temperaturaMax}°C)
                    </span>
                  </div>
                  {selectedGiornale.meteo.impraticabilitaCantiere && (
                    <span className="inline-block mt-1 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      ⚠️ CANTIERE IMPRATICABILE PER MALTEMPO
                    </span>
                  )}
                </div>

                {/* Maestranze Summary */}
                <div className="border-r border-slate-800 px-2">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
                    MAESTRANZE & SUBAPPALTI
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-100">
                    {selectedGiornale.maestranze.filter((m) => m.presente).length} Operatori Presenti
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Totale ore-uomo: {selectedGiornale.maestranze.reduce((sum, m) => sum + (m.presente ? m.oreSvolte : 0), 0)} h
                  </div>
                </div>

                {/* Progress */}
                <div className="pl-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    AVANZAMENTO OPERATIVO FASE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-emerald-300 font-mono">
                      {selectedGiornale.avanzamentoPercentuale}%
                    </span>
                    <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${selectedGiornale.avanzamentoPercentuale}%` }}
                      />
                    </div>
                  </div>
                  {selectedGiornale.quantitaPosata && (
                    <div className="text-[11px] text-slate-300 mt-1 truncate">{selectedGiornale.quantitaPosata}</div>
                  )}
                </div>
              </div>

              {/* Lavorazioni Eseguite */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                  LAVORAZIONI ESEGUITE NEL GIORNO
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 font-medium">
                  {selectedGiornale.lavorazioniEseguite}
                </div>
              </div>

              {/* Maestranze Table */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                  MAESTRANZE E PERSONALE OPERATIVO IN CANTIERE
                </h3>
                <table className="w-full text-left border border-slate-200 rounded-lg text-xs overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2.5">Operatore</th>
                      <th className="p-2.5">Ruolo</th>
                      <th className="p-2.5">Impresa / Subappalto</th>
                      <th className="p-2.5 text-right">Ore Svolte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedGiornale.maestranze.map((m, idx) => {
                      const isNonConforme = isSimulazioneBloccoSicurezzaGL && (idx === 1 || m.ditta.toLowerCase().includes('subappalt'));
                      return (
                        <tr key={idx} className={isNonConforme ? 'bg-rose-50/80' : ''}>
                          <td className="p-2.5 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{m.nome}</span>
                              {isNonConforme && (
                                <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                                  <ShieldAlert className="w-3 h-3" /> DURC Non Valido (D.Lgs. 81/08)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-600">{m.ruolo}</td>
                          <td className="p-2.5 font-medium text-slate-700">{m.ditta}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{m.oreSvolte} h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Attrezzature & Imprevisti Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attrezzature */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                    MACCHINARI & ATTREZZATURE
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                    {selectedGiornale.attrezzature.map((a, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <div className="font-bold text-slate-900">{a.nome}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{a.matricolaTarga || 'N/A'}</div>
                        </div>
                        <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {a.oreUtilizzo} h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Imprevisti */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                    IMPREVISTI & FERMI CANTIERE
                  </h3>
                  {selectedGiornale.imprevisti.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-medium">
                      ✔️ Nessun fermo cantiere o imprevisto riscontrato oggi.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedGiornale.imprevisti.map((imp, idx) => (
                        <div key={idx} className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950">
                          <div className="font-bold flex justify-between">
                            <span>[{imp.causa.toUpperCase()}] Ora {imp.oraRiscontro}</span>
                            <span className="font-mono text-red-700">-{imp.oreFermo} h</span>
                          </div>
                          <p className="mt-0.5">{imp.descrizione}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Galleria Foto Cantiere */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" />
                    GALLERIA FOTOGRAFICA DI GIORNATA ({selectedGiornale.fotoGalleria.length} FOTO)
                  </h3>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {selectedGiornale.fotoGalleria.map((foto) => (
                    <div
                      key={foto.id}
                      onClick={() => setLightboxFoto(foto)}
                      className="group relative border border-slate-200 rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                    >
                      <img src={foto.url} alt={foto.didascalia} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-2 text-[10px] bg-white">
                        <div className="font-bold text-slate-900 truncate">{foto.didascalia}</div>
                        <div className="text-slate-500 font-mono mt-0.5">{foto.oraScatto} · {foto.categoria}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload Foto Form */}
                <form onSubmit={handleAddFotoToSelected} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    ➕ Aggiungi Foto Scattata in Cantiere
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Didascalia (es. Posa tubo RK15)"
                      value={newFotoDidascalia}
                      onChange={(e) => setNewFotoDidascalia(e.target.value)}
                      required
                      className="bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                    <select
                      value={newFotoCategoria}
                      onChange={(e) => setNewFotoCategoria(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    >
                      <option value="impianti">Impianti Elettrici</option>
                      <option value="strutture">Strutture & Opere</option>
                      <option value="sicurezza">Sicurezza & DPI</option>
                      <option value="collaudo">Collaudo & Prove</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> Aggiungi alla Galleria
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
              Seleziona un verbale dalla lista a sinistra per visualizzare i dettagli completi del Giornale dei Lavori.
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modal Lightbox Foto */}
      {lightboxFoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setLightboxFoto(null)}
              className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxFoto.url} alt={lightboxFoto.didascalia} className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="text-sm font-bold text-amber-400">{lightboxFoto.didascalia}</div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Ora Scatto: {lightboxFoto.oraScatto} · Categoria: {lightboxFoto.categoria.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuovo Verbale Giornaliero */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" /> Nuovo Verbale Giornale dei Lavori
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGiornale} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cantiere</label>
                  <select
                    value={formCantiereId}
                    onChange={(e) => setFormCantiereId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titolo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data Esecuzione</label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Direttore dei Lavori (DL)</label>
                <input
                  type="text"
                  value={formDLNome}
                  onChange={(e) => setFormDLNome(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lavorazioni Eseguite nel Giorno</label>
                <textarea
                  rows={3}
                  value={formLavorazioni}
                  onChange={(e) => setFormLavorazioni(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantità Posata</label>
                  <input
                    type="text"
                    value={formQuantita}
                    onChange={(e) => setFormQuantita(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Avanzamento Fase (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formAvanzamento}
                    onChange={(e) => setFormAvanzamento(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Meteo Inputs */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">Condizioni Meteo & Temperature</span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formCondizioneMeteo}
                    onChange={(e) => setFormCondizioneMeteo(e.target.value as any)}
                    className="p-1.5 border border-slate-200 rounded text-xs"
                  >
                    <option value="sereno">Sereno</option>
                    <option value="parzialmente_nuvoloso">Parzialmente Nuvoloso</option>
                    <option value="coperto">Coperto</option>
                    <option value="pioggia">Pioggia</option>
                    <option value="temporale">Temporale</option>
                    <option value="vento_forte">Vento Forte</option>
                    <option value="gelo_neve">Gelo / Neve</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min °C"
                    value={formTempMin}
                    onChange={(e) => setFormTempMin(Number(e.target.value))}
                    className="p-1.5 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Max °C"
                    value={formTempMax}
                    onChange={(e) => setFormTempMax(Number(e.target.value))}
                    className="p-1.5 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note Sicurezza & DPI</label>
                <input
                  type="text"
                  value={formNoteSicurezza}
                  onChange={(e) => setFormNoteSicurezza(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg shadow"
                >
                  Crea Verbale Giornaliero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stampa Verbale DL */}
      {printModalGiornale && (
        <VerbaleGiornalieroPrintModal giornale={printModalGiornale} onClose={() => setPrintModalGiornale(null)} />
      )}
    </div>
  );
};
