import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  Package,
  Truck,
  MapPin,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Boxes,
} from 'lucide-react';
import { PaccoZonaVerde } from '../../types';

interface EtichettaColloA5ModalProps {
  pacco: PaccoZonaVerde;
  onClose: () => void;
  onConfermaCarico?: () => void;
}

export const EtichettaColloA5Modal: React.FC<EtichettaColloA5ModalProps> = ({
  pacco,
  onClose,
  onConfermaCarico,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Generazione del QR Code ad alta risoluzione (almeno 300x300px per stampa nitida)
  useEffect(() => {
    QRCode.toDataURL(
      pacco.qrCode,
      {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a', // slate-900 per massimo contrasto
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [pacco.qrCode]);

  // Stampa diretta browser per formato A5 Landscape
  const handlePrint = () => {
    window.print();
  };

  // Generazione e download PDF vettoriale A5 Landscape conforme con jsPDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Creazione documento jsPDF in formato A5 Landscape (210 x 148 mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const pageWidth = 210;
      const pageHeight = 148;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2; // 194 mm

      // 1. Header Superiore Verde / Slate
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, margin, contentWidth, 20, 'F');

      // Bordo laterale verde neon per Zona Verde
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(margin, margin, 5, 20, 'F');

      // Logo e Brand
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('VOLTMASTER', margin + 8, margin + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('GESTIONALE IMPIANTI ELETTRICI · SEGNATE COLLO / LOGISTICA ZONA VERDE', margin + 8, margin + 14);

      // Badge ZONA VERDE in alto a destra
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(pageWidth - margin - 68, margin + 3.5, 66, 13, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ZONA VERDE - PRONTO CANTIERE', pageWidth - margin - 65, margin + 9.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Prep: ${pacco.dataPreparazione} · ${pacco.magazzinierePreparatore}`, pageWidth - margin - 65, margin + 14);

      // 2. Colonna Sinistra: QR Code e Codice
      const qrBoxWidth = 52;
      const leftColX = margin;
      const bodyY = margin + 22;

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.3);
      doc.roundedRect(leftColX, bodyY, qrBoxWidth, 70, 2, 2, 'FD');

      // Se il QR code in formato DataURL è disponibile, inseriscilo
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', leftColX + 3.5, bodyY + 3.5, 45, 45);
      }

      // ID Pacco in grande
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(pacco.id, leftColX + qrBoxWidth / 2, bodyY + 54, { align: 'center' });

      // Stringa scanner
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(pacco.qrCode, leftColX + qrBoxWidth / 2, bodyY + 60, { align: 'center' });

      // Collo e Imballo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${pacco.numeroCollo || 'Collo Singolo'} ${pacco.pesoKg ? `(${pacco.pesoKg} kg)` : ''}`, leftColX + qrBoxWidth / 2, bodyY + 66, { align: 'center' });

      // 3. Colonna Destra: Box Destinazione e Box Logistica
      const rightColX = leftColX + qrBoxWidth + 4;
      const rightColWidth = contentWidth - qrBoxWidth - 4; // 138 mm

      // Box Destinazione Cantiere
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(rightColX, bodyY, rightColWidth, 33, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('DESTINAZIONE CANTIERE:', rightColX + 4, bodyY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`[${pacco.codiceCantiere}] ${pacco.cantiereTitolo}`.substring(0, 50), rightColX + 4, bodyY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Indirizzo: ${pacco.indirizzoCantiere}`, rightColX + 4, bodyY + 18);
      if (pacco.clienteNome) {
        doc.text(`Cliente: ${pacco.clienteNome}`, rightColX + 4, bodyY + 24);
      }

      // Box Logistica / Mezzo
      const logBoxY = bodyY + 35;
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(rightColX, logBoxY, rightColWidth, 23, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text('MEZZO & OPERATORE ASSEGNATO:', rightColX + 4, logBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Furgone: ${pacco.furgoneAssegnato || 'Da assegnare'}`, rightColX + 4, logBoxY + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Autista / Preposto: ${pacco.operatoreRitiro || 'Qualsiasi operatore incaricato'}`, rightColX + 4, logBoxY + 17.5);

      // Distinta Materiali (Tabella Sintetica)
      const tableY = bodyY + 60;
      const tableHeight = 32;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.rect(rightColX, tableY, rightColWidth, tableHeight, 'FD');

      // Intestazione Tabella
      doc.setFillColor(226, 232, 240);
      doc.rect(rightColX, tableY, rightColWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SKU / CODICE', rightColX + 3, tableY + 4.2);
      doc.text('DESCRIZIONE MATERIALE / COMPONENTE', rightColX + 35, tableY + 4.2);
      doc.text('Q.TÀ', rightColX + 110, tableY + 4.2);
      doc.text('U.M.', rightColX + 124, tableY + 4.2);

      // Righe Materiale (massimo 4 nel layout A5 sintetico)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      let rowY = tableY + 10;
      pacco.righeMateriale.slice(0, 4).forEach((riga) => {
        doc.setTextColor(15, 23, 42);
        doc.text(riga.sku.substring(0, 16), rightColX + 3, rowY);
        doc.text(riga.descrizione.substring(0, 45), rightColX + 35, rowY);
        doc.setFont('helvetica', 'bold');
        doc.text(String(riga.quantita), rightColX + 110, rowY);
        doc.setFont('helvetica', 'normal');
        doc.text(riga.um, rightColX + 124, rowY);
        rowY += 5.5;
      });

      if (pacco.righeMateriale.length > 4) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`... e altri ${pacco.righeMateriale.length - 4} articoli (vedi distinta completa allegata)`, rightColX + 35, rowY);
      }

      // Box Inferiore: Note Operative e Area di Firma Spunta Carico
      const bottomY = margin + 94;
      const bottomHeight = pageHeight - margin - bottomY;

      // Note Operative
      const noteBoxWidth = contentWidth * 0.6;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, bottomY, noteBoxWidth, bottomHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NOTE OPERATIVE & MANIPOLAZIONE:', margin + 3, bottomY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const splitNotes = doc.splitTextToSize(
        pacco.noteDiCarico || 'Verificare integrità prima della partenza. Assicurare il carico con cinghie omologate.',
        noteBoxWidth - 6
      );
      doc.text(splitNotes, margin + 3, bottomY + 10);

      // Box Firma / Spunta al Carico Mezzo
      const signBoxX = margin + noteBoxWidth + 4;
      const signBoxWidth = contentWidth - noteBoxWidth - 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(signBoxX, bottomY, signBoxWidth, bottomHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SPUNTA CARICO SUL MEZZO (AUTISTA / OP.)', signBoxX + 3, bottomY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('[  ] Collo integro e conteggiato', signBoxX + 3, bottomY + 11);
      doc.text('[  ] Caricato a bordo furgone', signBoxX + 3, bottomY + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Firma / Timbro: _______________________', signBoxX + 3, bottomY + 23);

      // Salva il PDF generato
      doc.save(`SEGNATE_COLLO_A5_${pacco.id}.pdf`);
    } catch (err) {
      console.error('Errore durante la generazione del PDF Segnacollo:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* CSS per stampa precisa A5 Landscape */}
      <style>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 6mm;
          }
          body * {
            visibility: hidden !important;
          }
          #print-area-a5, #print-area-a5 * {
            visibility: visible !important;
          }
          #print-area-a5 {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Non stampabile) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 flex-wrap">
                  <span>Segnacollo A5 - {pacco.id}</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono uppercase">
                    Zona Verde
                  </span>
                </h3>
                <p className="text-xs text-slate-400 hidden min-[480px]:block">
                  Layout pronto per stampante A5 / etichettatrice di spedizione logistica
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-xs active:scale-95"
              title="Scarica PDF Vettoriale A5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isGeneratingPdf ? 'Generazione...' : 'Scarica PDF A5'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95"
              title="Stampa diretta A5"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa A5</span>
            </button>

            {pacco.statoTransito === 'PRONTO_ZONA_VERDE' && onConfermaCarico && (
              <button
                onClick={onConfermaCarico}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95"
                title="Conferma presa in carico sul furgone"
              >
                <Truck className="w-4 h-4" />
                <span>Carica Mezzo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual A5 Label Sheet (Stile Landscape con scrolling fluido su mobile) */}
        <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto flex justify-start sm:justify-center bg-slate-100 dark:bg-slate-950">
          <div
            id="print-area-a5"
            ref={printableRef}
            className="w-full min-w-[620px] max-w-[800px] bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-4 sm:p-5 shadow-lg relative flex flex-col justify-between font-sans shrink-0"
            style={{ minHeight: '500px' }}
          >
            {/* Header Segnacollo */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 self-stretch bg-emerald-500 rounded-xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-900">
                      VOLTMASTER
                    </span>
                    <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold">
                      LOGISTICA
                    </span>
                  </div>
                  <p className="text-[10px] uppercase font-semibold text-slate-600 tracking-wider mt-0.5">
                    Impianti Elettrici · Spedizioni & Materiali Cantiere
                  </p>
                </div>
              </div>

              {/* Badge ZONA VERDE */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-black uppercase rounded-lg shadow-xs tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ZONA VERDE - PRONTO CANTIERE</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Preparato il <span className="font-bold text-slate-800">{pacco.dataPreparazione}</span> da <span className="font-bold text-slate-800">{pacco.magazzinierePreparatore}</span>
                </div>
              </div>
            </div>

            {/* Corpo Principale: QR Code a sinistra + Info Cantiere e Mezzo a destra */}
            <div className="grid grid-cols-12 gap-4 py-3">
              {/* Colonna Sinistra (QR Code Grande) */}
              <div className="col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={pacco.qrCode}
                    className="w-[160px] h-[160px] object-contain border border-slate-200 rounded-lg bg-white p-1"
                  />
                ) : (
                  <div className="w-[160px] h-[160px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                    Generazione QR...
                  </div>
                )}
                <div className="mt-2 text-center">
                  <div className="text-sm font-black font-mono tracking-wider text-slate-900">
                    {pacco.id}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                    {pacco.qrCode}
                  </div>
                  <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono">
                    {pacco.numeroCollo || 'Collo 1 di 1'} {pacco.pesoKg ? `· ${pacco.pesoKg} kg` : ''}
                  </div>
                </div>
              </div>

              {/* Colonna Destra: Cantiere e Logistica */}
              <div className="col-span-8 flex flex-col justify-between space-y-2.5">
                {/* Box Destinazione Cantiere */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Destinazione Cantiere</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    <span className="font-mono text-emerald-700 mr-1.5">[{pacco.codiceCantiere}]</span>
                    {pacco.cantiereTitolo}
                  </div>
                  <div className="text-xs text-slate-700 mt-1 flex items-center gap-1">
                    <span className="font-medium">Indirizzo:</span>
                    <span className="font-semibold">{pacco.indirizzoCantiere}</span>
                  </div>
                  {pacco.clienteNome && (
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Committente: {pacco.clienteNome}</span>
                    </div>
                  )}
                </div>

                {/* Box Logistica & Furgone */}
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mezzo & Operatore Assegnato per il Ritiro</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-amber-700 block uppercase font-medium">Furgone Assegnato:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {pacco.furgoneAssegnato || 'Da assegnare al carico'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 block uppercase font-medium">Autista / Capocantiere:</span>
                      <span className="font-bold text-slate-900">
                        {pacco.operatoreRitiro || 'Qualsiasi operatore incaricato'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tipo Imballo & Riferimento DDT */}
                <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-mono">
                  <span>Imballo: <strong className="text-slate-900 font-sans">{pacco.tipoImballo || 'Pallet'}</strong></span>
                  {pacco.ddtRiferimentoId && (
                    <span>Rif. DDT: <strong className="text-slate-900">{pacco.ddtRiferimentoId}</strong></span>
                  )}
                  {pacco.richiestaMaterialiRiferimentoId && (
                    <span>Richiesta: <strong className="text-slate-900">{pacco.richiestaMaterialiRiferimentoId}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Distinta Materiali Sintetica */}
            <div className="border border-slate-300 rounded-xl overflow-hidden my-2">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                  Distinta Materiale Contenuto nel Collo ({pacco.righeMateriale.length} posizioni)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Spuntare durante il carico a bordo
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-1.5 px-3">SKU</th>
                    <th className="py-1.5 px-3">Descrizione Articolo</th>
                    <th className="py-1.5 px-3 text-right">Q.tà</th>
                    <th className="py-1.5 px-2">U.M.</th>
                    <th className="py-1.5 px-3">Matricola / Note</th>
                    <th className="py-1.5 px-3 text-center">Spunta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {pacco.righeMateriale.map((riga, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-3 font-mono font-bold text-slate-800 text-[11px]">
                        {riga.sku}
                      </td>
                      <td className="py-1 px-3 text-slate-900 font-medium truncate max-w-[280px]">
                        {riga.descrizione}
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">
                        {riga.quantita}
                      </td>
                      <td className="py-1 px-2 font-mono text-slate-600 text-[11px]">
                        {riga.um}
                      </td>
                      <td className="py-1 px-3 text-slate-500 font-mono text-[10px]">
                        {riga.matricola || '-'}
                      </td>
                      <td className="py-1 px-3 text-center">
                        <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Area Note & Firma Carico */}
            <div className="grid grid-cols-12 gap-3 pt-2 border-t-2 border-slate-900 text-xs">
              <div className="col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                  Istruzioni Operative di Carico & Manipolazione:
                </span>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                  {pacco.noteDiCarico ||
                    'Verificare integrità prima della partenza. Assicurare il carico con cinghie omologate all’interno del furgone.'}
                </p>
              </div>

              <div className="col-span-5 bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-800 block mb-1">
                    Spunta Carico & Presa in Carico Mezzo:
                  </span>
                  <div className="text-[10px] text-slate-600 flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-slate-500 rounded-xs inline-block" />
                    <span>Confermo carico e posizionamento sul mezzo</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-700">
                  <span>Firma Operatore al Carico:</span>
                  <span className="font-mono text-slate-400">___________________</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
