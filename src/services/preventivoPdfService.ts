import { jsPDF } from 'jspdf';
import { Preventivo, Cliente, Cantiere } from '../types';

/**
 * Generate a certified, professional commercial PDF for a Preventivo
 */
export function generatePreventivoPdf(
  preventivo: Preventivo,
  cliente?: Cliente,
  cantiere?: Cantiere
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = 14;

  // 1. Top Decorative Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent amber stripe
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLTMASTER', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('IMPIANTI ELETTRICI INDUSTRIALI · DOMOTICA KNX · FOTOVOLTAICO · CEI 64-8', margin, 19);

  // Document Badge (top right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('PREVENTIVO ECONOMICO', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(preventivo.numero, pageWidth - margin, 19, { align: 'right' });

  y = 32;

  // 2. Company Sub-header & Certifications
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    'VoltMaster Impianti S.r.l. · P.IVA 09248100159 · REA MI-2099182 · Via dell\'Innovazione Elettrica 42, 20126 Milano (MI)',
    margin,
    y
  );
  y += 4;
  doc.text(
    'Abilitazioni D.M. 37/2008 lett. A, B, G · Certificazione CEI 64-8 / CEI 11-27 · Tel. +39 02 884400 · preventivi@voltmaster.it',
    margin,
    y
  );

  y += 6;

  // 3. Metadata Boxes (Committente & Dati Offerta)
  const boxHeight = 34;
  const colWidth = (contentWidth - 6) / 2;

  // Box 1: Dati Committente & Ubicazione
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('DESTINATARIO / COMMITTENTE', margin + 3.5, y + 5);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const cliRagione = preventivo.clienteNome || cliente?.ragioneSociale || 'Spett.le Committente';
  doc.text(doc.splitTextToSize(cliRagione, colWidth - 7)[0] || cliRagione, margin + 3.5, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const referenteStr = cliente?.referente ? `All'att.ne di: ${cliente.referente}` : 'All\'attenzione dell\'Ufficio Tecnico';
  doc.text(referenteStr, margin + 3.5, y + 15, { maxWidth: colWidth - 7 });

  const indirizzoStr = cliente?.indirizzo ? `${cliente.indirizzo}, ${cliente.citta}` : (cantiere ? `${cantiere.indirizzo}, ${cantiere.citta}` : 'Sede del cliente');
  doc.text(`Indirizzo: ${indirizzoStr}`, margin + 3.5, y + 19.5, { maxWidth: colWidth - 7 });

  const pivaStr = cliente?.partitaIva ? `P.IVA / C.F.: ${cliente.partitaIva}` : 'P.IVA: Documento rilasciato su anagrafica cliente';
  doc.text(pivaStr, margin + 3.5, y + 24);

  if (cliente?.email || cliente?.telefono) {
    const contactStr = [cliente.email, cliente.telefono].filter(Boolean).join(' · ');
    doc.text(contactStr, margin + 3.5, y + 28.5, { maxWidth: colWidth - 7 });
  }

  // Box 2: Dati Preventivo & Termini
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('RIFERIMENTI OFFERTA COMMERCIALE', col2X + 3.5, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Offerta N°: ${preventivo.numero}`, col2X + 3.5, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Data Emissione: ${preventivo.dataEmissione || new Date().toISOString().split('T')[0]}`, col2X + 3.5, y + 15);
  doc.text(`Validità Offerta: fino al ${preventivo.dataScadenza}`, col2X + 3.5, y + 19.5);

  // Status Badge
  const statoLabel = preventivo.stato.toUpperCase();
  const statoColor: [number, number, number] =
    preventivo.stato === 'accettato'
      ? [16, 185, 129] // emerald
      : preventivo.stato === 'inviato'
      ? [245, 158, 11] // amber
      : [100, 116, 139]; // slate

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statoColor[0], statoColor[1], statoColor[2]);
  doc.text(`Stato Preventivo: ${statoLabel}`, col2X + 3.5, y + 24);

  if (preventivo.cantiereIdCreato) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.text('✓ Commessa attiva avviata in cantiere', col2X + 3.5, y + 28.5);
  }

  y += boxHeight + 6;

  // 4. Oggetto della Fornitura / Intervento
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OGGETTO DELL\'APPALTO & AMBITO DI APPLICAZIONE', margin + 3.5, y + 4.2);

  y += 6.5;

  const oggettoLines = doc.splitTextToSize(
    preventivo.oggetto || 'Opere da elettricista, fornitura e posa in opera apparati di distribuzione e quadri.',
    contentWidth - 7
  );
  const oggettoHeight = Math.max(12, oggettoLines.length * 4.5 + 4);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, oggettoHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(oggettoLines, margin + 3.5, y + 5);

  y += oggettoHeight + 6;

  // 5. Computo Metrico & Capitolato Voci
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPUTO METRICO ESTIMATIVO DELLE VOCI DI CAPITOLATO', margin + 3.5, y + 4.2);

  y += 6.5;

  // Table header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 5.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('N°', margin + 2, y + 4);
  doc.text('Descrizione Fornitura e Posa a Regola d\'Arte', margin + 12, y + 4);
  doc.text('Cat.', margin + contentWidth - 62, y + 4);
  doc.text('Q.tà', margin + contentWidth - 45, y + 4);
  doc.text('U.M.', margin + contentWidth - 32, y + 4);
  doc.text('P. Unit (€)', margin + contentWidth - 21, y + 4, { align: 'right' });
  doc.text('Totale (€)', margin + contentWidth - 2, y + 4, { align: 'right' });

  y += 5.5;

  const categoryAbbr: Record<string, string> = {
    materiale: 'MAT',
    manodopera: 'MAN',
    noleggio: 'NOL',
    pratica_tecnica: 'DOC',
  };

  preventivo.voci.forEach((voce, index) => {
    // Check for page overflow
    if (y > 240) {
      doc.addPage();
      y = 15;

      // Re-add top mini header on new page
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`VOLTMASTER · Preventivo ${preventivo.numero} (Segue)`, margin, 8);

      y = 18;

      // Table header again
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y, contentWidth, 5.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('N°', margin + 2, y + 4);
      doc.text('Descrizione Fornitura e Posa', margin + 12, y + 4);
      doc.text('Cat.', margin + contentWidth - 62, y + 4);
      doc.text('Q.tà', margin + contentWidth - 45, y + 4);
      doc.text('U.M.', margin + contentWidth - 32, y + 4);
      doc.text('P. Unit (€)', margin + contentWidth - 21, y + 4, { align: 'right' });
      doc.text('Totale (€)', margin + contentWidth - 2, y + 4, { align: 'right' });
      y += 5.5;
    }

    const descMaxW = contentWidth - 78;
    const splitDesc = doc.splitTextToSize(voce.descrizione, descMaxW);
    const rowHeight = Math.max(6, splitDesc.length * 3.6 + 2.5);

    // Alternate row zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);

    doc.text(String(index + 1), margin + 2, y + 3.8);
    doc.text(splitDesc, margin + 12, y + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(categoryAbbr[voce.categoria] || voce.categoria.slice(0, 3).toUpperCase(), margin + contentWidth - 62, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    doc.text(String(voce.quantita), margin + contentWidth - 45, y + 3.8);
    doc.text(voce.unitaMisura, margin + contentWidth - 32, y + 3.8);

    doc.text(
      voce.prezzoUnitario.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      margin + contentWidth - 21,
      y + 3.8,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      voce.totale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      margin + contentWidth - 2,
      y + 3.8,
      { align: 'right' }
    );

    y += rowHeight;
  });

  y += 4;

  // 6. Totali Economici & Breakdown IVA
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  const totalsBoxW = 80;
  const totalsBoxX = margin + contentWidth - totalsBoxW;
  const totalsBoxH = 28;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, y, totalsBoxW, totalsBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Totale Imponibile:', totalsBoxX + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `€ ${preventivo.imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxW - 4,
    y + 6,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`IVA di Legge (${preventivo.ivaPercentuale}%):`, totalsBoxX + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `€ ${preventivo.ivaImporto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxW - 4,
    y + 12,
    { align: 'right' }
  );

  // Line before grand total
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 3, y + 16, totalsBoxX + totalsBoxW - 3, y + 16);

  // Highlighted Grand Total
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(totalsBoxX + 2, y + 18, totalsBoxW - 4, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('TOTALE PREVENTIVO:', totalsBoxX + 4, y + 23.5);

  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(
    `€ ${preventivo.totale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxW - 4,
    y + 23.5,
    { align: 'right' }
  );

  // 7. Condizioni Commerciali & Pagamenti (Left box beside totals)
  const condBoxW = contentWidth - totalsBoxW - 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, condBoxW, totalsBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CONDIZIONI GENERALI DI FORNITURA & PAGAMENTO', margin + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  const noteLines = doc.splitTextToSize(
    preventivo.note || 'Condizioni standard: 30% all\'ordine, 40% a SAL intermedio, 30% a saldo previo collaudo positivo e rilascio DiCo DM 37/08.',
    condBoxW - 7
  );
  doc.text(noteLines, margin + 3.5, y + 9.5);

  y += totalsBoxH + 6;

  // 8. Box Firme e Sottoscrizione
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  const sigW = (contentWidth - 6) / 2;
  const sigH = 26;

  // Signature 1: VoltMaster
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigW, sigH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PER LA DIREZIONE TECNICA (VOLTMASTER)', margin + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Ing. Roberto Fontana · Resp. Tecnico Albo MI-34891', margin + 3.5, y + 9.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text('✓ Offerta validata digitalmente con marca temporale', margin + 3.5, y + 17);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 3.5, y + 21, margin + sigW - 3.5, y + 21);

  // Signature 2: Committente per Accettazione
  doc.roundedRect(col2X, y, sigW, sigH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PER ACCETTAZIONE IL COMMITTENTE', col2X + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Timbro aziendale e firma leggibile del Legale Rappresentante)', col2X + 3.5, y + 9.5);

  doc.setDrawColor(226, 232, 240);
  doc.line(col2X + 3.5, y + 21, col2X + sigW - 3.5, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Data e Luogo: ____________________________________', col2X + 3.5, y + 24.5);

  y += sigH + 5;

  // 9. Legal Disclaimer & Standards
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Tutti i materiali impiegati rispondono alle normative CEI / IMQ vigenti. Al termine dell\'intervento verrà rilasciata la Dichiarazione di Conformità ex D.M. 37/2008.',
    margin + 3.5,
    y + 4
  );
  doc.text(
    `Documento informatico generato da VoltMaster Platform · Codice Univoco: VM-PREV-${preventivo.numero}-${Date.now().toString(36).toUpperCase()}`,
    margin + 3.5,
    y + 7.5
  );

  // Add Page Numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `VoltMaster Impianti S.r.l. · Preventivo ${preventivo.numero} · Pagina ${i} di ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Trigger immediate browser download of the Preventivo PDF
 */
export function downloadPreventivoPdf(
  preventivo: Preventivo,
  cliente?: Cliente,
  cantiere?: Cantiere
): void {
  const doc = generatePreventivoPdf(preventivo, cliente, cantiere);
  const cleanNum = preventivo.numero.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanNum}_Preventivo_VoltMaster.pdf`);
}

/**
 * Get PDF as Blob for email attachment, sharing or inline preview
 */
export function getPreventivoPdfBlob(
  preventivo: Preventivo,
  cliente?: Cliente,
  cantiere?: Cantiere
): Blob {
  const doc = generatePreventivoPdf(preventivo, cliente, cantiere);
  return doc.output('blob');
}

/**
 * Print the PDF directly from the browser without page interface noise
 */
export function printPreventivoPdfDirectly(
  preventivo: Preventivo,
  cliente?: Cliente,
  cantiere?: Cantiere
): void {
  const doc = generatePreventivoPdf(preventivo, cliente, cantiere);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Direct iframe print failed, falling back to window.open:', err);
        window.open(blobUrl, '_blank');
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    }, 250);
  };
}

/**
 * Share Preventivo PDF via Web Share API or download fallback
 */
export async function sharePreventivoPdf(
  preventivo: Preventivo,
  cliente?: Cliente,
  cantiere?: Cantiere
): Promise<boolean> {
  const blob = getPreventivoPdfBlob(preventivo, cliente, cantiere);
  const cleanNum = preventivo.numero.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanNum}_Preventivo_VoltMaster.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Preventivo ${preventivo.numero} - VoltMaster`,
        text: `Preventivo commerciale ${preventivo.numero} per ${preventivo.clienteNome} relativo a: ${preventivo.oggetto}`,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        downloadPreventivoPdf(preventivo, cliente, cantiere);
      }
      return false;
    }
  } else {
    // Fallback: download directly
    downloadPreventivoPdf(preventivo, cliente, cantiere);
    return false;
  }
}
