import React, { useState, useEffect } from 'react';
import { X, Smartphone, Save, Tablet, Radio, HardHat, Cpu } from 'lucide-react';
import { DispositivoAziendale, DispositivoTipologia, DispositivoStato } from '../../types/anagrafica';

interface DispositivoFormModalProps {
  isOpen: boolean;
  dispositivo?: DispositivoAziendale | null;
  onSave: (data: Partial<DispositivoAziendale>) => void;
  onClose: () => void;
}

export const DispositivoFormModal: React.FC<DispositivoFormModalProps> = ({
  isOpen,
  dispositivo,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<DispositivoAziendale>>({
    codice: '',
    tipologia: 'tablet',
    marcaModello: '',
    serialeImei: '',
    stato: 'attivo',
    assegnatarioTipo: 'utente',
    assegnatarioNome: 'Marco Villa (Capocantiere)',
    cantiereNome: '',
    simNumero: '',
    simOperatore: 'TIM Business',
    pianoDatiGb: '50 GB 5G',
    dataConsegna: new Date().toISOString().split('T')[0],
    valoreEuro: 500,
    note: '',
  });

  useEffect(() => {
    if (dispositivo) {
      setFormData(dispositivo);
    } else {
      setFormData({
        codice: `DSP-TAB-${String(Math.floor(Math.random() * 900) + 100)}`,
        tipologia: 'tablet',
        marcaModello: '',
        serialeImei: '',
        stato: 'attivo',
        assegnatarioTipo: 'utente',
        assegnatarioNome: 'Marco Villa (Capocantiere)',
        cantiereNome: '',
        simNumero: '',
        simOperatore: 'TIM Business',
        pianoDatiGb: '50 GB 5G',
        dataConsegna: new Date().toISOString().split('T')[0],
        valoreEuro: 500,
        note: '',
      });
    }
  }, [dispositivo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.marcaModello || !formData.codice) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {dispositivo ? 'Modifica Dispositivo IT' : 'Nuovo Dispositivo Aziendale'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tablet da cantiere, smartphone rugged, GPS tracker veicolare, DPI smart e timbratori.
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
                Codice Univoco *
              </label>
              <input
                type="text"
                required
                value={formData.codice || ''}
                onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="DSP-TAB-01"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Tipologia
              </label>
              <select
                value={formData.tipologia || 'tablet'}
                onChange={(e) => setFormData({ ...formData, tipologia: e.target.value as DispositivoTipologia })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="tablet">Tablet Rugged Campo</option>
                <option value="smartphone">Smartphone Rugged</option>
                <option value="gps_tracker">GPS Tracker Veicolo</option>
                <option value="timbratura_badge">Terminale Timbratura</option>
                <option value="dpi_smart">DPI Smart / Sensore Caduta</option>
                <option value="sensore_iot">Sensore IoT Ambientale</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Stato
              </label>
              <select
                value={formData.stato || 'attivo'}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as DispositivoStato })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="attivo">Attivo / In Uso</option>
                <option value="disponibile_scorta">Disponibile a Magazzino</option>
                <option value="in_riparazione">In Riparazione / Garanzia</option>
                <option value="dismesso">Dismesso</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Marca e Modello *
              </label>
              <input
                type="text"
                required
                value={formData.marcaModello || ''}
                onChange={(e) => setFormData({ ...formData, marcaModello: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Samsung Galaxy Tab Active4 Pro Rugged"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Seriale / IMEI
              </label>
              <input
                type="text"
                value={formData.serialeImei || ''}
                onChange={(e) => setFormData({ ...formData, serialeImei: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="IMEI 35892019482..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Assegnatario (Persona, Mezzo o Sede)
              </label>
              <input
                type="text"
                value={formData.assegnatarioNome || ''}
                onChange={(e) => setFormData({ ...formData, assegnatarioNome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Marco Villa (Capocantiere)"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Cantiere Collegato
              </label>
              <input
                type="text"
                value={formData.cantiereNome || ''}
                onChange={(e) => setFormData({ ...formData, cantiereNome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="es. Ospedale San Luca"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Numero SIM / Scheda Dati
              </label>
              <input
                type="text"
                value={formData.simNumero || ''}
                onChange={(e) => setFormData({ ...formData, simNumero: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="+39 348 ..."
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Operatore & Piano
              </label>
              <input
                type="text"
                value={formData.pianoDatiGb || ''}
                onChange={(e) => setFormData({ ...formData, pianoDatiGb: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="TIM 50 GB 5G"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Valore Fiscale (€)
              </label>
              <input
                type="number"
                value={formData.valoreEuro || 0}
                onChange={(e) => setFormData({ ...formData, valoreEuro: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Note, Accessori e Copertura Assicurativa Kasko
            </label>
            <input
              type="text"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Custodia antiurto con pennino e protezione vetro temperato."
            />
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
              Salva Dispositivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
