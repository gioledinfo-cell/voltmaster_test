import React from 'react';
import { X, Printer, QrCode, Building2, Calendar, Clock, Warehouse, CheckSquare } from 'lucide-react';
import { RichiestaMateriali } from '../../types/richiestaMateriali';

interface RichiestaPickListPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  richiesta: RichiestaMateriali | null;
}

export const RichiestaPickListPrintModal: React.FC<RichiestaPickListPrintModalProps> = ({
  isOpen,
  onClose,
  richiesta,
}) => {
  if (!isOpen || !richiesta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Pick-List Magazzino
            </span>
            <span className="text-xs text-slate-500">Scheda di prelievo materiale per cantiere</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Scheda A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 layout) */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans text-xs space-y-5 bg-white text-slate-900">
          {/* Header Azienda */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950">
                VOLT<span className="text-amber-600">MASTER</span> IMPIANTI ELETTRICI S.R.L.
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Logistica & Magazzino Centrale · Via dell&apos;Elettronica 14, 20100 Milano (MI)
                <br />
                P.IVA IT09876543210 · Tel. 02 8976543 · magazzino@voltmaster.it
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-black uppercase text-amber-600">Scheda Prelievo Colli</div>
              <div className="text-lg font-mono font-black text-slate-900">{richiesta.numero}</div>
              <div className="text-[11px] text-slate-500 font-mono">Data: {richiesta.dataRichiesta}</div>
            </div>
          </div>

          {/* Dati Cantiere & Richiedente */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cantiere di Destinazione</div>
              <div className="font-bold text-sm text-slate-900 mt-0.5">{richiesta.cantiereTitolo}</div>
              <div className="text-xs text-slate-700 mt-0.5">{richiesta.indirizzoConsegna}</div>
              <div className="text-[11px] text-slate-500 mt-1">Committente: {richiesta.clienteNome}</div>
            </div>

            <div className="border-l pl-4 border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dettagli Operativi Richiesta</div>
              <div className="text-xs text-slate-800 mt-0.5">
                Richiedente: <strong>{richiesta.richiedenteNome}</strong> ({richiesta.richiedenteRuolo})
              </div>
              <div className="text-xs text-slate-800 mt-0.5">Telefono: {richiesta.richiedenteTelefono}</div>
              <div className="text-xs text-slate-800 mt-0.5">
                Consegna desiderata: <strong>{richiesta.dataPrevistaConsegna}</strong> ({richiesta.orarioPreferito})
              </div>
              <div className="mt-1">
                <span className="font-bold text-[10px] px-2 py-0.5 rounded uppercase bg-amber-200 text-amber-900">
                  Priorità: {richiesta.priorita.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {richiesta.noteCantiere && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs">
              <strong>Istruzioni speciali dal cantiere:</strong> {richiesta.noteCantiere}
            </div>
          )}

          {/* Tabella Voci da Prelievare */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Distinta Materiali da Allestire ({richiesta.righe.length} voci)</span>
              <span className="text-[11px] font-normal text-slate-500">Spuntare ogni collo approntato</span>
            </div>

            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="p-2 border-r text-center w-10">Check</th>
                  <th className="p-2 border-r text-left w-20">Tipo</th>
                  <th className="p-2 border-r text-left w-28">Codice/SKU</th>
                  <th className="p-2 border-r text-left">Descrizione Articolo</th>
                  <th className="p-2 border-r text-right w-24">Quantità</th>
                  <th className="p-2 text-left w-32">Note / Ubicazione</th>
                </tr>
              </thead>
              <tbody>
                {richiesta.righe.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                    <td className="p-2 border-r text-center">
                      <div className="w-4 h-4 border-2 border-slate-400 rounded inline-block"></div>
                    </td>
                    <td className="p-2 border-r font-mono uppercase text-[10px] text-slate-600">{r.tipo}</td>
                    <td className="p-2 border-r font-mono font-bold text-slate-800">{r.codice}</td>
                    <td className="p-2 border-r font-medium text-slate-900">{r.descrizione}</td>
                    <td className="p-2 border-r text-right font-mono font-black text-slate-950">
                      {r.quantitaRichiesta} {r.unitaMisura}
                    </td>
                    <td className="p-2 text-[11px] text-slate-600">{r.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Firme di Controllo e Uscita Magazzino */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-200">
            <div>
              <div className="text-[11px] font-bold text-slate-700">Addetto al Prelievo (Magazzino):</div>
              <div className="text-xs text-slate-500 mt-0.5">Nome e firma leggibile</div>
              <div className="mt-8 border-b border-slate-400 pb-1 font-mono text-xs">
                {richiesta.preparataDa || '_________________________________'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-700">Autista / Corriere Incaricato (DDT):</div>
              <div className="text-xs text-slate-500 mt-0.5">Firma presa in carico colli per trasporto</div>
              <div className="mt-8 border-b border-slate-400 pb-1 font-mono text-xs">
                _________________________________
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4">
            Documento gestionale interno VoltMaster · Sistema di Tracciabilità Cantiere CEI 64-8
          </div>
        </div>
      </div>
    </div>
  );
};
