import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { ROL, Cantiere } from '../types';
import { DocumentoDiTrasporto } from '../types/ddt';
import { StatoAvanzamentoLavori } from '../types/sal';
import { auditService } from './auditService';

export interface CompanyBrandHeader {
  name: string;
  subTitle: string;
  pIva: string;
  address: string;
  pec: string;
  tel: string;
}

const DEFAULT_COMPANY: CompanyBrandHeader = {
  name: 'VOLTMASTER ELETTROIMPIANTI S.R.L.',
  subTitle: 'Impianti Elettrici Industriali, Automazione & Quadri CEI 64-8',
  pIva: 'P.IVA 09248100159 · Codice Fiscale 09248100159',
  address: "Via dell'Elettronica 12, 20138 Milano (MI)",
  pec: 'voltmaster@pec.it',
  tel: '+39 02 884400',
};

/**
 * Generate a QR Code Data URL for document audit verification
 */
async function generateQrCodeDataUrl(docId: string, docHash?: string): Promise<string> {
  const verifyUrl = `${window.location.origin}/#verify?docId=${encodeURIComponent(docId)}&hash=${encodeURIComponent(docHash || '')}`;
  try {
    return await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 120,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

// ==========================================
// 1. EXPORT DDT (DOCUMENTI DI TRASPORTO)
// ==========================================

export async function generateDdtPdf(ddt: DocumentoDiTrasporto, company = DEFAULT_COMPANY): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.name, margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(company.subTitle, margin, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248);
  doc.text('DOCUMENTO DI TRASPORTO (DDT)', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`N. ${ddt.numeroDdt} del ${ddt.dataEmissione}`, pageWidth - margin, 19, { align: 'right' });

  y = 32;

  // Subheader Company Details
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${company.address} · ${company.pIva} · PEC: ${company.pec}`, margin, y);
  y += 7;

  // Document Box Info
  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 34;

  // Destinatario Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESTINATARIO / CANTIERE DI DESTINO', margin + 3, y + 5);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(ddt.clienteNome || 'Cantiere Principale', margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cantiere: ${ddt.cantiereNome}`, margin + 3, y + 16, { maxWidth: boxWidth - 6 });
  doc.text(`Destinazione: ${ddt.cantiereIndirizzo}, ${ddt.cantiereCitta}`, margin + 3, y + 21, { maxWidth: boxWidth - 6 });
  if (ddt.causaleTrasporto) {
    doc.text(`Causale: ${ddt.causaleTrasporto.replace('_', ' ')}`, margin + 3, y + 26);
  }

  // Trasporto Box
  const x2 = margin + boxWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x2, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DETTAGLI TRASPORTO & VETTORE', x2 + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Vettore: ${ddt.vettoreRagioneSociale || 'Mezzo Proprio VoltMaster'}`, x2 + 3, y + 11);
  doc.text(`Conducente: ${ddt.autistaNome || 'Incaricato di Cantiere'}`, x2 + 3, y + 16);
  doc.text(`Targa Veicolo: ${ddt.veicoloTarga || 'N.D.'}`, x2 + 3, y + 21);
  doc.text(`Aspetto Beni: ${ddt.aspettoBeni || 'A vista / Container'}`, x2 + 3, y + 26);

  y += boxHeight + 8;

  // Table Headers
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('#', margin + 3, y + 5);
  doc.text('Codice / SKU', margin + 12, y + 5);
  doc.text('Descrizione Materiale / Attrezzatura', margin + 45, y + 5);
  doc.text('U.M.', margin + 130, y + 5);
  doc.text('Qtà', margin + 150, y + 5, { align: 'right' });
  doc.text('Note', margin + 180, y + 5, { align: 'right' });

  y += 7;

  // Table Rows
  let alt = false;
  let totalItems = 0;

  if (ddt.righe && ddt.righe.length > 0) {
    ddt.righe.forEach((art, idx) => {
      totalItems += art.quantita;
      doc.setFillColor(alt ? 248 : 255, alt ? 250 : 255, alt ? 252 : 255);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      doc.text(String(idx + 1), margin + 3, y + 5);
      doc.text(art.sku || 'MAT-CEI', margin + 12, y + 5);
      doc.text(art.descrizione.substring(0, 48), margin + 45, y + 5);
      doc.text(art.unitaMisura || 'PZ', margin + 130, y + 5);
      doc.text(String(art.quantita), margin + 150, y + 5, { align: 'right' });
      doc.text((art.note || '-').substring(0, 15), margin + 180, y + 5, { align: 'right' });

      y += 7;
      alt = !alt;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Nessun articolo registrato nel DDT.', margin + 3, y + 5);
    y += 8;
  }

  // Total Summary Bar
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Totale Colli: ${ddt.numeroColli} (${totalItems} unità)`, margin + 3, y);
  doc.text(`Peso Totale Presunto: ${ddt.pesoTotaleKg ? ddt.pesoTotaleKg + ' kg' : 'A vista'}`, margin + 100, y);

  y += 10;

  // Signatures & Audit Trail Section
  const sigBoxWidth = (contentWidth - 6) / 2;
  const sigBoxHeight = 36;

  // Conducente / Mittente Signature
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, sigBoxWidth, sigBoxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA MITTENTE / CONDUCENTE', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(ddt.autistaNome || company.name, margin + 3, y + 10);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Emesso con validità di cantiere VoltMaster ERP', margin + 3, y + 30);

  // Destinatario Signature & Audit Hash
  doc.roundedRect(x2, y, sigBoxWidth, sigBoxHeight, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA PER RICEVUTA DESTINATARIO', x2 + 3, y + 5);

  if (ddt.firmaDestinatario) {
    try {
      doc.addImage(ddt.firmaDestinatario, 'PNG', x2 + 3, y + 7, 45, 18);
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.text('[Firma Digitale Acquisita]', x2 + 3, y + 15);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Firmato da: ${ddt.nomeRiceventeCantiere || 'Incaricato'}`, x2 + 3, y + 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Data: ${ddt.dataOraRicezione || ddt.dataEmissione}`, x2 + 3, y + 31);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Firma in attesa di acquisizione', x2 + 3, y + 18);
  }

  y += sigBoxHeight + 6;

  // QR Code & Cryptographic Verification Footer
  const docHash = await auditService.getLatestDocumentHash(ddt.id, ddt.numeroDdt);
  const qrDataUrl = await generateQrCodeDataUrl(ddt.id, docHash);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 22, y, 22, 22);
    } catch (err) {
      console.warn('Could not render QR code on PDF:', err);
    }
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth - 26, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFICA CRITTOGRAFICA AUDIT TRAIL', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256 Hash: ${docHash}`, margin + 3, y + 10);
  doc.text(`Certificato di Origine: VoltMaster Server Node.js Express · Marca Temporale UTC: ${new Date().toISOString()}`, margin + 3, y + 14);
  doc.text('Inquadra il QR Code con lo smartphone per verificare l\'autenticità immutabile del documento sul Registro di Cantiere.', margin + 3, y + 18);

  return doc;
}

export async function exportDdtToExcel(ddtList: DocumentoDiTrasporto[]): Promise<void> {
  const data = ddtList.map((d) => ({
    'Numero DDT': d.numeroDdt,
    'Data Emissione': d.dataEmissione,
    'Cantiere Titolo': d.cantiereNome,
    'Cliente': d.clienteNome,
    'Indirizzo Destinazione': `${d.cantiereIndirizzo}, ${d.cantiereCitta}`,
    'Vettore': d.vettoreRagioneSociale || 'Mezzo Proprio',
    'Autista': d.autistaNome || '-',
    'Targa': d.veicoloTarga || '-',
    'Totale Articoli': d.righe ? d.righe.length : 0,
    'Stato Firma': d.firmaDestinatario ? 'FIRMATO' : 'IN ATTESA',
    'Firmatario': d.nomeRiceventeCantiere || '-',
    'Data Ricezione': d.dataOraRicezione || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Documenti di Trasporto');

  XLSX.writeFile(workbook, `Registro_DDT_VoltMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ==========================================
// 2. EXPORT SAL (STATO AVANZAMENTO LAVORI)
// ==========================================

export async function generateSalPdf(sal: StatoAvanzamentoLavori, company = DEFAULT_COMPANY): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Top Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.name, margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(company.subTitle, margin, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153);
  doc.text('STATO AVANZAMENTO LAVORI (SAL)', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`${sal.codiceSal} - ${sal.dataEmissione}`, pageWidth - margin, 19, { align: 'right' });

  y = 32;

  // Header Sub
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${company.address} · ${company.pIva} · Contabilità di Cantiere`, margin, y);
  y += 7;

  // Info Box
  const colW = (contentWidth - 6) / 2;
  const boxH = 34;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colW, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('COMMITTENTE & CANTIERE', margin + 3, y + 5);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(sal.committenteNome || 'Committente Principale', margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cantiere: ${sal.cantiereNome}`, margin + 3, y + 16, { maxWidth: colW - 6 });
  doc.text(`Codice Commessa: ${sal.cantiereId}`, margin + 3, y + 21);
  doc.text(`Direttore Lavori: ${sal.approvatoDirettoreLavori?.nome || 'Ing. Capocantiere'}`, margin + 3, y + 26);

  // Financial Box
  const x2 = margin + colW + 6;
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(x2, y, colW, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text('QUADRO ECONOMICO SAL', x2 + 3, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Importo Contratto Reale: € ${sal.importoContrattualeTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, x2 + 3, y + 11);
  doc.text(`Lavori Eseguiti al SAL: € ${sal.totaleLavoriCumulati.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, x2 + 3, y + 16);
  doc.text(`Percentuale Avanzamento: ${sal.percentualeAvanzamentoGlobale}%`, x2 + 3, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(`Netto da Liquidare: € ${(sal.certificatoPagamento?.importoNettoLiquidare || sal.totaleLavoriCumulati).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, x2 + 3, y + 27);

  y += boxH + 8;

  // Lavorazioni Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('#', margin + 3, y + 5);
  doc.text('Descrizione Categoria / Lavorazione', margin + 12, y + 5);
  doc.text('Importo Previsto', margin + 105, y + 5, { align: 'right' });
  doc.text('Eseguito', margin + 140, y + 5, { align: 'right' });
  doc.text('% Avanz.', margin + 180, y + 5, { align: 'right' });

  y += 7;

  let alt = false;
  if (sal.voci && sal.voci.length > 0) {
    sal.voci.forEach((lav, idx) => {
      doc.setFillColor(alt ? 248 : 255, alt ? 250 : 255, alt ? 252 : 255);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      doc.text(String(idx + 1), margin + 3, y + 5);
      doc.text(lav.descrizione.substring(0, 52), margin + 12, y + 5);
      doc.text(`€ ${lav.importoContrattuale.toLocaleString('it-IT')}`, margin + 105, y + 5, { align: 'right' });
      doc.text(`€ ${lav.importoTotaleCumulato.toLocaleString('it-IT')}`, margin + 140, y + 5, { align: 'right' });
      doc.text(`${lav.percentualeAvanzamento}%`, margin + 180, y + 5, { align: 'right' });

      y += 7;
      alt = !alt;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Avanzamento complessivo da contabilità di cantiere.', margin + 3, y + 5);
    y += 8;
  }

  y += 8;

  // Signatures Section
  const sigW = (contentWidth - 6) / 2;
  const sigH = 36;

  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigW, sigH, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('IL DIRETTORE DEI LAVORI / IMPRESA', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(sal.approvatoDirettoreLavori?.nome || company.name, margin + 3, y + 11);

  doc.roundedRect(x2, y, sigW, sigH, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('IL COMMITTENTE PER APPROVAZIONE', x2 + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(sal.committenteNome || 'Accettazione Cantiere', x2 + 3, y + 11);

  y += sigH + 6;

  // QR Code & Verification Footer
  const docHash = await auditService.getLatestDocumentHash(sal.id, sal.codiceSal);
  const qrDataUrl = await generateQrCodeDataUrl(sal.id, docHash);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 22, y, 22, 22);
    } catch (err) {
      console.warn('Could not render QR code on PDF:', err);
    }
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth - 26, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFICA CRITTOGRAFICA AUDIT TRAIL SAL', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256 Hash: ${docHash}`, margin + 3, y + 10);
  doc.text(`Certificato Contabile VoltMaster ERP · Registro Immutabile Cantiere · ${new Date().toISOString()}`, margin + 3, y + 14);
  doc.text('Scansiona il codice QR per verificare la validità contabile e l\'approvazione del Direttore Lavori.', margin + 3, y + 18);

  return doc;
}

export async function exportSalToExcel(salList: StatoAvanzamentoLavori[]): Promise<void> {
  const data = salList.map((s) => ({
    'Codice SAL': s.codiceSal,
    'Data Emissione': s.dataEmissione,
    'Cantiere': s.cantiereNome,
    'Cliente': s.committenteNome,
    'Importo Contratto (€)': s.importoContrattualeTotale,
    'Lavori Eseguiti (€)': s.totaleLavoriCumulati,
    'Avanzamento (%)': s.percentualeAvanzamentoGlobale,
    'Netto da Liquidare (€)': s.certificatoPagamento?.importoNettoLiquidare || s.totaleLavoriCumulati,
    'Stato Approvazione': s.stato || 'IN CORSO',
    'Direttore Lavori': s.approvatoDirettoreLavori?.nome || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stato Avanzamento Lavori');

  XLSX.writeFile(workbook, `Registro_SAL_VoltMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ==========================================
// 3. BULK MULTI-SHEET EXECUTIVE EXPORT
// ==========================================

export async function exportFullMasterReportToExcel(
  cantieri: Cantiere[],
  rols: ROL[],
  sals: StatoAvanzamentoLavori[],
  ddts: DocumentoDiTrasporto[]
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Cantieri Summary
  const cantieriData = cantieri.map((c) => ({
    'Codice Commessa': c.id,
    'Titolo Cantiere': c.titolo,
    'Cliente': c.clienteNome,
    'Indirizzo': `${c.indirizzo}, ${c.citta}`,
    'Stato Commessa': c.stato,
    'Budget Contratto (€)': c.budgetTotale || 0,
    'Costi Consuntivati (€)': c.costiConsuntivati || 0,
    'Avanzamento (%)': c.avanzamentoPercentuale || 0,
    'Data Inizio': c.dataInizio,
    'Data Presunta Fine': c.dataFinePrevista,
  }));
  const sheetCantieri = XLSX.utils.json_to_sheet(cantieriData);
  XLSX.utils.book_append_sheet(workbook, sheetCantieri, 'Cantieri & Commesse');

  // Sheet 2: ROL
  const rolsData = rols.map((r) => ({
    'Numero ROL': r.numero,
    'Data': r.data,
    'Cantiere': r.cantiereTitolo,
    'Cliente': r.clienteNome,
    'Operatore': r.operatoreNome,
    'Ore Ordinarie': r.oreOrdinarie || 0,
    'Ore Straordinarie': r.oreStraordinarie || 0,
    'Descrizione Intervento': r.descrizioneLavori,
    'Stato Firma': r.firmaClienteDataUrl ? 'FIRMATO' : 'DA FIRMARE',
  }));
  const sheetRols = XLSX.utils.json_to_sheet(rolsData);
  XLSX.utils.book_append_sheet(workbook, sheetRols, 'Rapporti Lavoro (ROL)');

  // Sheet 3: SAL
  const salsData = sals.map((s) => ({
    'SAL N.': s.codiceSal,
    'Data': s.dataEmissione,
    'Cantiere': s.cantiereNome,
    'Contratto (€)': s.importoContrattualeTotale,
    'Totale Eseguito (€)': s.totaleLavoriCumulati,
    'Avanzamento (%)': s.percentualeAvanzamentoGlobale,
    'Stato': s.stato,
  }));
  const sheetSals = XLSX.utils.json_to_sheet(salsData);
  XLSX.utils.book_append_sheet(workbook, sheetSals, 'Stato Avanzamento (SAL)');

  // Sheet 4: DDT
  const ddtsData = ddts.map((d) => ({
    'DDT N.': d.numeroDdt,
    'Data': d.dataEmissione,
    'Cantiere': d.cantiereNome,
    'Destinatario': d.clienteNome,
    'Vettore': d.vettoreRagioneSociale || 'Mezzo Proprio',
    'Articoli Totali': d.righe ? d.righe.length : 0,
    'Firmato': d.firmaDestinatario ? 'SI' : 'NO',
  }));
  const sheetDdts = XLSX.utils.json_to_sheet(ddtsData);
  XLSX.utils.book_append_sheet(workbook, sheetDdts, 'Documenti Trasporto (DDT)');

  XLSX.writeFile(workbook, `Master_Audit_Report_VoltMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
