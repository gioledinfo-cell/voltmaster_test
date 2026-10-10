import React, { useState, useEffect } from 'react';
import { X, Building2, Save, MapPin, Calendar, FileText, Euro, ShieldCheck } from 'lucide-react';
import { Cantiere, CantiereStato } from '../../types';

interface CantiereFormModalProps {
  isOpen: boolean;
  cantiere?: Cantiere | null;
  onSave: (data: Partial<Cantiere>) => void;
  onClose: () => void;
}

export const CantiereFormModal: React.FC<CantiereFormModalProps> = ({
  isOpen,
  cantiere,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Cantiere>>({
    codice: '',
    titolo: '',
    clienteNome: '',
    indirizzo: '',
    citta: 'Milano (MI)',
    stato: 'in_corso',
    dataInizio: new Date().toISOString().split('T')[0],
    dataFinePrevista: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    responsabileNome: 'Marco Villa',
    budgetTotale: 50000,
    descrizione: '',
    lat: 45.4642,
    lng: 9.19,
  });

  useEffect(() => {
    if (cantiere) {
      setFormData(cantiere);
    } else {
      setFormData({
        codice: `CNT-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        titolo: '',
        clienteNome: '',
        indirizzo: '',
        citta: 'Milano (MI)',
        stato: 'in_corso',
        dataInizio: new Date().toISOString().split('T')[0],
        dataFinePrevista: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
        responsabileNome: 'Marco Villa',
        budgetTotale: 50000,
        descrizione: '',
        lat: 45.4642,
        lng: 9.19,
      });
    }
  }, [cantiere, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titolo || !formData.codice) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {cantiere ? 'Modifica Cantiere' : 'Nuovo Cantiere / Commessa'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compila i dati tecnici, logistici e contrattuali del cantiere.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Codice Cantiere *
              </label>
              <input
                type="text"
                required
                value={formData.codice || ''}
                onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="CNT-2026-001"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Stato Operativo
              </label>
              <select
                value={formData.stato || 'in_corso'}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as CantiereStato })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="in_corso">In Corso (Attivo)</option>
                <option value="in_attesa">In Attesa Avvio</option>
                <option value="collaudo">Collaudo Finale</option>
                <option value="completato">Completato</option>
                <option value="sospeso">Sospeso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Nome / Titolo Cantiere *
            </label>
            <input
              type="text"
              required
              value={formData.titolo || ''}
              onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. Cabina Elettrica MT/BT Ospedale San Luca"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Cliente / Committente
              </label>
              <input
                type="text"
                value={formData.clienteNome || ''}
                onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Ragione Sociale Committente"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Capocantiere / Responsabile
              </label>
              <input
                type="text"
                value={formData.responsabileNome || ''}
                onChange={(e) => setFormData({ ...formData, responsabileNome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Marco Villa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Indirizzo Cantiere
              </label>
              <input
                type="text"
                value={formData.indirizzo || ''}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Via / Piazza e civico"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Città / Provincia
              </label>
              <input
                type="text"
                value={formData.citta || ''}
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Milano (MI)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={formData.dataInizio || ''}
                onChange={(e) => setFormData({ ...formData, dataInizio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Data Fine Prevista
              </label>
              <input
                type="date"
                value={formData.dataFinePrevista || ''}
                onChange={(e) => setFormData({ ...formData, dataFinePrevista: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Importo Lavori (€)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.budgetTotale || 0}
                onChange={(e) => setFormData({ ...formData, budgetTotale: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Coordinate GPS (Lat / Lng)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={formData.lat || 45.4642}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 45.4642 })}
                  className="w-1/2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  placeholder="Lat 45.4642"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={formData.lng || 9.19}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 9.19 })}
                  className="w-1/2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  placeholder="Lng 9.1900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Note e Specifiche Tecniche
              </label>
              <input
                type="text"
                value={formData.descrizione || ''}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Dettagli lavorazioni e prescrizioni"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Salva Cantiere
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
