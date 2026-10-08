import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Truck, MapPin } from 'lucide-react';
import { DocumentoDiTrasporto } from '../../types/ddt';

interface DdtPrintModalProps {
  ddt: DocumentoDiTrasporto;
  onClose: () => void;
}

export const DdtPrintModal: React.FC<DdtPrintModalProps> = ({ ddt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(
      `VOLTMASTER-DDT|${ddt.numeroDdt}|${ddt.dataEmissione}|${ddt.cantiereNome}|${ddt.veicoloTarga || 'PROPRIO'}`,
      {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrUrl(url);
        }
      }
    );
  }, [ddt]);

  const handlePrint = () => {
    window.print();
  };

  const getCausaleLabel = (c: string) => {
    switch (c) {
      case 'installazione_cantiere':
        return 'Conto Lavorazione / Installazione Cantiere';
      case 'vendita_materiale':
        return 'Vendita Materiali con Posa in Opera';
      case 'conto_visione':
        return 'Conto Visione e Collaudo Tecnico';
      case 'reso_magazzino':
        return 'Reso Materiali da Cantiere a Magazzino';
      case 'riparazione_garanzia':
        return 'Riparazione / Taratura Strumentazione';
      default:
        return c;
    }
  };

  const getAspettoBeniLabel = (a: string) => {
    switch (a) {
      case 'a_vista_colli':
        return 'A vista in colli';
      case 'cartoni_imballati':
        return 'Cartoni e scatole imballate';
      case 'bobine_cavi':
        return 'Bobine e matasse cavi';
      case 'pallet_fasciato':
        return 'Pallet fasciato con film estensibile';
      case 'sfuso_cassonato':
        return 'Materiale sfuso nel cassone';
      default:
        return a;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300">
        {/* Modal Actions Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              Documento di Trasporto (DDT) · {ddt.numeroDdt}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Sheet */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-xs bg-white text-slate-900">
          {/* Header VoltMaster & Document Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-sm font-black">VOLTMASTER</span>
                <span>IMPIANTI S.R.L.</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">
                Impianti Elettrici Industriali, Civili, MT/BT, Automazione & Sicurezza
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Sede Legale & Magazzino Centrale: Via dell’Artigianato 18, 20100 Milano (MI)
                <br />
                P.IVA & C.F.: IT09876543210 · REA MI-2049182 · PEC: voltmaster@legalmail.it
              </p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg text-center min-w-[210px]">
                <div className="text-[10px] uppercase font-bold text-slate-500">Documento di Trasporto</div>
                <div className="text-base font-black text-slate-950 font-mono tracking-wider">{ddt.numeroDdt}</div>
                <div className="text-[11px] font-semibold text-slate-700">del {ddt.dataEmissione}</div>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Conforme D.P.R. 14/08/1996 n. 472</div>
            </div>
          </div>

          {/* Mittente / Destinatario / Cantiere 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Destinatario (Cliente / Committente) */}
            <div className="p-3.5 border border-slate-300 rounded-lg bg-slate-50/60">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Cessionario / Committente:</div>
              <div className="font-bold text-sm text-slate-950">{ddt.clienteNome}</div>
              <div className="text-[11px] text-slate-700 mt-0.5">P.IVA / C.F.: {ddt.clientePivaCodFisc}</div>
            </div>

            {/* Luogo di Destinazione / Cantiere */}
            <div className="p-3.5 border border-slate-300 rounded-lg bg-amber-50/40 border-amber-300/60">
              <div className="text-[10px] uppercase font-bold text-amber-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Luogo di Consegna (Cantiere Operativo):</span>
              </div>
              <div className="font-bold text-sm text-slate-950">{ddt.cantiereNome}</div>
              <div className="text-[11px] text-slate-800 mt-0.5">{ddt.cantiereIndirizzo} - {ddt.cantiereCitta}</div>
            </div>
          </div>

          {/* Dati Fiscali e Vettore */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 border border-slate-200 rounded-lg bg-slate-50 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Causale Trasporto:</span>
              <span className="font-semibold text-slate-900">{getCausaleLabel(ddt.causaleTrasporto)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Aspetto dei Beni:</span>
              <span className="font-semibold text-slate-900">{getAspettoBeniLabel(ddt.aspettoBeni)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">N. Colli / Peso:</span>
              <span className="font-semibold text-slate-900">{ddt.numeroColli} colli · {ddt.pesoTotaleKg} kg</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Porto:</span>
              <span className="font-semibold text-slate-900 uppercase">{ddt.porto}</span>
            </div>
          </div>

          {/* Dettagli Trasporto / Veicolo e Conducente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 border border-slate-200 rounded-lg bg-slate-50 text-[11px]">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Mezzo di Trasporto:</span>
              <span className="font-semibold text-slate-900">
                {ddt.veicoloModello || 'Mezzo proprio'} ({ddt.veicoloTarga || 'Targa N/D'})
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Conducente / Incaricato:</span>
              <span className="font-semibold text-slate-900">{ddt.autistaNome || 'Incaricato interno'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Data & Ora Inizio Trasporto:</span>
              <span className="font-semibold text-slate-900">
                {ddt.dataEmissione} {ddt.oraPartenza ? `ore ${ddt.oraPartenza}` : ''}
              </span>
            </div>
          </div>

          {/* Tabella Merci / Materiali */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-600">
                  <th className="py-2 px-3 w-10 text-center">N.</th>
                  <th className="py-2 px-3 w-32">Codice / SKU</th>
                  <th className="py-2 px-3">Descrizione Merci e Materiali Elettrici</th>
                  <th className="py-2 px-3 w-16 text-center">U.M.</th>
                  <th className="py-2 px-3 w-20 text-right">Quantità</th>
                  <th className="py-2 px-3 w-32">Lotto / Matricola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {ddt.righe.map((r, i) => (
                  <tr key={r.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">{i + 1}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">{r.sku}</td>
                    <td className="py-2 px-3 text-slate-900">
                      <div className="font-medium">{r.descrizione}</div>
                      {r.note && <div className="text-[10px] text-slate-500 italic mt-0.5">{r.note}</div>}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">{r.unitaMisura}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">{r.quantita}</td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-600">{r.lottoMatricola || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Annotazioni di cantiere */}
          {ddt.annotazioni && (
            <div className="p-3 border border-amber-200 bg-amber-50/30 rounded-lg text-[11px]">
              <span className="font-bold text-amber-900">Note & Prescrizioni di Cantiere: </span>
              <span className="text-slate-800">{ddt.annotazioni}</span>
            </div>
          )}

          {/* Verification QR Code & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t-2 border-slate-900">
            {/* QR Code di verifica su strada */}
            <div className="flex items-center gap-3 border-r md:border-r border-slate-200 pr-3">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code DDT" className="w-16 h-16 object-contain border border-slate-200 rounded p-0.5" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] font-mono">
                  QR
                </div>
              )}
              <div className="text-[9px] text-slate-500 leading-tight">
                <span className="font-bold block text-slate-800">Verifica Digitale</span>
                Tracciabilità carico D.P.R. 472/96 per controlli su strada
              </div>
            </div>

            {/* Firma Mittente */}
            <div className="border border-slate-300 rounded-lg p-2.5 text-center flex flex-col justify-between h-24">
              <span className="text-[9px] uppercase font-bold text-slate-500">Firma Mittente (VoltMaster)</span>
              <div className="font-serif italic text-xs text-slate-700">VoltMaster Impianti Srl</div>
              <span className="text-[8px] text-slate-400">Addetto Logistica</span>
            </div>

            {/* Firma Vettore */}
            <div className="border border-slate-300 rounded-lg p-2.5 text-center flex flex-col justify-between h-24">
              <span className="text-[9px] uppercase font-bold text-slate-500">Firma Vettore / Conducente</span>
              <div className="font-serif italic text-xs text-slate-700">{ddt.autistaNome || 'Incaricato'}</div>
              <span className="text-[8px] text-slate-400">Presa in carico merce</span>
            </div>

            {/* Firma Destinatario */}
            <div className="border border-slate-300 rounded-lg p-2.5 text-center flex flex-col justify-between h-24 bg-amber-50/20 border-amber-300/80">
              <span className="text-[9px] uppercase font-bold text-amber-900">Firma Destinatario Cantiere</span>
              {ddt.stato === 'consegnato' ? (
                <div className="font-serif italic text-xs text-emerald-800 font-bold">
                  {ddt.nomeRiceventeCantiere || 'Ricevuto regolare'}
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 italic">Per ricevuta a pié d’opera</div>
              )}
              <span className="text-[8px] text-slate-500">
                {ddt.dataOraRicezione ? `Consegnato: ${ddt.dataOraRicezione}` : 'Data e firma all’arrivo'}
              </span>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
            VoltMaster Enterprise Cloud · Documento generato elettronicamente conforme alla normativa sui trasporti di cose in conto proprio
          </div>
        </div>
      </div>
    </div>
  );
};
