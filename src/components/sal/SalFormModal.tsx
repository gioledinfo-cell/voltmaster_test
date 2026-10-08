import React, { useState, useEffect, useMemo } from 'react';
import { StatoAvanzamentoLavori, VoceLibrettoSAL } from '../../types/sal';
import { Cantiere, Preventivo, Lavorazione } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Check,
  Building2,
  Calendar,
  Layers,
  Calculator,
  Info,
} from 'lucide-react';

interface SalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantieri: Cantiere[];
  preventivi: Preventivo[];
  lavorazioni: Lavorazione[];
  existingSals: StatoAvanzamentoLavori[];
  onSave: (sal: Omit<StatoAvanzamentoLavori, 'id'>) => void;
  initialCantiereId?: string;
}

export const SalFormModal: React.FC<SalFormModalProps> = ({
  isOpen,
  onClose,
  cantieri,
  preventivi,
  lavorazioni,
  existingSals,
  onSave,
  initialCantiereId,
}) => {
  const [cantiereId, setCantiereId] = useState(initialCantiereId || cantieri[0]?.id || '');
  const [dataEmissione, setDataEmissione] = useState(new Date().toISOString().split('T')[0]);
  const [periodoInizio, setPeriodoInizio] = useState(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [periodoFine, setPeriodoFine] = useState(new Date().toISOString().split('T')[0]);
  const [redattoDa, setRedattoDa] = useState('Ing. Roberto Fontana (PM)');
  const [noteGenerali, setNoteGenerali] = useState('');

  // Selected Cantiere Info
  const cantiereSelezionato = useMemo(() => {
    return cantieri.find((c) => c.id === cantiereId) || cantieri[0];
  }, [cantieri, cantiereId]);

  // Compute existing SAL count for this site to determine next progressive number
  const salsDiQuestoCantiere = useMemo(() => {
    return existingSals.filter((s) => s.cantiereId === cantiereId);
  }, [existingSals, cantiereId]);

  const nextSalNumber = salsDiQuestoCantiere.length + 1;
  const totaleLavoriPrecedenti = useMemo(() => {
    if (salsDiQuestoCantiere.length === 0) return 0;
    // Prende il cumulato dell'ultimo SAL
    const sorted = [...salsDiQuestoCantiere].sort((a, b) => b.numeroSal - a.numeroSal);
    return sorted[0].totaleLavoriCumulati;
  }, [salsDiQuestoCantiere]);

  // Items in the measurement book
  const [voci, setVoci] = useState<VoceLibrettoSAL[]>([
    {
      id: 'v-new-1',
      codiceTariffa: 'EL-01.01',
      descrizione: 'Canalizzazioni metalliche e supporti antisismici',
      unitaMisura: 'm',
      quantitaContrattuale: 300,
      prezzoUnitario: 35,
      importoContrattuale: 10500,
      quantitaPrecedente: 0,
      quantitaPeriodo: 120,
      quantitaTotale: 120,
      percentualeAvanzamento: 40,
      importoPeriodo: 4200,
      importoTotaleCumulato: 4200,
      noteMisure: 'Posa piano terra e corsia tecnica',
    },
    {
      id: 'v-new-2',
      codiceTariffa: 'EL-02.05',
      descrizione: 'Cavi di distribuzione energia FG16OR12',
      unitaMisura: 'm',
      quantitaContrattuale: 800,
      prezzoUnitario: 18,
      importoContrattuale: 14400,
      quantitaPrecedente: 0,
      quantitaPeriodo: 400,
      quantitaTotale: 400,
      percentualeAvanzamento: 50,
      importoPeriodo: 7200,
      importoTotaleCumulato: 7200,
      noteMisure: 'Tiraggio dorsali primarie',
    },
    {
      id: 'v-new-3',
      codiceTariffa: 'EL-03.10',
      descrizione: 'Quadro elettrico secondario BT modulare',
      unitaMisura: 'cad',
      quantitaContrattuale: 2,
      prezzoUnitario: 4500,
      importoContrattuale: 9000,
      quantitaPrecedente: 0,
      quantitaPeriodo: 1,
      quantitaTotale: 1,
      percentualeAvanzamento: 50,
      importoPeriodo: 4500,
      importoTotaleCumulato: 4500,
      noteMisure: 'Montaggio e cablaggio interruttori differenziali',
    },
  ]);

  // Recalculate totals
  const calcoli = useMemo(() => {
    let totContrattuale = 0;
    let totPeriodo = 0;
    let totCumulato = 0;

    for (const v of voci) {
      totContrattuale += v.importoContrattuale;
      totPeriodo += v.importoPeriodo;
      totCumulato += v.importoTotaleCumulato;
    }

    const importoContrattoFinale =
      totContrattuale > 0 ? totContrattuale : cantiereSelezionato?.budgetTotale || 50000;
    const percGlobale =
      importoContrattoFinale > 0 ? (totCumulato / importoContrattoFinale) * 100 : 0;

    return {
      totContrattuale: importoContrattoFinale,
      totPeriodo,
      totCumulato,
      percGlobale,
    };
  }, [voci, cantiereSelezionato]);

  const handleUpdateVoce = (idx: number, field: keyof VoceLibrettoSAL, value: any) => {
    setVoci((prev) => {
      const copy = [...prev];
      const target = { ...copy[idx], [field]: value };

      // Recalculate quantities and amounts
      const qPrec = Number(target.quantitaPrecedente) || 0;
      const qPer = Number(target.quantitaPeriodo) || 0;
      const pu = Number(target.prezzoUnitario) || 0;
      const qContr = Number(target.quantitaContrattuale) || 1;

      target.quantitaTotale = qPrec + qPer;
      target.importoContrattuale = qContr * pu;
      target.importoPeriodo = qPer * pu;
      target.importoTotaleCumulato = target.quantitaTotale * pu;
      target.percentualeAvanzamento = qContr > 0 ? (target.quantitaTotale / qContr) * 100 : 0;

      copy[idx] = target;
      return copy;
    });
  };

  const handleAddVoce = () => {
    const nuova: VoceLibrettoSAL = {
      id: `v-custom-${Date.now()}`,
      codiceTariffa: `EL-0${voci.length + 1}.10`,
      descrizione: 'Nuova voce di computo metrico',
      unitaMisura: 'cad',
      quantitaContrattuale: 1,
      prezzoUnitario: 1000,
      importoContrattuale: 1000,
      quantitaPrecedente: 0,
      quantitaPeriodo: 1,
      quantitaTotale: 1,
      percentualeAvanzamento: 100,
      importoPeriodo: 1000,
      importoTotaleCumulato: 1000,
      noteMisure: 'Esecuzione a regola d’arte',
    };
    setVoci((prev) => [...prev, nuova]);
  };

  const handleRemoveVoce = (idx: number) => {
    setVoci((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantiereSelezionato) return;

    onSave({
      numeroSal: nextSalNumber,
      codiceSal: `SAL n. 0${nextSalNumber}`,
      cantiereId: cantiereSelezionato.id,
      cantiereNome: cantiereSelezionato.titolo,
      committenteNome: cantiereSelezionato.clienteNome,
      dataEmissione,
      periodoInizio,
      periodoFine,
      importoContrattualeTotale: calcoli.totContrattuale,
      totaleLavoriPrecedenti,
      totaleLavoriPeriodo: calcoli.totPeriodo,
      totaleLavoriCumulati: calcoli.totCumulato,
      percentualeAvanzamentoGlobale: calcoli.percGlobale,
      stato: 'bozza',
      voci,
      redattoDa,
      noteGenerali,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Emissione Nuovo Stato Avanzamento Lavori (SAL n. 0{nextSalNumber})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inserimento libretto delle misure e quantificazione lavori maturati a corpo e a misura
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* 1. Dati Intestazione */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Cantiere / Commessa</label>
              <select
                value={cantiereId}
                onChange={(e) => setCantiereId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:ring-1 focus:ring-amber-500 shadow-sm"
              >
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice} - {c.titolo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Committente</label>
              <input
                type="text"
                disabled
                value={cantiereSelezionato?.clienteNome || ''}
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Data Emissione</label>
              <input
                type="date"
                value={dataEmissione}
                onChange={(e) => setDataEmissione(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Periodo Lavori: Dal</label>
              <input
                type="date"
                value={periodoInizio}
                onChange={(e) => setPeriodoInizio(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Periodo Lavori: Al</label>
              <input
                type="date"
                value={periodoFine}
                onChange={(e) => setPeriodoFine(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Redatto Da (Ufficio Tecnico)</label>
              <input
                type="text"
                value={redattoDa}
                onChange={(e) => setRedattoDa(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 shadow-sm"
              />
            </div>
          </div>

          {/* 2. Voci Libretto delle Misure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Voci di Computo & Libretto Misure</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Indica le quantità realizzate nel periodo corrente per calcolare l'importo maturato.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVoce}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Aggiungi Voce</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 px-2.5 w-20">Tariffa</th>
                    <th className="py-2 px-2.5">Descrizione</th>
                    <th className="py-2 px-1.5 w-16 text-center">U.M.</th>
                    <th className="py-2 px-1.5 w-20 text-right">Q.tà Tot</th>
                    <th className="py-2 px-1.5 w-24 text-right">Prezzo Unit.</th>
                    <th className="py-2 px-1.5 w-20 text-right">Q.tà Periodo</th>
                    <th className="py-2 px-2.5 w-28 text-right text-amber-600 dark:text-amber-300">Maturato €</th>
                    <th className="py-2 px-1 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {voci.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={v.codiceTariffa}
                          onChange={(e) => handleUpdateVoce(idx, 'codiceTariffa', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-amber-600 dark:text-amber-400 font-mono font-bold"
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={v.descrizione}
                          onChange={(e) => handleUpdateVoce(idx, 'descrizione', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      <td className="py-2 px-1.5">
                        <select
                          value={v.unitaMisura}
                          onChange={(e) => handleUpdateVoce(idx, 'unitaMisura', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-center text-slate-800 dark:text-slate-200"
                        >
                          <option value="m">m</option>
                          <option value="cad">cad</option>
                          <option value="a_corpo">corpo</option>
                          <option value="mq">mq</option>
                          <option value="h">ore</option>
                        </select>
                      </td>
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={v.quantitaContrattuale}
                          onChange={(e) => handleUpdateVoce(idx, 'quantitaContrattuale', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-right font-mono text-slate-800 dark:text-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={v.prezzoUnitario}
                          onChange={(e) => handleUpdateVoce(idx, 'prezzoUnitario', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-right font-mono text-slate-800 dark:text-slate-200"
                        />
                      </td>
                      <td className="py-2 px-1.5">
                        <input
                          type="number"
                          value={v.quantitaPeriodo}
                          onChange={(e) => handleUpdateVoce(idx, 'quantitaPeriodo', e.target.value)}
                          className="w-full bg-amber-500/10 border border-amber-500/40 rounded px-1.5 py-1 text-right font-mono font-bold text-amber-700 dark:text-amber-300"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-300">
                        € {v.importoPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-1 text-center">
                        {voci.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVoce(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Riepilogo Calcoli */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold block">Totale Contratto</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                € {calcoli.totContrattuale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-sans font-bold block">Lavori Questo SAL</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                € {calcoli.totPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-sans font-bold block">Avanzamento Globale</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {calcoli.percGlobale.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Note e Considerazioni del Direttore di Cantiere</label>
            <textarea
              rows={2}
              value={noteGenerali}
              onChange={(e) => setNoteGenerali(e.target.value)}
              placeholder="Inserisci eventuali riserve, varianti concordate o annotazioni per la Direzione Lavori..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 shadow-sm"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salva Stato Avanzamento Lavori</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
