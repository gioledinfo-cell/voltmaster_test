import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Truck,
  MapPin,
  Building2,
  Package,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Download,
} from 'lucide-react';
import { DocumentoDiTrasporto } from '../../types/ddt';
import { useApp } from '../../context/AppContext';
import { exportDdtSingoloToCsv } from '../../utils/ddtExportService';

interface DdtDetailModalProps {
  ddt: DocumentoDiTrasporto;
  onClose: () => void;
  onOpenPrint: (ddt: DocumentoDiTrasporto) => void;
}

export const DdtDetailModal: React.FC<DdtDetailModalProps> = ({ ddt, onClose, onOpenPrint }) => {
  const { confermaConsegnaDdt, currentUser } = useApp();

  const [nomeRicevente, setNomeRicevente] = useState(
    ddt.nomeRiceventeCantiere || currentUser.name
  );
  const [isSignMode, setIsSignMode] = useState(false);

  const handleConferma = () => {
    confermaConsegnaDdt(ddt.id, nomeRicevente);
    setIsSignMode(false);
  };

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'consegnato':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Consegnato & Convalidato
          </span>
        );
      case 'in_viaggio':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            In Transito verso Cantiere
          </span>
        );
      case 'bozza':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-500/30">
            Bozza in Preparazione
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {ddt.numeroDdt}
                </h2>
                {getStatusBadge(ddt.stato)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emissione del {ddt.dataEmissione} {ddt.oraPartenza ? `ore ${ddt.oraPartenza}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(ddt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
              title="Stampa Documento Ufficiale"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Stampa DDT</span>
            </button>
            <button
              onClick={() => exportDdtSingoloToCsv(ddt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Esporta CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Cantiere & Trasporto Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Destinazione Cantiere
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{ddt.cantiereNome}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {ddt.cantiereIndirizzo}, {ddt.cantiereCitta}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                Cliente: <strong className="text-slate-800 dark:text-slate-200">{ddt.clienteNome}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Vettore & Conducente
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {ddt.veicoloModello || 'Mezzo proprio'}
              </div>
              <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                Targa: {ddt.veicoloTarga || 'N/D'} · Autista: {ddt.autistaNome || 'Incaricato interno'}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                Causale: <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{ddt.causaleTrasporto.replace('_', ' ')}</span> · {ddt.numeroColli} colli ({ddt.pesoTotaleKg} kg)
              </div>
            </div>
          </div>

          {/* Table of Articles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                Dettaglio Righe Merci Trasportate ({ddt.righe.length})
              </span>
              <span className="text-slate-400 font-normal">Totale {ddt.numeroColli} colli</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3 w-10 text-center">N.</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Descrizione</th>
                    <th className="py-2.5 px-3 text-center">U.M.</th>
                    <th className="py-2.5 px-3 text-right">Quantità</th>
                    <th className="py-2.5 px-3">Lotto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {ddt.righe.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.sku}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-medium">
                        {r.descrizione}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">{r.unitaMisura}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {r.quantita}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{r.lottoMatricola || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annotations */}
          {ddt.annotazioni && (
            <div className="p-3 bg-amber-50/50 dark:bg-slate-950/60 border border-amber-300/40 rounded-xl text-xs">
              <strong className="text-amber-800 dark:text-amber-400">Prescrizioni Consegna: </strong>
              <span className="text-slate-700 dark:text-slate-300">{ddt.annotazioni}</span>
            </div>
          )}

          {/* Site Receipt & Signoff Action */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Ricezione in Cantiere & Firma Digitale
              </span>

              {ddt.stato === 'consegnato' && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Ricevuto il {ddt.dataOraRicezione}
                </span>
              )}
            </div>

            {ddt.stato === 'consegnato' ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div>
                  Merce ricevuta regolarmente a piè d’opera da: <strong>{ddt.nomeRiceventeCantiere}</strong>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>
            ) : isSignMode ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome e Ruolo del Ricevente al Cantiere:
                  </label>
                  <input
                    type="text"
                    value={nomeRicevente}
                    onChange={(e) => setNomeRicevente(e.target.value)}
                    placeholder="Es. Ing. Fabbri (DL) o Capocantiere"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConferma}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma Consegna & Archivia</span>
                  </button>
                  <button
                    onClick={() => setIsSignMode(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  La merce è arrivata a destinazione? Registra la presa in carico da parte del cantiere.
                </p>
                <button
                  onClick={() => setIsSignMode(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registra Consegna Cantiere</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Emesso da {ddt.creatoDa.name}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
