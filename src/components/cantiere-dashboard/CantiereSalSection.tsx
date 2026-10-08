import React, { useState } from 'react';
import { StatoAvanzamentoLavori } from '../../types/sal';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Plus,
  ChevronRight,
  FileCheck,
  CheckCircle2,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { SalDetailModal } from '../sal/SalDetailModal';
import { SalFormModal } from '../sal/SalFormModal';
import { CertificatoPagamentoModal } from '../sal/CertificatoPagamentoModal';
import { exportSalExcel } from '../../utils/salExportService';

interface CantiereSalSectionProps {
  cantiereId: string;
}

export const CantiereSalSection: React.FC<CantiereSalSectionProps> = ({ cantiereId }) => {
  const {
    cantieri,
    preventivi,
    lavorazioni,
    sals,
    addSal,
    approvaSalDL,
    emettiCertificatoPagamento,
    liquidaSal,
    showToast,
  } = useApp();

  const [selectedSal, setSelectedSal] = useState<StatoAvanzamentoLavori | null>(null);
  const [selectedCertSal, setSelectedCertSal] = useState<StatoAvanzamentoLavori | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const siteSals = sals.filter((s) => s.cantiereId === cantiereId);
  const cantiere = cantieri.find((c) => c.id === cantiereId);

  // Totali cantiere
  const budgetTotale = siteSals[0]?.importoContrattualeTotale || cantiere?.budgetTotale || 50000;
  const ultimoSal = [...siteSals].sort((a, b) => b.numeroSal - a.numeroSal)[0];
  const totaleMaturato = ultimoSal?.totaleLavoriCumulati || 0;
  const percAvanzamento = budgetTotale > 0 ? (totaleMaturato / budgetTotale) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              Stato Avanzamento Lavori (S.A.L.) & Contabilità di Commessa
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Contabilità a corpo e a misura, libretto delle misure e certificati di pagamento emessi dalla Direzione Lavori.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuovo SAL</span>
        </button>
      </div>

      {/* Mini Progress Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 block">Budget Contrattuale</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
            € {budgetTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400 block">Lavori Eseguiti a Oggi</span>
          <span className="text-sm font-black text-amber-700 dark:text-amber-300">
            € {totaleMaturato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-sans text-emerald-600 dark:text-emerald-400 block">Avanzamento Globale</span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {percAvanzamento.toFixed(1)}%
          </span>
        </div>

        <div>
          <span className="text-[10px] font-sans text-sky-600 dark:text-sky-400 block">Rimanenza a Finire</span>
          <span className="text-sm font-bold text-sky-700 dark:text-sky-300">
            € {(budgetTotale - totaleMaturato).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SALs Table */}
      {siteSals.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs italic">
          Nessun SAL ancora emesso per questo cantiere. Clicca su "Nuovo SAL" per redigere il primo stato di avanzamento.
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">SAL</th>
                <th className="py-2.5 px-3">Periodo di Riferimento</th>
                <th className="py-2.5 px-3 text-right">Maturato Periodo</th>
                <th className="py-2.5 px-3 text-right">Cumulato a Oggi</th>
                <th className="py-2.5 px-3 text-center">Avanzamento</th>
                <th className="py-2.5 px-3">Stato</th>
                <th className="py-2.5 px-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {siteSals.map((sal) => (
                <tr key={sal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">{sal.codiceSal}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300 text-[11px]">
                    Dal {sal.periodoInizio} al {sal.periodoFine}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-300 font-bold">
                    € {sal.totaleLavoriPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
                    € {sal.totaleLavoriCumulati.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sal.percentualeAvanzamentoGlobale.toFixed(1)}%</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sal.stato === 'liquidato'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : sal.stato === 'certificato_emesso'
                          ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                          : sal.stato === 'approvato_dl'
                          ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sal.stato.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSal(sal)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
                        title="Visualizza Libretto Misure e Contabilità"
                      >
                        Libretto
                      </button>

                      {sal.certificatoPagamento && (
                        <button
                          onClick={() => setSelectedCertSal(sal)}
                          className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                          title="Certificato di Pagamento"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          exportSalExcel(sal);
                          showToast(`Export Excel per ${sal.codiceSal} avviato!`, 'success');
                        }}
                        className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                        title="Esporta Excel"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {selectedSal && (
        <SalDetailModal
          isOpen={!!selectedSal}
          onClose={() => setSelectedSal(null)}
          sal={selectedSal}
          onApprovaDL={approvaSalDL}
          onEmettiCertificato={emettiCertificatoPagamento}
          onLiquida={liquidaSal}
          onShowToast={showToast}
        />
      )}

      {selectedCertSal && (
        <CertificatoPagamentoModal
          isOpen={!!selectedCertSal}
          onClose={() => setSelectedCertSal(null)}
          sal={selectedCertSal}
          onLiquida={liquidaSal}
          onShowToast={showToast}
        />
      )}

      {isFormOpen && (
        <SalFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          cantieri={cantieri}
          preventivi={preventivi}
          lavorazioni={lavorazioni}
          existingSals={sals}
          initialCantiereId={cantiereId}
          onSave={addSal}
        />
      )}
    </div>
  );
};
