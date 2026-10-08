import React, { useState } from 'react';
import {
  X,
  Boxes,
  Plus,
  Trash2,
  MapPin,
  Truck,
  User,
  Package,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaccoZonaVerde, RigaMaterialePacco, TipoImballoPacco } from '../../types';
import { generateUniqueId } from '../../utils/idGenerator';

interface NuovoPaccoZonaVerdeModalProps {
  onClose: () => void;
  onSuccess?: (pacco: PaccoZonaVerde) => void;
}

export const NuovoPaccoZonaVerdeModal: React.FC<NuovoPaccoZonaVerdeModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { cantieri, veicoli, dipendenti, magazzino, currentUser, addPaccoZonaVerde, showToast } =
    useApp();

  // Cantiere Destinazione
  const [selectedCantiereId, setSelectedCantiereId] = useState(cantieri[0]?.id || '');

  // Logistica & Mezzo
  const [selectedFurgoneId, setSelectedFurgoneId] = useState(veicoli[0]?.id || '');
  const [selectedOperatoreId, setSelectedOperatoreId] = useState(dipendenti[0]?.id || '');

  // Dati Imballo
  const [tipoImballo, setTipoImballo] = useState<TipoImballoPacco>('Pallet');
  const [numeroCollo, setNumeroCollo] = useState('Collo 1 di 1');
  const [pesoKg, setPesoKg] = useState<number>(45);
  const [noteDiCarico, setNoteDiCarico] = useState(
    'Preparato in Zona Verde. Maneggiare con cura e ancorare prima del trasporto.'
  );

  // Distinta Articoli nel Pacco
  const [righe, setRighe] = useState<RigaMaterialePacco[]>([
    {
      sku: magazzino[0]?.codiceSku || 'CAV-FG16-4X6',
      descrizione: magazzino[0]?.nome || 'Cavo FG16OR16 4x6 mmq',
      quantita: 50,
      um: magazzino[0]?.unitaMisura || 'm',
    },
  ]);

  // Selezionatore rapido aggiunta articolo da magazzino
  const [tempArticoloId, setTempArticoloId] = useState(magazzino[0]?.id || '');
  const [tempQty, setTempQty] = useState(1);
  const [tempMatricola, setTempMatricola] = useState('');

  const selectedCantiere = cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0];
  const selectedVeicolo = veicoli.find((v) => v.id === selectedFurgoneId);
  const selectedOperatore = dipendenti.find((d) => d.id === selectedOperatoreId);

  const handleAddRigaFromStock = () => {
    const art = magazzino.find((m) => m.id === tempArticoloId);
    if (!art) return;

    setRighe((prev) => [
      ...prev,
      {
        sku: art.codiceSku,
        descrizione: art.nome,
        quantita: Number(tempQty) || 1,
        um: art.unitaMisura || 'pz',
        matricola: tempMatricola.trim() || undefined,
      },
    ]);
    setTempQty(1);
    setTempMatricola('');
  };

  const handleRemoveRiga = (index: number) => {
    setRighe((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (righe.length === 0) {
      showToast('Aggiungi almeno un articolo alla distinta del pacco.', 'warning');
      return;
    }

    if (!selectedCantiere) {
      showToast('Seleziona un cantiere di destinazione.', 'warning');
      return;
    }

    const newPackage = addPaccoZonaVerde({
      cantiereId: selectedCantiere.id,
      codiceCantiere: selectedCantiere.codice,
      cantiereTitolo: selectedCantiere.titolo,
      indirizzoCantiere: selectedCantiere.indirizzo,
      clienteNome: selectedCantiere.clienteNome,
      furgoneAssegnato: selectedVeicolo
        ? `${selectedVeicolo.modello} (${selectedVeicolo.targa})`
        : undefined,
      furgoneId: selectedVeicolo?.id,
      operatoreRitiro: selectedOperatore
        ? `${selectedOperatore.nome} ${selectedOperatore.cognome}`
        : undefined,
      operatoreRitiroId: selectedOperatore?.id,
      dataPreparazione: new Date().toISOString().split('T')[0],
      magazzinierePreparatore: currentUser.name || 'Responsabile Logistica',
      tipoImballo,
      numeroCollo,
      pesoKg,
      noteDiCarico,
      righeMateriale: righe,
      statoTransito: 'PRONTO_ZONA_VERDE',
    });

    showToast(`Pacco ${newPackage.id} preparato e registrato in Zona Verde!`, 'success');
    if (onSuccess) onSuccess(newPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Nuova Spedizione / Pacco "Zona Verde"</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono uppercase">
                  A5 Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Prepara collo per cantiere, genera QR Code e stampa Segnacollo A5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Cantiere Destinazione */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cantiere di Destinazione:</span>
            </label>
            <select
              value={selectedCantiereId}
              onChange={(e) => setSelectedCantiereId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              required
            >
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.codice}] {c.titolo} - {c.citta} ({c.clienteNome})
                </option>
              ))}
            </select>
          </div>

          {/* Assegnazione Logistica: Furgone e Autista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-500" />
                <span>Furgone / Mezzo Designato:</span>
              </label>
              <select
                value={selectedFurgoneId}
                onChange={(e) => setSelectedFurgoneId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {veicoli.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.modello} ({v.targa}) - {v.autistaAssegnatoNome || 'In sede'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Operatore Ritiro / Capocantiere:</span>
              </label>
              <select
                value={selectedOperatoreId}
                onChange={(e) => setSelectedOperatoreId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {dipendenti.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} {d.cognome} ({d.ruoloAziendale})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dettagli Imballo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo Imballo:
              </label>
              <select
                value={tipoImballo}
                onChange={(e) => setTipoImballo(e.target.value as TipoImballoPacco)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="Pallet">Pallet</option>
                <option value="Bancale Termoretraibile">Bancale Termoretraibile</option>
                <option value="Scatola">Scatola</option>
                <option value="Bobina Cavi">Bobina Cavi</option>
                <option value="Cassa Metallica">Cassa Metallica</option>
                <option value="Collo Sfuso">Collo Sfuso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Collo / Numerazione:
              </label>
              <input
                type="text"
                value={numeroCollo}
                onChange={(e) => setNumeroCollo(e.target.value)}
                placeholder="es. Collo 1 di 2"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso Stimato (kg):
              </label>
              <input
                type="number"
                value={pesoKg}
                onChange={(e) => setPesoKg(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Distinta Articoli */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-500" />
                <span>Distinta Materiali da Includere ({righe.length} articoli)</span>
              </span>
            </div>

            {/* Inserimento Rapido */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <select
                  value={tempArticoloId}
                  onChange={(e) => setTempArticoloId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {magazzino.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.codiceSku}) - Giac: {m.giacenza} {m.unitaMisura}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  value={tempQty}
                  onChange={(e) => setTempQty(Number(e.target.value))}
                  min={1}
                  placeholder="Q.tà"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="text"
                  value={tempMatricola}
                  onChange={(e) => setTempMatricola(e.target.value)}
                  placeholder="Matricola opz."
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="col-span-1">
                <button
                  type="button"
                  onClick={handleAddRigaFromStock}
                  className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center transition-colors"
                  title="Aggiungi alla distinta"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabella Righe */}
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              {righe.map((riga, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {riga.descrizione}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      SKU: {riga.sku} {riga.matricola ? `· Matr: ${riga.matricola}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {riga.quantita} {riga.um}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRiga(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note di Manipolazione */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note di Carico & Avvertenze per Operatore:
            </label>
            <textarea
              value={noteDiCarico}
              onChange={(e) => setNoteDiCarico(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              placeholder="es. Maneggiare con cura quadri cablati. Pallet 1 di 2."
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Genera codice QR formato <code className="font-mono text-emerald-600">VM-PACKAGE:...</code>
            </span>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Annulla
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all active:scale-95 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salva & Prepara in Zona Verde</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
