import React, { useState, useMemo } from 'react';
import { StatoAvanzamentoLavori, CertificatoPagamento } from '../../types/sal';
import { useApp } from '../../context/AppContext';
import { calcolaCongruitaManodoperaSAL } from '../../services/congruitaService';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Clock,
  UserCheck,
  Plus,
  CreditCard,
  Lock,
  Unlock,
} from 'lucide-react';
import { exportSalExcel } from '../../utils/salExportService';
import { CertificatoPagamentoModal } from './CertificatoPagamentoModal';
import { CongruitaManodoperaPanel } from './CongruitaManodoperaPanel';

interface SalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sal: StatoAvanzamentoLavori;
  onApprovaDL: (id: string, nomeDL: string, note?: string) => void;
  onEmettiCertificato: (salId: string, cert: CertificatoPagamento) => void;
  onLiquida: (salId: string, rifFattura?: string) => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SalDetailModal: React.FC<SalDetailModalProps> = ({
  isOpen,
  onClose,
  sal,
  onApprovaDL,
  onEmettiCertificato,
  onLiquida,
  onShowToast,
}) => {
  const { rols } = useApp();
  const [activeTab, setActiveTab] = useState<'libretto' | 'certificato' | 'congruita' | 'workflow'>('libretto');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Certificato emission form state
  const [dlNome, setDlNome] = useState('Arch. Valerio De Marchi');
  const [anticipazionePerc, setAnticipazionePerc] = useState(10);
  const [ritenutaPerc, setRitenutaPerc] = useState(0.5);
  const [aliquotaIva, setAliquotaIva] = useState(10);

  // Calcolo congruità manodopera D.M. 143/2021 in tempo reale per questo SAL
  const congruita = useMemo(() => {
    return calcolaCongruitaManodoperaSAL(sal, rols, 'OG11_OS30', 35.0);
  }, [sal, rols]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    try {
      exportSalExcel(sal);
      onShowToast(`File Excel (.xlsx) per ${sal.codiceSal} generato con successo!`, 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Errore durante la generazione del file Excel.', 'error');
    }
  };

  const handleCreaCertificato = () => {
    const matPeriodo = sal.totaleLavoriPeriodo;
    const matCumulato = sal.totaleLavoriCumulati;
    const quotaAnticipo = (matPeriodo * anticipazionePerc) / 100;
    const quotaRitenuta = (matPeriodo * ritenutaPerc) / 100;
    const netto = matPeriodo - quotaAnticipo - quotaRitenuta;
    const iva = (netto * aliquotaIva) / 100;
    const lordo = netto + iva;

    const cert: CertificatoPagamento = {
      numeroCertificato: `CERT-PAG-2026/0${sal.numeroSal}`,
      dataCertificato: new Date().toISOString().split('T')[0],
      totaleLavoriMaturatiPeriodo: matPeriodo,
      totaleLavoriMaturatiCumulati: matCumulato,
      recuperoAnticipazionePercentuale: anticipazionePerc,
      recuperoAnticipazioneImporto: quotaAnticipo,
      ritenutaGaranziaPercentuale: ritenutaPerc,
      ritenutaGaranziaImporto: quotaRitenuta,
      altreDetrazioni: 0,
      importoNettoLiquidare: netto,
      aliquotaIva,
      importoIva: iva,
      totaleLordoLiquidare: lordo,
      direttoreLavoriNome: dlNome,
      stato: 'emesso',
    };

    onEmettiCertificato(sal.id, cert);
    setActiveTab('certificato');
  };

  const rimanenza = sal.importoContrattualeTotale - sal.totaleLavoriCumulati;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {sal.codiceSal} · {sal.cantiereNome}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sal.stato === 'liquidato'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : sal.stato === 'certificato_emesso'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                        : sal.stato === 'approvato_dl'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {sal.stato.replace(/_/g, ' ')}
                  </span>
                  {/* Badge Congruità Manodopera D.M. 143/2021 */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border transition-all ${
                      congruita.isCongruo
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 animate-pulse'
                    }`}
                    title={`Verifica Congruità D.M. 143/2021: ${congruita.percentualeIncidenzaEffettiva}% rispetto al minimo di legge ${congruita.percentualeMinimaTabellare}% per OG11/OS30`}
                  >
                    {congruita.isCongruo
                      ? `✓ Incidenza ${congruita.percentualeIncidenzaEffettiva}% (CNCE Conforme)`
                      : `⚠ Incidenza ${congruita.percentualeIncidenzaEffettiva}% (Min. 14% Non Congruo)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Committente: <strong>{sal.committenteNome}</strong> · Periodo: Dal {sal.periodoInizio} al {sal.periodoFine}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Strip Economico */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Importo Contratto</span>
              <div className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                € {sal.importoContrattualeTotale.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">A corpo e a misura</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Lavori Precedenti</span>
              <div className="text-base font-black font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                € {sal.totaleLavoriPrecedenti.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Già contabilizzati</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Maturato nel SAL</span>
              <div className="text-base font-black font-mono text-amber-600 dark:text-amber-300 mt-0.5">
                € {sal.totaleLavoriPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Periodo corrente</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Totale Cumulato</span>
              <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                € {sal.totaleLavoriCumulati.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">{sal.percentualeAvanzamentoGlobale.toFixed(1)}% eseguito</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">Rimanenza a Finire</span>
              <div className="text-base font-black font-mono text-sky-600 dark:text-sky-300 mt-0.5">
                € {rimanenza.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{(100 - sal.percentualeAvanzamentoGlobale).toFixed(1)}% da eseguire</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('libretto')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all ${
                  activeTab === 'libretto'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Libretto delle Misure & Voci ({sal.voci.length})
              </button>

              <button
                onClick={() => setActiveTab('certificato')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'certificato'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>2. Certificato di Pagamento {sal.certificatoPagamento ? '✓' : ''}</span>
              </button>

              <button
                onClick={() => setActiveTab('congruita')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'congruita'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>3. Congruità D.M. 143/2021 ({congruita.percentualeIncidenzaEffettiva}%)</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    congruita.isCongruo
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {congruita.isCongruo ? '✓ 14% OK' : '⚠ Non Congruo'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('workflow')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'workflow'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>4. Workflow & Approvazione DL</span>
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 transition-all text-xs"
              title="Esporta il SAL e il libretto in formato Microsoft Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Excel (.xlsx)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950/70 text-xs">
            {/* TAB 1: LIBRETTO DELLE MISURE */}
            {activeTab === 'libretto' && (
              <div className="space-y-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Tariffa</th>
                        <th className="py-2.5 px-3">Descrizione Lavorazione</th>
                        <th className="py-2.5 px-2 text-center">U.M.</th>
                        <th className="py-2.5 px-2 text-right">Q.tà Progetto</th>
                        <th className="py-2.5 px-2 text-right">Prezzo Unit. €</th>
                        <th className="py-2.5 px-2 text-right">Q.tà Prec.</th>
                        <th className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400">Q.tà Attuale</th>
                        <th className="py-2.5 px-2 text-right font-bold">Q.tà Cumulo</th>
                        <th className="py-2.5 px-2 text-right font-bold">% Voce</th>
                        <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-300 font-bold">Maturato SAL €</th>
                        <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">Totale Cumulo €</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                      {sal.voci.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">{v.codiceTariffa}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">
                            <div className="font-semibold">{v.descrizione}</div>
                            {v.noteMisure && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                                📍 Misure: {v.noteMisure}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-sans">{v.unitaMisura}</td>
                          <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">{v.quantitaContrattuale}</td>
                          <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">€ {v.prezzoUnitario.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right text-slate-500">{v.quantitaPrecedente}</td>
                          <td className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400 font-bold">{v.quantitaPeriodo}</td>
                          <td className="py-2.5 px-2 text-right text-slate-800 dark:text-slate-200 font-bold">{v.quantitaTotale}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-slate-800 dark:text-slate-200">{v.percentualeAvanzamento.toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-300 font-bold">
                            € {v.importoPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
                            € {v.importoTotaleCumulato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {/* Totale Libretto */}
                      <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                        <td colSpan={3} className="py-2.5 px-3 font-sans">TOTALI GENERALI</td>
                        <td colSpan={2} className="py-2.5 px-2 text-right">
                          € {sal.importoContrattualeTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={4} className="py-2.5 px-2 text-right font-sans">
                          Avanzamento Medio: <strong className="text-emerald-600 dark:text-emerald-400">{sal.percentualeAvanzamentoGlobale.toFixed(1)}%</strong>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-300 font-black">
                          € {sal.totaleLavoriPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                          € {sal.totaleLavoriCumulati.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CERTIFICATO DI PAGAMENTO */}
            {activeTab === 'certificato' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {sal.certificatoPagamento ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          CERTIFICATO EMESSO
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                          Certificato di Pagamento n. {sal.certificatoPagamento.numeroCertificato}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Data emissione: {sal.certificatoPagamento.dataCertificato} · Direttore Lavori: {sal.certificatoPagamento.direttoreLavoriNome}
                        </p>
                      </div>

                      <button
                        onClick={() => setIsCertModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Apri Modello A4 Ufficiale</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lavori Periodo</span>
                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                          € {sal.certificatoPagamento.totaleLavoriMaturatiPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 block">Ritenute Garanzia ({sal.certificatoPagamento.ritenutaGaranziaPercentuale}%)</span>
                        <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-300">
                          - € {sal.certificatoPagamento.ritenutaGaranziaImporto.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Netto da Liquidare</span>
                        <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
                          € {sal.certificatoPagamento.importoNettoLiquidare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Lordo IVA Inclusa ({sal.certificatoPagamento.aliquotaIva}%)</span>
                        <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                          € {sal.certificatoPagamento.totaleLordoLiquidare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Fattura Elettronica SDI: </span>
                        <strong className="text-slate-800 dark:text-slate-100">{sal.certificatoPagamento.riferimentoFattura || 'Non ancora emessa'}</strong>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sal.certificatoPagamento.stato === 'pagato'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        Stato: {sal.certificatoPagamento.stato.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Emissione Certificato di Pagamento</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        In base agli articoli del D.Lgs 36/2023, il Direttore dei Lavori emette il certificato di pagamento entro 7 giorni dall'approvazione del SAL.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Direttore dei Lavori</label>
                        <input
                          type="text"
                          value={dlNome}
                          onChange={(e) => setDlNome(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Aliquota I.V.A.</label>
                        <select
                          value={aliquotaIva}
                          onChange={(e) => setAliquotaIva(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm"
                        >
                          <option value={10}>10% (Ristrutturazioni edili e impianti)</option>
                          <option value={22}>22% (Ordinaria)</option>
                          <option value={4}>4% (Agevolata)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Recupero Anticipazione (%)</label>
                        <input
                          type="number"
                          value={anticipazionePerc}
                          onChange={(e) => setAnticipazionePerc(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-mono shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Ritenuta Infortuni / Garanzia (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={ritenutaPerc}
                          onChange={(e) => setRitenutaPerc(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-mono shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                      <strong>Riepilogo Stimato:</strong> Importo Lavori SAL: € {sal.totaleLavoriPeriodo.toFixed(2)} ➔ Netto da Liquidare stimato: € {(sal.totaleLavoriPeriodo * (1 - (anticipazionePerc + ritenutaPerc) / 100)).toFixed(2)} + IVA ({aliquotaIva}%).
                    </div>

                    <button
                      onClick={handleCreaCertificato}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Emetti Certificato di Pagamento</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONGRUITÀ DELLA MANODOPERA D.M. 143/2021 */}
            {activeTab === 'congruita' && (
              <div className="max-w-4xl mx-auto space-y-4">
                <CongruitaManodoperaPanel initialSalId={sal.id} standalone={false} />
              </div>
            )}

            {/* TAB 4: WORKFLOW */}
            {activeTab === 'workflow' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Avanzamento del Ciclo Contabile</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">1. Redazione del Libretto Misure</div>
                        <div className="text-slate-500 dark:text-slate-400">Compilato da {sal.redattoDa} in data {sal.dataEmissione}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          sal.approvatoDirettoreLavori
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">2. Verifica in Contraddittorio & Approvazione D.L.</div>
                        {sal.approvatoDirettoreLavori ? (
                          <div className="text-slate-500 dark:text-slate-400">
                            Approvato da <strong>{sal.approvatoDirettoreLavori.nome}</strong> il {sal.approvatoDirettoreLavori.dataOra}
                            {sal.approvatoDirettoreLavori.note && <div className="text-slate-600 dark:text-slate-300 italic mt-0.5">"{sal.approvatoDirettoreLavori.note}"</div>}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => onApprovaDL(sal.id, dlNome, 'Verifica congiunta in cantiere approvata')}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                              Approva come Direttore dei Lavori
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          sal.certificatoPagamento
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">3. Rilascio Certificato di Pagamento</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {sal.certificatoPagamento
                            ? `Certificato n. ${sal.certificatoPagamento.numeroCertificato} emesso`
                            : 'In attesa di emissione certificato'}
                        </div>
                      </div>
                    </div>

                    {/* Step 3.5: Verifica Congruità CNCE Edilconnect */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          congruita.isCongruo
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            3b. Attestazione Congruità CNCE Edilconnect (D.M. 143/2021)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            congruita.isCongruo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {congruita.isCongruo ? '✓ SBLOCCATA' : '⛔ BLOCCANTE PRIMA DEL SALDO'}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          {congruita.isCongruo ? (
                            <span>Incidenza registrata <strong>{congruita.percentualeIncidenzaEffettiva}%</strong> (soglia minima {congruita.percentualeMinimaTabellare}%). Protocollo: <code>{congruita.attestazioneEdilconnect?.protocollo}</code>. Fattura di saldo autorizzata.</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400">Incidenza manodopera insufficiente (<strong>{congruita.percentualeIncidenzaEffettiva}%</strong> &lt; {congruita.percentualeMinimaTabellare}%). Mancano € {Math.abs(congruita.differenzaEuro).toLocaleString('it-IT')} ({congruita.oreMancanti} ore) per il rilascio CNCE.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          sal.stato === 'liquidato'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">4. Liquidazione & Ricezione Bonifico</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {sal.stato === 'liquidato'
                            ? 'Fattura emessa e saldo incassato regolarmente.'
                            : 'In attesa di accredito da parte della committenza.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shrink-0">
            <span className="text-slate-500 font-mono">ID Contabilità: {sal.id} · Cantiere: {sal.cantiereId}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors shadow-sm"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>

      {/* Certificato Modal se richiesto */}
      {sal.certificatoPagamento && (
        <CertificatoPagamentoModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          sal={sal}
          onLiquida={onLiquida}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
};
