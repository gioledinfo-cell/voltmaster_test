import React, { useState } from 'react';
import {
  OrdineInterno,
  TipoOrdine,
  PrioritaOrdine,
  TipologiaRigaOrdine,
  RigaOrdine,
  RipartizioneCantiereRiga,
  AllegatoOrdine,
  Cantiere,
  Cliente,
} from '../../types';
import { FornitoreAnagrafica } from '../../data/mockOrdini';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  MapPin,
  AlertTriangle,
  Upload,
  FileText,
  Package,
  Wrench,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';

interface OrdineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ordine: Omit<OrdineInterno, 'id' | 'numero' | 'storicoStati' | 'creatoDa'>) => void;
  initialType?: TipoOrdine;
  editOrder?: OrdineInterno | null;
}

export const OrdineFormModal: React.FC<OrdineFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'fornitore',
  editOrder = null,
}) => {
  const { cantieri, clienti, fornitori, magazzino, attrezzature, veicoli, showToast } = useApp();

  const [tipo, setTipo] = useState<TipoOrdine>(editOrder ? editOrder.tipo : initialType);
  const [destinatarioId, setDestinatarioId] = useState<string>(() => {
    if (editOrder) return editOrder.destinatarioId;
    return initialType === 'fornitore' ? (fornitori[0]?.id || '') : (clienti[0]?.id || '');
  });

  const [cantiereId, setCantiereId] = useState<string>(
    editOrder ? editOrder.cantiereRiferimentoId : (cantieri[0]?.id || 'cnt-deposito')
  );

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [dataOrdine, setDataOrdine] = useState<string>(editOrder ? editOrder.dataOrdine : today);
  const [dataConsegna, setDataConsegna] = useState<string>(editOrder ? editOrder.dataConsegnaPrevista : nextWeek);
  const [priorita, setPriorita] = useState<PrioritaOrdine>(editOrder ? editOrder.priorita : 'media');
  const [noteGenerali, setNoteGenerali] = useState<string>(editOrder ? editOrder.noteGenerali || '' : '');

  // Righe ordine
  const [righe, setRighe] = useState<RigaOrdine[]>(() => {
    if (editOrder && editOrder.righe.length > 0) return editOrder.righe;
    return [
      {
        id: `r-${Date.now()}-1`,
        tipologia: 'materiale',
        codice: magazzino[0]?.codiceSku || 'CAV-FG16-5G16',
        descrizione: magazzino[0]?.nome || 'Cavo FG16OR12 5G16 mm² CPR Cca-s1b,d1,a1',
        quantitaTotale: 100,
        unitaMisura: magazzino[0]?.unitaMisura || 'm',
        prezzoUnitario: magazzino[0]?.prezzoUnitarioAcquisto || 9.4,
        subtotale: 940,
        note: '',
        ripartizioniCantieri: [],
      },
    ];
  });

  // Allegati simulati
  const [allegati, setAllegati] = useState<AllegatoOrdine[]>(editOrder ? editOrder.allegati : []);
  const [newAllegatoNome, setNewAllegatoNome] = useState('');
  const [newAllegatoTipo, setNewAllegatoTipo] = useState<AllegatoOrdine['tipo']>('preventivo');

  // Multi-Cantiere Split Sub-Editor State
  const [editingRowForSplit, setEditingRowForSplit] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sync recipient default when type changes
  const handleTypeChange = (newTipo: TipoOrdine) => {
    setTipo(newTipo);
    if (newTipo === 'fornitore') {
      setDestinatarioId(fornitori[0]?.id || '');
    } else {
      setDestinatarioId(clienti[0]?.id || '');
    }
  };

  // Get recipient info
  const selectedFornitore = fornitori.find((f) => f.id === destinatarioId);
  const selectedCliente = clienti.find((c) => c.id === destinatarioId);
  const selectedCantiereObj = cantieri.find((c) => c.id === cantiereId);
  const cantiereNome =
    cantiereId === 'cnt-deposito'
      ? 'Deposito Centrale Magazzino & Logistica VoltMaster'
      : selectedCantiereObj?.titolo || 'Cantiere Principale';

  // Add line
  const handleAddRow = () => {
    const newId = `r-${Date.now()}-${righe.length + 1}`;
    setRighe((prev) => [
      ...prev,
      {
        id: newId,
        tipologia: 'materiale',
        codice: '',
        descrizione: '',
        quantitaTotale: 1,
        unitaMisura: 'pz',
        prezzoUnitario: 0,
        subtotale: 0,
        note: '',
        ripartizioniCantieri: [],
      },
    ]);
  };

  // Update line
  const handleUpdateRow = (id: string, updates: Partial<RigaOrdine>) => {
    setRighe((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...updates };
        if (updates.quantitaTotale !== undefined || updates.prezzoUnitario !== undefined) {
          const q = updates.quantitaTotale !== undefined ? updates.quantitaTotale : merged.quantitaTotale;
          const p = updates.prezzoUnitario !== undefined ? updates.prezzoUnitario : merged.prezzoUnitario || 0;
          merged.subtotale = q * p;
        }
        return merged;
      })
    );
  };

  // Quick fill from warehouse/tools/fleet
  const handleQuickFill = (rowId: string, itemType: TipologiaRigaOrdine, catalogItemId: string) => {
    if (itemType === 'materiale') {
      const mat = magazzino.find((m) => m.id === catalogItemId);
      if (mat) {
        handleUpdateRow(rowId, {
          tipologia: 'materiale',
          codice: mat.codiceSku,
          descrizione: mat.nome,
          unitaMisura: mat.unitaMisura,
          prezzoUnitario: tipo === 'fornitore' ? mat.prezzoUnitarioAcquisto : mat.prezzoListinoVendita,
        });
      }
    } else if (itemType === 'attrezzatura') {
      const att = attrezzature.find((a) => a.id === catalogItemId);
      if (att) {
        handleUpdateRow(rowId, {
          tipologia: 'attrezzatura',
          codice: att.codiceUnivoco,
          descrizione: `${att.nome} (${att.marcaModello}) - Matr. ${att.matricola}`,
          unitaMisura: 'pz',
          prezzoUnitario: tipo === 'fornitore' ? 0 : 150,
        });
      }
    } else if (itemType === 'mezzo') {
      const vec = veicoli.find((v) => v.id === catalogItemId);
      if (vec) {
        handleUpdateRow(rowId, {
          tipologia: 'mezzo',
          codice: vec.targa,
          descrizione: `Noleggio/Impiego ${vec.modello} (Targa ${vec.targa})`,
          unitaMisura: 'gg',
          prezzoUnitario: tipo === 'fornitore' ? 0 : 250,
        });
      }
    }
  };

  // Remove line
  const handleRemoveRow = (id: string) => {
    if (righe.length === 1) {
      showToast('L’ordine deve contenere almeno una riga.', 'warning');
      return;
    }
    setRighe((prev) => prev.filter((r) => r.id !== id));
  };

  // Multi-Cantiere Split Functions
  const handleAddSplitToRow = (rowId: string, targetCantiereId: string, qta: number, note?: string) => {
    const targetC = cantieri.find((c) => c.id === targetCantiereId);
    const targetNome =
      targetCantiereId === 'cnt-deposito'
        ? 'Deposito Centrale Magazzino'
        : targetC?.titolo || 'Cantiere';

    setRighe((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentSplits = r.ripartizioniCantieri || [];
        const existingIdx = currentSplits.findIndex((s) => s.cantiereId === targetCantiereId);
        let updatedSplits: RipartizioneCantiereRiga[];

        if (existingIdx >= 0) {
          updatedSplits = currentSplits.map((s, idx) =>
            idx === existingIdx ? { ...s, quantita: qta, note: note || s.note } : s
          );
        } else {
          updatedSplits = [
            ...currentSplits,
            { cantiereId: targetCantiereId, cantiereNome: targetNome, quantita: qta, note },
          ];
        }
        return { ...r, ripartizioniCantieri: updatedSplits };
      })
    );
  };

  const handleRemoveSplitFromRow = (rowId: string, splitCantiereId: string) => {
    setRighe((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          ripartizioniCantieri: (r.ripartizioniCantieri || []).filter(
            (s) => s.cantiereId !== splitCantiereId
          ),
        };
      })
    );
  };

  // Add attachment
  const handleAddAllegato = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllegatoNome.trim()) return;
    const newAll: AllegatoOrdine = {
      id: `all-${Date.now()}`,
      nomeFile: newAllegatoNome.endsWith('.pdf') ? newAllegatoNome : `${newAllegatoNome}.pdf`,
      tipo: newAllegatoTipo,
      dimensioneKb: Math.floor(Math.random() * 600 + 150),
      dataCaricamento: today,
      urlSimulato: `/docs/${newAllegatoNome.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    };
    setAllegati((prev) => [...prev, newAll]);
    setNewAllegatoNome('');
    showToast(`Allegato ${newAll.nomeFile} aggiunto alla bozza.`);
  };

  const handleRemoveAllegato = (id: string) => {
    setAllegati((prev) => prev.filter((a) => a.id !== id));
  };

  // Calcolo totale
  const totaleImporto = righe.reduce((sum, r) => sum + (r.subtotale || 0), 0);

  const handleSubmit = (saveAsSent: boolean = false) => {
    // Validazione
    if (!destinatarioId) {
      showToast('Selezionare un destinatario valido.', 'error');
      return;
    }

    for (let i = 0; i < righe.length; i++) {
      const r = righe[i];
      if (!r.descrizione.trim()) {
        showToast(`Descrizione mancante per la riga #${i + 1}.`, 'error');
        return;
      }
      if (r.quantitaTotale <= 0) {
        showToast(`La quantità della riga #${i + 1} deve essere maggiore di zero.`, 'error');
        return;
      }
    }

    const destName =
      tipo === 'fornitore'
        ? selectedFornitore?.ragioneSociale || 'Fornitore'
        : selectedCliente?.ragioneSociale || 'Cliente';

    const destEmail = tipo === 'fornitore' ? selectedFornitore?.email : selectedCliente?.email;
    const destTel = tipo === 'fornitore' ? selectedFornitore?.telefono : selectedCliente?.telefono;
    const destIndirizzo =
      tipo === 'fornitore'
        ? `${selectedFornitore?.indirizzo}, ${selectedFornitore?.citta}`
        : `${selectedCliente?.indirizzo}, ${selectedCliente?.citta}`;

    onSave({
      tipo,
      destinatarioId,
      destinatarioRagioneSociale: destName,
      destinatarioEmail: destEmail,
      destinatarioTelefono: destTel,
      destinatarioIndirizzo: destIndirizzo,
      cantiereRiferimentoId: cantiereId,
      cantiereRiferimentoNome: cantiereNome,
      dataOrdine,
      dataConsegnaPrevista: dataConsegna,
      priorita,
      stato: saveAsSent ? 'inviato' : 'bozza',
      noteGenerali,
      righe,
      allegati,
      importoTotale: totaleImporto,
      valuta: 'EUR',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${tipo === 'fornitore' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {editOrder ? `Modifica Ordine ${editOrder.numero}` : 'Crea Nuovo Ordine Interno'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tipo === 'fornitore'
                  ? 'Approvvigionamento materiali, macchinari e attrezzature da fornitori'
                  : 'Fornitura, cessione materiali o noleggio mezzi per clienti committenti'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Section 1: Tipo & Destinatario Selector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  1. Tipologia Ordine <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('fornitore')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      tipo === 'fornitore'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Verso FORNITORE (Approvvigionamento)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('cliente')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      tipo === 'cliente'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Verso CLIENTE (Fornitura / Noleggio)
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Priorità
                </label>
                <div className="flex gap-1.5">
                  {(['bassa', 'media', 'alta', 'urgente'] as PrioritaOrdine[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorita(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                        priorita === p
                          ? p === 'urgente'
                            ? 'bg-rose-500 text-white border-rose-400'
                            : p === 'alta'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-sky-600 text-white border-sky-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recipient select + Destination Site + Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {/* Select Destinatario */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {tipo === 'fornitore' ? 'Seleziona Fornitore' : 'Seleziona Cliente'} <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                {tipo === 'fornitore' ? (
                  <select
                    value={destinatarioId}
                    onChange={(e) => setDestinatarioId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.ragioneSociale} ({f.citta}) - Consegna media: {f.tempoMedioConsegnaGiorni}gg
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={destinatarioId}
                    onChange={(e) => setDestinatarioId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {clienti.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ragioneSociale} ({c.referente}) - {c.citta}
                      </option>
                    ))}
                  </select>
                )}
                {/* Info preview */}
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {tipo === 'fornitore' && selectedFornitore ? (
                    <span>Email: {selectedFornitore.email} · Tel: {selectedFornitore.telefono}</span>
                  ) : selectedCliente ? (
                    <span>Email: {selectedCliente.email} · Tel: {selectedCliente.telefono}</span>
                  ) : null}
                </div>
              </div>

              {/* Data Ordine */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data Ordine
                </label>
                <input
                  type="date"
                  value={dataOrdine}
                  onChange={(e) => setDataOrdine(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Data Consegna Prevista */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data Consegna Prevista
                </label>
                <input
                  type="date"
                  value={dataConsegna}
                  onChange={(e) => setDataConsegna(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>

            {/* Destination site */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                Cantiere o Deposito Principale di Consegna / Scarico
              </label>
              <select
                value={cantiereId}
                onChange={(e) => setCantiereId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="cnt-deposito">
                  🏢 Deposito Centrale Magazzino & Logistica VoltMaster (Milano - Via dell'Elettricità)
                </option>
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏗️ {c.codice} - {c.titolo} ({c.citta})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Nota: Sarà possibile ripartire parzialmente ciascuna riga su più cantieri diversi tramite il pulsante "Suddividi su Cantieri" in tabella.
              </p>
            </div>
          </div>

          {/* Section 2: Righe Ordine Dinamiche */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  2. Righe dell'Ordine ({righe.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aggiungi materiali, attrezzature CEI 64-8 o veicoli/piattaforme aeree.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Riga</span>
              </button>
            </div>

            {/* Dynamic Lines Table */}
            <div className="space-y-3">
              {righe.map((riga, index) => {
                const totalSplitQty = (riga.ripartizioniCantieri || []).reduce((sum, s) => sum + s.quantita, 0);
                const isSplitMismatch = (riga.ripartizioniCantieri || []).length > 0 && totalSplitQty !== riga.quantitaTotale;

                return (
                  <div
                    key={riga.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 relative group shadow-sm"
                  >
                    {/* Top Row bar: Tipologia & Quick Select */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">#{index + 1}</span>
                        {/* Tipologia */}
                        <div className="flex gap-1">
                          {(['materiale', 'attrezzatura', 'mezzo'] as TipologiaRigaOrdine[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleUpdateRow(riga.id, { tipologia: t })}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                                riga.tipologia === t
                                  ? 'bg-slate-200 dark:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                  : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Quick fill dropdown from inventory */}
                        <div className="text-xs flex items-center gap-1.5 ml-2">
                          <span className="text-[11px] text-slate-500">Compila da catalogo:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleQuickFill(riga.id, riga.tipologia, e.target.value);
                            }}
                            defaultValue=""
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="">-- Seleziona voce esistente --</option>
                            {riga.tipologia === 'materiale' &&
                              magazzino.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.codiceSku} - {m.nome}
                                </option>
                              ))}
                            {riga.tipologia === 'attrezzatura' &&
                              attrezzature.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.codiceUnivoco} - {a.nome}
                                </option>
                              ))}
                            {riga.tipologia === 'mezzo' &&
                              veicoli.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.targa} - {v.modello}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Delete row button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(riga.id)}
                        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition-colors"
                        title="Elimina riga"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Codice */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Codice SKU / Targa / Matricola
                        </label>
                        <input
                          type="text"
                          value={riga.codice}
                          onChange={(e) => handleUpdateRow(riga.id, { codice: e.target.value })}
                          placeholder="es. CAV-5G16 o AS-9942"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Descrizione */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Descrizione Articolo o Servizio <span className="text-rose-500 dark:text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={riga.descrizione}
                          onChange={(e) => handleUpdateRow(riga.id, { descrizione: e.target.value })}
                          placeholder="es. Cavo FG16OR12 5G16 mm² / Noleggio cestello"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                      </div>

                      {/* Quantità */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Quantità Totale
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={riga.quantitaTotale}
                          onChange={(e) => handleUpdateRow(riga.id, { quantitaTotale: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* U.M. */}
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          U.M.
                        </label>
                        <select
                          value={riga.unitaMisura}
                          onChange={(e) => handleUpdateRow(riga.id, { unitaMisura: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 uppercase font-mono focus:outline-none"
                        >
                          <option value="m">m</option>
                          <option value="pz">pz</option>
                          <option value="kit">kit</option>
                          <option value="gg">gg</option>
                          <option value="ore">ore</option>
                          <option value="n.">n.</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>

                      {/* Prezzo unitario */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Prezzo Unit. (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={riga.prezzoUnitario ?? ''}
                          onChange={(e) => handleUpdateRow(riga.id, { prezzoUnitario: parseFloat(e.target.value) || 0 })}
                          placeholder="Opzionale"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Bottom of Row: Note riga + Multi-Cantiere Split Accordion Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-900 text-xs">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={riga.note || ''}
                          onChange={(e) => handleUpdateRow(riga.id, { note: e.target.value })}
                          placeholder="Note specifiche per questa riga (es. bobina da 500m, connettori inclusi...)"
                          className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Subtotale display */}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1.5">Subtotale:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            € {(riga.subtotale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Multi-cantiere allocation trigger */}
                        <button
                          type="button"
                          onClick={() => setEditingRowForSplit(editingRowForSplit === riga.id ? null : riga.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                            (riga.ripartizioniCantieri || []).length > 0
                              ? isSplitMismatch
                                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {(riga.ripartizioniCantieri || []).length > 0
                              ? `Ripartito su ${(riga.ripartizioniCantieri || []).length} cantieri`
                              : 'Suddividi su Cantieri'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-Cantiere Split Sub-Panel for this row */}
                    {editingRowForSplit === riga.id && (
                      <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in shadow-md">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" /> Ripartizione Quantità Parziali per Cantiere
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">Totale Riga: <strong>{riga.quantitaTotale} {riga.unitaMisura}</strong></span>
                            <span>·</span>
                            <span className={isSplitMismatch ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                              Somma Quote: {totalSplitQty} {riga.unitaMisura}
                            </span>
                          </div>
                        </div>

                        {isSplitMismatch && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              Attenzione: La somma delle quote parziali ({totalSplitQty} {riga.unitaMisura}) differisce dalla quantità totale della riga ({riga.quantitaTotale} {riga.unitaMisura}).
                            </span>
                          </div>
                        )}

                        {/* List of current allocations */}
                        <div className="space-y-2">
                          {(riga.ripartizioniCantieri || []).map((rip, ripIdx) => (
                            <div
                              key={ripIdx}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{rip.cantiereNome}</span>
                                {rip.note && <span className="text-[11px] text-slate-500 ml-2 italic">({rip.note})</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {rip.quantita} {riga.unitaMisura}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSplitFromRow(riga.id, rip.cantiereId)}
                                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add new split allocation form */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                          <div className="sm:col-span-6">
                            <select
                              id={`sel-cnt-${riga.id}`}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="cnt-deposito">Deposito Centrale Milano</option>
                              {cantieri.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.codice} - {c.titolo}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              id={`qta-cnt-${riga.id}`}
                              type="number"
                              min="0.1"
                              step="any"
                              placeholder={`Qta (${riga.unitaMisura})`}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <button
                              type="button"
                              onClick={() => {
                                const sel = document.getElementById(`sel-cnt-${riga.id}`) as HTMLSelectElement;
                                const qtaInput = document.getElementById(`qta-cnt-${riga.id}`) as HTMLInputElement;
                                const qta = parseFloat(qtaInput?.value || '0');
                                if (qta <= 0) {
                                  showToast('Inserire una quantità parziale valida per il cantiere.', 'warning');
                                  return;
                                }
                                handleAddSplitToRow(riga.id, sel.value, qta);
                                qtaInput.value = '';
                              }}
                              className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assegna Quota</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total value bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Totale Netto Preventivato ({righe.length} {righe.length === 1 ? 'riga' : 'righe'})
              </span>
              <div className="text-right">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  € {totaleImporto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500">
                  IVA 22% stimata: € {(totaleImporto * 0.22).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Note Generali & Allegati */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Note Generali */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                3. Note Generali & Istruzioni di Consegna
              </label>
              <textarea
                rows={4}
                value={noteGenerali}
                onChange={(e) => setNoteGenerali(e.target.value)}
                placeholder="Es. Consegna con sponda idraulica, avvisare il capocantiere 24h prima, scaricare a pié d’opera..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Allegati */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                4. Allegati (Preventivi, DDT, Foto)
              </label>

              {/* Add attachment form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllegatoNome}
                  onChange={(e) => setNewAllegatoNome(e.target.value)}
                  placeholder="Nome file (es. Preventivo_Fornitore_01)"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                <select
                  value={newAllegatoTipo}
                  onChange={(e) => setNewAllegatoTipo(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="preventivo">Preventivo</option>
                  <option value="ddt">DDT</option>
                  <option value="foto">Foto</option>
                  <option value="fattura">Fattura</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddAllegato}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
                >
                  Allega
                </button>
              </div>

              {/* Attached files list */}
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {allegati.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nessun file allegato al momento.</p>
                ) : (
                  allegati.map((a) => (
                    <div
                      key={a.id}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-800 dark:text-slate-200">{a.nomeFile}</span>
                        <span className="text-[10px] text-slate-500 uppercase">({a.tipo})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllegato(a.id)}
                        className="text-slate-400 hover:text-rose-500 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
          >
            Annulla
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
            >
              Salva come Bozza
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-900/30 active:scale-95"
            >
              <span>Salva ed Invia Subito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
