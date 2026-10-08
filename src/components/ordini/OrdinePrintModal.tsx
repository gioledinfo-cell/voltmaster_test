import React from 'react';
import { OrdineInterno } from '../../types';
import { Printer, X, Download, ShieldCheck, CheckCircle2, Building2, MapPin, Calendar, Clock, FileText } from 'lucide-react';

interface OrdinePrintModalProps {
  ordine: OrdineInterno | null;
  onClose: () => void;
}

export const OrdinePrintModal: React.FC<OrdinePrintModalProps> = ({ ordine, onClose }) => {
  if (!ordine) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFornitore = ordine.tipo === 'fornitore';
  const imponibile = ordine.importoTotale;
  const iva = imponibile * 0.22;
  const totaleConIva = imponibile + iva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Esportazione & Stampa PDF Professionale - {ordine.numero}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva in PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-order-doc" className="p-8 sm:p-12 print:p-6 text-slate-800 text-sm leading-relaxed bg-white">
          {/* Company Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-slate-950 tracking-tight">VOLTMASTER</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-slate-950">
                  IMPIANTI S.R.L.
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Impianti Elettrici Industriali · MT/BT · Energie Rinnovabili & Fotovoltaico · Domotica
              </p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <p>Sede Operativa & Logistica: Via dell'Elettricità 15, 20128 Milano (MI)</p>
                <p>P.IVA / C.F.: IT 08234590154 · Reg. Imprese Milano · Capitale Sociale: € 100.000 i.v.</p>
                <p>Tel: +39 02 88991200 · PEC: voltmaster@pec.it · Web: www.voltmaster.it</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 rounded border border-slate-300 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {isFornitore ? 'Buono d’Ordine Fornitore' : 'Ordine di Fornitura Cliente'}
                </span>
                <span className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  {ordine.numero}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>
                  Data Ordine: <span className="font-bold text-slate-900">{ordine.dataOrdine}</span>
                </p>
                <p>
                  Consegna Richiesta:{' '}
                  <span className="font-bold text-emerald-700">{ordine.dataConsegnaPrevista}</span>
                </p>
                <p>
                  Priorità:{' '}
                  <span className="font-bold uppercase text-amber-700">
                    {ordine.priorita}
                  </span>
                </p>
                <p>
                  Emesso da:{' '}
                  <span className="font-semibold text-slate-800">{ordine.creatoDa.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Recipient & Delivery Site Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Box Destinatario */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                {isFornitore ? 'Spett.le Fornitore' : 'Spett.le Cliente Committente'}
              </span>
              <h3 className="font-bold text-base text-slate-950">
                {ordine.destinatarioRagioneSociale}
              </h3>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                {ordine.destinatarioIndirizzo && (
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {ordine.destinatarioIndirizzo}
                  </p>
                )}
                {ordine.destinatarioEmail && (
                  <p>Email: <span className="text-slate-800 font-mono">{ordine.destinatarioEmail}</span></p>
                )}
                {ordine.destinatarioTelefono && (
                  <p>Tel: <span className="text-slate-800">{ordine.destinatarioTelefono}</span></p>
                )}
              </div>
            </div>

            {/* Box Cantiere / Luogo di Scarico */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                Destinazione Principale / Cantiere di Riferimento
              </span>
              <h3 className="font-bold text-base text-slate-950">
                {ordine.cantiereRiferimentoNome}
              </h3>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>
                  Tipologia: <span className="font-semibold text-slate-800">{isFornitore ? 'Approvvigionamento materiali & noli' : 'Fornitura materiali, mezzi e posa'}</span>
                </p>
                <p>
                  Stato Avanzamento:{' '}
                  <span className="font-bold uppercase text-slate-900">{ordine.stato.replace('_', ' ')}</span>
                </p>
                {ordine.dataConsegnaEffettiva && (
                  <p className="text-emerald-700 font-semibold">
                    Consegnato il: {ordine.dataConsegnaEffettiva}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
              <span>Elenco Righe Ordine & Ripartizioni di Cantiere</span>
              <span className="text-[11px] font-normal text-slate-500 font-mono">
                {ordine.righe.length} {ordine.righe.length === 1 ? 'riga' : 'righe'}
              </span>
            </h4>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Tipo / Codice</th>
                    <th className="py-2.5 px-3">Descrizione Articolo / Servizio</th>
                    <th className="py-2.5 px-3 w-20 text-center">U.M.</th>
                    <th className="py-2.5 px-3 w-24 text-right">Quantità</th>
                    <th className="py-2.5 px-3 w-24 text-right">Prezzo Unit.</th>
                    <th className="py-2.5 px-3 w-24 text-right">Importo Netto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ordine.righe.map((r, idx) => {
                    const rowSubtotal = r.subtotale || (r.prezzoUnitario ? r.prezzoUnitario * r.quantitaTotale : 0);
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            <span className="block text-[10px] uppercase font-bold text-slate-500">
                              {r.tipologia}
                            </span>
                            {r.codice}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-950">
                            <div>{r.descrizione}</div>
                            {r.note && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5">
                                Note: {r.note}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center uppercase font-mono font-bold text-slate-700">
                            {r.unitaMisura}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                            {r.quantitaTotale.toLocaleString('it-IT')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {r.prezzoUnitario !== undefined
                              ? `€ ${r.prezzoUnitario.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {rowSubtotal > 0
                              ? `€ ${rowSubtotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : 'A consuntivo'}
                          </td>
                        </tr>

                        {/* Ripartizione Multi-Cantiere Sub-Row (if present) */}
                        {r.ripartizioniCantieri && r.ripartizioniCantieri.length > 0 && (
                          <tr className="bg-slate-50 border-t border-dashed border-slate-200">
                            <td colSpan={7} className="py-2 px-4">
                              <div className="flex items-start gap-2 text-[11px] text-slate-600">
                                <span className="font-bold text-slate-800 uppercase tracking-wider shrink-0">
                                  Suddivisione Cantieri:
                                </span>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {r.ripartizioniCantieri.map((rip, ripIdx) => (
                                    <span key={ripIdx} className="inline-flex items-center gap-1 font-mono">
                                      <span className="font-semibold text-slate-900">{rip.cantiereNome}:</span>
                                      <span className="font-black text-amber-700">{rip.quantita} {r.unitaMisura}</span>
                                      {rip.note && <span className="text-slate-500 italic">({rip.note})</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-8 items-start">
            {/* Notes & Delivery terms */}
            <div className="sm:col-span-7 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Condizioni di Fornitura & Note di Consegna
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {ordine.noteGenerali || 'Materiale da consegnare a pié d’opera previo preavviso telefonico di 24h al capocantiere. Imballi integri e certificazioni di conformità allegate al DDT.'}
              </p>
              <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-200 space-y-0.5">
                <p>• Resa: Franco Cantiere destinazione concordata.</p>
                <p>• Pagamento: Come da accordi commerciali e condizioni quadro vigenti.</p>
                <p>• Documentazione: Riportare sempre il numero ordine {ordine.numero} su bolle e fatture.</p>
              </div>
            </div>

            {/* Totals Table */}
            <div className="sm:col-span-5 p-4 rounded-xl border border-slate-300 bg-slate-100/60">
              <table className="w-full text-xs space-y-1">
                <tbody>
                  <tr>
                    <td className="py-1 text-slate-600">Imponibile Netto:</td>
                    <td className="py-1 text-right font-mono font-bold text-slate-900">
                      € {imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600">I.V.A. (22%):</td>
                    <td className="py-1 text-right font-mono text-slate-800">
                      € {iva.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-400">
                    <td className="pt-2 font-black text-sm text-slate-950 uppercase">Totale Documento:</td>
                    <td className="pt-2 text-right font-mono font-black text-base text-slate-950">
                      € {totaleConIva.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Firma VoltMaster Impianti S.r.l.
              </p>
              <p className="text-xs text-slate-700 font-semibold mb-8">
                Ufficio Logistica & Acquisti: {ordine.creatoDa.name}
              </p>
              <div className="border-b border-dashed border-slate-400 w-full mb-1"></div>
              <span className="text-[10px] text-slate-400">Firma autorizzata per emissione</span>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {isFornitore ? 'Per Ricevuta e Accettazione Fornitore' : 'Per Ricevuta e Accettazione Cliente'}
              </p>
              <p className="text-xs text-slate-700 font-semibold mb-8">
                Timbro e Firma del Legale Rappresentante
              </p>
              <div className="border-b border-dashed border-slate-400 w-full mb-1"></div>
              <span className="text-[10px] text-slate-400">Data e firma leggibile</span>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-order-doc, #printable-order-doc * {
              visibility: visible;
            }
            #printable-order-doc {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px !important;
            }
          }
        `}} />
      </div>
    </div>
  );
};
