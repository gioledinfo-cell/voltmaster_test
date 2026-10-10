import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ImpostazioniTabId, ImportValidationResult } from '../../types/anagrafica';
import { anagraficaExcelService } from '../../services/anagraficaExcelService';

interface ImportAnagraficaModalProps {
  isOpen: boolean;
  tab: ImpostazioniTabId;
  tabLabel: string;
  existingData: any[];
  onCommitImport: (items: any[]) => void;
  onClose: () => void;
}

export const ImportAnagraficaModal: React.FC<ImportAnagraficaModalProps> = ({
  isOpen,
  tab,
  tabLabel,
  existingData,
  onCommitImport,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ImportValidationResult<any> | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setResult(null);

    try {
      const res = await anagraficaExcelService.importFromExcel(tab, file, existingData);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        importedItems: [],
        updatedCount: 0,
        insertedCount: 0,
        errors: [
          {
            row: 0,
            message: `Errore durante la lettura del file: ${err?.message || 'Formato non supportato.'}`,
            rawRowData: {},
          },
        ],
        totalParsed: 0,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!result || result.importedItems.length === 0) return;
    onCommitImport(result.importedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Importazione Excel / CSV
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {tabLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Carica un file .xlsx, .xls o .csv con le intestazioni standard per aggiornare l'anagrafica.
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

        {/* Quick Template Download Info */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Hai bisogno del modello corretto?</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                Scarica il template Excel precompilato con le colonne raccomandate e 2 righe di esempio esplicative.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => anagraficaExcelService.downloadTemplate(tab)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Scarica Template
          </button>
        </div>

        {/* Drag and drop area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Trascina qui il file Excel o CSV, oppure <span className="text-amber-600 dark:text-amber-400 underline">sfoglia dal computer</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Formati supportati: Microsoft Excel (.xlsx, .xls) e Testo Delimitato (.csv)
          </p>
          {selectedFile && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Parsing Indicator */}
        {isParsing && (
          <div className="mt-4 p-4 text-center">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Analisi e validazione colonne in corso...
            </p>
          </div>
        )}

        {/* Validation Results & Preview */}
        {result && (
          <div className="mt-4 space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Righe Lette</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{result.totalParsed}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Nuovi Inseriti</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">+{result.insertedCount}</span>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Aggiornati</span>
                <span className="text-sm font-black text-blue-700 dark:text-blue-300 mt-0.5 block">{result.updatedCount}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                result.errors.length > 0
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                <span className="text-[10px] uppercase font-bold block">Errori / Saltati</span>
                <span className="text-sm font-black mt-0.5 block">{result.errors.length}</span>
              </div>
            </div>

            {/* Error detail list if any */}
            {result.errors.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-h-36 overflow-y-auto space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Attenzione: Rilevate {result.errors.length} anomalie nelle righe del file</span>
                </div>
                {result.errors.map((err, i) => (
                  <div key={i} className="text-[11px] text-rose-700 dark:text-rose-400 pl-5">
                    <span className="font-mono font-bold">Riga {err.row}:</span> {err.message}
                  </div>
                ))}
              </div>
            )}

            {/* Success Preview */}
            {result.importedItems.length > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Validazione superata: {result.importedItems.length} record pronti per essere importati.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Annulla
          </button>

          <button
            type="button"
            disabled={!result || result.importedItems.length === 0}
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all ${
              !result || result.importedItems.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Conferma e Importa in Archivio ({result?.importedItems.length || 0})
          </button>
        </div>
      </div>
    </div>
  );
};
