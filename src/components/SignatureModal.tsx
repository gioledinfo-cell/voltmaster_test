import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, ShieldCheck, Lock, MapPin } from 'lucide-react';
import { auditService } from '../services/auditService';

interface SignatureModalProps {
  cantiereTitolo: string;
  clienteNome: string;
  rolNumero: string;
  documentType?: 'ROL' | 'DDT' | 'SAL' | 'CERTIFICATO' | 'ORDINE' | 'POS';
  onClose: () => void;
  onSaveSignature: (dataUrl: string, signatoryName: string, timestamp: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  cantiereTitolo,
  clienteNome,
  rolNumero,
  documentType = 'ROL',
  onClose,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatoryName, setSignatoryName] = useState(clienteNome);
  const [currentTimestamp, setCurrentTimestamp] = useState('');
  const [isProcessingAudit, setIsProcessingAudit] = useState(false);
  const [auditHash, setAuditHash] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('it-IT')} ore ${now.toLocaleTimeString('it-IT')}`;
    setCurrentTimestamp(formatted);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    setIsProcessingAudit(true);

    const dataUrl = canvas.toDataURL('image/png');
    const finalName = signatoryName.trim() || clienteNome;

    try {
      const entry = await auditService.createSignatureAuditEntry({
        documentId: rolNumero,
        documentType: documentType,
        action: 'FIRMA_CLIENTE',
        signatoryName: finalName,
        signatoryRole: 'Referente / Cliente Cantiere',
        signatureDataUrl: dataUrl,
        extraPayload: {
          cantiereTitolo,
          clienteNome,
          timestampLabel: currentTimestamp,
        },
      });

      setAuditHash(entry.sha256Hash);
      onSaveSignature(dataUrl, finalName, currentTimestamp);
    } catch (e) {
      console.error('Audit log generation error:', e);
      onSaveSignature(dataUrl, finalName, currentTimestamp);
    } finally {
      setIsProcessingAudit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl my-2 sm:my-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Firma Grafometrica Cliente</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conferma dell’intervento giornaliero per {rolNumero}
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg mb-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Cantiere:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{cantiereTitolo}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Committente:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{clienteNome}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Data e Ora:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">{currentTimestamp}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nome e Cognome del firmatario (Referente in cantiere):
          </label>
          <input
            type="text"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            placeholder="es. Ing. Laura Valenti / Dott. Gianluigi Marini"
          />
        </div>

        {/* Signature Pad */}
        <div className="relative mb-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
            <span>Firma nello spazio sottostante (touch o mouse):</span>
            {hasDrawn && <span className="text-emerald-500 dark:text-emerald-400 font-medium">Tratto registrato ✓</span>}
          </div>
          <div className="bg-white rounded-lg border-2 border-slate-300 overflow-hidden relative shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-44 block cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                Firma qui sul touchscreen del dispositivo
              </div>
            )}
            <div className="absolute bottom-2 left-4 right-4 border-b border-dashed border-slate-300 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-95"
          >
            <Eraser className="w-3.5 h-3.5" />
            Cancella e rifai
          </button>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 min-h-[44px] flex items-center justify-center bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasDrawn}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              Conferma Firma e Blocca ROL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
