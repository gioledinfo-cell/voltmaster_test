import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Calendar,
  X,
  FileCheck,
  Building2,
  RefreshCw,
  Eye,
  Percent,
} from 'lucide-react';
import {
  ComputoMetricoImportResult,
  parseXpweComputo,
  parseExcelOrCsvComputo,
  getSampleXpweXml,
  getSampleExcelComputoData,
  convertComputoToPreventivoVoci,
  convertComputoToGanttFasi,
} from '../../services/computoMetricoService';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Preventivo } from '../../types';

interface ImportComputoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToPreventivo?: (payload: Omit<Preventivo, 'id'>) => void;
  onImportToGanttFasi?: (fasi: any[]) => void;
  targetCantiereId?: string;
}

export const ImportComputoModal: React.FC<ImportComputoModalProps> = ({
  isOpen,
  onClose,
  onImportToPreventivo,
  onImportToGanttFasi,
  targetCantiereId,
}) => {
  const { cantieri, clienti, showToast, addPreventivo, setActiveTab, setSelectedCantiereId } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ComputoMetricoImportResult | null>(null);
  const [importDestination, setImportDestination] = useState<'preventivo' | 'gantt' | 'entrambi'>('preventivo');
  const [selectedCantiere, setSelectedCantiereIdState] = useState<string>(targetCantiereId || cantieri[0]?.id || '');
  const [selectedCliente, setSelectedCliente] = useState<string>(clienti[0]?.ragioneSociale || 'Cliente da Computo');

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();

      if (lowerName.endsWith('.xpwe') || lowerName.endsWith('.xml')) {
        const text = await file.text();
        const result = parseXpweComputo(text, fileName);
        setParsedResult(result);
        showToast(`Computo PriMus ${fileName} caricato: ${result.totaleVoci} voci analizzate!`, 'success');
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const result = parseExcelOrCsvComputo(buffer, fileName);
        setParsedResult(result);
        showToast(`Computo Excel ${fileName} elaborato con successo!`, 'success');
      } else if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        const result = parseExcelOrCsvComputo(text, fileName);
        setParsedResult(result);
        showToast(`Computo CSV ${fileName} elaborato con successo!`, 'success');
      } else {
        throw new Error('Formato non supportato. Utilizzare file .xpwe (PriMus), .xlsx, .xls o .csv');
      }
    } catch (err: any) {
      console.error('Errore parsing computo:', err);
      setParseError(err.message || 'Errore durante la lettura del file di computo.');
      showToast('Errore durante l\'importazione del computo metrico.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSampleXpwe = () => {
    setIsParsing(true);
    setParseError(null);
    try {
      const xml = getSampleXpweXml();
      const result = parseXpweComputo(xml, 'Computo_Uffici_PriMus_ACCA.xpwe');
      setParsedResult(result);
      showToast('Esempio standard PriMus ACCA Software caricato!', 'success');
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSampleExcel = () => {
    setIsParsing(true);
    setParseError(null);
    try {
      const data = getSampleExcelComputoData();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Computo Industriale');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const result = parseExcelOrCsvComputo(wbout, 'Computo_Impianto_Industriale.xlsx');
      setParsedResult(result);
      showToast('Esempio Excel Computo Impiantistico caricato!', 'success');
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!parsedResult) return;

    const { materiali, manodopera } = convertComputoToPreventivoVoci(parsedResult);
    const chosenCantiere = cantieri.find((c) => c.id === selectedCantiere);

    // 1. Azione Preventivo
    if (importDestination === 'preventivo' || importDestination === 'entrambi') {
      const totaleMaterialiVendita = materiali.reduce((acc, m) => acc + m.totaleVendita, 0);
      const totaleManodopera = manodopera.reduce((acc, mo) => acc + mo.totale, 0);
      const imponibileTotale = totaleMaterialiVendita + totaleManodopera;
      const aliquotaIva = 22;
      const importoIva = Math.round(imponibileTotale * (aliquotaIva / 100) * 100) / 100;
      const totaleIvato = Math.round((imponibileTotale + importoIva) * 100) / 100;

      const payload: Omit<Preventivo, 'id'> = {
        numero: `PREV-COMP-${Date.now().toString().slice(-4)}`,
        dataEmissione: new Date().toISOString().split('T')[0],
        dataScadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clienteId: chosenCantiere ? (chosenCantiere.cliente || 'CLI-01') : (clienti[0]?.id || 'CLI-01'),
        clienteNome: chosenCantiere ? chosenCantiere.clienteNome : selectedCliente,
        oggetto: `${parsedResult.titolo} (Importato da ${parsedResult.softwareSorgente})`,
        stato: 'bozza',
        materiali,
        manodopera,
        voci: [],
        tariffaOraria: 35.0,
        percentualeRicaricoMateriali: 30,
        percentualeScontoMaggiorazione: 0,
        subtotaleMaterialiCosto: materiali.reduce((acc, m) => acc + m.totaleCosto, 0),
        subtotaleMateriali: totaleMaterialiVendita,
        subtotaleManodopera: totaleManodopera,
        totaleLavorazioni: imponibileTotale,
        totaleImponibile: imponibileTotale,
        imponibile: imponibileTotale,
        aliquotaIva,
        ivaPercentuale: aliquotaIva,
        ivaImporto: importoIva,
        totaleIvato,
        totale: totaleIvato,
        note: `Computo metrico importato con ${parsedResult.totaleVoci} articoli distribuiti su ${parsedResult.categorie.length} categorie di lavorazione.`,
      };

      if (onImportToPreventivo) {
        onImportToPreventivo(payload);
      } else {
        const created = addPreventivo(payload);
        showToast(`Preventivo ${created.numero} generato da computo! (${totaleIvato.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })})`, 'success');
        setActiveTab('preventivi');
      }
    }

    // 2. Azione Cronoprogramma Gantt
    if (importDestination === 'gantt' || importDestination === 'entrambi') {
      const fasiGantt = convertComputoToGanttFasi(parsedResult, selectedCantiere || 'CNT-01');
      if (onImportToGanttFasi) {
        onImportToGanttFasi(fasiGantt);
      } else {
        showToast(`Cronoprogramma Gantt popolato con ${fasiGantt.length} fasi di cantiere stimate!`, 'success');
        setSelectedCantiereId(selectedCantiere);
        setActiveTab('gantt_squadre');
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Import Computo Metrico Esterno
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  PriMus .xpwe & Excel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Popola preventivi, capitolati e cronoprogramma Gantt in 1 click dal software di computo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Dropzone & Quick Samples */}
          {!parsedResult && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xpwe,.xml,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 mx-auto mb-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Trascina qui il file di Computo o Clicca per Selezionare
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Formati supportati: <strong className="text-amber-600 dark:text-amber-400">PriMus ACCA (.xpwe / .xml)</strong>, fogli di calcolo <strong className="text-amber-600 dark:text-amber-400">Excel (.xlsx / .xls)</strong> e file tabellari <strong className="text-amber-600 dark:text-amber-400">CSV</strong>.
                </p>
              </div>

              {/* 1-Click Samples for Instant Testing */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Oppure Collauda Subito con File di Esempio Certificati:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleLoadSampleXpwe}
                    disabled={isParsing}
                    className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 hover:border-amber-500 rounded-xl text-left transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-lg">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600">
                          Esempio PriMus ACCA (.xpwe)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Impianto Elettrico & Dati Uffici (8 Voci, 7 Cat.)
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleExcel}
                    disabled={isParsing}
                    className="p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-500 rounded-xl text-left transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-lg">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                          Esempio Excel Computo (.xlsx)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Impianto Industriale & Canali (6 Voci di tariffa)
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading spinner */}
          {isParsing && (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Analisi del file di computo metrico in corso...
              </p>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong>Errore Importazione:</strong> {parseError}
              </div>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Summary Cards */}
              <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] font-mono uppercase font-bold tracking-wider">
                    <FileCheck className="w-3.5 h-3.5" /> {parsedResult.softwareSorgente}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {parsedResult.titolo}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data: {parsedResult.dataComputo} • Autore: {parsedResult.autore || 'Ufficio Tecnico'}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Totale Computo</div>
                    <div className="text-xl font-black text-amber-400 font-mono">
                      {parsedResult.totaleImporto.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Voci Rilevate</div>
                    <div className="text-xl font-black text-white font-mono">
                      {parsedResult.totaleVoci}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Ripartizione Categorie / Fasi di Cantiere ({parsedResult.categorie.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Mappate automaticamente per il Cronoprogramma Gantt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {parsedResult.categorie.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.nome}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cat.vociCount} {cat.vociCount === 1 ? 'voce' : 'voci'} • {cat.percentualeSuTotale}%
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {cat.importo.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Table Preview */}
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-500" />
                    Dettaglio Articoli & Misurazioni ({parsedResult.voci.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setParsedResult(null)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                  >
                    Carica Altro File
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3">Tariffa</th>
                        <th className="py-2 px-3">Categoria / Descrizione</th>
                        <th className="py-2 px-2 text-center">U.M.</th>
                        <th className="py-2 px-3 text-right">Q.tà</th>
                        <th className="py-2 px-3 text-right">Prezzo Unit.</th>
                        <th className="py-2 px-3 text-right">Importo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedResult.voci.map((voce) => (
                        <tr key={voce.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {voce.codiceTariffa}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-slate-400 block">
                              {voce.categoria}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 line-clamp-1">
                              {voce.descrizione}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500 font-mono">
                            {voce.unitaMisura}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium">
                            {voce.quantita}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                            € {voce.prezzoUnitario.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            € {voce.totaleImporto.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Seleziona Destinazione dell'Importazione:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importDestination === 'preventivo'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="dest"
                        value="preventivo"
                        checked={importDestination === 'preventivo'}
                        onChange={() => setImportDestination('preventivo')}
                        className="accent-slate-950"
                      />
                      <span className="text-xs font-bold">Preventivo / Capitolato</span>
                    </div>
                    <span className="text-[10px] opacity-80">
                      Crea offerta con materiali, manodopera e ricarico
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importDestination === 'gantt'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="dest"
                        value="gantt"
                        checked={importDestination === 'gantt'}
                        onChange={() => setImportDestination('gantt')}
                        className="accent-slate-950"
                      />
                      <span className="text-xs font-bold">Cronoprogramma Gantt</span>
                    </div>
                    <span className="text-[10px] opacity-80">
                      Genera fasi di cantiere con durate stimate per importo
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importDestination === 'entrambi'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="dest"
                        value="entrambi"
                        checked={importDestination === 'entrambi'}
                        onChange={() => setImportDestination('entrambi')}
                        className="accent-slate-950"
                      />
                      <span className="text-xs font-bold">Entrambi (Preventivo + Gantt)</span>
                    </div>
                    <span className="text-[10px] opacity-80">
                      Sincronizzazione contabile e pianificazione
                    </span>
                  </label>
                </div>

                {/* Selezione Cantiere di Appoggio */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Assegna al Cantiere:
                    </label>
                    <select
                      value={selectedCantiere}
                      onChange={(e) => setSelectedCantiereIdState(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-900 dark:text-white"
                    >
                      {cantieri.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.titolo} ({c.clienteNome})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Annulla
          </button>

          {parsedResult && (
            <button
              type="button"
              onClick={handleExecuteImport}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Importa nel Sistema (1 Click)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
