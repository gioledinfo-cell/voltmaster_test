import React, { useState } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download, Mail, Share2 } from 'lucide-react';
import { ROL } from '../types';
import { useApp } from '../context/AppContext';
import { downloadRolPdf, printRolPdfDirectly, shareRolPdf } from '../services/rolPdfService';
import { ROLEmailReportModal } from './ROLEmailReportModal';

interface ROLPrintModalProps {
  rol: ROL;
  onClose: () => void;
}

export const ROLPrintModal: React.FC<ROLPrintModalProps> = ({ rol, onClose }) => {
  const { showToast, cantieri, clienti } = useApp();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const cantiere = cantieri.find((c) => c.id === rol.cantiereId);
  const cliente = clienti.find((c) => c.ragioneSociale === rol.clienteNome || c.id === cantiere?.clienteId);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectPrintPDF = () => {
    printRolPdfDirectly(rol, cliente, cantiere);
    showToast('Apertura finestra di stampa PDF...', 'info');
  };

  const handleDownloadPDF = () => {
    downloadRolPdf(rol, cliente, cantiere);
    showToast(`PDF del rapporto ${rol.numero} scaricato con successo!`, 'success');
  };

  const handleShare = async () => {
    const shared = await shareRolPdf(rol, cliente, cantiere);
    if (shared) showToast('Rapporto ROL condiviso con successo!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-8">
        {/* Header Controls (Screen Only) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Documento Ufficiale ROL - Rapporto di Intervento</span>
            {rol.bloccatoModifiche && (
              <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Firmato & Archiviato
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Condividi Rapporto"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Condividi</span>
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-slate-950" />
              Invia PDF al Cliente
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Scarica PDF
            </button>
            <button
              onClick={handleDirectPrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Stampa diretta del file PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Stampa PDF
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Stampa A4
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Sheet */}
        <div className="bg-white text-slate-900 p-8 rounded-lg shadow-md border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 text-xs font-sans">
          {/* Company & Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 uppercase">VoltMaster</span>
                <span className="text-[11px] font-semibold text-amber-600 border-l border-slate-400 pl-2">
                  Impianti Elettrici & Automazione
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                VoltMaster ElettroImpianti S.r.l. · P.IVA 09248100159
              </p>
              <p className="text-[10px] text-slate-500">
                Via dell'Elettronica 12, 20138 Milano (MI) · Tel: +39 02 884400 · info@voltmaster.it
              </p>
              <p className="text-[9px] text-slate-400 italic">
                Abilitazioni DM 37/08 lett. A, B, G · Certificazione UNI EN ISO 9001:2015
              </p>
            </div>

            <div className="text-right">
              <div className="text-base font-extrabold text-slate-950 uppercase tracking-wide">
                RAPPORTO INTERVENTO (ROL)
              </div>
              <div className="font-mono text-xs font-bold text-amber-700 mt-0.5">{rol.numero}</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Data Intervento: <strong>{new Date(rol.data).toLocaleDateString('it-IT')}</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                Stato: <span className="uppercase font-bold">{rol.stato}</span>
              </div>
            </div>
          </div>

          {/* Client and Project Meta Table */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200 mb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dati Committente / Cliente
              </span>
              <div className="text-sm font-bold text-slate-900">{rol.clienteNome}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Cantiere di Riferimento:</div>
              <div className="text-xs font-medium text-slate-800">{rol.cantiereTitolo}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dati Personale & Attività
              </span>
              <div className="text-xs text-slate-700">
                Tecnico Responsabile: <strong>{rol.operatoreNome}</strong>
              </div>
              {rol.workType && (
                <div className="text-xs text-slate-700 mt-1">
                  Macro-Area: <strong className="uppercase text-amber-700">
                    {rol.workType === 'manutenzione_riparazione' ? 'Manutenzione & Riparazione Dispositivi' : rol.workType === 'officina' ? 'Officina / Cablaggio Quadri' : 'Attività di Cantiere'}
                  </strong>
                </div>
              )}
              {rol.subActivity && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Lavorazione: <em>{rol.subActivity}</em>
                </div>
              )}
              {rol.activityDescription && (
                <div className="text-[11px] text-slate-800 font-semibold mt-0.5">
                  Oggetto Intervento: {rol.activityDescription}
                </div>
              )}
              {rol.collaboratori && rol.collaboratori.length > 0 && (
                <div className="text-xs text-slate-700 mt-1">
                  Collaboratori Squadra: <strong>{rol.collaboratori.map((c) => c.nome).join(', ')}</strong>
                </div>
              )}
              {rol.lavorazioneTitolo && (
                <div className="text-xs text-slate-700 mt-1">
                  Lavorazione: <strong>{rol.lavorazioneTitolo}</strong>
                </div>
              )}
              {rol.attivitaLibera && (
                <div className="text-xs text-slate-700 mt-1">
                  Attività Libera: <em>{rol.attivitaLibera}</em>
                </div>
              )}
            </div>
          </div>

          {/* PARAMETRI GIORNALE DEI LAVORI: Meteo, Turno, Avanzamento */}
          {(rol.meteo || rol.turnoOrario || rol.avanzamentoPercentuale !== undefined) && (
            <div className="mb-4 grid grid-cols-3 gap-3 bg-slate-900 text-white p-3 rounded-md border border-slate-800">
              {/* Meteo */}
              <div className="border-r border-slate-700 pr-2">
                <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold block mb-0.5">
                  Condizioni Meteo & Cantiere
                </span>
                <div className="text-xs font-semibold uppercase flex items-center gap-1 text-slate-100">
                  <span>{rol.meteo?.condizione || 'Sereno'}</span>
                  {rol.meteo?.temperaturaMin !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({rol.meteo.temperaturaMin}°C / {rol.meteo.temperaturaMax}°C)
                    </span>
                  )}
                </div>
                {rol.meteo?.impraticabilitaCantiere && (
                  <span className="inline-block mt-1 text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                    ⚠️ IMPRATICABILE PER MALTEMPO
                  </span>
                )}
              </div>

              {/* Turno */}
              <div className="border-r border-slate-700 px-2">
                <span className="text-[9px] uppercase tracking-wider text-sky-400 font-bold block mb-0.5">
                  Orario Turno & Pausa
                </span>
                <div className="text-xs font-mono text-slate-200 font-bold">
                  {rol.turnoOrario ? `${rol.turnoOrario.oraInizio || '07:30'} - ${rol.turnoOrario.oraFine || '16:30'}` : '07:30 - 16:30'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Pausa: {rol.turnoOrario?.pausaMinuti ?? 60} min
                </div>
              </div>

              {/* Avanzamento */}
              <div className="pl-2">
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block mb-0.5">
                  Stato Avanzamento Operativo
                </span>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-extrabold text-emerald-300 font-mono">
                    {rol.avanzamentoPercentuale ?? 50}%
                  </div>
                  <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${rol.avanzamentoPercentuale ?? 50}%` }}
                    />
                  </div>
                </div>
                {rol.quantitaPosata && (
                  <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                    {rol.quantitaPosata}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Replaced parts if present */}
          {rol.partsReplaced && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs">
              <span className="font-bold text-emerald-900 block mb-0.5">Ricambi e Componenti Sostituiti:</span>
              <p className="text-emerald-800">{rol.partsReplaced}</p>
            </div>
          )}

          {/* Description of Work Done */}
          <div className="mb-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
              Descrizione Dettagliata Lavori Eseguiti
            </h4>
            <div className="p-3 bg-white border border-slate-200 rounded min-h-[70px] text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {rol.descrizioneLavori}
            </div>
          </div>

          {/* Materials Used if present */}
          {rol.materialiUtilizzati && rol.materialiUtilizzati.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                Materiali & Componenti Installati
              </h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-y border-slate-200">
                    <th className="py-1.5 px-2 font-semibold">Descrizione Materiale</th>
                    <th className="py-1.5 px-2 font-semibold text-right w-24">Quantità</th>
                    <th className="py-1.5 px-2 font-semibold text-center w-16">U.M.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rol.materialiUtilizzati.map((mat, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-2 text-slate-800">{mat.nome}</td>
                      <td className="py-1 px-2 font-mono text-right font-medium">{mat.quantita}</td>
                      <td className="py-1 px-2 text-center text-slate-600">{mat.unita}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hours Accounting Table */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
              Riepilogo Ore Lavorate & Personale Operativo
            </h4>
            <div className={`grid gap-2 text-center mb-3 ${rol.hasTravel ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Ore Ordinarie</span>
                <span className="text-sm font-bold font-mono text-slate-900">{rol.oreOrdinarie} h</span>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Straordinari</span>
                <span className="text-sm font-bold font-mono text-slate-900">{rol.oreStraordinarie} h</span>
              </div>
              {rol.hasTravel && (
                <div className="p-2 border border-indigo-200 rounded bg-indigo-50">
                  <span className="text-[10px] text-indigo-700 block">Ore Viaggio</span>
                  <span className="text-sm font-bold font-mono text-indigo-900">{rol.hoursTravel || 0} h</span>
                </div>
              )}
              <div className="p-2 border border-amber-300 rounded bg-amber-50">
                <span className="text-[10px] text-amber-800 font-bold block">Totale Ore Tecnico</span>
                <span className="text-sm font-extrabold font-mono text-amber-900">{rol.oreTotali} h</span>
              </div>
            </div>

            {rol.hasTravel && rol.travelDetails && (
              <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded text-[11px] text-indigo-950 mb-3">
                <strong>Trasferta e Viaggio:</strong> Tratta: {rol.travelDetails.route} · Mezzo: {rol.travelDetails.vehicleName || rol.travelDetails.vehiclePlate || 'Mezzo aziendale'}{rol.travelDetails.km ? ` (${rol.travelDetails.km} km)` : ''}
              </div>
            )}

            {/* Squad details if present */}
            {rol.collaboratori && rol.collaboratori.length > 0 && (
              <div className="border border-slate-200 rounded overflow-hidden text-xs">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px] flex justify-between">
                  <span>Dettaglio Componenti Squadra di Lavoro ({1 + rol.collaboratori.length} Tecnici)</span>
                  <span className="text-amber-700 font-mono">
                    Totale Squadra:{' '}
                    {rol.oreTotali +
                      rol.collaboratori.reduce(
                        (sum, c) => sum + (c.oreOrdinarie ?? rol.oreOrdinarie) + (c.oreStraordinarie ?? rol.oreStraordinarie),
                        0
                      )}{' '}
                    ore/uomo
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 text-[10px] text-slate-500 bg-white">
                    <tr>
                      <th className="py-1 px-3">Operatore</th>
                      <th className="py-1 px-2">Ruolo</th>
                      <th className="py-1 px-2 text-right">Ordinarie</th>
                      <th className="py-1 px-2 text-right">Straordinari</th>
                      <th className="py-1 px-3 text-right">Totale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1 px-3 font-semibold text-slate-800">{rol.operatoreNome} (Caposquadra)</td>
                      <td className="py-1 px-2 text-slate-600 text-[11px]">Tecnico Installatore</td>
                      <td className="py-1 px-2 text-right font-mono text-slate-700">{rol.oreOrdinarie} h</td>
                      <td className="py-1 px-2 text-right font-mono text-slate-700">{rol.oreStraordinarie} h</td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">{rol.oreTotali} h</td>
                    </tr>
                    {rol.collaboratori.map((c, i) => {
                      const cOrd = c.oreOrdinarie ?? rol.oreOrdinarie;
                      const cStr = c.oreStraordinarie ?? rol.oreStraordinarie;
                      return (
                        <tr key={i}>
                          <td className="py-1 px-3 text-slate-800">
                            {c.nome} {c.note && <span className="text-[10px] text-slate-400">({c.note})</span>}
                          </td>
                          <td className="py-1 px-2 text-slate-600 text-[11px]">{c.ruolo || 'Collaboratore'}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-700">{cOrd} h</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-700">{cStr} h</td>
                          <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">{cOrd + cStr} h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attrezzature & Mezzi Utilizzati */}
          {rol.attrezzature && rol.attrezzature.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                Macchinari, Mezzi & Attrezzature di Cantiere Impiegate
              </h4>
              <table className="w-full text-left border border-slate-200 rounded text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px]">
                    <th className="py-1 px-2.5">Macchinario / Attrezzatura</th>
                    <th className="py-1 px-2">Matricola / Targa</th>
                    <th className="py-1 px-2">Operatore Abilitato</th>
                    <th className="py-1 px-2 text-right">Ore Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rol.attrezzature.map((attr, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-2.5 font-medium text-slate-800">{attr.nome}</td>
                      <td className="py-1 px-2 font-mono text-slate-600 text-[10px]">{attr.matricolaOTarga || 'N/A'}</td>
                      <td className="py-1 px-2 text-slate-700">{rol.operatoreNome}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{attr.oreUtilizzo} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Imprevisti & Fermi Cantiere */}
          {rol.imprevisti && rol.imprevisti.length > 0 && (
            <div className="mb-5 p-3 bg-red-50/80 border border-red-200 rounded text-xs">
              <span className="font-bold text-red-900 block mb-1 uppercase text-[10px] tracking-wider">
                ⚠️ Imprevisti, Anomalia o Fermi Cantiere Registrati ({rol.imprevisti.reduce((sum, i) => sum + (i.oreFermo || 0), 0)} ore fermo totali)
              </span>
              <ul className="space-y-1 divide-y divide-red-200/60">
                {rol.imprevisti.map((imp, idx) => (
                  <li key={idx} className="pt-1 text-red-950 flex justify-between items-start">
                    <div>
                      <span className="font-bold capitalize">[{imp.causa}]:</span> {imp.descrizione}
                    </div>
                    <span className="font-mono font-bold text-red-800 whitespace-nowrap ml-2">
                      -{imp.oreFermo || 0} h
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Note Sicurezza & DPI */}
          {rol.noteSicurezza && (
            <div className="mb-5 p-2.5 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-950">
              <span className="font-bold text-amber-900 block mb-0.5 text-[10px] uppercase tracking-wider">
                🛡️ Prescrizioni Sicurezza, POS/PSC & DPI Verificati:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900">{rol.noteSicurezza}</p>
            </div>
          )}

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300 mt-6">
            {/* Operator Signature */}
            <div className="border border-slate-200 p-3 rounded bg-slate-50 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Firma Tecnico Installatore</span>
                <span className="text-xs font-semibold text-slate-800">{rol.operatoreNome}</span>
              </div>
              <div className="text-center font-mono text-xs text-slate-400 italic">
                [Firmato digitalmente tramite app VoltMaster]
              </div>
              <div className="text-[9px] text-slate-400 border-t border-slate-200 pt-1">
                Data trasmissione: {rol.data}
              </div>
            </div>

            {/* Client Signature */}
            <div className="border border-slate-200 p-3 rounded bg-slate-50 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Firma del Committente per Presa Visione</span>
                <span className="text-xs font-semibold text-slate-800">
                  {rol.firmaClienteNome || rol.clienteNome}
                </span>
              </div>

              <div className="flex items-center justify-center h-16">
                {rol.firmaClienteDataUrl ? (
                  <img
                    src={rol.firmaClienteDataUrl}
                    alt="Firma grafometrica cliente"
                    className="max-h-14 max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    {rol.firmaClientePresente ? 'Firma acquisita su tablet' : 'In attesa di firma cliente'}
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-1 flex justify-between">
                <span>{rol.firmaClienteTimestamp ? `Data/Ora: ${rol.firmaClienteTimestamp}` : 'Firma su touch-screen'}</span>
                <span className="text-emerald-700 font-semibold">Valido ai fini contrattuali</span>
              </div>
            </div>
          </div>

          {/* Certificato di Sigillo Digitale Crittografico SHA-256 (Passo 3) */}
          {rol.sigilloDigitale && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded text-[10px] space-y-1.5 print:bg-slate-50 print:border-slate-400">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <span>🔒 ATTESTAZIONE DI SIGILLO DIGITALE CRITTOGRAFICO SHA-256</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono text-[9px] border border-emerald-300">
                    {rol.sigilloDigitale.codiceVerificaUnivoco}
                  </span>
                </div>
                <span className="font-bold text-emerald-700 text-[9px]">
                  ✓ CONFORME EX ARTT. 20-21 CAD & ART. 2702 C.C.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="text-slate-500 font-semibold block">Impronta Crittografica (Digest SHA-256):</span>
                  <span className="font-mono text-slate-800 font-bold break-all select-all block bg-white p-1 rounded border border-slate-200 mt-0.5">
                    {rol.sigilloDigitale.sha256Hash}
                  </span>
                </div>
                <div className="space-y-0.5 text-slate-600">
                  <div>
                    Firmatario: <strong className="text-slate-900">{rol.sigilloDigitale.firmatarioNome}</strong> ({rol.sigilloDigitale.firmatarioRuolo})
                  </div>
                  <div>
                    Marca Temporale: <strong className="text-slate-900 font-mono">{rol.sigilloDigitale.improntaTimestamp}</strong>
                  </div>
                  {rol.sigilloDigitale.coordinateGpsFirma && (
                    <div>
                      GPS rilevato: <strong className="text-slate-900 font-mono">{rol.sigilloDigitale.coordinateGpsFirma.lat.toFixed(5)}, {rol.sigilloDigitale.coordinateGpsFirma.lng.toFixed(5)}</strong>
                    </div>
                  )}
                  <div className="text-[8px] text-slate-500 italic mt-0.5">
                    Documento informatico immodificabile con piena efficacia probatoria legale.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="mt-6 text-[9px] text-slate-400 text-center leading-tight">
            Il presente rapporto di lavoro attesta l'esecuzione a regola d'arte delle attività descritte ai sensi della Legge 46/90 e DM 37/08.
            VoltMaster ElettroImpianti S.r.l. - Documento generato elettronicamente.
          </div>
        </div>
      </div>

      {/* Email Report Dispatch Modal */}
      {isEmailModalOpen && (
        <ROLEmailReportModal
          rol={rol}
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
        />
      )}
    </div>
  );
};
