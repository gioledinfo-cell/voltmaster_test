import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { ROL, Cantiere, Dipendente } from '../types';

export interface RolBrogliaccioFilterOptions {
  periodoLabel?: string;
  dataInizio?: string;
  dataFine?: string;
  dipendenteId?: string;
  cantiereId?: string;
  soloFirmati?: boolean;
}

/**
 * Calcola il costo manodopera stimato per un ROL basato sulle ore e sulle tariffe orarie
 */
export function calcolaCostoManodoperaRol(rol: ROL, dipendenti: Dipendente[]): number {
  const dip = dipendenti.find((d) => d.nome.toLowerCase() === rol.operatoreNome.toLowerCase());
  const tariffaBase = dip?.costoOrario || 35; // Default 35 €/h
  const tariffaStraord = tariffaBase * 1.3;
  const tariffaViaggio = tariffaBase * 0.7;

  const oreViag = rol.hoursTravel || 0;
  const oreStr = rol.oreStraordinarie || 0;
  const oreOrd = rol.oreOrdinarie ?? Math.max(0, rol.oreTotali - oreStr - oreViag);
  const diaria = rol.travelDetails?.km ? rol.travelDetails.km * 0.5 : 0;

  const costoManodopera =
    oreOrd * tariffaBase +
    oreStr * tariffaStraord +
    oreViag * tariffaViaggio +
    diaria;

  return Math.round(costoManodopera * 100) / 100;
}

/**
 * 1. ESPORTAZIONE BROGLIACCIO ROL MENSILE IN FORMATO EXCEL (.XLSX)
 * Include foglio analitico ROL, foglio riepilogativo dipendenti e foglio commesse.
 */
export function exportRolBrogliaccioExcel(
  rols: ROL[],
  cantieri: Cantiere[],
  dipendenti: Dipendente[],
  periodoLabel = 'Ottobre 2026',
  aziendaNome = 'VoltMaster Impianti S.r.l.'
): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // FOGLIO 1: REGISTRO BROGLIACCIO ANALITICO
  // -------------------------------------------------------------
  const f1Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    ['REGISTRO BROGLIACCIO MENSILE RAPPORTINI DI LAVORO (ROL)'],
    [`Periodo di Riferimento: ${periodoLabel}`],
    [`Generato il: ${new Date().toLocaleDateString('it-IT')} alle ore ${new Date().toLocaleTimeString('it-IT')}`],
    [],
    [
      'N. ROL',
      'Data Intervento',
      'Codice Cantiere',
      'Cantiere / Commessa',
      'Committente / Cliente',
      'Tecnico Redattore',
      'Collaboratori di Squadra',
      'Tipo Intervento',
      'Ore Ordinarie',
      'Ore Straordinarie',
      'Ore Viaggio',
      'Ore Totali',
      'Diaria / Km (€)',
      'Costo Manodopera Stimato (€)',
      'Firma Committente',
      'Stato Validazione',
      'Descrizione Attività Svolta & Note',
    ],
  ];

  let totOreOrd = 0;
  let totOreStr = 0;
  let totOreViag = 0;
  let totOreTot = 0;
  let totDiaria = 0;
  let totCostoManodopera = 0;

  for (const r of rols) {
    const cantiere = cantieri.find((c) => c.id === r.cantiereId);
    const oreViag = r.hoursTravel || 0;
    const oreStr = r.oreStraordinarie || 0;
    const oreOrd = r.oreOrdinarie ?? Math.max(0, r.oreTotali - oreStr - oreViag);
    const oreTot = r.oreTotali || oreOrd + oreStr + oreViag;
    const diaria = r.travelDetails?.km ? r.travelDetails.km * 0.5 : 0;
    const costo = calcolaCostoManodoperaRol(r, dipendenti);

    totOreOrd += oreOrd;
    totOreStr += oreStr;
    totOreViag += oreViag;
    totOreTot += oreTot;
    totDiaria += diaria;
    totCostoManodopera += costo;

    const squadStr = (r.collaboratori || [])
      .map((c) => `${c.nome} (${(c.oreOrdinarie || 0) + (c.oreStraordinarie || 0) || 8}h)`)
      .join(', ') || '-';

    const isFirmato = Boolean(r.firmaClientePresente || r.firmaClienteDataUrl);

    f1Data.push([
      r.numero,
      r.data,
      cantiere?.codice || 'CNT-GEN',
      r.cantiereTitolo,
      r.clienteNome,
      r.operatoreNome,
      squadStr,
      r.workType ? r.workType.toUpperCase() : 'CANTIERE',
      oreOrd,
      oreStr,
      oreViag,
      oreTot,
      diaria,
      costo,
      isFirmato ? 'SI (FOGLIO FIRMATO)' : 'NO (DA FIRMARE)',
      r.stato.toUpperCase().replace(/_/g, ' '),
      r.descrizioneLavori || r.noteOperatore || '-',
    ]);
  }

  // Riga totali complessivi
  f1Data.push([]);
  f1Data.push([
    'TOTALI COMPLESSIVI',
    '',
    '',
    '',
    '',
    '',
    '',
    `${rols.length} RAPPORTINI`,
    totOreOrd,
    totOreStr,
    totOreViag,
    totOreTot,
    totDiaria,
    Number(totCostoManodopera.toFixed(2)),
    '',
    '',
    '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(f1Data);
  ws1['!cols'] = [
    { wch: 16 }, // N. ROL
    { wch: 13 }, // Data
    { wch: 14 }, // Cod Cantiere
    { wch: 30 }, // Cantiere
    { wch: 25 }, // Cliente
    { wch: 20 }, // Tecnico
    { wch: 28 }, // Collaboratori
    { wch: 15 }, // Tipo
    { wch: 12 }, // Ore Ord
    { wch: 14 }, // Ore Str
    { wch: 12 }, // Ore Viag
    { wch: 12 }, // Ore Tot
    { wch: 13 }, // Diaria
    { wch: 18 }, // Costo
    { wch: 18 }, // Firma
    { wch: 16 }, // Stato
    { wch: 45 }, // Note
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Brogliaccio Analitico ROL');

  // -------------------------------------------------------------
  // FOGLIO 2: RIEPILOGO PER DIPENDENTE / MANODOPERA
  // -------------------------------------------------------------
  const f2Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    [`PROSPETTO ORE E COMPETENZE PER DIPENDENTE - ${periodoLabel}`],
    [],
    [
      'Nominativo Dipendente',
      'Qualifica Aziendale / Mansione',
      'N. ROL Registrati',
      'Ore Ordinarie',
      'Ore Straordinarie',
      'Ore Viaggio',
      'Ore Totali Periodo',
      'Tariffa Oraria Base (€/h)',
      'Costo Manodopera Stimato (€)',
    ],
  ];

  // Raggruppa per dipendente
  const workerStats: Record<
    string,
    {
      nome: string;
      qualifica: string;
      count: number;
      oreOrd: number;
      oreStr: number;
      oreViag: number;
      oreTot: number;
      costoTot: number;
      tariffa: number;
    }
  > = {};

  for (const r of rols) {
    const nome = r.operatoreNome;
    const dip = dipendenti.find((d) => d.nome.toLowerCase() === nome.toLowerCase());
    const tariffa = dip?.costoOrario || 35;
    const qualifica = dip?.ruoloAziendale || 'Tecnico Specializzato';

    if (!workerStats[nome]) {
      workerStats[nome] = {
        nome,
        qualifica,
        count: 0,
        oreOrd: 0,
        oreStr: 0,
        oreViag: 0,
        oreTot: 0,
        costoTot: 0,
        tariffa,
      };
    }

    const oreViag = r.hoursTravel || 0;
    const oreStr = r.oreStraordinarie || 0;
    const oreOrd = r.oreOrdinarie ?? Math.max(0, r.oreTotali - oreStr - oreViag);
    const oreTot = r.oreTotali || oreOrd + oreStr + oreViag;
    const costo = calcolaCostoManodoperaRol(r, dipendenti);

    workerStats[nome].count += 1;
    workerStats[nome].oreOrd += oreOrd;
    workerStats[nome].oreStr += oreStr;
    workerStats[nome].oreViag += oreViag;
    workerStats[nome].oreTot += oreTot;
    workerStats[nome].costoTot += costo;
  }

  for (const w of Object.values(workerStats)) {
    f2Data.push([
      w.nome,
      w.qualifica,
      w.count,
      w.oreOrd,
      w.oreStr,
      w.oreViag,
      w.oreTot,
      w.tariffa,
      Number(w.costoTot.toFixed(2)),
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(f2Data);
  ws2['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Riepilogo Dipendenti');

  // -------------------------------------------------------------
  // FOGLIO 3: RIEPILOGO PER CANTIERE E COMMESSA
  // -------------------------------------------------------------
  const f3Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    [`CONTO ECONOMICO MANODOPERA PER COMMESSA - ${periodoLabel}`],
    [],
    [
      'Codice Cantiere',
      'Titolo Commessa',
      'Cliente Committente',
      'Stato Commessa',
      'N. Interventi ROL',
      'Ore Totali Investite',
      'Costo Manodopera Consuntivato (€)',
    ],
  ];

  const cantiereStats: Record<
    string,
    {
      cantiereId: string;
      codice: string;
      titolo: string;
      cliente: string;
      stato: string;
      count: number;
      oreTot: number;
      costoTot: number;
    }
  > = {};

  for (const r of rols) {
    const cId = r.cantiereId || 'generico';
    const cantiere = cantieri.find((c) => c.id === cId);

    if (!cantiereStats[cId]) {
      cantiereStats[cId] = {
        cantiereId: cId,
        codice: cantiere?.codice || 'CNT',
        titolo: r.cantiereTitolo,
        cliente: r.clienteNome,
        stato: cantiere?.stato ? cantiere.stato.toUpperCase() : 'IN CORSO',
        count: 0,
        oreTot: 0,
        costoTot: 0,
      };
    }

    cantiereStats[cId].count += 1;
    cantiereStats[cId].oreTot += r.oreTotali;
    cantiereStats[cId].costoTot += calcolaCostoManodoperaRol(r, dipendenti);
  }

  for (const c of Object.values(cantiereStats)) {
    f3Data.push([
      c.codice,
      c.titolo,
      c.cliente,
      c.stato,
      c.count,
      c.oreTot,
      Number(c.costoTot.toFixed(2)),
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(f3Data);
  ws3['!cols'] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 26 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Riepilogo Cantieri');

  // Salvataggio e trigger download del file Excel
  const safePeriodo = periodoLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Brogliaccio_Mensile_ROL_VoltMaster_${safePeriodo}.xlsx`);
}

/**
 * 2. ESPORTAZIONE BROGLIACCIO ROL MENSILE IN FORMATO PDF (.PDF)
 * Layout professionale A4 orizzontale (Landscape), con impaginazione multi-pagina,
 * header aziendale, KPI di periodo, tabella formattata e box firme.
 */
export function exportRolBrogliaccioPdf(
  rols: ROL[],
  cantieri: Cantiere[],
  dipendenti: Dipendente[],
  periodoLabel = 'Ottobre 2026',
  aziendaNome = 'VoltMaster Impianti S.r.l.'
): void {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 273mm

  let currentPage = 1;
  let y = 10;

  // Calcolo statistiche globali
  let totOreOrd = 0;
  let totOreStr = 0;
  let totOreViag = 0;
  let totOreTot = 0;
  let totCostoManodopera = 0;
  let firmatiCount = 0;

  rols.forEach((r) => {
    const v = r.hoursTravel || 0;
    const str = r.oreStraordinarie || 0;
    const ord = r.oreOrdinarie ?? Math.max(0, r.oreTotali - str - v);
    totOreOrd += ord;
    totOreStr += str;
    totOreViag += v;
    totOreTot += r.oreTotali || ord + str + v;
    totCostoManodopera += calcolaCostoManodoperaRol(r, dipendenti);
    if (r.firmaClientePresente || r.firmaClienteDataUrl) firmatiCount++;
  });

  const drawHeader = () => {
    // Top banner scuro
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 20, 'F');

    // Striscia dorata
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 20, pageWidth, 2, 'F');

    // Testo Brand
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('VOLTMASTER IMPIANTI S.R.L.', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('IMPIANTI ELETTRICI INDUSTRIALI & TECNOLOGICI · CEI 64-8 · REGISTRO PRESENZE E ATTIVITÀ CANTIERE', margin, 17);

    // Titolo Documento a destra
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text('BROGLIACCIO MENSILE RAPPORTINI ROL', pageWidth - margin, 11, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Periodo: ${periodoLabel} · Generato: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - margin, 17, {
      align: 'right',
    });

    y = 28;
  };

  const drawFooter = (page: number, totalPagesStr = '') => {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      'VoltMaster ElettroImpianti S.r.l. · P.IVA 09248100159 · Documento con valenza di brogliaccio interno e controllo di gestione manodopera.',
      margin,
      pageHeight - 6
    );
    doc.text(`Pagina ${page} ${totalPagesStr}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  // 1. Disegna Header Pagina 1
  drawHeader();

  // 2. Quadro Riassuntivo KPI (Pagina 1)
  const kpiBoxHeight = 18;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, kpiBoxHeight, 2, 2, 'FD');

  const colKpi = contentWidth / 6;

  // Box 1: Totale ROL
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('N. RAPPORTINI', margin + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${rols.length}`, margin + 3, y + 14);

  // Box 2: Ore Ordinarie
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ORE ORDINARIE', margin + colKpi + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totOreOrd} h`, margin + colKpi + 3, y + 14);

  // Box 3: Ore Straordinarie
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('STRAORDINARI', margin + colKpi * 2 + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`${totOreStr} h`, margin + colKpi * 2 + 3, y + 14);

  // Box 4: Ore Viaggio
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ORE VIAGGIO', margin + colKpi * 3 + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totOreViag} h`, margin + colKpi * 3 + 3, y + 14);

  // Box 5: Ore Complessive
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTALE ORE LAVORO', margin + colKpi * 4 + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`${totOreTot} h`, margin + colKpi * 4 + 3, y + 14);

  // Box 6: Costo Manodopera & % Firmati
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COSTO MANODOPERA', margin + colKpi * 5 + 3, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`€ ${totCostoManodopera.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, margin + colKpi * 5 + 3, y + 14);

  y += kpiBoxHeight + 6;

  // 3. Tabella Analitica dei ROL
  const colWidths = [18, 16, 20, 52, 42, 34, 13, 13, 13, 14, 18, 20];
  const colHeaders = [
    'N. ROL',
    'Data',
    'Cantiere',
    'Descrizione Commessa',
    'Committente',
    'Tecnico Redattore',
    'Ord.',
    'Str.',
    'Viag.',
    'Tot.',
    'Firma',
    'Stato',
  ];

  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    colHeaders.forEach((h, i) => {
      const align = i >= 6 && i <= 9 ? 'right' : 'left';
      const textX = align === 'right' ? curX + colWidths[i] - 2 : curX + 2;
      doc.text(h, textX, y + 4.8, { align });
      curX += colWidths[i];
    });
    y += 7;
  };

  drawTableHeader();

  // Righe Tabella
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);

  const rowHeight = 6.2;
  const maxRowsPerPage = 23;
  let rowsOnCurrentPage = 0;

  for (let idx = 0; idx < rols.length; idx++) {
    const r = rols[idx];
    const cantiere = cantieri.find((c) => c.id === r.cantiereId);
    const v = r.hoursTravel || 0;
    const str = r.oreStraordinarie || 0;
    const ord = r.oreOrdinarie ?? Math.max(0, r.oreTotali - str - v);
    const tot = r.oreTotali || ord + str + v;
    const isFirmato = Boolean(r.firmaClientePresente || r.firmaClienteDataUrl);

    // Controlla se serve nuova pagina
    if (y + rowHeight > pageHeight - 25) {
      drawFooter(currentPage);
      doc.addPage();
      currentPage++;
      y = 10;
      drawHeader();
      drawTableHeader();
      rowsOnCurrentPage = 0;
    }

    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    // Testo colonne
    doc.setTextColor(15, 23, 42); // slate-900

    let curX = margin;
    // 0: N. ROL
    doc.setFont('helvetica', 'bold');
    doc.text(r.numero, curX + 2, y + 4.3);
    curX += colWidths[0];

    // 1: Data
    doc.setFont('helvetica', 'normal');
    doc.text(r.data, curX + 2, y + 4.3);
    curX += colWidths[1];

    // 2: Cod Cantiere
    doc.text(cantiere?.codice || 'CNT', curX + 2, y + 4.3);
    curX += colWidths[2];

    // 3: Titolo Cantiere
    const titoloTroncato = doc.splitTextToSize(r.cantiereTitolo, colWidths[3] - 4)[0] || r.cantiereTitolo;
    doc.text(titoloTroncato, curX + 2, y + 4.3);
    curX += colWidths[3];

    // 4: Cliente
    const clienteTroncato = doc.splitTextToSize(r.clienteNome, colWidths[4] - 4)[0] || r.clienteNome;
    doc.text(clienteTroncato, curX + 2, y + 4.3);
    curX += colWidths[4];

    // 5: Tecnico
    doc.text(r.operatoreNome, curX + 2, y + 4.3);
    curX += colWidths[5];

    // 6: Ordinarie
    doc.text(`${ord}`, curX + colWidths[6] - 2, y + 4.3, { align: 'right' });
    curX += colWidths[6];

    // 7: Straordinarie
    if (str > 0) {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(`${str}`, curX + colWidths[7] - 2, y + 4.3, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    curX += colWidths[7];

    // 8: Viaggio
    doc.text(`${v}`, curX + colWidths[8] - 2, y + 4.3, { align: 'right' });
    curX += colWidths[8];

    // 9: Totale
    doc.setFont('helvetica', 'bold');
    doc.text(`${tot}`, curX + colWidths[9] - 2, y + 4.3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    curX += colWidths[9];

    // 10: Firma
    if (isFirmato) {
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text('Firmato ✓', curX + 2, y + 4.3);
    } else {
      doc.setTextColor(239, 68, 68); // rose-500
      doc.text('Non firmato', curX + 2, y + 4.3);
    }
    doc.setTextColor(15, 23, 42);
    curX += colWidths[10];

    // 11: Stato
    const statoLabel = r.stato === 'approvato' ? 'Approvato' : r.stato === 'respinto' ? 'Respinto' : 'In attesa';
    doc.text(statoLabel, curX + 2, y + 4.3);

    y += rowHeight;
    rowsOnCurrentPage++;
  }

  // 4. Riga Totali a fine tabella
  if (y + 12 > pageHeight - 20) {
    drawFooter(currentPage);
    doc.addPage();
    currentPage++;
    y = 15;
    drawHeader();
  }

  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  doc.text(`TOTALI BROGLIACCIO (${rols.length} RAPPORTINI)`, margin + 4, y + 4.8);

  // Totali numerici
  let curTotalX = margin;
  for (let i = 0; i < 6; i++) curTotalX += colWidths[i];

  doc.text(`${totOreOrd}h`, curTotalX + colWidths[6] - 2, y + 4.8, { align: 'right' });
  curTotalX += colWidths[6];
  doc.text(`${totOreStr}h`, curTotalX + colWidths[7] - 2, y + 4.8, { align: 'right' });
  curTotalX += colWidths[7];
  doc.text(`${totOreViag}h`, curTotalX + colWidths[8] - 2, y + 4.8, { align: 'right' });
  curTotalX += colWidths[8];
  doc.text(`${totOreTot}h`, curTotalX + colWidths[9] - 2, y + 4.8, { align: 'right' });

  y += 12;

  // 5. Box Firme & Convalida
  if (y + 24 <= pageHeight - 12) {
    const signatureWidth = 75;
    const sigBoxHeight = 18;

    // Timbro e firma Resp. Tecnico
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, signatureWidth, sigBoxHeight, 2, 2, 'D');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('VERIFICA E VISTO RESPONSABILE TECNICO (PM)', margin + 3, y + 4.5);
    doc.setFontSize(6.5);
    doc.text('Firma per attestazione ore lavorate e conformità D.Lgs 81/08:', margin + 3, y + 8);
    doc.line(margin + 5, y + sigBoxHeight - 3, margin + signatureWidth - 5, y + sigBoxHeight - 3);

    // Timbro e firma Ufficio Personale / Amministrazione
    const sigX2 = margin + signatureWidth + 10;
    doc.roundedRect(sigX2, y, signatureWidth, sigBoxHeight, 2, 2, 'D');
    doc.text('CONTROLLO CONTABILITÀ & UFFICIO PAGHE', sigX2 + 3, y + 4.5);
    doc.text('Visto per liquidazione retribuzioni e fatturazione commesse:', sigX2 + 3, y + 8);
    doc.line(sigX2 + 5, y + sigBoxHeight - 3, sigX2 + signatureWidth - 5, y + sigBoxHeight - 3);
  }

  // Footer ultima pagina
  drawFooter(currentPage);

  // Salva file PDF
  const safePeriodo = periodoLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`VoltMaster_Brogliaccio_Mensile_ROL_${safePeriodo}.pdf`);
}
