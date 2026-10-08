import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Mail,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { Preventivo, Cliente, Cantiere } from '../types';
import { useApp } from '../context/AppContext';
import {
  downloadPreventivoPdf,
  printPreventivoPdfDirectly,
  sharePreventivoPdf,
} from '../services/preventivoPdfService';

interface PreventivoPrintModalProps {
  preventivo: Preventivo;
  onClose: () => void;
}

export const PreventivoPrintModal: React.FC<PreventivoPrintModalProps> = ({
  preventivo,
  onClose,
}) => {
  const { showToast, clienti, cantieri } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);

  const cliente = clienti.find(
    (c) => c.id === preventivo.clienteId || c.ragioneSociale === preventivo.clienteNome
  );
  const cantiere = cantieri.find((c) => c.id === preventivo.cantiereIdCreato);

  const handleDownloadPDF = () => {
    downloadPreventivoPdf(preventivo, cliente, cantiere);
    showToast(`PDF del Preventivo ${preventivo.numero} scaricato con successo!`, 'success');
  };

  const handleDirectPrintPDF = () => {
    printPreventivoPdfDirectly(preventivo, cliente, cantiere);
    showToast('Apertura finestra di stampa PDF...', 'info');
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const success = await sharePreventivoPdf(preventivo, cliente, cantiere);
    if (success) {
      showToast('Preventivo condiviso con successo!', 'success');
    }
  };

  const handleCopyLink = () => {
    const summaryText = `Preventivo ${preventivo.numero} - ${preventivo.oggetto} (€ ${preventivo.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })} IVA incl.) emesso per ${preventivo.clienteNome}`;
    navigator.clipboard.writeText(summaryText);
    setCopiedLink(true);
    showToast('Dati preventivo copiati negli appunti!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Control Bar (Screen Only) */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Anteprima Preventivo Ufficiale
                </span>
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
                  {preventivo.numero}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formato A4 pronto per esportazione PDF, stampa diretta e invio al committente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Condividi tramite app o email"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Condividi</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              title="Genera e scarica file PDF vettoriale formattato"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica PDF</span>
            </button>

            <button
              onClick={handleDirectPrintPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Stampa diretta del file PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Stampa PDF</span>
            </button>

            <button
              onClick={handleNativePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Stampa pagina tramite browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Stampa A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable A4 Sheet Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div className="w-full max-w-3xl bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-relaxed font-sans border border-slate-200 print:border-none">
            {/* 1. Header Aziendale Ufficiale */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                    VOLTMASTER
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 border-l border-slate-400 pl-2 uppercase tracking-wider">
                    Impianti Elettrici Industriali
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-semibold mt-1">
                  VoltMaster Impianti S.r.l. · P.IVA 09248100159 · REA MI-2099182
                </p>
                <p className="text-[10px] text-slate-500">
                  Via dell'Innovazione Elettrica 42, 20126 Milano (MI) · Tel: +39 02 884400
                </p>
                <p className="text-[9px] text-slate-400 italic mt-0.5">
                  Abilitazioni D.M. 37/2008 lett. A, B, G · Qualifiche PES/PAV CEI 11-27 · Verifiche CEI 64-8
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded">
                  OFFERTA COMMERCIALE
                </div>
                <div className="font-mono text-sm font-black text-amber-700 mt-1">
                  {preventivo.numero}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Data: {preventivo.dataEmissione || new Date().toISOString().split('T')[0]}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Validità: {preventivo.dataScadenza}
                </div>
              </div>
            </div>

            {/* 2. Box Committente & Dati Offerta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Committente */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Destinatario / Committente
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {preventivo.clienteNome}
                </div>
                {cliente?.referente && (
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    All'att.ne di: <strong>{cliente.referente}</strong>
                  </div>
                )}
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {cliente?.indirizzo ? `${cliente.indirizzo}, ${cliente.citta}` : 'Sede operativa cliente'}
                </div>
                {cliente?.partitaIva && (
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    P.IVA / C.F.: {cliente.partitaIva}
                  </div>
                )}
              </div>

              {/* Riferimenti Commessa */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Dettagli Fornitura & Stato
                </span>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Stato Offerta:</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] uppercase ${
                      preventivo.stato === 'accettato'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : preventivo.stato === 'inviato'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preventivo.stato}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Tempi esecuzione:</span>
                  <span className="font-semibold text-slate-800">10-15 gg lavorativi</span>
                </div>
                {preventivo.cantiereIdCreato && (
                  <div className="text-[11px] text-emerald-700 font-semibold mt-2 pt-1 border-t border-slate-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Convertito in Cantiere Attivo</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Oggetto dell'Appalto */}
            <div className="mb-5 p-3.5 bg-slate-100 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Oggetto dei Lavori & Descrizione Sintetica
              </span>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {preventivo.oggetto}
              </div>
            </div>

            {/* 4. Tabella Dettagliata delle Voci di Capitolato */}
            <div className="mb-5 overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b border-slate-300 text-[10px] font-bold uppercase">
                    <th className="p-2 border-r border-slate-300 w-8 text-center">N°</th>
                    <th className="p-2 border-r border-slate-300">Descrizione Fornitura e Posa a Regola d'Arte</th>
                    <th className="p-2 border-r border-slate-300 w-16 text-center">Cat.</th>
                    <th className="p-2 border-r border-slate-300 w-14 text-center">Q.tà</th>
                    <th className="p-2 border-r border-slate-300 w-12 text-center">U.M.</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-right">Prezzo Unit.</th>
                    <th className="p-2 w-24 text-right">Totale (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preventivo.voci.map((voce, index) => (
                    <tr key={voce.id || index} className={index % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-600">
                        {index + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                        {voce.descrizione}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                          {voce.categoria === 'materiale'
                            ? 'Mat'
                            : voce.categoria === 'manodopera'
                            ? 'Man'
                            : voce.categoria === 'noleggio'
                            ? 'Nol'
                            : 'Doc'}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-semibold">
                        {voce.quantita}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">
                        {voce.unitaMisura}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                        € {voce.prezzoUnitario.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        € {voce.totale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Totali & Condizioni Economiche */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6">
              {/* Condizioni Contrattuali (7 cols) */}
              <div className="sm:col-span-7 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-600 block">
                  Condizioni Generali & Termini di Pagamento
                </span>
                <p className="text-slate-700 leading-relaxed font-sans">
                  {preventivo.note || 'Condizioni standard: 30% all\'ordine, 40% a SAL intermedio, 30% a saldo previo collaudo positivo e rilascio DiCo DM 37/08.'}
                </p>
                <div className="pt-1.5 border-t border-slate-200 text-slate-500 space-y-0.5">
                  <p>• Garanzia: 24 mesi su tutti i componenti installati e posa in opera.</p>
                  <p>• Esclusioni: Opere murarie, ponteggi oltre 4mt e oneri allaccio distributore se non esplicitati.</p>
                </div>
              </div>

              {/* Totali Economici (5 cols) */}
              <div className="sm:col-span-5 p-3.5 bg-slate-100 rounded-xl border border-slate-300 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Imponibile Totale:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      € {preventivo.imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>IVA di Legge ({preventivo.ivaPercentuale}%):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      € {preventivo.ivaImporto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 mt-2">
                  <div className="p-2 bg-amber-100 border border-amber-300 rounded-lg flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-950 uppercase">
                      Totale Preventivo:
                    </span>
                    <span className="text-sm font-black font-mono text-amber-900">
                      € {preventivo.totale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block text-right mt-1">
                    IVA {preventivo.ivaPercentuale}% inclusa
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Spazi Firma e Sottoscrizione */}
            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300 mb-4 text-[10px]">
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">
                  Per la Direzione Tecnica (VoltMaster)
                </span>
                <span className="text-slate-500 block mb-6">
                  Ing. Roberto Fontana · Responsabile Tecnico Albo MI-34891
                </span>
                <div className="border-b border-slate-400 pb-4 flex items-center justify-between text-emerald-700 italic text-[9px]">
                  <span>✓ Validato con firma elettronica</span>
                  <span>{preventivo.dataEmissione}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-0.5">
                  Per Accettazione il Committente
                </span>
                <span className="text-slate-500 block mb-6">
                  (Timbro aziendale e firma leggibile del Legale Rappresentante)
                </span>
                <div className="border-b border-slate-400 pb-4 text-slate-400 text-[9px]">
                  Data e Firma: _____________________________________
                </div>
              </div>
            </div>

            {/* 7. Footer Legale */}
            <div className="text-[9px] text-slate-400 text-center pt-2 border-t border-slate-200">
              VoltMaster Impianti S.r.l. · P.IVA 09248100159 · Documento informatico originale memorizzato su cloud certificato · Codice: VM-PREV-{preventivo.numero}
            </div>
          </div>
        </div>

        {/* Modal Bottom Strip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 print:hidden">
          <button
            onClick={handleCopyLink}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiato negli appunti' : 'Copia Riepilogo'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica File PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors shadow-sm"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
