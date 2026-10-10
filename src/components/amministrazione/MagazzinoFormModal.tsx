import React, { useState, useEffect } from 'react';
import { X, Package, Save, Barcode, Warehouse } from 'lucide-react';
import { ArticoloMagazzino } from '../../types';

interface MagazzinoFormModalProps {
  isOpen: boolean;
  articolo?: ArticoloMagazzino | null;
  onSave: (data: Partial<ArticoloMagazzino>) => void;
  onClose: () => void;
}

export const MagazzinoFormModal: React.FC<MagazzinoFormModalProps> = ({
  isOpen,
  articolo,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<ArticoloMagazzino>>({
    codiceSku: '',
    nome: '',
    categoria: 'materiale_vario',
    giacenza: 10,
    scortaMinima: 5,
    unitaMisura: 'pz',
    prezzoUnitarioAcquisto: 10,
    prezzoListinoVendita: 15,
    ubicazioneScaffale: 'CORSIA-A1',
    fornitore: 'RemaTarlazzi S.p.A.',
    barcodeEan: '',
  });

  useEffect(() => {
    if (articolo) {
      setFormData(articolo);
    } else {
      setFormData({
        codiceSku: `SKU-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        nome: '',
        categoria: 'materiale_vario',
        giacenza: 10,
        scortaMinima: 5,
        unitaMisura: 'pz',
        prezzoUnitarioAcquisto: 10,
        prezzoListinoVendita: 15,
        ubicazioneScaffale: 'CORSIA-A1',
        fornitore: 'RemaTarlazzi S.p.A.',
        barcodeEan: '',
      });
    }
  }, [articolo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.codiceSku) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {articolo ? 'Modifica Articolo Magazzino' : 'Nuovo Articolo Magazzino'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Codice SKU, prezzi di acquisto/vendita, scorte minime e scaffale.
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
                Codice SKU *
              </label>
              <input
                type="text"
                required
                value={formData.codiceSku || ''}
                onChange={(e) => setFormData({ ...formData, codiceSku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="CAV-FG16-5G16"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Categoria Materiale
              </label>
              <select
                value={formData.categoria || 'materiale_vario'}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="cavi_elettrici">Cavi Elettrici Energia / CPR</option>
                <option value="quadri_modulari">Quadri Elettrici & Modulari DIN</option>
                <option value="apparecchi_comando">Serie Civile & Comandi</option>
                <option value="tubi_canaline">Tubi, Cavidotti & Canaline</option>
                <option value="illuminazione">Corpi Illuminanti & LED</option>
                <option value="fotovoltaico_accumulo">Fotovoltaico & Accumulo</option>
                <option value="materiale_vario">Materiale Vario & Minuterie</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Descrizione Dettagliata Articolo *
            </label>
            <input
              type="text"
              required
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. Cavo FG16OR16 0.6/1kV 5G16 CPR Cca-s3,d1,a3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Giacenza Attuale
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.giacenza ?? 0}
                onChange={(e) => setFormData({ ...formData, giacenza: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Scorta Minima (Alert)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.scortaMinima ?? 0}
                onChange={(e) => setFormData({ ...formData, scortaMinima: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Unità di Misura
              </label>
              <input
                type="text"
                value={formData.unitaMisura || 'pz'}
                onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="m, pz, conf, rotolo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Prezzo Acquisto Unitario (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.prezzoUnitarioAcquisto || 0}
                onChange={(e) => setFormData({ ...formData, prezzoUnitarioAcquisto: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Prezzo Listino Vendita (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.prezzoListinoVendita || 0}
                onChange={(e) => setFormData({ ...formData, prezzoListinoVendita: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Ubicazione Scaffale
              </label>
              <input
                type="text"
                value={formData.ubicazioneScaffale || ''}
                onChange={(e) => setFormData({ ...formData, ubicazioneScaffale: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
                placeholder="CORSIA-B2-RIP-3"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Fornitore Abituale
              </label>
              <input
                type="text"
                value={formData.fornitore || ''}
                onChange={(e) => setFormData({ ...formData, fornitore: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="RemaTarlazzi / Sacchi"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Codice a Barre (EAN / Barcode)
              </label>
              <input
                type="text"
                value={formData.barcodeEan || ''}
                onChange={(e) => setFormData({ ...formData, barcodeEan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="800492810..."
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
              Salva Articolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
