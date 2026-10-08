import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Barcode,
  Layers,
  Sparkles,
  Info,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  parseRemaTarlazziFile,
  applyRemaTarlazziDiffsToCatalog,
  applyRemaTarlazziDiffsToListinoFornitore,
  generateSampleRemaTarlazziExcel,
  RemaTarlazziImportSummary,
  RemaTarlazziDiffItem,
} from '../../utils/remaTarlazziParser';
import { playSuccessChime } from '../../utils/audioChime';

interface AggiornaListinoExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

export const AggiornaListinoExcelModal: React.FC<AggiornaListinoExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { magazzino, addArticoliMagazzinoBatch, listinoFornitore, updateListinoFornitore, showToast } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<RemaTarlazziImportSummary | null>(null);
  const [filterTab, setFilterTab] = useState<'tutti' | 'nuovi' | 'aggiornati'>('tutti');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const parsedSummary = await parseRemaTarlazziFile(file, magazzino);
      setSummary(parsedSummary);
      playSuccessChime();
      showToast(
        `Listino ${file.name} analizzato: ${parsedSummary.newCount} nuovi articoli, ${parsedSummary.updatedCount} aggiornati!`,
        'info'
      );
    } catch (err: any) {
      console.error('Errore parsing listino:', err);
      setErrorMsg(err.message || 'Errore durante la lettura del file Excel.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSimulaEsempio = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Simula caricamento dati standard RemaTarlazzi LISRTAXLS
      const sampleCsv = `Cod.Art.RemaTarlazzi;Descrizione Articolo;Prezzo Cliente;Prezzo Listino;Unità di Misura;Barcode Produttore
RT-BT-K4001;BTicino Living Now Interruttore 1P 10AX 250V AC;3,45;7,20;NR;8012199991201
RT-BT-K4140;BTicino Living Now Presa Bipasso 2P+T 10/16A;4,85;9,90;NR;8012199991202
RT-BT-K4003;BTicino Living Now Deviatore 1P 10AX 250V AC;4,20;8,50;NR;8012199991203
RT-PRY-FG16-3G25;Prysmian Cavo FG16OR16 3G2.5 mm² CPR Cca;1,42;2,40;ML;8024220019284
RT-PRY-FG16-5G6;Prysmian Cavo FG16OR16 5G6 mm² dorsale cantiere;3,95;6,80;ML;8024220019291
RT-SCH-A9F74116;Schneider Acti9 iC60N Magnetotermico 1P+N C16 6kA;9,80;18,50;NR;3606480439812
RT-SCH-A9R11225;Schneider Acti9 iID Differenziale Puro 2P 25A 30mA Tipo A;24,50;49,00;NR;3606480439829
RT-GEW-GW40003;Gewiss Centralino incasso 12 moduli IP40 porta fumé;11,20;22,40;NR;8011564010034
RT-GEW-DX15020;Gewiss Tubo corrugato pieghevole medio ICTA d.20mm;0,32;0,65;ML;8011564010041
RT-PHI-LED-6060;Philips CoreLine Pannello LED 60x60 34W 4000K;28,90;58,00;NR;8718699380123
RT-VMR-14008;Vimar Plana Interruttore 1P 16AX 250V AC Bianco;2,90;5,80;NR;8007352014088
RT-ABB-S201-C10;ABB Magnetotermico S201L C10 1P 4.5kA;6,70;13,20;NR;7612270100122`;

      const encoder = new TextEncoder();
      const buffer = encoder.encode(sampleCsv);
      const parsedSummary = await parseRemaTarlazziFile(buffer, magazzino);
      setSummary(parsedSummary);
      playSuccessChime();
      showToast('File di esempio RemaTarlazzi caricato con successo!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la simulazione.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!summary || summary.diffs.length === 0) return;

    const { updatedCatalog, appliedCount } = applyRemaTarlazziDiffsToCatalog(summary.diffs, magazzino);
    const updatedListino = applyRemaTarlazziDiffsToListinoFornitore(summary.diffs, listinoFornitore);

    // Esegui batch update attraverso il context
    addArticoliMagazzinoBatch(updatedCatalog);
    updateListinoFornitore(updatedListino);

    playSuccessChime();
    showToast(
      `Listino Prezzi RemaTarlazzi aggiornato con successo! ${appliedCount} articoli aggiornati nel listino fornitore.`,
      'success'
    );

    if (onSuccess) {
      onSuccess(appliedCount);
    }
    onClose();
  };

  // Filtraggio righe per preview
  const filteredDiffs = (summary?.diffs || []).filter((diff) => {
    if (filterTab === 'nuovi' && diff.status !== 'new') return false;
    if (filterTab === 'aggiornati' && diff.status !== 'updated') return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchSku = diff.item.codiceSku.toLowerCase().includes(q);
      const matchName = diff.item.nome.toLowerCase().includes(q);
      const matchBarcode = diff.item.barcodeEan?.toLowerCase().includes(q);
      return matchSku || matchName || matchBarcode;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Aggiorna Listino Prezzi da Excel (RemaTarlazzi)
                </h2>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Foglio LISRTAXLS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggiorna automaticamente i prezzi d'acquisto scontati e i prezzi di listino, integrando i nuovi articoli a giacenza 0.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Box Caricamento File */}
          {!summary ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/30 hover:bg-emerald-500/5 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Trascina qui il file Excel o clicca per sfogliare
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                  Supporta file <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong> con foglio <code>LISRTAXLS</code> (tracciato standard fornitore RemaTarlazzi o equivalente).
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Seleziona File dal Computer</span>
                </div>
              </div>

              {/* Specifiche Tracciato RemaTarlazzi */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-500" />
                    Tracciato Colonne Supportato (Foglio 'LISRTAXLS'):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulaEsempio}
                      disabled={isLoading}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Carica Demo Immediata</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={generateSampleRemaTarlazziExcel}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Scarica File Template .xlsx</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 1</span>
                    <strong className="text-slate-800 dark:text-slate-200">Cod.Art.RemaTarlazzi</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 2</span>
                    <strong className="text-slate-800 dark:text-slate-200">Descrizione Articolo</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 3</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">Prezzo Cliente (Acq.)</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 4</span>
                    <strong className="text-slate-800 dark:text-slate-200">Prezzo Listino (Ven.)</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 5</span>
                    <strong className="text-slate-800 dark:text-slate-200">Unità di Misura (NR/ML)</strong>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Colonna 6</span>
                    <strong className="text-slate-800 dark:text-slate-200">Barcode Produttore</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistiche di Riepilogo Importazione */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Righe Totali File</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {summary.validParsed}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Foglio: <strong>{summary.sheetUsed}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-bold">
                    <Plus className="w-3.5 h-3.5" /> Nuovi Articoli
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {summary.newCount}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 mt-0.5">
                    Giacenza iniziale a 0 pz
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-bold">
                    <RefreshCw className="w-3.5 h-3.5" /> Prezzi Aggiornati
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    {summary.updatedCount}
                  </div>
                  <div className="text-[10px] text-amber-600/80 mt-0.5">
                    Confrontati con SKU/EAN
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Prezzi Invariati</div>
                  <div className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                    {summary.unchangedCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Nessuna variazione listino
                  </div>
                </div>
              </div>

              {/* Filtri e Ricerca Tabella */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterTab('tutti')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterTab === 'tutti'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tutti ({summary.diffs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('nuovi')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterTab === 'nuovi'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
                    }`}
                  >
                    Solo Nuovi ({summary.newCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('aggiornati')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterTab === 'aggiornati'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                    }`}
                  >
                    Solo Aggiornati ({summary.updatedCount})
                  </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Cerca per SKU, nome, EAN..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tabella di Anteprima Modifiche */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Stato</th>
                      <th className="p-2.5">Cod. Art. RemaTarlazzi</th>
                      <th className="p-2.5">Descrizione Articolo</th>
                      <th className="p-2.5">UM</th>
                      <th className="p-2.5 text-right">Prezzo Acquisto</th>
                      <th className="p-2.5 text-right">Prezzo Listino</th>
                      <th className="p-2.5">Barcode / EAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {filteredDiffs.map((diff) => {
                      const isNew = diff.status === 'new';
                      const isUpdated = diff.status === 'updated';

                      return (
                        <tr
                          key={diff.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            isNew
                              ? 'bg-emerald-500/5'
                              : isUpdated
                              ? 'bg-amber-500/5'
                              : ''
                          }`}
                        >
                          <td className="p-2.5">
                            {isNew ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <Plus className="w-3 h-3" /> NUOVO
                              </span>
                            ) : isUpdated ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <RefreshCw className="w-3 h-3" /> AGGIORNATO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Invariato
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {diff.item.codiceSku}
                          </td>

                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                              {diff.item.nome}
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              {diff.item.categoria.replace('_', ' ')}
                            </div>
                          </td>

                          <td className="p-2.5 font-mono uppercase text-slate-600 dark:text-slate-400">
                            {diff.item.unitaMisura}
                          </td>

                          <td className="p-2.5 text-right font-mono">
                            {isUpdated && diff.oldPrezzoAcquisto !== undefined ? (
                              <div>
                                <span className="line-through text-slate-400 text-[10px] block">
                                  € {diff.oldPrezzoAcquisto.toFixed(2)}
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  € {diff.newPrezzoAcquisto.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                € {diff.newPrezzoAcquisto.toFixed(2)}
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                            {isUpdated && diff.oldPrezzoListino !== undefined ? (
                              <div>
                                <span className="line-through text-slate-400 text-[10px] block">
                                  € {diff.oldPrezzoListino.toFixed(2)}
                                </span>
                                <span className="font-semibold">
                                  € {diff.newPrezzoListino.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span>€ {diff.newPrezzoListino.toFixed(2)}</span>
                            )}
                          </td>

                          <td className="p-2.5 font-mono text-[11px] text-slate-500">
                            {diff.item.barcodeEan ? (
                              <span className="inline-flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-slate-400" />
                                {diff.item.barcodeEan}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            {summary && (
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
              >
                ← Carica un altro file
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>

            {summary && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={summary.diffs.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Conferma e Salva nel Catalogo ({summary.newCount + summary.updatedCount} Articoli)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
