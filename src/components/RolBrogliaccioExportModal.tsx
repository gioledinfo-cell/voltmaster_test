import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Euro,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportRolBrogliaccioExcel,
  exportRolBrogliaccioPdf,
  calcolaCostoManodoperaRol,
} from '../utils/rolBrogliaccioExportService';

interface RolBrogliaccioExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolBrogliaccioExportModal: React.FC<RolBrogliaccioExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rols, cantieri, dipendenti, showToast } = useApp();

  const [periodoPreset, setPeriodoPreset] = useState<'ottobre_2026' | 'settembre_2026' | 'anno_2026' | 'custom'>('ottobre_2026');
  const [dataDa, setDataDa] = useState<string>('2026-10-01');
  const [dataA, setDataA] = useState<string>('2026-10-31');
  const [selectedDipendenteId, setSelectedDipendenteId] = useState<string>('tutti');
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [soloFirmati, setSoloFirmati] = useState<boolean>(false);

  // Set date based on preset
  const handlePeriodoPresetChange = (preset: 'ottobre_2026' | 'settembre_2026' | 'anno_2026' | 'custom') => {
    setPeriodoPreset(preset);
    if (preset === 'ottobre_2026') {
      setDataDa('2026-10-01');
      setDataA('2026-10-31');
    } else if (preset === 'settembre_2026') {
      setDataDa('2026-09-01');
      setDataA('2026-09-30');
    } else if (preset === 'anno_2026') {
      setDataDa('2026-01-01');
      setDataA('2026-12-31');
    }
  };

  // Filtered ROLs
  const filteredRols = useMemo(() => {
    return rols.filter((r) => {
      // Date filter
      if (r.data < dataDa || r.data > dataA) return false;

      // Dipendente filter
      if (selectedDipendenteId !== 'tutti') {
        const dip = dipendenti.find((d) => d.id === selectedDipendenteId);
        if (dip && r.operatoreNome.toLowerCase() !== dip.nome.toLowerCase()) {
          return false;
        }
      }

      // Cantiere filter
      if (selectedCantiereId !== 'tutti' && r.cantiereId !== selectedCantiereId) {
        return false;
      }

      // Solo firmati filter
      if (soloFirmati && !r.firmaClientePresente && !r.firmaClienteDataUrl) {
        return false;
      }

      return true;
    });
  }, [rols, dataDa, dataA, selectedDipendenteId, selectedCantiereId, soloFirmati, dipendenti]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totOrd = 0;
    let totStr = 0;
    let totViag = 0;
    let totOre = 0;
    let totCosto = 0;
    let firmatiCount = 0;

    filteredRols.forEach((r) => {
      const v = r.hoursTravel || 0;
      const str = r.oreStraordinarie || 0;
      const ord = r.oreOrdinarie ?? Math.max(0, r.oreTotali - str - v);
      totOrd += ord;
      totStr += str;
      totViag += v;
      totOre += r.oreTotali || ord + str + v;
      totCosto += calcolaCostoManodoperaRol(r, dipendenti);
      if (r.firmaClientePresente || r.firmaClienteDataUrl) firmatiCount++;
    });

    const firmatiPct = filteredRols.length > 0 ? Math.round((firmatiCount / filteredRols.length) * 100) : 0;

    return { totOrd, totStr, totViag, totOre, totCosto, firmatiCount, firmatiPct };
  }, [filteredRols, dipendenti]);

  if (!isOpen) return null;

  const periodoLabel =
    periodoPreset === 'ottobre_2026'
      ? 'Ottobre 2026'
      : periodoPreset === 'settembre_2026'
      ? 'Settembre 2026'
      : periodoPreset === 'anno_2026'
      ? 'Anno 2026'
      : `Dal ${dataDa} al ${dataA}`;

  const handleExportExcel = () => {
    if (filteredRols.length === 0) {
      showToast('Nessun rapportino trovato per i filtri selezionati.', 'warning');
      return;
    }
    exportRolBrogliaccioExcel(filteredRols, cantieri, dipendenti, periodoLabel);
    showToast(`Brogliaccio Excel esportato con successo (${filteredRols.length} ROL)!`, 'success');
  };

  const handleExportPdf = () => {
    if (filteredRols.length === 0) {
      showToast('Nessun rapportino trovato per i filtri selezionati.', 'warning');
      return;
    }
    exportRolBrogliaccioPdf(filteredRols, cantieri, dipendenti, periodoLabel);
    showToast(`Brogliaccio PDF impaginato scaricato (${filteredRols.length} ROL)!`, 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/60">
                  Export & Reportistica Operativa
                </span>
                <span className="text-[10px] text-slate-400 font-mono">D.Lgs 81/08 · Brogliaccio</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                Esportazione Brogliaccio Mensile Rapportini (ROL)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* 1. Selezione Periodo Presets */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>1. Seleziona Periodo di Riferimento</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePeriodoPresetChange('ottobre_2026')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  periodoPreset === 'ottobre_2026'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="block text-[11px] font-bold">Mese Corrente</span>
                <span className="text-[10px] opacity-75">Ottobre 2026</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodoPresetChange('settembre_2026')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  periodoPreset === 'settembre_2026'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="block text-[11px] font-bold">Mese Precedente</span>
                <span className="text-[10px] opacity-75">Settembre 2026</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodoPresetChange('anno_2026')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  periodoPreset === 'anno_2026'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="block text-[11px] font-bold">Intero Anno 2026</span>
                <span className="text-[10px] opacity-75">Tutti i ROL dell'anno</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodoPresetChange('custom')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  periodoPreset === 'custom'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="block text-[11px] font-bold">Personalizzato</span>
                <span className="text-[10px] opacity-75">Scegli intervallo date</span>
              </button>
            </div>

            {/* Custom dates input row */}
            {periodoPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Inizio (Da)</label>
                  <input
                    type="date"
                    value={dataDa}
                    onChange={(e) => setDataDa(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Fine (A)</label>
                  <input
                    type="date"
                    value={dataA}
                    onChange={(e) => setDataA(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Filtri Cantiere & Dipendente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-500" />
                <span>2. Filtra per Tecnico / Dipendente</span>
              </label>
              <select
                value={selectedDipendenteId}
                onChange={(e) => setSelectedDipendenteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="tutti">Tutti i tecnici e capicantiere ({dipendenti.length})</option>
                {dipendenti.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} ({d.ruoloAziendale || d.reparto})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>3. Filtra per Cantiere / Commessa</span>
              </label>
              <select
                value={selectedCantiereId}
                onChange={(e) => setSelectedCantiereId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="tutti">Tutte le commesse e cantieri ({cantieri.length})</option>
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice} - {c.titolo} ({c.clienteNome})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox solo firmati */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloFirmati}
                onChange={(e) => setSoloFirmati(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                Esporta esclusivamente i rapportini con firma del committente presente
              </span>
            </label>
          </div>

          {/* 3. Live Metrics Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px] uppercase font-bold">
              <span>Anteprima Statistiche di Esportazione</span>
              <span className="text-amber-500 font-bold">
                {filteredRols.length} ROL Selezionati
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Ore Ordinarie</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {stats.totOrd} h
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-amber-500 block font-mono">Straordinari</span>
                <span className="text-sm font-black text-amber-500">
                  {stats.totStr} h
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Ore Viaggio</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {stats.totViag} h
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-emerald-500 block font-mono">Totale Ore Lavoro</span>
                <span className="text-sm font-black text-emerald-500">
                  {stats.totOre} h
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Costo Manodopera</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  € {stats.totCosto.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Anteprima rapida dei primi 4 ROL */}
          {filteredRols.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase font-mono">
                Anteprima Tabellare (Primi {Math.min(4, filteredRols.length)} di {filteredRols.length} ROL)
              </span>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredRols.slice(0, 4).map((r) => {
                  const isFirmato = Boolean(r.firmaClientePresente || r.firmaClienteDataUrl);
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-500">{r.numero}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400">{r.data}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {r.cantiereTitolo}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Tecnico: {r.operatoreNome}</span>
                          <span>·</span>
                          <span>Cliente: {r.clienteNome}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {r.oreTotali}h
                        </span>
                        {isFirmato ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                            Firmato ✓
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700">
                            Non firmato
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/70">
          <div className="text-slate-400 text-xs">
            Formato conforme a D.Lgs 81/08 e compatibile con studio paghe / commercialista.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Esporta Brogliaccio Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm shadow-amber-500/30 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Esporta Brogliaccio PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
