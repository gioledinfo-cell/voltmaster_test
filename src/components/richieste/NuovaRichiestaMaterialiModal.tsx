import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  Clock,
  Send,
  Warehouse,
  Wrench,
  Search,
  CheckCircle2,
  BellRing,
  Mail,
  Smartphone,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PrioritaRichiesta,
  RigaRichiestaMateriali,
  TipoElementoRichiesto,
} from '../../types/richiestaMateriali';

interface NuovaRichiestaMaterialiModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCantiereId?: string;
}

export const NuovaRichiestaMaterialiModal: React.FC<NuovaRichiestaMaterialiModalProps> = ({
  isOpen,
  onClose,
  preselectedCantiereId,
}) => {
  const { cantieri, magazzino, attrezzature, currentUser, addRichiestaMateriali, showToast } = useApp();

  const [cantiereId, setCantiereId] = useState<string>(
    preselectedCantiereId || cantieri[0]?.id || ''
  );
  const [priorita, setPriorita] = useState<PrioritaRichiesta>('urgente');
  const [dataPrevista, setDataPrevista] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [orarioPreferito, setOrarioPreferito] = useState<string>('Mattina entro le 08:30');
  const [noteCantiere, setNoteCantiere] = useState<string>('');

  // Righe
  const [righe, setRighe] = useState<RigaRichiestaMateriali[]>([
    {
      id: `riga-init-1`,
      tipo: 'materiale',
      articoloId: magazzino[0]?.id || 'MAT-001',
      codice: magazzino[0]?.codiceSku || 'SKU-001',
      descrizione: magazzino[0]?.nome || 'Cavo Elettrico',
      quantitaRichiesta: 50,
      unitaMisura: magazzino[0]?.unitaMisura || 'm',
      quantitaDisponibileMagazzino: magazzino[0]?.giacenza || 100,
    },
  ]);

  // Selettore rapido articolo
  const [tipoNuovo, setTipoNuovo] = useState<TipoElementoRichiesto>('materiale');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (!isOpen) return null;

  const currentCantiere = cantieri.find((c) => c.id === cantiereId) || cantieri[0];

  const handleAddRigaFromMagazzino = (art: typeof magazzino[0]) => {
    const newRiga: RigaRichiestaMateriali = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipo: 'materiale',
      articoloId: art.id,
      codice: art.codiceSku,
      descrizione: art.nome,
      quantitaRichiesta: 10,
      unitaMisura: art.unitaMisura,
      quantitaDisponibileMagazzino: art.giacenza,
      note: `Scaffale: ${art.ubicazioneScaffale}`,
    };
    setRighe((prev) => [...prev, newRiga]);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleAddRigaFromAttrezzatura = (att: typeof attrezzature[0]) => {
    const newRiga: RigaRichiestaMateriali = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipo: 'attrezzatura',
      articoloId: att.id,
      codice: att.codiceUnivoco,
      descrizione: `${att.nome} (${att.marcaModello})`,
      quantitaRichiesta: 1,
      unitaMisura: 'pz',
      quantitaDisponibileMagazzino: att.stato === 'disponibile' ? 1 : 0,
      note: `Matricola: ${att.matricola}`,
    };
    setRighe((prev) => [...prev, newRiga]);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleAddRigaLibera = () => {
    const newRiga: RigaRichiestaMateriali = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipo: 'materiale',
      codice: 'FUORI-LISTINO',
      descrizione: 'Materiale speciale o fuori catalogo',
      quantitaRichiesta: 1,
      unitaMisura: 'pz',
      note: '',
    };
    setRighe((prev) => [...prev, newRiga]);
  };

  const handleRemoveRiga = (id: string) => {
    setRighe((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRigaQty = (id: string, delta: number) => {
    setRighe((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newQty = Math.max(1, r.quantitaRichiesta + delta);
        return { ...r, quantitaRichiesta: newQty };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCantiere) {
      showToast('Seleziona un cantiere valido', 'error');
      return;
    }

    if (righe.length === 0) {
      showToast('Aggiungi almeno un articolo o attrezzatura alla richiesta', 'error');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    addRichiestaMateriali({
      dataRichiesta: nowStr,
      cantiereId: currentCantiere.id,
      cantiereTitolo: currentCantiere.titolo,
      clienteNome: currentCantiere.clienteNome,
      indirizzoConsegna: `${currentCantiere.indirizzo}, ${currentCantiere.citta}`,
      richiedenteId: currentUser.id,
      richiedenteNome: currentUser.name,
      richiedenteRuolo:
        currentUser.reparto === 'capocantiere'
          ? 'Capocantiere Elettrico'
          : currentUser.reparto === 'operaio'
          ? 'Operaio Specializzato'
          : 'Tecnico di Cantiere',
      richiedenteTelefono: currentUser.phone || '+39 348 1234567',
      priorita,
      dataPrevistaConsegna: dataPrevista,
      orarioPreferito,
      stato: 'inviata',
      noteCantiere,
      righe,
    });

    onClose();
  };

  const filteredMateriali = magazzino.filter(
    (m) =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codiceSku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttrezzature = attrezzature.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.codiceUnivoco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.marcaModello.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-bold shrink-0">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Campo ➔ Magazzino Live
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Notifica push e invio email istantanei
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Nuova Richiesta Materiali & Attrezzature Cantiere
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Sezione Cantiere e Priorità */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cantiere */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Cantiere di Destinazione:</span>
              </label>
              <select
                value={cantiereId}
                onChange={(e) => setCantiereId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice} - {c.titolo} ({c.citta})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentCantiere?.clienteNome}</span>
                <br />
                Indirizzo: <span className="text-slate-600 dark:text-slate-400">{currentCantiere?.indirizzo}, {currentCantiere?.citta}</span>
              </div>
            </div>

            {/* Priorità */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Livello di Urgenza:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorita('normale')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    priorita === 'normale'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  🟢 Normale
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">2-3 giorni</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPriorita('urgente')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    priorita === 'urgente'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  🟡 Urgente
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Entro 24 ore</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPriorita('bloccante_fermo_cantiere')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    priorita === 'bloccante_fermo_cantiere'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-600 text-rose-700 dark:text-rose-300 ring-2 ring-rose-600/30 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  🚨 FERMO CANTIERE
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">Immediato</div>
                </button>
              </div>
            </div>
          </div>

          {/* Tempi Consegna Desiderati */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Consegna Desiderata:
              </label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fascia Oraria / Reperibilità:
              </label>
              <input
                type="text"
                value={orarioPreferito}
                onChange={(e) => setOrarioPreferito(e.target.value)}
                placeholder="es. Mattina presto prima delle 08:30"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Articoli & Attrezzature Richieste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Distinta Materiali & Attrezzature ({righe.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTipoNuovo('materiale');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>+ Da Magazzino</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTipoNuovo('attrezzatura');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>+ Attrezzatura</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRigaLibera}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
                  title="Inserisci voce libera non a listino"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Voce Libera</span>
                </button>
              </div>
            </div>

            {/* Ricerca e Aggiunta a tendina / modale rapido */}
            {isSearchOpen && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    {tipoNuovo === 'materiale' ? <Warehouse className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                    <span>Seleziona {tipoNuovo === 'materiale' ? 'Materiale da Giacenza' : 'Strumento / Attrezzatura'}:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    Chiudi ✕
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Cerca per nome, codice o matricola...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tipoNuovo === 'materiale' ? (
                    filteredMateriali.length > 0 ? (
                      filteredMateriali.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleAddRigaFromMagazzino(m)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-850 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{m.nome}</div>
                            <div className="text-[10px] text-slate-500">
                              SKU: <span className="font-mono">{m.codiceSku}</span> · Ubicazione: {m.ubicazioneScaffale}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                m.giacenza > m.scortaMinima
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              Giacenza: {m.giacenza} {m.unitaMisura}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 p-2 text-center">Nessun articolo trovato</div>
                    )
                  ) : filteredAttrezzature.length > 0 ? (
                    filteredAttrezzature.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => handleAddRigaFromAttrezzatura(a)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-850 hover:bg-cyan-100/60 dark:hover:bg-cyan-900/30 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{a.nome}</div>
                          <div className="text-[10px] text-slate-500">
                            Modello: {a.marcaModello} · Matr: <span className="font-mono">{a.matricola}</span>
                          </div>
                        </div>
                        <div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.stato === 'disponibile'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {a.stato.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 p-2 text-center">Nessuna attrezzatura trovata</div>
                  )}
                </div>
              </div>
            )}

            {/* Tabella / Lista Righe */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {righe.map((r, index) => (
                <div key={r.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                            r.tipo === 'materiale'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                          }`}
                        >
                          {r.tipo}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {r.descrizione}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>Cod: <span className="font-mono">{r.codice}</span></span>
                        {r.quantitaDisponibileMagazzino !== undefined && (
                          <span className={r.quantitaDisponibileMagazzino >= r.quantitaRichiesta ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                            Giacenza attuale: {r.quantitaDisponibileMagazzino} {r.unitaMisura}
                          </span>
                        )}
                      </div>
                      {r.note && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">{r.note}</div>
                      )}
                    </div>
                  </div>

                  {/* Quantità stepper */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateRigaQty(r.id, -1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={r.quantitaRichiesta}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setRighe((prev) =>
                            prev.map((item) => (item.id === r.id ? { ...item, quantitaRichiesta: val } : item))
                          );
                        }}
                        className="w-14 text-center py-1 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateRigaQty(r.id, 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 w-10">
                      {r.unitaMisura}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveRiga(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Rimuovi voce"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note Operative Cantiere */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Note & Istruzioni per il Magazziniere:
            </label>
            <textarea
              rows={2}
              value={noteCantiere}
              onChange={(e) => setNoteCantiere(e.target.value)}
              placeholder="es. Scarico previsto con muletto/sponda idraulica, chiamare il capocantiere 15 min prima dell'arrivo..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Informazione Notifica Push & Email Automatica */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <BellRing className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-100">
                Automazione Magazzino Istantanea:
              </strong>{' '}
              All'invio della richiesta, il sistema invia in tempo reale una{' '}
              <strong className="text-amber-600 dark:text-amber-400">notifica push</strong> e una{' '}
              <strong className="text-amber-600 dark:text-amber-400">email prioritaria</strong> a{' '}
              <code className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                magazzino@voltmaster.it
              </code>{' '}
              con il riepilogo delle voci e l'ubicazione a scaffale, abilitando la predisposizione del DDT di trasporto.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Annulla
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Invia Richiesta al Magazzino (Push + Email)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
