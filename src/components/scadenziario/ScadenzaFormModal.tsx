import React, { useState } from 'react';
import {
  X,
  Plus,
  Calendar,
  AlertTriangle,
  Building2,
  Users,
  Truck,
  Wrench,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScadenzaItem, CategoriaScadenza } from '../../types/scadenze';

interface ScadenzaFormModalProps {
  onClose: () => void;
  onSave: (item: Omit<ScadenzaItem, 'id'>) => void;
}

export const ScadenzaFormModal: React.FC<ScadenzaFormModalProps> = ({
  onClose,
  onSave,
}) => {
  const { dipendenti, veicoli, attrezzature, cantieri, fornitori } = useApp();

  const [categoria, setCategoria] = useState<CategoriaScadenza>('patentini_sicurezza');
  const [titolo, setTitolo] = useState('');
  const [soggetto, setSoggetto] = useState('');
  const [ruoloORipartizione, setRuoloORipartizione] = useState('');
  const [dataScadenza, setDataScadenza] = useState('');
  const [priorita, setPriorita] = useState<'alta' | 'media' | 'bassa'>('alta');
  const [protocolloONumero, setProtocolloONumero] = useState('');
  const [enteRilascio, setEnteRilascio] = useState('');
  const [costoRinnovoPrevisto, setCostoRinnovoPrevisto] = useState<number>(0);
  const [note, setNote] = useState('');

  // Preset assistiti per velocizzare l'inserimento
  const handleSelectDipendente = (dipId: string) => {
    const dip = dipendenti.find((d) => d.id === dipId);
    if (!dip) return;
    setSoggetto(`${dip.nome} ${dip.cognome}`);
    setRuoloORipartizione(dip.ruoloAziendale);
    if (!titolo) {
      setTitolo(`Rinnovo Abilitazione PES/PAV CEI 11-27 ${dip.nome} ${dip.cognome}`);
    }
  };

  const handleSelectVeicolo = (vecId: string) => {
    const vec = veicoli.find((v) => v.id === vecId);
    if (!vec) return;
    setSoggetto(`${vec.modello} (${vec.targa})`);
    setRuoloORipartizione(`Autista: ${vec.autistaAssegnatoNome || 'Non assegnato'}`);
    if (!titolo) {
      setTitolo(`Revisione Ministeriale MCTC ${vec.modello} - ${vec.targa}`);
    }
  };

  const handleSelectAttrezzatura = (attId: string) => {
    const att = attrezzature.find((a) => a.id === attId);
    if (!att) return;
    setSoggetto(`${att.nome} (Matr. ${att.matricola})`);
    setRuoloORipartizione(att.marcaModello);
    if (!titolo) {
      setTitolo(`Taratura Periodica Laboratorio Accredia ${att.nome}`);
    }
  };

  const handleSelectCantiere = (cntId: string) => {
    const cnt = cantieri.find((c) => c.id === cntId);
    if (!cnt) return;
    setSoggetto(`${cnt.titolo} (${cnt.codice})`);
    setRuoloORipartizione(`Committente: ${cnt.clienteNome}`);
    if (!titolo) {
      setTitolo(`Aggiornamento POS e Notifica ASL ${cnt.titolo}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo || !soggetto || !dataScadenza) return;

    onSave({
      categoria,
      titolo,
      descrizione: note || `${titolo} per ${soggetto}`,
      soggetto,
      ruoloORipartizione,
      dataScadenza,
      priorita,
      protocolloONumero,
      enteRilascio,
      costoRinnovoPrevisto: Number(costoRinnovoPrevisto) || 0,
      note,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Nuova Scadenza di Conformità & Sicurezza
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra un adempimento normativo nello scadenziario a semaforo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* 1. Scelta Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              1. Categoria Adempimento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setCategoria('durc')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  categoria === 'durc'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 mb-1 text-blue-500 dark:text-blue-400" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">DURC</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">120 giorni</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('taratura_cei64')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  categoria === 'taratura_cei64'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4 mb-1 text-amber-500 dark:text-amber-400" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">CEI 64-8</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Taratura annua</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('revisione_veicoli')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  categoria === 'revisione_veicoli'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Truck className="w-4 h-4 mb-1 text-cyan-500 dark:text-cyan-400" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Furgoni</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Revisione / RCA</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('patentini_sicurezza')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  categoria === 'patentini_sicurezza'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 mb-1 text-purple-500 dark:text-purple-400" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Patentini</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">PES/PAV/PLE</div>
              </button>

              <button
                type="button"
                onClick={() => setCategoria('cantieri_sicurezza')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  categoria === 'cantieri_sicurezza'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 mb-1 text-rose-500 dark:text-rose-400" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Cantieri</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">POS & Polizze</div>
              </button>
            </div>
          </div>

          {/* Quick link selectors */}
          {categoria === 'patentini_sicurezza' && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Collega Rapido Dipendente (20 Dipendenti VoltMaster)
              </label>
              <select
                onChange={(e) => handleSelectDipendente(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none shadow-sm"
              >
                <option value="">-- Seleziona dipendente per compilazione rapida --</option>
                {dipendenti.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} {d.cognome} ({d.ruoloAziendale})
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoria === 'revisione_veicoli' && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Collega Rapido Veicolo Aziendale
              </label>
              <select
                onChange={(e) => handleSelectVeicolo(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none shadow-sm"
              >
                <option value="">-- Seleziona veicolo --</option>
                {veicoli.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.modello} - {v.targa} (Autista: {v.autistaAssegnatoNome || 'Nessuno'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoria === 'taratura_cei64' && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Collega Rapido Strumento / Attrezzatura di Misura
              </label>
              <select
                onChange={(e) => handleSelectAttrezzatura(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none shadow-sm"
              >
                <option value="">-- Seleziona strumento --</option>
                {attrezzature.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} (Matr. {a.matricola})
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoria === 'cantieri_sicurezza' && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Collega Rapido Cantiere Attivo
              </label>
              <select
                onChange={(e) => handleSelectCantiere(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none shadow-sm"
              >
                <option value="">-- Seleziona cantiere --</option>
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice} - {c.titolo} ({c.clienteNome})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Core Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Titolo Scadenza *
              </label>
              <input
                type="text"
                placeholder="es. Rinnovo Abilitazione PES/PAV CEI 11-27 Matteo Bianchi"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Soggetto / Risorsa Coinvolta *
                </label>
                <input
                  type="text"
                  placeholder="es. Matteo Bianchi / Iveco Daily FS 829 KR / HT Combi G3"
                  value={soggetto}
                  onChange={(e) => setSoggetto(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ruolo, Modello o Reparto
                </label>
                <input
                  type="text"
                  placeholder="es. Capocantiere / Laboratorio Accredia"
                  value={ruoloORipartizione}
                  onChange={(e) => setRuoloORipartizione(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data di Scadenza *
                </label>
                <input
                  type="date"
                  value={dataScadenza}
                  onChange={(e) => setDataScadenza(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priorità Normativa
                </label>
                <select
                  value={priorita}
                  onChange={(e) => setPriorita(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="alta">Alta (Blocco immediato ex D.Lgs 81/08)</option>
                  <option value="media">Media (Standard di gestione)</option>
                  <option value="bassa">Bassa (Prorogabile / Notifica semplice)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Costo Stimato Rinnovo (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoRinnovoPrevisto}
                  onChange={(e) => setCostoRinnovoPrevisto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Numero Protocollo / Certificato / Targa
                </label>
                <input
                  type="text"
                  placeholder="es. LAT102-2025/11 o INPS_38920194"
                  value={protocolloONumero}
                  onChange={(e) => setProtocolloONumero(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ente di Rilascio / Struttura Accreditata
                </label>
                <input
                  type="text"
                  placeholder="es. Accredia LAT 102 / INPS / Scuola Edile"
                  value={enteRilascio}
                  onChange={(e) => setEnteRilascio(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Note Operative & Prescrizioni
              </label>
              <textarea
                rows={2}
                placeholder="Dettagli sulle modalità di rinnovo, convocazione medico competente o laboratorio..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-none shadow-sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Inserisci nello Scadenziario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
