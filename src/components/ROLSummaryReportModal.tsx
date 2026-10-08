import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Mail,
  Calendar,
  Building2,
  CheckCircle2,
  Send,
  Paperclip,
  Users,
  Check,
} from 'lucide-react';
import { ROL, Cliente } from '../types';
import { useApp } from '../context/AppContext';
import { generateSummaryRolPdf } from '../services/rolPdfService';

interface ROLSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ROLSummaryReportModal: React.FC<ROLSummaryReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rols, clienti, cantieri, showToast } = useApp();

  const [selectedClienteNome, setSelectedClienteNome] = useState<string>('tutti');
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [periodoMese, setPeriodoMese] = useState<string>('Settembre 2026');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  if (!isOpen) return null;

  // Filter ROLs
  const filteredRols = rols.filter((r) => {
    const matchesCliente =
      selectedClienteNome === 'tutti' ||
      r.clienteNome.toLowerCase() === selectedClienteNome.toLowerCase();
    const matchesCantiere =
      selectedCantiereId === 'tutti' || r.cantiereId === selectedCantiereId;
    return matchesCliente && matchesCantiere;
  });

  const totalOre = filteredRols.reduce((acc, r) => acc + r.oreTotali, 0);
  const totalFirmati = filteredRols.filter(
    (r) => r.firmaClientePresente || r.firmaClienteDataUrl
  ).length;

  const currentCliente = clienti.find(
    (c) => c.ragioneSociale.toLowerCase() === selectedClienteNome.toLowerCase()
  );

  const handleDownloadSummaryPDF = () => {
    const title = `Riepilogo ${periodoMese}`;
    const doc = generateSummaryRolPdf(
      filteredRols,
      selectedClienteNome === 'tutti' ? 'Tutti i Clienti Attivi' : selectedClienteNome,
      title
    );
    doc.save(`VoltMaster_Report_Riepilogativo_ROL_${periodoMese.replace(' ', '_')}.pdf`);
    showToast('Report PDF riepilogativo scaricato con successo!', 'success');
  };

  const handleSendSummaryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Specifica un indirizzo email valido', 'error');
      return;
    }

    setIsSendingEmail(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSendingEmail(false);
    setIsEmailSent(true);
    showToast(`Report riepilogativo trasmesso via email a ${recipientEmail}!`, 'success');

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 dark:border-cyan-500/30 flex items-center justify-center shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/60">
                Consuntivazione & SAL
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Report PDF Riepilogativo Multi-ROL per Committente
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-[11px]">
                Filtra per Committente:
              </label>
              <select
                value={selectedClienteNome}
                onChange={(e) => {
                  setSelectedClienteNome(e.target.value);
                  const cli = clienti.find((c) => c.ragioneSociale === e.target.value);
                  if (cli?.email) setRecipientEmail(cli.email);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 shadow-sm"
              >
                <option value="tutti">Tutti i Committenti</option>
                {clienti.map((c) => (
                  <option key={c.id} value={c.ragioneSociale}>
                    {c.ragioneSociale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-[11px]">
                Cantiere:
              </label>
              <select
                value={selectedCantiereId}
                onChange={(e) => setSelectedCantiereId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 shadow-sm"
              >
                <option value="tutti">Tutti i Cantieri</option>
                {cantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice} - {c.titolo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-[11px]">
                Periodo / Mese:
              </label>
              <input
                type="text"
                value={periodoMese}
                onChange={(e) => setPeriodoMese(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 shadow-sm"
              />
            </div>
          </div>

          {/* Aggregated KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                Rapportini Inclusi
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                {filteredRols.length} ROL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                Rapportini Firmati
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {totalFirmati} / {filteredRols.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                Totale Ore Lavorate
              </span>
              <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                {totalOre} h
              </span>
            </div>
          </div>

          {/* List of included ROLs preview */}
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Dettaglio Rapportini Selezionati per il Riepilogo:
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/60 dark:bg-slate-950/60">
              {filteredRols.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  Nessun rapporto trovato con i filtri selezionati.
                </div>
              ) : (
                filteredRols.map((r) => (
                  <div
                    key={r.id}
                    className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{r.numero}</span>
                      <span className="text-slate-500 dark:text-slate-400">{r.data}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {r.cantiereTitolo}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400">{r.operatoreNome}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.oreTotali}h</span>
                      {r.firmaClientePresente || r.firmaClienteDataUrl ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Firmato</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Non firmato</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email dispatch section */}
          <form
            onSubmit={handleSendSummaryEmail}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Mail className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Invia Report Riepilogativo al Committente
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder={currentCliente?.email || 'email-amministrazione@cliente.it'}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono shadow-sm"
              />
              <button
                type="submit"
                disabled={isSendingEmail || filteredRols.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSendingEmail ? (
                  <span>Invio in corso...</span>
                ) : isEmailSent ? (
                  <span>✓ Inviato</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Invia Riepilogo PDF</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold"
          >
            Chiudi
          </button>

          <button
            onClick={handleDownloadSummaryPDF}
            disabled={filteredRols.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Scarica Report PDF Riepilogativo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
