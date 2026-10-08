import React, { useState } from 'react';
import { X, Truck, FileText, CheckCircle2, User, Building2, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RichiestaMateriali } from '../../types/richiestaMateriali';

interface GeneraDdtModalProps {
  isOpen: boolean;
  onClose: () => void;
  richiesta: RichiestaMateriali | null;
  onDdtCreated?: (ddtId: string) => void;
}

export const GeneraDdtModal: React.FC<GeneraDdtModalProps> = ({
  isOpen,
  onClose,
  richiesta,
  onDdtCreated,
}) => {
  const { veicoli, dipendenti, currentUser, generaDdtDaRichiesta, showToast } = useApp();

  const [veicoloId, setVeicoloId] = useState<string>(veicoli[0]?.id || '');
  const [autistaId, setAutistaId] = useState<string>(dipendenti[0]?.id || '');
  const [noteTrasporto, setNoteTrasporto] = useState<string>('Consegna materiale urgente per avanzamento cantiere.');

  if (!isOpen || !richiesta) return null;

  const selectedVeicolo = veicoli.find((v) => v.id === veicoloId) || veicoli[0];
  const selectedAutista = dipendenti.find((d) => d.id === autistaId) || dipendenti[0];

  const handleEmettiDdt = (e: React.FormEvent) => {
    e.preventDefault();

    const ddt = generaDdtDaRichiesta(richiesta.id, {
      veicoloId,
      autistaId,
      noteTrasporto,
    });

    if (ddt) {
      if (onDdtCreated) {
        onDdtCreated(ddt.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-amber-500/5 to-transparent dark:from-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-600/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">
                Pianificazione Spedizione & DDT
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Emissione DDT per Richiesta {richiesta.numero}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleEmettiDdt} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Cantiere & Cliente Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>{richiesta.cantiereTitolo}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Destinazione: <strong>{richiesta.indirizzoConsegna}</strong>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Committente: <strong>{richiesta.clienteNome}</strong>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Colli / Voci da trasportare: <strong>{richiesta.righe.length} articoli</strong>
            </div>
          </div>

          {/* Selezione Veicolo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Seleziona Veicolo per la Spedizione:</span>
            </label>
            <select
              value={veicoloId}
              onChange={(e) => setVeicoloId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {veicoli.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.modello} - Targa: {v.targa} ({v.stato.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Selezione Autista / Tecnico Incaricato */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Autista / Conducente Incaricato:</span>
            </label>
            <select
              value={autistaId}
              onChange={(e) => setAutistaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {dipendenti.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} {d.cognome} - {d.ruoloAziendale}
                </option>
              ))}
            </select>
          </div>

          {/* Note Trasporto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Note di Consegna sul DDT:
            </label>
            <textarea
              rows={2}
              value={noteTrasporto}
              onChange={(e) => setNoteTrasporto(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              placeholder="es. Consegna al piano terra, contattare capocantiere..."
            />
          </div>

          {/* Summary checklist righe */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Voci che verranno scaricate e inserite nel DDT</span>
              <span className="font-mono text-[10px] text-slate-500">{richiesta.righe.length} voci</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto">
              {richiesta.righe.map((r) => (
                <div key={r.id} className="p-2 text-xs flex items-center justify-between">
                  <div className="truncate flex-1 pr-2">
                    <span className="font-mono font-bold text-[10px] text-slate-500 mr-1.5">[{r.codice}]</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{r.descrizione}</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    {r.quantitaRichiesta} {r.unitaMisura}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Annulla
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Emetti DDT & Pianifica Invio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
