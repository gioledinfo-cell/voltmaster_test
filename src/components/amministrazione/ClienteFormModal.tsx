import React, { useState, useEffect } from 'react';
import { X, UserCheck, Save, Mail, Phone, MapPin, Building, CreditCard } from 'lucide-react';
import { Cliente } from '../../types';

interface ClienteFormModalProps {
  isOpen: boolean;
  cliente?: Cliente | null;
  onSave: (data: Partial<Cliente>) => void;
  onClose: () => void;
}

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  isOpen,
  cliente,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    ragioneSociale: '',
    referente: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: 'Milano',
    provincia: 'MI',
    cap: '20100',
    partitaIva: '',
    codiceFiscale: '',
    codiceUnivocoSdi: '0000000',
    pec: '',
    note: '',
  });

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({
        ragioneSociale: '',
        referente: '',
        email: '',
        telefono: '',
        indirizzo: '',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20100',
        partitaIva: '',
        codiceFiscale: '',
        codiceUnivocoSdi: '0000000',
        pec: '',
        note: '',
      });
    }
  }, [cliente, isOpen]);

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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {cliente ? 'Modifica Cliente' : 'Nuovo Cliente / Committente'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dati anagrafici, fiscali SDI, recapiti e condizioni contrattuali.
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
              Ragione Sociale / Nominativo *
            </label>
            <input
              type="text"
              required
              value={formData.ragioneSociale || ''}
              onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. Alfa Costruzioni S.r.l. o Mario Rossi"
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
                Codice Fiscale
              </label>
              <input
                type="text"
                value={formData.codiceFiscale || ''}
                onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="16 caratteri o uguale a P.IVA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Codice Univoco SDI
              </label>
              <input
                type="text"
                value={formData.codiceUnivocoSdi || '0000000'}
                onChange={(e) => setFormData({ ...formData, codiceUnivocoSdi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                placeholder="7 caratteri (o 0000000)"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                PEC (Posta Elettronica Certificata)
              </label>
              <input
                type="email"
                value={formData.pec || ''}
                onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ragionesociale@pec.it"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Indirizzo Sede
              </label>
              <input
                type="text"
                value={formData.indirizzo || ''}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Via / Piazza e numero"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Comune / Prov. / CAP
              </label>
              <input
                type="text"
                value={formData.citta || ''}
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Milano (MI) 20100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Persona Referente
              </label>
              <input
                type="text"
                value={formData.referente || ''}
                onChange={(e) => setFormData({ ...formData, referente: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Nome e Cognome referente"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Telefono Diretto
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
                Email Aziendale
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="info@cliente.it"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Note, Condizioni di Pagamento & IBAN
            </label>
            <input
              type="text"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="es. Bonifico 60 gg d.f. f.m. - IBAN IT..."
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
              Salva Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
