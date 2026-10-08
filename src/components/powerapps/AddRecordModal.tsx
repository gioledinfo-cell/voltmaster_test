import React, { useState } from 'react';
import { X, Plus, Save, Database, AlertCircle } from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';
import { CsvDatasetType } from '../../types/powerApps';
import { CSV_TABLE_CONFIGS } from '../../services/csvIngestionService';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetType: CsvDatasetType;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  datasetType,
}) => {
  const {
    addRecord,
    dipendenti,
    veicoli,
    depositi,
    cantieri,
    attrezzature,
    rifornimenti,
  } = usePowerApps();

  const config = CSV_TABLE_CONFIGS[datasetType];

  // Initialize form state
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    config.expectedHeaders.forEach((header) => {
      init[header] = '';
    });

    // Smart default PKs
    if (datasetType === 'dipendenti') init['Matricola'] = `DIP-${String(dipendenti.length + 1).padStart(2, '0')}`;
    if (datasetType === 'veicoli') init['ID'] = `VEI-${String(veicoli.length + 1).padStart(2, '0')}`;
    if (datasetType === 'attrezzature') init['ID'] = `ATT-${String(attrezzature.length + 1).padStart(3, '0')}`;
    if (datasetType === 'cantieri') init['ID'] = `CNT-${String(cantieri.length + 1).padStart(2, '0')}`;
    if (datasetType === 'rifornimenti') {
      init['ID'] = `RIF-${String(rifornimenti.length + 1).padStart(3, '0')}`;
      init['Data/ora creazione'] = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    return init;
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Relational cascades
      if (datasetType === 'rifornimenti' && field === 'ID_Veicolo') {
        const foundV = veicoli.find((v) => v.ID === value);
        if (foundV) {
          updated['Targa'] = foundV.Targa;
          updated['Modello_Veicolo'] = foundV.Veicolo;
          if (foundV.Assegnato && !updated['Operatore']) {
            updated['Operatore'] = foundV.Assegnato;
          }
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const pkField = config.primaryKey;
    if (!formData[pkField] || String(formData[pkField]).trim() === '') {
      setErrorMsg(`Il campo chiave primaria "${pkField}" è obbligatorio.`);
      return;
    }

    addRecord(datasetType, formData);
    onClose();
  };

  // Render input with relational dropdowns where applicable
  const renderFieldInput = (header: string) => {
    const val = formData[header] ?? '';

    // Relational field 1: Dipendente Responsible / Assegnato
    if (
      (datasetType === 'attrezzature' && header === 'Oper. Responsabi') ||
      (datasetType === 'veicoli' && header === 'Assegnato') ||
      (datasetType === 'cantieri' && header === 'Assegnato') ||
      (datasetType === 'rifornimenti' && header === 'Operatore') ||
      (datasetType === 'carichi_carburante' && (header === 'Operatore' || header === 'Operatore_Ultimo_Scarico'))
    ) {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">-- Seleziona Dipendente Registrato --</option>
          {dipendenti.map((d) => {
            const fullName = `${d.Title} ${d.Cognome}`;
            return (
              <option key={d.Matricola} value={fullName}>
                {fullName} ({d.Matricola} - {d.Qualifica})
              </option>
            );
          })}
        </select>
      );
    }

    // Relational field 2: Posizione Attrezzatura (Depositi & Cantieri)
    if (datasetType === 'attrezzature' && header === 'Posizione') {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">-- Seleziona Deposito o Cantiere --</option>
          <optgroup label="Depositi & Furgoni Aziendali">
            {depositi.map((dep) => (
              <option key={dep.Titolo} value={dep.Titolo}>
                [DEPOSITO] {dep.Titolo} ({dep.Tipologia})
              </option>
            ))}
          </optgroup>
          <optgroup label="Cantieri Attivi">
            {cantieri.map((cnt) => (
              <option key={cnt.ID} value={cnt.CANTIERE}>
                [CANTIERE] {cnt.COD_CANTIERE} - {cnt.CANTIERE}
              </option>
            ))}
          </optgroup>
        </select>
      );
    }

    // Relational field 3: Veicolo Dropdown (Rifornimenti)
    if (datasetType === 'rifornimenti' && header === 'ID_Veicolo') {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          required
        >
          <option value="">-- Seleziona Veicolo --</option>
          {veicoli.map((v) => (
            <option key={v.ID} value={v.ID}>
              {v.Targa} - {v.Veicolo}
            </option>
          ))}
        </select>
      );
    }

    // Booleans / Status dropdowns
    if (header === 'Cantiere_Aperto' || header === 'Operatore_In_Campo') {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
        >
          <option value="Sì">Sì</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (datasetType === 'veicoli' && header === 'Stato') {
      return (
        <select
          value={val || 'Attivo'}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
        >
          <option value="Attivo">Attivo</option>
          <option value="In Manutenzione">In Manutenzione</option>
          <option value="Fermo">Fermo</option>
          <option value="Dismesso">Dismesso</option>
        </select>
      );
    }

    // Date inputs
    if (
      header.toLowerCase().includes('data') ||
      header.toLowerCase().includes('assunzione') ||
      header === 'D. Acquisto'
    ) {
      return (
        <input
          type="date"
          value={val}
          onChange={(e) => handleChange(header, e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
        />
      );
    }

    // Number inputs
    if (
      header.includes('Km') ||
      header.includes('Qta') ||
      header.includes('Quantità') ||
      header.includes('Totaliz') ||
      header.includes('N_tot')
    ) {
      return (
        <input
          type="number"
          step="any"
          value={val}
          onChange={(e) => handleChange(header, parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
        />
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => handleChange(header, e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Nuovo Record: {config.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">File sorgente: {config.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.expectedHeaders.map((header) => (
              <div
                key={header}
                className={
                  header === 'Note' || header === 'Titolo' || header === 'CANTIERE'
                    ? 'sm:col-span-2'
                    : ''
                }
              >
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{header}</span>
                  {header === config.primaryKey && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      PRIMARY KEY
                    </span>
                  )}
                </label>
                {renderFieldInput(header)}
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salva Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
