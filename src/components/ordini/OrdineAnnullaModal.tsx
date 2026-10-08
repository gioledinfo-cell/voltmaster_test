import React, { useState } from 'react';
import { OrdineInterno } from '../../types';
import { AlertTriangle, X, Ban } from 'lucide-react';

interface OrdineAnnullaModalProps {
  ordine: OrdineInterno | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ordineId: string, motivo: string) => void;
}

export const OrdineAnnullaModal: React.FC<OrdineAnnullaModalProps> = ({
  ordine,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !ordine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Inserire obbligatoriamente il motivo dell’annullamento.');
      return;
    }
    onConfirm(ordine.id, motivo.trim());
    setMotivo('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Annulla Ordine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{ordine.numero}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 flex gap-2.5 items-start text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              Stai per annullare l'ordine verso <strong className="text-slate-900 dark:text-white">{ordine.destinatarioRagioneSociale}</strong> ({ordine.tipo === 'fornitore' ? 'Fornitore' : 'Cliente'}).
              L'operazione registrerà la data, l'utente e il motivo nello storico permanente degli stati.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo dell'Annullamento <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              placeholder="Es. Richiesta del cliente per variazione progetto / Fornitore impossibilitato alla consegna / Errore di inserimento quantitativi..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            {error && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              Annulla Operazione
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md shadow-rose-900/20"
            >
              <Ban className="w-4 h-4" />
              <span>Conferma Annullamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
