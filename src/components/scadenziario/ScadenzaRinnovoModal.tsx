import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Calendar,
  FileCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ScadenzaItem, calcolaSemaforoScadenza, getBadgeColorSemaforo } from '../../types/scadenze';

interface ScadenzaRinnovoModalProps {
  scadenza: ScadenzaItem;
  onClose: () => void;
  onConfirm: (
    id: string,
    nuovaData: string,
    note?: string,
    nuovoProtocollo?: string,
    costo?: number
  ) => void;
}

export const ScadenzaRinnovoModal: React.FC<ScadenzaRinnovoModalProps> = ({
  scadenza,
  onClose,
  onConfirm,
}) => {
  // Pre-calcola una nuova data suggerita in base alla categoria
  const calcolaNuovaDataDefault = (): string => {
    const d = new Date(scadenza.dataScadenza);
    if (isNaN(d.getTime())) {
      const now = new Date();
      now.setFullYear(now.getFullYear() + 1);
      return now.toISOString().split('T')[0];
    }

    if (scadenza.categoria === 'durc') {
      // DURC ha validità 120 giorni
      d.setDate(d.getDate() + 120);
    } else if (scadenza.categoria === 'revisione_veicoli') {
      // Revisione biennale
      d.setFullYear(d.getFullYear() + 2);
    } else if (scadenza.categoria === 'patentini_sicurezza') {
      // PES/PAV quinquennale o annuale per visita medica
      if (scadenza.titolo.toLowerCase().includes('medica')) {
        d.setFullYear(d.getFullYear() + 1);
      } else {
        d.setFullYear(d.getFullYear() + 5);
      }
    } else {
      // Taratura annuale di default
      d.setFullYear(d.getFullYear() + 1);
    }
    return d.toISOString().split('T')[0];
  };

  const [nuovaData, setNuovaData] = useState<string>(calcolaNuovaDataDefault());
  const [nuovoProtocollo, setNuovoProtocollo] = useState<string>(scadenza.protocolloONumero || '');
  const [costo, setCosto] = useState<number>(scadenza.costoRinnovoPrevisto || 0);
  const [note, setNote] = useState<string>('');

  const calcAttuale = calcolaSemaforoScadenza(scadenza.dataScadenza);
  const badgeAttuale = getBadgeColorSemaforo(calcAttuale.stato);

  const calcNuovo = calcolaSemaforoScadenza(nuovaData);
  const badgeNuovo = getBadgeColorSemaforo(calcNuovo.stato);

  const applyAddDays = (days: number) => {
    const base = new Date();
    base.setDate(base.getDate() + days);
    setNuovaData(base.toISOString().split('T')[0]);
  };

  const applyAddYears = (years: number) => {
    const base = new Date();
    base.setFullYear(base.getFullYear() + years);
    setNuovaData(base.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovaData) return;
    onConfirm(
      scadenza.id,
      nuovaData,
      note || `Rinnovato con successo (precedente scadenza: ${scadenza.dataScadenza})`,
      nuovoProtocollo,
      Number(costo)
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Rinnova Scadenza & Proroga
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggiornamento validità a norma di legge e azzeramento semaforo di allerta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Elemento da Rinnovare
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {scadenza.titolo}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {scadenza.soggetto} {scadenza.ruoloORipartizione && `· ${scadenza.ruoloORipartizione}`}
              </p>
            </div>
            <div
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${badgeAttuale.bg} ${badgeAttuale.border} ${badgeAttuale.text}`}
            >
              {badgeAttuale.label} (
              {calcAttuale.giorniRimanenti < 0
                ? `${Math.abs(calcAttuale.giorniRimanenti)} gg fa`
                : `${calcAttuale.giorniRimanenti} gg`}
              )
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 text-[10px] block">Data Scadenza Attuale</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {scadenza.dataScadenza}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 text-[10px] block">Protocollo / Attestato Corrente</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                {scadenza.protocolloONumero || 'Nessuno'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Quick preset buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proroga Rapida (Intervalli Standard di Legge)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyAddDays(120)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors text-center shadow-sm"
              >
                +120 gg (DURC)
              </button>
              <button
                type="button"
                onClick={() => applyAddYears(1)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors text-center shadow-sm"
              >
                +1 Anno (Taratura / Visita)
              </button>
              <button
                type="button"
                onClick={() => applyAddYears(2)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors text-center shadow-sm"
              >
                +2 Anni (Revisione)
              </button>
              <button
                type="button"
                onClick={() => applyAddYears(5)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors text-center shadow-sm"
              >
                +5 Anni (PES/PAV/PLE)
              </button>
            </div>
          </div>

          {/* New Date and New Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nuova Data di Scadenza *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={nuovaData}
                  onChange={(e) => setNuovaData(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nuovo Numero Protocollo / Certificato
              </label>
              <input
                type="text"
                placeholder="es. INPS_48192019 / LAT102-2026/10"
                value={nuovoProtocollo}
                onChange={(e) => setNuovoProtocollo(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
              />
            </div>
          </div>

          {/* Cost and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Costo Effettivo Rinnovo (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ente Esecutore / Laboratorio
              </label>
              <input
                type="text"
                defaultValue={scadenza.enteRilascio || ''}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note di Rinnovo / Esito Collaudo
            </label>
            <textarea
              rows={2}
              placeholder="es. Taratura effettuata con esito Conforme; rilasciato verbale Accredia n. LAT102/2026 allegato agli atti."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-none shadow-sm"
            />
          </div>

          {/* Preview of New Status */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Nuovo Stato Semaforo previsto:</span>
            </div>
            <div
              className={`px-2.5 py-0.5 rounded text-xs font-black uppercase border ${badgeNuovo.bg} ${badgeNuovo.border} ${badgeNuovo.text}`}
            >
              {badgeNuovo.label} ({calcNuovo.giorniRimanenti} gg rimanenti)
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Conferma Rinnovo & Salva</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
