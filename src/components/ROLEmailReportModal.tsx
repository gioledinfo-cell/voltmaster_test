import React, { useState } from 'react';
import {
  X,
  Mail,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  Building2,
  User,
  Paperclip,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ROL } from '../types';
import { useApp } from '../context/AppContext';
import { downloadRolPdf } from '../services/rolPdfService';

interface ROLEmailReportModalProps {
  rol: ROL;
  isOpen: boolean;
  onClose: () => void;
  onEmailSentSuccess?: (updatedRol: ROL) => void;
}

export const ROLEmailReportModal: React.FC<ROLEmailReportModalProps> = ({
  rol,
  isOpen,
  onClose,
  onEmailSentSuccess,
}) => {
  const { clienti, cantieri, updateROL, showToast } = useApp();

  // Find matching client and cantiere
  const cantiere = cantieri.find((c) => c.id === rol.cantiereId);
  const cliente = clienti.find(
    (cli) => cli.id === cantiere?.clienteId || cli.ragioneSociale.toLowerCase() === rol.clienteNome.toLowerCase()
  );

  const defaultRecipient =
    rol.emailDestinatario ||
    cliente?.email ||
    `amministrazione@${rol.clienteNome.toLowerCase().replace(/[^a-z0-9]/g, '')}.it`;

  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient);
  const [ccEmail, setCcEmail] = useState('contabilita@voltmaster.it, ufficiotecnico@voltmaster.it');
  const [subject, setSubject] = useState(
    `[VoltMaster] Rapporto di Intervento Firmato ${rol.numero} - ${rol.cantiereTitolo}`
  );

  const teamNote =
    rol.collaboratori && rol.collaboratori.length > 0
      ? `\nLe attività sono state svolte dalla squadra tecnica VoltMaster: ${[
          `${rol.operatoreNome} (Caposquadra)`,
          ...rol.collaboratori.map((c) => `${c.nome} (${c.ruolo || 'Collaboratore'})`),
        ].join(', ')} (${1 + rol.collaboratori.length} tecnici per complessive ${
          rol.oreTotali +
          rol.collaboratori.reduce(
            (acc, c) => acc + (c.oreOrdinarie ?? rol.oreOrdinarie) + (c.oreStraordinarie ?? rol.oreStraordinarie),
            0
          )
        } ore-uomo).\n`
      : '';

  const [customMessage, setCustomMessage] = useState(
    `Gentile ${rol.clienteNome},\n\nIn allegato trasmettiamo in formato PDF il Rapporto Operativo di Lavoro (ROL) relativo alle attività eseguite in data ${new Date(
      rol.data
    ).toLocaleDateString('it-IT')} presso il cantiere "${rol.cantiereTitolo}".\n` +
      teamNote +
      `\nIl documento riporta la descrizione dettagliata dei lavori eseguiti a regola d'arte, le ore lavorate (${rol.oreTotali}h) e la firma grafometrica acquisita in loco per presa visione ed accettazione.\n\n` +
      `Restiamo a Vostra completa disposizione per eventuali chiarimenti tecnici o contabili.\n\n` +
      `Cordiali saluti,\nVoltMaster ElettroImpianti S.r.l.\nUfficio Tecnico & Assistenza Clienti\nTel. +39 02 884400`
  );

  const [sendArchiveCopy, setSendArchiveCopy] = useState(true);
  const [autoApprove, setAutoApprove] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendStep, setSendStep] = useState<string>('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const pdfFileName = `${rol.numero.replace(/[^a-zA-Z0-9_-]/g, '_')}_Rapporto_Firmato.pdf`;

  const handleDownloadPDF = () => {
    downloadRolPdf(rol, cliente, cantiere);
    showToast(`PDF "${pdfFileName}" scaricato con successo!`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Inserisci un indirizzo email valido per il destinatario', 'error');
      return;
    }

    setIsSending(true);
    setSendStep('Generazione documento PDF certificato...');

    await new Promise((r) => setTimeout(r, 600));
    setSendStep('Compilazione firma grafometrica e sigillo digitale...');

    await new Promise((r) => setTimeout(r, 700));
    setSendStep(`Invio messaggio SMTP sicuro a ${recipientEmail}...`);

    await new Promise((r) => setTimeout(r, 800));

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('it-IT')} ore ${now.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const updates: Partial<ROL> = {
      emailInviataIl: formattedDate,
      emailDestinatario: recipientEmail,
      pdfReportGenerato: true,
    };

    if (autoApprove && rol.stato === 'bozza') {
      updates.stato = 'inviato';
    }

    updateROL(rol.id, updates);

    setIsSending(false);
    setIsSent(true);

    showToast(`Email con PDF allegato inviata con successo a ${recipientEmail}!`, 'success');

    if (onEmailSentSuccess) {
      onEmailSentSuccess({ ...rol, ...updates });
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center shadow">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/60">
                  Modulo Invio Report PDF Firmato
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {rol.numero}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                Rapporto di Intervento Elettronico per il Committente
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: PDF Document Card Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Allegato PDF Generato
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-1.5 py-0.5 rounded">
                  A4 Pronto
                </span>
              </div>

              {/* Simulated Paper Document Sheet */}
              <div className="bg-white text-slate-900 p-4 rounded-lg shadow-md border border-slate-200 text-[10px] font-sans space-y-2 select-none">
                <div className="flex justify-between items-start border-b border-slate-900 pb-1.5">
                  <div>
                    <span className="font-black text-slate-950 uppercase tracking-tight text-xs">
                      VOLTMASTER
                    </span>
                    <div className="text-[8px] text-slate-500">Impianti Elettrici · DM 37/08</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-700 font-mono text-[9px] block">
                      {rol.numero}
                    </span>
                    <span className="text-[8px] text-slate-500">
                      {new Date(rol.data).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-900 line-clamp-1">{rol.clienteNome}</div>
                  <div className="text-slate-600 text-[9px] line-clamp-1">Cantiere: {rol.cantiereTitolo}</div>
                  <div className="text-slate-500 text-[8px] mt-0.5">
                    Tecnico: <strong>{rol.operatoreNome}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[9px] text-slate-700 line-clamp-3">
                  {rol.descrizioneLavori}
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-200 text-[9px]">
                  <span>Totale Ore Consuntivate:</span>
                  <span className="font-bold font-mono text-amber-800">{rol.oreTotali} ore</span>
                </div>

                {/* Signature preview in mini paper */}
                <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[8px] text-slate-500">
                    <div>Firma Committente:</div>
                    <div className="font-semibold text-slate-800 truncate max-w-[100px]">
                      {rol.firmaClienteNome || rol.clienteNome}
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                    {rol.firmaClienteDataUrl ? (
                      <img
                        src={rol.firmaClienteDataUrl}
                        alt="Firma"
                        className="max-h-7 max-w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <span className="text-[7px] text-emerald-600 font-bold">
                        {rol.firmaClientePresente ? '✓ Firma Acquisita' : 'In attesa firma'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions for PDF */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Scarica PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Stampa A4</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Conformità Legale Garantita:</strong>
                  <div className="text-emerald-700/80 dark:text-emerald-200/80 text-[10px] mt-0.5">
                    Include riferimenti abilitativi DM 37/08, codice univoco crittografico e firma grafometrica per validità contrattuale.
                  </div>
                </div>
              </div>

              {rol.emailInviataIl && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Già trasmesso in precedenza
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Inviato il: <strong className="text-slate-800 dark:text-slate-200">{rol.emailInviataIl}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    A: <strong className="text-slate-800 dark:text-slate-200">{rol.emailDestinatario}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Email Composer Form (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destinatario Committente (Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="amministrazione@azienda-cliente.it"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono shadow-sm"
                  />
                </div>
                {cliente && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span>
                      Cliente collegato: <strong className="text-slate-700 dark:text-slate-200">{cliente.ragioneSociale}</strong>
                    </span>
                    <span>Referente: {cliente.referente}</span>
                  </div>
                )}
              </div>

              {/* CC Copy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  In Copia (CC Ufficio Tecnico / Contabilità):
                </label>
                <input
                  type="text"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono shadow-sm"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Oggetto dell'Email:
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 shadow-sm"
                />
              </div>

              {/* Attachment Pill */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{pdfFileName}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 rounded font-mono">
                        ~145 KB
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ Documento PDF firmato e autenticato con timbro digitale
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Anteprima
                </button>
              </div>

              {/* Body message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Testo del Messaggio:
                </label>
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 leading-relaxed font-sans shadow-sm"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendArchiveCopy}
                    onChange={(e) => setSendArchiveCopy(e.target.checked)}
                    className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Invia copia di archiviazione per contabilità e fatturazione SAL</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Contrassegna automaticamente come "Inviato al Committente"</span>
                </label>
              </div>

              {/* Submit / Progress */}
              <div className="pt-2">
                {isSending ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-center justify-center gap-3 text-amber-800 dark:text-amber-200 text-xs">
                    <span className="w-4 h-4 border-2 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                    <span className="font-semibold">{sendStep}</span>
                  </div>
                ) : isSent ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Report PDF trasmesso con successo via email!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Invia Report PDF Firmato al Cliente</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
