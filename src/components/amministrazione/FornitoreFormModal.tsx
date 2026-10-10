import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Save, ShieldCheck, Star } from 'lucide-react';
import { FornitoreAnagrafica } from '../../data/mockOrdini';

interface FornitoreFormModalProps {
  isOpen: boolean;
  fornitore?: FornitoreAnagrafica | null;
  onSave: (data: Partial<FornitoreAnagrafica>) => void;
  onClose: () => void;
}

export const FornitoreFormModal: React.FC<FornitoreFormModalProps> = ({
  isOpen,
  fornitore,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<FornitoreAnagrafica>>({
    ragioneSociale: '',
    referente: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: 'Milano',
    partitaIva: '',
    categoria: 'materiale_elettrico',
    tempoMedioConsegnaGiorni: 1,
  });

  useEffect(() => {
    if (fornitore) {
      setFormData(fornitore);
    } else {
      setFormData({
        ragioneSociale: '',
        referente: '',
        email: '',
        telefono: '',
        indirizzo: '',
        citta: 'Milano',
        partitaIva: '',
        categoria: 'materiale_elettrico',
        tempoMedioConsegnaGiorni: 1,
      });
    }
  }, [fornitore, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ragioneSociale) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {fornitore ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Anagrafica fornitore, categoria merceologica, tempi di consegna e conformità DURC.
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
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Ragione Sociale Fornitore *
            </label>
            <input
              type="text"
              required
              value={formData.ragioneSociale || ''}
              onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. RemaTarlazzi S.p.A. o Sacchi Elettroforniture"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Partita IVA
              </label>
              <input
                type="text"
                value={formData.partitaIva || ''}
                onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="11 cifre"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Categoria Merceologica
              </label>
              <select
                value={formData.categoria || 'materiale_elettrico'}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="materiale_elettrico">Materiale Elettrico & Impianti</option>
                <option value="fotovoltaico">Fotovoltaico & Accumulo</option>
                <option value="attrezzature_utensili">Attrezzature & Elettroutensili</option>
                <option value="veicoli_noleggio">Veicoli & Noleggio Mezzi</option>
                <option value="ferramenta_fissaggi">Ferramenta & Fissaggi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Indirizzo Sede
              </label>
              <input
                type="text"
                value={formData.indirizzo || ''}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Via e numero"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Città (Hub)
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
                Referente Commerciale
              </label>
              <input
                type="text"
                value={formData.referente || ''}
                onChange={(e) => setFormData({ ...formData, referente: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Sig. Mario Rossi"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Telefono Ordini
              </label>
              <input
                type="text"
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="+39 02 ..."
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Email Ordini / EDI
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ordini@fornitore.it"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Tempo Medio Consegna (Giorni)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.tempoMedioConsegnaGiorni || 1}
                onChange={(e) => setFormData({ ...formData, tempoMedioConsegnaGiorni: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Valutazione Rating Fornitore
              </label>
              <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-amber-500">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">5.0 / 5 (Top Partner)</span>
              </div>
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
              Salva Fornitore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
