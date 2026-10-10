import React, { useState, useEffect } from 'react';
import { X, Wrench, Save, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Attrezzatura, AttrezzaturaStato } from '../../types';

interface AttrezzaturaFormModalProps {
  isOpen: boolean;
  attrezzatura?: Attrezzatura | null;
  onSave: (data: Partial<Attrezzatura>) => void;
  onClose: () => void;
}

export const AttrezzaturaFormModal: React.FC<AttrezzaturaFormModalProps> = ({
  isOpen,
  attrezzatura,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Attrezzatura>>({
    codiceUnivoco: '',
    nome: '',
    marcaModello: '',
    matricola: '',
    stato: 'disponibile',
    dataAcquisto: new Date().toISOString().split('T')[0],
    prossimaTaratura: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (attrezzatura) {
      setFormData(attrezzatura);
    } else {
      setFormData({
        codiceUnivoco: `ATT-${String(Math.floor(Math.random() * 900) + 100)}`,
        nome: '',
        marcaModello: '',
        matricola: '',
        stato: 'disponibile',
        dataAcquisto: new Date().toISOString().split('T')[0],
        prossimaTaratura: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      });
    }
  }, [attrezzatura, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.codiceUnivoco) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {attrezzatura ? 'Modifica Attrezzatura' : 'Nuova Attrezzatura / Strumento'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Strumenti di misura CEI 64-8, elettroutensili, scale e scadenze di taratura.
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
                Codice Univoco *
              </label>
              <input
                type="text"
                required
                value={formData.codiceUnivoco || ''}
                onChange={(e) => setFormData({ ...formData, codiceUnivoco: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ATT-STR-001"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Stato Strumento
              </label>
              <select
                value={formData.stato || 'disponibile'}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as AttrezzaturaStato })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="disponibile">Disponibile (In Magazzino)</option>
                <option value="assegnata">Assegnata a Cantiere/Dipendente</option>
                <option value="in_manutenzione">In Manutenzione / Riparazione</option>
                <option value="taratura_scaduta">Taratura Scaduta (Non Utilizzabile)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Nome / Denominazione Strumento *
            </label>
            <input
              type="text"
              required
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. Strumento Multifunzione Prove CEI 64-8 Asita I-V 400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Marca e Modello
              </label>
              <input
                type="text"
                value={formData.marcaModello || ''}
                onChange={(e) => setFormData({ ...formData, marcaModello: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Asita / Fluke / Hilti"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Matricola / Seriale
              </label>
              <input
                type="text"
                value={formData.matricola || ''}
                onChange={(e) => setFormData({ ...formData, matricola: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="SN-..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Data Acquisto
              </label>
              <input
                type="date"
                value={formData.dataAcquisto || ''}
                onChange={(e) => setFormData({ ...formData, dataAcquisto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Prossima Taratura / Verifica Periodica
              </label>
              <input
                type="date"
                value={formData.prossimaTaratura || ''}
                onChange={(e) => setFormData({ ...formData, prossimaTaratura: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-600 dark:text-amber-400"
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
              Salva Attrezzatura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
