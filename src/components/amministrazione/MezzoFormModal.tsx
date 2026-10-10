import React, { useState, useEffect } from 'react';
import { X, Truck, Save, ShieldAlert, Gauge } from 'lucide-react';
import { Veicolo } from '../../types';

interface MezzoFormModalProps {
  isOpen: boolean;
  veicolo?: Veicolo | null;
  onSave: (data: Partial<Veicolo>) => void;
  onClose: () => void;
}

export const MezzoFormModal: React.FC<MezzoFormModalProps> = ({
  isOpen,
  veicolo,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Veicolo>>({
    targa: '',
    modello: '',
    kmAttuali: 80000,
    autistaAssegnatoNome: 'Marco Villa',
    scadenzaRevisione: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
    scadenzaAssicurazione: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
    scadenzaBollo: new Date(Date.now() + 320 * 86400000).toISOString().split('T')[0],
    scadenzaTagliandoKm: 100000,
    stato: 'in_servizio',
    note: '',
  });

  useEffect(() => {
    if (veicolo) {
      setFormData(veicolo);
    } else {
      setFormData({
        targa: '',
        modello: '',
        kmAttuali: 80000,
        autistaAssegnatoNome: 'Marco Villa',
        scadenzaRevisione: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
        scadenzaAssicurazione: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
        scadenzaBollo: new Date(Date.now() + 320 * 86400000).toISOString().split('T')[0],
        scadenzaTagliandoKm: 100000,
        stato: 'in_servizio',
        note: '',
      });
    }
  }, [veicolo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targa || !formData.modello) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {veicolo ? 'Modifica Veicolo Flotta' : 'Nuovo Automezzo / Furgone'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dati del mezzo, scadenze ministeriali MCTC, assicurazione, bollo e tagliandi.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Targa *
              </label>
              <input
                type="text"
                required
                value={formData.targa || ''}
                onChange={(e) => setFormData({ ...formData, targa: e.target.value.toUpperCase().trim() })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                placeholder="GA421KL"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Marca e Modello Allestimento *
              </label>
              <input
                type="text"
                required
                value={formData.modello || ''}
                onChange={(e) => setFormData({ ...formData, modello: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Iveco Daily 35C15 Allestito Elettricisti"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Km Attuali
              </label>
              <input
                type="number"
                min="0"
                value={formData.kmAttuali || 0}
                onChange={(e) => setFormData({ ...formData, kmAttuali: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Autista / Assegnatario
              </label>
              <input
                type="text"
                value={formData.autistaAssegnatoNome || ''}
                onChange={(e) => setFormData({ ...formData, autistaAssegnatoNome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Marco Villa"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Stato Operativo
              </label>
              <select
                value={formData.stato || 'in_servizio'}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="in_servizio">In Servizio (Attivo)</option>
                <option value="in_officina">In Officina / Tagliando</option>
                <option value="fermo">Fermo Deposito</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Scadenza Revisione MCTC
              </label>
              <input
                type="date"
                value={formData.scadenzaRevisione || ''}
                onChange={(e) => setFormData({ ...formData, scadenzaRevisione: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Scadenza Polizza RCA
              </label>
              <input
                type="date"
                value={formData.scadenzaAssicurazione || ''}
                onChange={(e) => setFormData({ ...formData, scadenzaAssicurazione: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Scadenza Tassa Bollo
              </label>
              <input
                type="date"
                value={formData.scadenzaBollo || ''}
                onChange={(e) => setFormData({ ...formData, scadenzaBollo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Scadenza Prossimo Tagliando (Km)
              </label>
              <input
                type="number"
                value={formData.scadenzaTagliandoKm || 0}
                onChange={(e) => setFormData({ ...formData, scadenzaTagliandoKm: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Note & Dotazione Allestimento
              </label>
              <input
                type="text"
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Scaffalature Syncro, morsa, inverter 230V"
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
              Salva Veicolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
