import React, { useState, useEffect } from 'react';
import { X, Users, Save, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';
import { Dipendente } from '../../types';
import { SubappaltoAnagrafica } from '../../types/anagrafica';

interface OperatoreFormModalProps {
  isOpen: boolean;
  type: 'dipendente' | 'subappalto';
  dipendente?: Dipendente | null;
  subappalto?: SubappaltoAnagrafica | null;
  onSaveDipendente: (data: Partial<Dipendente>) => void;
  onSaveSubappalto: (data: Partial<SubappaltoAnagrafica>) => void;
  onClose: () => void;
}

export const OperatoreFormModal: React.FC<OperatoreFormModalProps> = ({
  isOpen,
  type: initialType,
  dipendente,
  subappalto,
  onSaveDipendente,
  onSaveSubappalto,
  onClose,
}) => {
  const [recordType, setRecordType] = useState<'dipendente' | 'subappalto'>(initialType);

  // Dipendente state
  const [dipData, setDipData] = useState<Partial<Dipendente>>({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    reparto: 'operaio',
    ruoloAziendale: 'Operaio Elettricista Specializzato',
    telefono: '',
    email: '',
    costoOrario: 32,
    patentini: ['PES-PAV-PEI (Norma CEI 11-27)', 'Lavori in Quota'],
    visitaMedicaScadenza: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
  });

  // Subappalto state
  const [subData, setSubData] = useState<Partial<SubappaltoAnagrafica>>({
    ragioneSociale: '',
    partitaIva: '',
    codiceFiscale: '',
    sedeLegale: 'Lombardia (MI)',
    referente: '',
    telefono: '',
    email: '',
    categoriaLavorazione: 'Opere Civili & Scavi',
    cantiereAssegnatoNome: 'Tutti i cantieri',
    dataInizioContratto: new Date().toISOString().split('T')[0],
    dataFineContratto: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    importoContratto: 25000,
    durcProtocollo: 'INPS_48192034',
    durcScadenza: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    durcStato: 'regolare',
    posStato: 'approvato_cse',
    numeroOperatoriInCantiere: 3,
    congruitaManodopera: true,
  });

  const [patentiniInput, setPatentiniInput] = useState('PES-PAV-PEI; Lavori in Quota');

  useEffect(() => {
    setRecordType(initialType);
    if (dipendente) {
      setDipData(dipendente);
      setPatentiniInput(dipendente.patentini?.join('; ') || '');
    } else {
      setDipData({
        nome: '',
        cognome: '',
        codiceFiscale: '',
        reparto: 'operaio',
        ruoloAziendale: 'Operaio Elettricista Specializzato',
        telefono: '',
        email: '',
        costoOrario: 32,
        patentini: ['PES-PAV-PEI (Norma CEI 11-27)', 'Lavori in Quota'],
        visitaMedicaScadenza: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
      });
    }

    if (subappalto) {
      setSubData(subappalto);
    } else {
      setSubData({
        ragioneSociale: '',
        partitaIva: '',
        codiceFiscale: '',
        sedeLegale: 'Lombardia (MI)',
        referente: '',
        telefono: '',
        email: '',
        categoriaLavorazione: 'Opere Civili & Scavi',
        cantiereAssegnatoNome: 'Tutti i cantieri',
        dataInizioContratto: new Date().toISOString().split('T')[0],
        dataFineContratto: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        importoContratto: 25000,
        durcProtocollo: 'INPS_48192034',
        durcScadenza: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
        durcStato: 'regolare',
        posStato: 'approvato_cse',
        numeroOperatoriInCantiere: 3,
        congruitaManodopera: true,
      });
    }
  }, [dipendente, subappalto, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordType === 'dipendente') {
      if (!dipData.nome || !dipData.cognome) return;
      const parsedPatentini = patentiniInput.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      onSaveDipendente({
        ...dipData,
        patentini: parsedPatentini.length > 0 ? parsedPatentini : ['PES-PAV-PEI'],
      });
    } else {
      if (!subData.ragioneSociale || !subData.partitaIva) return;
      onSaveSubappalto(subData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {recordType === 'dipendente'
                  ? dipendente ? 'Modifica Dipendente' : 'Nuovo Dipendente / Collaboratore'
                  : subappalto ? 'Modifica Subappalto' : 'Nuova Impresa in Subappalto'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestione organico aziendale, scadenze mediche, patentini CEI 11-27 e DURC subappalti.
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

        {/* Toggle between Dipendente and Subappalto if creating new */}
        {!dipendente && !subappalto && (
          <div className="mt-4 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setRecordType('dipendente')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                recordType === 'dipendente'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Dipendente Interno / Operaio
            </button>
            <button
              type="button"
              onClick={() => setRecordType('subappalto')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                recordType === 'subappalto'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Ditta Terza / Subappalto
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {recordType === 'dipendente' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={dipData.nome || ''}
                    onChange={(e) => setDipData({ ...dipData, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Mario"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={dipData.cognome || ''}
                    onChange={(e) => setDipData({ ...dipData, cognome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={dipData.codiceFiscale || ''}
                    onChange={(e) => setDipData({ ...dipData, codiceFiscale: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="RSSMRA80A01F205X"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Reparto
                  </label>
                  <select
                    value={dipData.reparto || 'operaio'}
                    onChange={(e) => setDipData({ ...dipData, reparto: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="capocantiere">Capocantiere</option>
                    <option value="operaio">Operaio Specializzato</option>
                    <option value="apprendista">Apprendista</option>
                    <option value="ufficio_tecnico">Ufficio Tecnico / PM</option>
                    <option value="contabilita">Amministrazione / Contabilità</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Costo Orario Aziendale (€/h)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="0.5"
                    value={dipData.costoOrario || 32}
                    onChange={(e) => setDipData({ ...dipData, costoOrario: parseFloat(e.target.value) || 32 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Mansione / Qualifica Aziendale
                </label>
                <input
                  type="text"
                  value={dipData.ruoloAziendale || ''}
                  onChange={(e) => setDipData({ ...dipData, ruoloAziendale: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Elettricista Specializzato Impianti Industriali"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={dipData.telefono || ''}
                    onChange={(e) => setDipData({ ...dipData, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="+39 340 ..."
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Email Aziendale
                  </label>
                  <input
                    type="email"
                    value={dipData.email || ''}
                    onChange={(e) => setDipData({ ...dipData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="nome.cognome@voltmaster.it"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Patentini & Abilitazioni (separati da ;)
                  </label>
                  <input
                    type="text"
                    value={patentiniInput}
                    onChange={(e) => setPatentiniInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="PES-PAV; PLE; Lavori in quota; Primo Soccorso"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Scadenza Visita Medica D.Lgs. 81/08
                  </label>
                  <input
                    type="date"
                    value={dipData.visitaMedicaScadenza || ''}
                    onChange={(e) => setDipData({ ...dipData, visitaMedicaScadenza: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Ragione Sociale Impresa Subappaltatrice *
                </label>
                <input
                  type="text"
                  required
                  value={subData.ragioneSociale || ''}
                  onChange={(e) => setSubData({ ...subData, ragioneSociale: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="es. Orobica Montaggi S.r.l."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Partita IVA *
                  </label>
                  <input
                    type="text"
                    required
                    value={subData.partitaIva || ''}
                    onChange={(e) => setSubData({ ...subData, partitaIva: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="11 cifre"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Categoria Lavorazione Autorizzata
                  </label>
                  <input
                    type="text"
                    value={subData.categoriaLavorazione || ''}
                    onChange={(e) => setSubData({ ...subData, categoriaLavorazione: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Opere Civili & Posa Blindosbarre"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    DURC Protocollo
                  </label>
                  <input
                    type="text"
                    value={subData.durcProtocollo || ''}
                    onChange={(e) => setSubData({ ...subData, durcProtocollo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="INPS_39812491"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    DURC Scadenza
                  </label>
                  <input
                    type="date"
                    value={subData.durcScadenza || ''}
                    onChange={(e) => setSubData({ ...subData, durcScadenza: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Stato POS
                  </label>
                  <select
                    value={subData.posStato || 'approvato_cse'}
                    onChange={(e) => setSubData({ ...subData, posStato: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="approvato_cse">Approvato CSE</option>
                    <option value="in_revisione">In Revisione</option>
                    <option value="da_presentare">Da Presentare</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Importo Contratto (€)
                  </label>
                  <input
                    type="number"
                    value={subData.importoContratto || 0}
                    onChange={(e) => setSubData({ ...subData, importoContratto: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Operatori in Cantiere
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subData.numeroOperatoriInCantiere || 1}
                    onChange={(e) => setSubData({ ...subData, numeroOperatoriInCantiere: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Congruità Manodopera
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs">
                    <input
                      type="checkbox"
                      id="congCheck"
                      checked={subData.congruitaManodopera ?? true}
                      onChange={(e) => setSubData({ ...subData, congruitaManodopera: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <label htmlFor="congCheck" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Attestata D.M. 143
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

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
              Salva Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
