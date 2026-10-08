import React, { useMemo } from 'react';
import { StatoAvanzamentoLavori, CertificatoPagamento } from '../../types/sal';
import { useApp } from '../../context/AppContext';
import { calcolaCongruitaManodoperaSAL } from '../../services/congruitaService';
import {
  X,
  Printer,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Download,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
} from 'lucide-react';

interface CertificatoPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sal: StatoAvanzamentoLavori;
  onLiquida?: (salId: string, rifFattura?: string) => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CertificatoPagamentoModal: React.FC<CertificatoPagamentoModalProps> = ({
  isOpen,
  onClose,
  sal,
  onLiquida,
  onShowToast,
}) => {
  const { rols } = useApp();
  const [isEditingPayment, setIsEditingPayment] = React.useState(false);
  const [rifFatturaInput, setRifFatturaInput] = React.useState(
    sal.certificatoPagamento?.riferimentoFattura || ''
  );

  const congruita = useMemo(() => {
    return calcolaCongruitaManodoperaSAL(sal, rols, 'OG11_OS30', 35.0);
  }, [sal, rols]);

  if (!isOpen || !sal.certificatoPagamento) return null;

  const cp = sal.certificatoPagamento;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmLiquidazione = () => {
    if (congruita.bloccoFatturazioneFinale) {
      const confirmForced = window.confirm(
        `ATTENZIONE D.M. 143/2021: L'incidenza di manodopera registrata (${congruita.percentualeIncidenzaEffettiva}%) è inferiore alla soglia minima del 14% richiesta per gli impianti elettrici (OG11/OS30). L'attestazione CNCE Edilconnect non è ancora stata rilasciata e c'è il rischio di segnalazione BNCF e blocco DURC.\n\nVuoi comunque procedere con la registrazione provvisoria della fattura?`
      );
      if (!confirmForced) return;
    }

    if (onLiquida) {
      onLiquida(sal.id, rifFatturaInput || 'FATT-SDI-' + new Date().getFullYear() + '-' + sal.numeroSal);
      setIsEditingPayment(false);
      onShowToast(
        congruita.isCongruo
          ? `Pagamento e fattura di saldo registrati con attestazione CNCE conforme (${congruita.percentualeIncidenzaEffettiva}%).`
          : `Attenzione: Registrata fattura con riserva congruità D.M. 143/2021. Necessaria regolarizzazione entro 15 giorni.`,
        congruita.isCongruo ? 'success' : 'warning'
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Certificato di Pagamento n. {cp.numeroCertificato}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cp.stato === 'pagato'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {cp.stato === 'pagato' ? '✓ Liquidato / Incassato' : 'In attesa di liquidazione'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rilasciato dalla Direzione Lavori in base al {sal.codiceSal} del cantiere {sal.cantiereNome}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content A4 Preview */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/70 flex justify-center">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none text-xs">
            {/* Header Documento */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  REPUBBLICA ITALIANA · D.Lgs 36/2023 & D.P.R. 207/2010
                </span>
                <h1 className="text-lg font-black text-slate-900 mt-0.5">
                  CERTIFICATO DI PAGAMENTO N. {cp.numeroCertificato}
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5 font-semibold">
                  A valere sullo Stato di Avanzamento Lavori {sal.codiceSal}
                </p>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-600">
                <div>Data di Emissione: <strong>{cp.dataCertificato}</strong></div>
                <div>Protocollo DL: <strong>DL-CERT-{sal.numeroSal}</strong></div>
              </div>
            </div>

            {/* Dati Commessa e Soggetti */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-[11px]">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">COMMITTENTE (STAZIONE APPALTANTE):</span>
                <span className="font-bold text-slate-900 text-xs">{sal.committenteNome}</span>
                <div className="text-slate-600 mt-0.5">Cantiere: <strong>{sal.cantiereNome}</strong></div>
                <div className="text-slate-500 text-[10px]">Codice Commessa: {sal.cantiereId.toUpperCase()}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">IMPRESA ESECUTRICE / APPALTATRICE:</span>
                <span className="font-bold text-slate-900 text-xs">VOLTMASTER IMPIANTI S.R.L.</span>
                <div className="text-slate-600 mt-0.5">P.IVA / C.F.: 08234590154 · REA MI-2194830</div>
                <div className="text-slate-600">Direttore dei Lavori: <strong>{cp.direttoreLavoriNome}</strong></div>
              </div>
            </div>

            {/* Prospetto Contabile e Ritenute */}
            <div className="mb-6 border border-slate-300 rounded overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase tracking-wider text-[10px]">
                CONTO FINALE DI LIQUIDAZIONE DEL PRESENTE S.A.L.
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-700">1. Totale Lavori Eseguiti a Tutto Oggi (Cumulativo):</span>
                  <span className="font-mono font-bold text-slate-900">
                    € {cp.totaleLavoriMaturatiCumulati.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50/50">
                  <span className="text-slate-600">2. A detrarre: Lavori già liquidati nei precedenti SAL:</span>
                  <span className="font-mono text-slate-600">
                    - € {(cp.totaleLavoriMaturatiCumulati - cp.totaleLavoriMaturatiPeriodo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 font-bold bg-slate-100/60">
                  <span className="text-slate-900">3. Importo Lavori Eseguiti nel Periodo del Presente SAL:</span>
                  <span className="font-mono text-slate-900">
                    € {cp.totaleLavoriMaturatiPeriodo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {cp.recuperoAnticipazioneImporto > 0 && (
                  <div className="flex justify-between p-2.5 text-rose-700">
                    <span>4. Recupero quota anticipazione contrattuale ({cp.recuperoAnticipazionePercentuale}%):</span>
                    <span className="font-mono font-semibold">
                      - € {cp.recuperoAnticipazioneImporto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {cp.ritenutaGaranziaImporto > 0 && (
                  <div className="flex justify-between p-2.5 text-rose-700">
                    <span>5. Ritenuta di garanzia per infortuni e svincolo ({cp.ritenutaGaranziaPercentuale}%):</span>
                    <span className="font-mono font-semibold">
                      - € {cp.ritenutaGaranziaImporto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-amber-50/60 font-bold border-t border-slate-300">
                  <span className="text-amber-950 uppercase">6. IMPORTO NETTO DA LIQUIDARE ALL'IMPRESA:</span>
                  <span className="font-mono text-base text-amber-950 font-black">
                    € {cp.importoNettoLiquidare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 text-slate-600">
                  <span>7. I.V.A. di Legge applicabile ({cp.aliquotaIva}%):</span>
                  <span className="font-mono">
                    € {cp.importoIva.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-3.5 bg-emerald-50 text-emerald-950 font-black text-sm border-t-2 border-emerald-300">
                  <span className="uppercase">8. TOTALE LORDO CERTIFICATO A PAGAMENTO:</span>
                  <span className="font-mono text-base font-black">
                    € {cp.totaleLordoLiquidare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Visto di Congruità della Manodopera D.M. 143/2021 & CNCE Edilconnect */}
            <div className={`p-3.5 rounded border text-[11px] mb-6 ${
              congruita.isCongruo
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/60 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between font-bold text-xs pb-1 mb-1 border-b border-current/20">
                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  Visto di Congruità Manodopera D.M. 143/2021 (OG11/OS30 Impianti Elettrici)
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border">
                  {congruita.isCongruo ? '✓ CNCE EDILCONNECT POSITIVO' : '⚠ BLOCCO SALDO / REGOLARIZZAZIONE'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Soglia di Legge (OG11/OS30):</span>
                  <strong>{congruita.percentualeMinimaTabellare}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Incidenza Effettiva:</span>
                  <strong className={congruita.isCongruo ? 'text-emerald-700' : 'text-rose-700'}>
                    {congruita.percentualeIncidenzaEffettiva}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Protocollo CNCE Edilconnect:</span>
                  <strong className="font-mono">{congruita.attestazioneEdilconnect?.protocollo}</strong>
                </div>
              </div>
              <p className="mt-2 text-[10px] opacity-90">
                {congruita.isCongruo
                  ? 'Attestazione di congruità rilasciata dalla Cassa Edile competente. Nessun impedimento all’emissione della fattura finale di saldo.'
                  : `Attenzione: Il saldo finale non può essere erogato prima della regolarizzazione dello scostamento di € ${Math.abs(congruita.differenzaEuro).toLocaleString('it-IT')} ai sensi dell'art. 5 D.M. 143/2021.`}
              </p>
            </div>

            {/* Note Pagamento e Fattura SDI */}
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-[11px] mb-8 space-y-1">
              <div>
                <strong>Coordinate Bancarie:</strong> IT98 K 03069 09606 100000012345 · Banca Intesa Sanpaolo (C/C intestato a VoltMaster S.r.l.)
              </div>
              <div>
                <strong>Fattura Elettronica di Riferimento:</strong> {cp.riferimentoFattura || 'Da emettere su canale SDI codice univoco USAL123'}
              </div>
              <div>
                <strong>Termini di Pagamento:</strong> 30 giorni data emissione certificato mediante bonifico bancario SEPA.
              </div>
            </div>

            {/* Riquadro Firme Ufficiali */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-300 text-[10px]">
              <div className="border border-slate-200 rounded p-3 min-h-[100px] flex flex-col justify-between">
                <span className="font-bold text-slate-900 block">IL DIRETTORE DEI LAVORI</span>
                <span className="text-slate-500">Per attestazione di regolare esecuzione e visto contabile</span>
                <div className="border-b border-dashed border-slate-400 mt-4 text-center text-slate-400">
                  {cp.direttoreLavoriNome} (Firma)
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 min-h-[100px] flex flex-col justify-between">
                <span className="font-bold text-slate-900 block">L'IMPRESA APPALTATRICE</span>
                <span className="text-slate-500">VoltMaster Impianti S.r.l. - Per accettazione senza riserve</span>
                <div className="border-b border-dashed border-slate-400 mt-4 text-center text-slate-400">
                  Firma del Legale Rappresentante
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 min-h-[100px] flex flex-col justify-between">
                <span className="font-bold text-slate-900 block">IL COMMITTENTE / R.U.P.</span>
                <span className="text-slate-500">Per autorizzazione all'emissione del mandato di pagamento</span>
                <div className="border-b border-dashed border-slate-400 mt-4 text-center text-slate-400">
                  Firma e Timbro Committenza
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Certificato conforme al D.Lgs 36/2023 con applicazione automatica delle ritenute di legge.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Stampa Certificato A4</span>
            </button>

            {cp.stato !== 'pagato' && (
              <>
                {isEditingPayment ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Codice Fattura SDI..."
                      value={rifFatturaInput}
                      onChange={(e) => setRifFatturaInput(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
                    />
                    <button
                      onClick={handleConfirmLiquidazione}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      <span>Conferma Incasso</span>
                    </button>
                    <button
                      onClick={() => setIsEditingPayment(false)}
                      className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPayment(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-md active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Segna come Liquidato / Pagato</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
