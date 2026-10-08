import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, QrCode } from 'lucide-react';
import { QRModalData } from '../context/AppContext';

interface QRModalProps {
  data: QRModalData;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ data, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(
      data.code,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setDataUrl(url);
        }
      }
    );
  }, [data.code]);

  const handlePrint = () => {
    // Stampa sicura senza window.open (conforme all'ambiente iframe di AI Studio)
    window.print();
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${data.code}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-qr-target, #print-qr-target * {
            visibility: visible !important;
          }
          #print-qr-target {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            border: 2px solid #000 !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{data.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tracciabilità e identificazione rapida da smartphone</p>
          </div>
        </div>

        <div
          id="print-qr-target"
          className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center my-4 border border-slate-200 shadow-inner"
        >
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={data.code}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400 text-sm">
              Generazione QR in corso...
            </div>
          )}
          <span className="font-mono text-xs tracking-wider text-slate-900 font-bold mt-2 text-center">
            {data.code}
          </span>
          {data.subtitle && (
            <span className="text-[11px] text-slate-600 mt-1 max-w-[240px] text-center font-medium">
              {data.subtitle}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-5">
          <button
            onClick={handlePrint}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Stampa Etichetta
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            Scarica PNG
          </button>
        </div>
      </div>
    </div>
  );
};
