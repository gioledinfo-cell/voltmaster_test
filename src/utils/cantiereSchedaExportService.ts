import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Cantiere, StatoAvanzamentoLavori } from '../types';
import {
  CantiereDashboardData,
  CantiereMaterialeStock,
  CantiereAttrezzaturaItem,
} from '../types/cantiereDashboard';
import { GanttTask } from '../components/cantiere-dashboard/CantiereGanttSection';

export interface CantiereSchedaExportPayload {
  cantiere: CantiereDashboardData['cantiere'] | Cantiere;
  kpi?: CantiereDashboardData['kpi'];
  salList?: StatoAvanzamentoLavori[];
  ganttTasks?: GanttTask[];
  materiali?: CantiereMaterialeStock[];
  attrezzature?: CantiereAttrezzaturaItem[];
  aziendaNome?: string;
}

function getCantiereMeta(
  cantiere: CantiereDashboardData['cantiere'] | Cantiere,
  kpi?: CantiereDashboardData['kpi']
) {
  const pm =
    ('responsabilePM' in cantiere && cantiere.responsabilePM) ||
    ('responsabileNome' in cantiere && cantiere.responsabileNome) ||
    'Ing. Roberto Fontana';
  const capo =
    ('capocantiereNome' in cantiere && cantiere.capocantiereNome) ||
    'Matteo Bianchi';
  const avanzamento =
    kpi?.avanzamentoPercentuale ??
    ('avanzamentoPercentuale' in cantiere ? cantiere.avanzamentoPercentuale : 65);
  return { pm, capo, avanzamento };
}

/**
 * 1. ESPORTAZIONE EXCEL SCHEDA COMMESSA COMPLETA (.XLSX)
 * Comprende:
 * - Foglio 1: Frontespizio Commessa, Dati Contrattuali & Controllo di Gestione
 * - Foglio 2: Cronoprogramma Lavori Gantt (WBS, date, durate, dipendenze, milestone)
 * - Foglio 3: Avanzamento SAL & Contabilità Lavori
 * - Foglio 4: Materiali Allocati e Attrezzature in Cantiere
 */
export function exportCantiereSchedaExcel(payload: CantiereSchedaExportPayload): void {
  const {
    cantiere,
    kpi,
    salList = [],
    ganttTasks = [],
    materiali = [],
    attrezzature = [],
    aziendaNome = 'VoltMaster Impianti S.r.l.',
  } = payload;

  const { pm, capo, avanzamento } = getCantiereMeta(cantiere, kpi);
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // FOGLIO 1: FRONTESPIZIO COMMESSA & CONTABILITÀ
  // -------------------------------------------------------------
  const budget = kpi?.budgetTotale || ('budgetTotale' in cantiere ? cantiere.budgetTotale : 45000) || 45000;
  const costiConsuntivati =
    kpi?.costoConsuntivato ||
    ('costiConsuntivati' in cantiere ? cantiere.costiConsuntivati : 18450) ||
    18450;
  const margineEuro = budget - costiConsuntivati;
  const marginePct = budget > 0 ? ((margineEuro / budget) * 100).toFixed(1) : '0';

  const f1Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    ['SCHEDA COMMESSA 360° - CONTABILITÀ & CRONOPROGRAMMA'],
    [`Generato in data: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`],
    [],
    ['DATI GENERALI COMMESSA', ''],
    ['Codice Commessa:', cantiere.codice],
    ['Titolo Cantiere:', cantiere.titolo],
    ['Cliente Committente:', cantiere.clienteNome],
    ['Ubicazione Cantiere:', `${cantiere.indirizzo}, ${cantiere.citta}`],
    ['Stato Operativo:', cantiere.stato.toUpperCase().replace(/_/g, ' ')],
    ['Project Manager (PM):', pm],
    ['Preposto / Capocantiere:', capo],
    ['Data Inizio Contrattuale:', cantiere.dataInizio],
    ['Data Fine Prevista:', cantiere.dataFinePrevista],
    ['Descrizione Opere:', cantiere.descrizione || '-'],
    [],
    ['QUADRO ECONOMICO & CONTABILITÀ COMMESSA', 'VALORE (€)', 'INCIDENZA / %'],
    ['Importo Lavori a Base di Contratto (Budget):', budget, '100.0%'],
    ['Costi Consuntivati a Tutto Oggi (Manodopera + Materiali):', costiConsuntivati, `${((costiConsuntivati / budget) * 100).toFixed(1)}%`],
    ['Margine Operativo Lordo di Commessa (MOL):', margineEuro, `${marginePct}%`],
    ['Percentuale di Avanzamento Globale Esecuzione:', `${avanzamento}%`, ''],
    ['Ore Lavorate Totali Registrate (da ROL):', kpi?.oreLavorateTotali || 148, 'ore-uomo'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(f1Data);
  ws1['!cols'] = [{ wch: 42 }, { wch: 32 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Scheda Commessa');

  // -------------------------------------------------------------
  // FOGLIO 2: CRONOPROGRAMMA GANTT & FASI WBS
  // -------------------------------------------------------------
  const f2Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    [`CRONOPROGRAMMA OPERATIVO DEI LAVORI - COMMESSA ${cantiere.codice}`],
    [`Titolo: ${cantiere.titolo} · Committente: ${cantiere.clienteNome}`],
    [],
    [
      'Codice WBS',
      'Fase di Lavorazione / Descrizione',
      'Disciplina Impiantistica',
      'Data Inizio',
      'Data Fine',
      'Durata (Giorni)',
      'Avanzamento (%)',
      'Stato Esecuzione',
      'Responsabile Tecnico',
      'Dipendenza (FS)',
      'Tipo Elemento',
      'Percorso Critico',
      'Note Tecniche & Prescrizioni CSE',
    ],
  ];

  if (ganttTasks.length > 0) {
    ganttTasks.forEach((t) => {
      const depTask = t.dipendenzaId ? ganttTasks.find((gt) => gt.id === t.dipendenzaId) : null;
      f2Data.push([
        t.codice,
        t.titolo,
        t.categoria.toUpperCase(),
        t.dataInizio,
        t.dataFine,
        t.durataGiorni,
        `${t.avanzamento}%`,
        t.stato.toUpperCase().replace(/_/g, ' '),
        t.responsabileNome,
        depTask ? `${depTask.codice} - ${depTask.titolo}` : '-',
        t.isMilestone ? 'MILESTONE CONTRATTUALE' : 'FASE OPERATIVA',
        t.isCritico ? 'SI (PERCORSO CRITICO)' : 'NO',
        t.note || '-',
      ]);
    });
  } else {
    // Default fallback phases
    f2Data.push([
      'F-01',
      'Allestimento Cantiere & Approvazione POS/PSC',
      'SICUREZZA',
      '2026-09-15',
      '2026-09-21',
      7,
      '100%',
      'COMPLETATO',
      'Ing. Roberto Fontana',
      '-',
      'FASE OPERATIVA',
      'SI',
      'Verifica quadri ASC',
    ]);
    f2Data.push([
      'F-02',
      'Posa Canaline & Staffaggi Portacavi',
      'POSA',
      '2026-09-22',
      '2026-10-06',
      15,
      '100%',
      'COMPLETATO',
      'Matteo Bianchi',
      'F-01',
      'FASE OPERATIVA',
      'SI',
      'Passerelle metalliche forate',
    ]);
    f2Data.push([
      'F-03',
      'Tiraggio Cavi FG16 & Linee Dorsali BT',
      'CABLAGGIO',
      '2026-10-07',
      '2026-10-24',
      18,
      '75%',
      'IN CORSO',
      'Davide Riva',
      'F-02',
      'FASE OPERATIVA',
      'SI',
      'Infilaggio multipolari',
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(f2Data);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 18 },
    { wch: 13 },
    { wch: 13 },
    { wch: 15 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 25 },
    { wch: 24 },
    { wch: 18 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Cronoprogramma Gantt');

  // -------------------------------------------------------------
  // FOGLIO 3: STATO AVANZAMENTO LAVORI (SAL)
  // -------------------------------------------------------------
  const f3Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    [`REGISTRO STATO AVANZAMENTO LAVORI (SAL) - ${cantiere.codice}`],
    [],
    [
      'Codice SAL',
      'Data Emissione',
      'Periodo di Riferimento',
      'Importo Lavori Periodo (€)',
      'Importo Totale Cumulato (€)',
      'Avanzamento Globale (%)',
      'Stato Contabile',
      'Redatto Da',
      'Approvato Direttore Lavori',
      'Note Contabili',
    ],
  ];

  if (salList.length > 0) {
    salList.forEach((s) => {
      f3Data.push([
        s.codiceSal,
        s.dataEmissione,
        `${s.periodoInizio} → ${s.periodoFine}`,
        s.totaleLavoriPeriodo,
        s.totaleLavoriCumulati,
        `${s.percentualeAvanzamentoGlobale.toFixed(1)}%`,
        s.stato.toUpperCase().replace(/_/g, ' '),
        s.redattoDa,
        s.approvatoDirettoreLavori?.nome || 'In attesa di visto D.L.',
        s.noteGenerali || '-',
      ]);
    });
  } else {
    f3Data.push([
      'SAL-01',
      '2026-09-30',
      '2026-09-01 → 2026-09-30',
      14500,
      14500,
      '32.2%',
      'APPROVATO DL',
      'Ing. Roberto Fontana',
      'Arch. Carlo Manzoni (D.L.)',
      'Opere murarie e canaline certificate',
    ]);
    f3Data.push([
      'SAL-02 (In Corso)',
      '2026-10-31',
      '2026-10-01 → 2026-10-31',
      14750,
      29250,
      '65.0%',
      'BOZZA',
      'Ing. Roberto Fontana',
      'In lavorazione',
      'Infilaggio dorsali e montaggio quadri BT',
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(f3Data);
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 26 },
    { wch: 24 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Avanzamento SAL');

  // -------------------------------------------------------------
  // FOGLIO 4: MATERIALI & ATTREZZATURE CANTIERE
  // -------------------------------------------------------------
  const f4Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    [`GIACENZE MATERIALI & ATTREZZATURE - CANTIERE ${cantiere.codice}`],
    [],
    ['MATERIALI DA COSTRUZIONE & INSTALLAZIONE'],
    [
      'Descrizione Materiale',
      'Categoria',
      'Quantità Allocata',
      'Quantità Utilizzata',
      'Giacenza a Cantiere',
      'U.M.',
      'Stato Scorta',
      'Ultimo Scarico',
    ],
  ];

  materiali.forEach((m) => {
    f4Data.push([
      m.nome,
      m.categoria.toUpperCase().replace(/_/g, ' '),
      m.quantitaAllocata,
      m.quantitaUtilizzata,
      m.giacenzaRimanente,
      m.unitaMisura,
      m.statoStock.toUpperCase(),
      m.ultimoScaricoData || '-',
    ]);
  });

  f4Data.push([]);
  f4Data.push(['ATTREZZATURE & STRUMENTAZIONE OPERATIVA']);
  f4Data.push([
    'Codice Univoco',
    'Denominazione Attrezzo',
    'Marca e Modello',
    'Matricola',
    'Stato Funzionale',
    'Prossima Taratura',
    'Assegnato A',
  ]);

  attrezzature.forEach((a) => {
    f4Data.push([
      a.codiceUnivoco,
      a.nome,
      a.marcaModello,
      a.matricola,
      a.stato.toUpperCase().replace(/_/g, ' '),
      a.prossimaRevisioneTaratura,
      a.assegnatoA,
    ]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(f4Data);
  ws4['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Materiali & Attrezzature');

  // Salvataggio file
  const safeCodice = cantiere.codice.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Scheda_Commessa_Gantt_SAL_${safeCodice}.xlsx`);
}

/**
 * 2. ESPORTAZIONE PDF SCHEDA COMMESSA COMPLETA (.PDF)
 * Report editoriale multi-pagina ad alta risoluzione:
 * - Pagina 1: Scheda Anagrafica, Quadro Economico MOL, Stato SAL e Tabella Cronoprogramma Gantt
 * - Pagina 2: Dettaglio SAL, Libretto Misure, Materiali Critici e Box Firme Committenza/D.L.
 */
export function exportCantiereSchedaPdf(payload: CantiereSchedaExportPayload): void {
  const {
    cantiere,
    kpi,
    salList = [],
    ganttTasks = [],
    materiali = [],
    attrezzature = [],
    aziendaNome = 'VoltMaster Impianti S.r.l.',
  } = payload;

  const { pm, capo, avanzamento } = getCantiereMeta(cantiere, kpi);

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

  const drawHeader = (pageTitle: string) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 24, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('VOLTMASTER IMPIANTI S.R.L.', margin, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('IMPIANTI ELETTRICI INDUSTRIALI · CABINE MT/BT · AUTOMAZIONE · FOTOVOLTAICO', margin, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.text(pageTitle, pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Commessa: ${cantiere.codice}`, pageWidth - margin, 18, { align: 'right' });

    y = 32;
  };

  const drawFooter = (page: number, totalPagesStr = '') => {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      'VoltMaster ElettroImpianti S.r.l. · P.IVA 09248100159 · Documento Tecnico-Contabile riservato.',
      margin,
      pageHeight - 7
    );
    doc.text(`Pagina ${page} ${totalPagesStr}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // =============================================================
  // PAGINA 1: ANAGRAFICA COMMESSA, ECONOMIA & CRONOPROGRAMMA GANTT
  // =============================================================
  drawHeader('SCHEDA COMMESSA & CRONOPROGRAMMA GANTT');

  // 1. Box Anagrafica Cantiere & Committente
  const boxHeight = 30;
  const colW = (contentWidth - 6) / 2;

  // Box 1.1 Committente & Sede
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colW, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('COMMITTENTE & UBICAZIONE', margin + 3, y + 5);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(cantiere.clienteNome, colW - 6)[0] || cantiere.clienteNome, margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cantiere: ${cantiere.titolo}`, margin + 3, y + 16, { maxWidth: colW - 6 });
  doc.text(`Indirizzo: ${cantiere.indirizzo}, ${cantiere.citta}`, margin + 3, y + 21, { maxWidth: colW - 6 });
  doc.text(`Stato Operativo: ${cantiere.stato.toUpperCase().replace(/_/g, ' ')}`, margin + 3, y + 26);

  // Box 1.2 Responsabili & Date
  const colX2 = margin + colW + 6;
  doc.roundedRect(colX2, y, colW, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ORGANIGRAMMA & TEMPISTICHE', colX2 + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Project Manager: ${pm}`, colX2 + 3, y + 11);
  doc.text(`Capocantiere (Preposto): ${capo}`, colX2 + 3, y + 16);
  doc.text(`Data Inizio Lavori: ${cantiere.dataInizio}`, colX2 + 3, y + 21);
  doc.text(`Consegna Prevista: ${cantiere.dataFinePrevista}`, colX2 + 3, y + 26);

  y += boxHeight + 5;

  // 2. Quadro Economico & Margine
  const budget = kpi?.budgetTotale || ('budgetTotale' in cantiere ? cantiere.budgetTotale : 45000) || 45000;
  const costiConsuntivati =
    kpi?.costoConsuntivato ||
    ('costiConsuntivati' in cantiere ? cantiere.costiConsuntivati : 18450) ||
    18450;
  const margineEuro = budget - costiConsuntivati;
  const marginePct = budget > 0 ? ((margineEuro / budget) * 100).toFixed(1) : '0';

  const ecoH = 17;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, ecoH, 2, 2, 'FD');

  const ecoColW = contentWidth / 4;

  // Budget
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('BUDGET CONTRATTUALE', margin + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`€ ${budget.toLocaleString('it-IT')}`, margin + 3, y + 12);

  // Consuntivato
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COSTI CONSUNTIVATI', margin + ecoColW + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`€ ${costiConsuntivati.toLocaleString('it-IT')}`, margin + ecoColW + 3, y + 12);

  // Margine MOL
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('MARGINE LORDO (MOL)', margin + ecoColW * 2 + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`€ ${margineEuro.toLocaleString('it-IT')} (${marginePct}%)`, margin + ecoColW * 2 + 3, y + 12);

  // Avanzamento
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AVANZAMENTO OPERE', margin + ecoColW * 3 + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text(`${avanzamento}% COMPLETATO`, margin + ecoColW * 3 + 3, y + 12);

  y += ecoH + 6;

  // 3. Tabella Cronoprogramma Lavori & Gantt
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CRONOPROGRAMMA FASI DI LAVORAZIONE (WBS)', margin, y + 4);
  y += 7;

  // Table header
  const ganttColW = [14, 60, 24, 24, 16, 20, 24];
  const ganttHeaders = ['WBS', 'Descrizione Fase', 'Inizio', 'Fine', 'Durata', 'Avanzam.', 'Stato'];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let gX = margin;
  ganttHeaders.forEach((h, i) => {
    doc.text(h, gX + 2, y + 4.5);
    gX += ganttColW[i];
  });
  y += 6.5;

  const tasksToRender =
    ganttTasks.length > 0
      ? ganttTasks
      : [
          {
            id: '1',
            codice: 'F-01',
            titolo: 'Allestimento Cantiere & Approvazione POS/PSC',
            categoria: 'sicurezza',
            dataInizio: '2026-09-15',
            dataFine: '2026-09-21',
            durataGiorni: 7,
            avanzamento: 100,
            stato: 'completato',
            responsabileNome: 'Ing. Fontana',
            squadraIds: [],
          },
          {
            id: '2',
            codice: 'F-02',
            titolo: 'Posa Canaline Metalliche & Passerelle Portacavi',
            categoria: 'posa',
            dataInizio: '2026-09-22',
            dataFine: '2026-10-06',
            durataGiorni: 15,
            avanzamento: 100,
            stato: 'completato',
            responsabileNome: 'M. Bianchi',
            squadraIds: [],
          },
          {
            id: '3',
            codice: 'M-01',
            titolo: 'SAL 1: Verifica Canaline & Chiusura Opere Murarie',
            categoria: 'posa',
            dataInizio: '2026-10-06',
            dataFine: '2026-10-06',
            durataGiorni: 1,
            avanzamento: 100,
            stato: 'completato',
            responsabileNome: 'Ing. Fontana',
            squadraIds: [],
            isMilestone: true,
          },
          {
            id: '4',
            codice: 'F-03',
            titolo: 'Tiraggio Cavi FG16 & Linee Dorsali BT/MT',
            categoria: 'cablaggio',
            dataInizio: '2026-10-07',
            dataFine: '2026-10-24',
            durataGiorni: 18,
            avanzamento: 75,
            stato: 'in_corso',
            responsabileNome: 'D. Riva',
            squadraIds: [],
          },
          {
            id: '5',
            codice: 'F-04',
            titolo: 'Assemblaggio & Cablaggio Power Center e Quadri BT',
            categoria: 'quadri',
            dataInizio: '2026-10-18',
            dataFine: '2026-11-08',
            durataGiorni: 22,
            avanzamento: 40,
            stato: 'in_corso',
            responsabileNome: 'M. Bianchi',
            squadraIds: [],
          },
          {
            id: '6',
            codice: 'F-05',
            titolo: 'Posa Moduli Fotovoltaici & Inverter di Stringa',
            categoria: 'fotovoltaico',
            dataInizio: '2026-10-25',
            dataFine: '2026-11-18',
            durataGiorni: 25,
            avanzamento: 15,
            stato: 'in_corso',
            responsabileNome: 'L. Moretti',
            squadraIds: [],
          },
          {
            id: '7',
            codice: 'M-02',
            titolo: 'Posa Gruppo di Misura e Allaccio Rete E-Distribuzione',
            categoria: 'collaudo',
            dataInizio: '2026-11-15',
            dataFine: '2026-11-15',
            durataGiorni: 1,
            avanzamento: 0,
            stato: 'pianificato',
            responsabileNome: 'Ing. Fontana',
            squadraIds: [],
            isMilestone: true,
          },
          {
            id: '8',
            codice: 'F-06',
            titolo: 'Prove Strumentali CEI 64-8 & Prove di Isolamento',
            categoria: 'collaudo',
            dataInizio: '2026-11-19',
            dataFine: '2026-11-30',
            durataGiorni: 12,
            avanzamento: 0,
            stato: 'pianificato',
            responsabileNome: 'M. Bianchi',
            squadraIds: [],
          },
          {
            id: '9',
            codice: 'M-03',
            titolo: 'Collaudo Finale, Chiusura Lavori & Rilascio DiCo DM 37/08',
            categoria: 'collaudo',
            dataInizio: '2026-12-05',
            dataFine: '2026-12-05',
            durataGiorni: 1,
            avanzamento: 0,
            stato: 'pianificato',
            responsabileNome: 'Ing. Fontana',
            squadraIds: [],
            isMilestone: true,
          },
        ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);

  tasksToRender.forEach((task, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    let rowX = margin;
    doc.setTextColor(15, 23, 42);

    // WBS
    doc.setFont('helvetica', 'bold');
    doc.text(task.codice, rowX + 2, y + 4.2);
    rowX += ganttColW[0];

    // Titolo
    doc.setFont('helvetica', task.isMilestone ? 'bold' : 'normal');
    const tTroncato = doc.splitTextToSize(task.titolo, ganttColW[1] - 3)[0] || task.titolo;
    doc.text(tTroncato, rowX + 2, y + 4.2);
    rowX += ganttColW[1];

    // Inizio
    doc.setFont('helvetica', 'normal');
    doc.text(task.dataInizio, rowX + 2, y + 4.2);
    rowX += ganttColW[2];

    // Fine
    doc.text(task.dataFine, rowX + 2, y + 4.2);
    rowX += ganttColW[3];

    // Durata
    doc.text(`${task.durataGiorni} gg`, rowX + 2, y + 4.2);
    rowX += ganttColW[4];

    // Avanzamento con barretta visiva mini
    doc.setFont('helvetica', 'bold');
    if (task.avanzamento === 100) doc.setTextColor(16, 185, 129);
    else if (task.avanzamento > 0) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(148, 163, 184);

    doc.text(`${task.avanzamento}%`, rowX + 2, y + 4.2);
    rowX += ganttColW[5];

    // Stato
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    const statoStr =
      task.stato === 'completato' ? 'Completato' : task.stato === 'in_corso' ? 'In Corso' : 'Pianificato';
    doc.text(task.isMilestone ? `Milestone 🏁` : statoStr, rowX + 2, y + 4.2);

    y += 6;
  });

  drawFooter(1, '/ 2');

  // =============================================================
  // PAGINA 2: AVANZAMENTO SAL, MATERIALI CRITICI & FIRME LEGALI
  // =============================================================
  doc.addPage();
  drawHeader('STATO AVANZAMENTO LAVORI (SAL) & MATERIALI CANTIERE');

  // 1. Tabella SAL Contabile
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RIASSUNTO STATI AVANZAMENTO LAVORI (SAL CONTRATTUALI)', margin, y + 4);
  y += 7;

  const salColW = [20, 24, 45, 30, 30, 33];
  const salHeaders = ['Codice SAL', 'Emissione', 'Periodo Riferimento', 'Importo SAL (€)', 'Cumulato (€)', 'Stato & Visto DL'];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let sX = margin;
  salHeaders.forEach((h, i) => {
    doc.text(h, sX + 2, y + 4.5);
    sX += salColW[i];
  });
  y += 6.5;

  const salRowsToRender =
    salList.length > 0
      ? salList
      : [
          {
            codiceSal: 'SAL-01',
            dataEmissione: '2026-09-30',
            periodoInizio: '2026-09-01',
            periodoFine: '2026-09-30',
            totaleLavoriPeriodo: 14500,
            totaleLavoriCumulati: 14500,
            stato: 'approvato_dl',
            approvatoDirettoreLavori: { nome: 'Arch. Carlo Manzoni (DL)' },
          },
          {
            codiceSal: 'SAL-02 (Prossimo)',
            dataEmissione: '2026-10-31',
            periodoInizio: '2026-10-01',
            periodoFine: '2026-10-31',
            totaleLavoriPeriodo: 14750,
            totaleLavoriCumulati: 29250,
            stato: 'bozza',
            approvatoDirettoreLavori: { nome: 'In preparazione' },
          },
        ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);

  salRowsToRender.forEach((s, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    let rowX = margin;
    doc.setFont('helvetica', 'bold');
    doc.text(s.codiceSal, rowX + 2, y + 4.2);
    rowX += salColW[0];

    doc.setFont('helvetica', 'normal');
    doc.text(s.dataEmissione, rowX + 2, y + 4.2);
    rowX += salColW[1];

    doc.text(`${s.periodoInizio} → ${s.periodoFine}`, rowX + 2, y + 4.2);
    rowX += salColW[2];

    doc.text(`€ ${s.totaleLavoriPeriodo.toLocaleString('it-IT')}`, rowX + 2, y + 4.2);
    rowX += salColW[3];

    doc.setFont('helvetica', 'bold');
    doc.text(`€ ${s.totaleLavoriCumulati.toLocaleString('it-IT')}`, rowX + 2, y + 4.2);
    rowX += salColW[4];

    doc.setFont('helvetica', 'normal');
    doc.text(s.approvatoDirettoreLavori?.nome || 'In attesa DL', rowX + 2, y + 4.2);

    y += 6;
  });

  y += 6;

  // 2. Materiali di Cantiere
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RIASSUNTO MATERIALI & GIACENZE DI COMMESSA', margin, y + 4);
  y += 7;

  const matColW = [60, 30, 24, 24, 20, 24];
  const matHeaders = ['Materiale', 'Categoria', 'Allocati', 'Utilizzati', 'Giacenza', 'Stato Stock'];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let mX = margin;
  matHeaders.forEach((h, i) => {
    doc.text(h, mX + 2, y + 4.5);
    mX += matColW[i];
  });
  y += 6.5;

  const matToRender =
    materiali.length > 0
      ? materiali.slice(0, 5)
      : [
          {
            nome: 'Cavo FG16OR12 5G16 mm² CPR',
            categoria: 'cavi_elettrici',
            quantitaAllocata: 300,
            quantitaUtilizzata: 240,
            giacenzaRimanente: 60,
            unitaMisura: 'm',
            statoStock: 'ottimale',
          },
          {
            nome: 'Canalina Metallica Asolata 200x50',
            categoria: 'tubi_canaline',
            quantitaAllocata: 120,
            quantitaUtilizzata: 105,
            giacenzaRimanente: 15,
            unitaMisura: 'm',
            statoStock: 'in_esaurimento',
          },
          {
            nome: 'Interruttore Magnetotermico Diff. 4P 32A',
            categoria: 'quadri_modulari',
            quantitaAllocata: 18,
            quantitaUtilizzata: 16,
            giacenzaRimanente: 2,
            unitaMisura: 'pz',
            statoStock: 'critico',
          },
        ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);

  matToRender.forEach((m, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    let rowX = margin;
    doc.text(m.nome, rowX + 2, y + 4.2);
    rowX += matColW[0];

    doc.text(m.categoria.replace(/_/g, ' '), rowX + 2, y + 4.2);
    rowX += matColW[1];

    doc.text(`${m.quantitaAllocata} ${m.unitaMisura}`, rowX + 2, y + 4.2);
    rowX += matColW[2];

    doc.text(`${m.quantitaUtilizzata} ${m.unitaMisura}`, rowX + 2, y + 4.2);
    rowX += matColW[3];

    doc.setFont('helvetica', 'bold');
    doc.text(`${m.giacenzaRimanente} ${m.unitaMisura}`, rowX + 2, y + 4.2);
    rowX += matColW[4];

    doc.setFont('helvetica', 'normal');
    doc.text(m.statoStock.toUpperCase(), rowX + 2, y + 4.2);

    y += 6;
  });

  y += 10;

  // 3. Quadro Firme di Asseverazione
  const sigW = 85;
  const sigH = 26;

  // Impresa
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigW, sigH, 2, 2, 'D');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text("PER L'IMPRESA ESECUTRICE (VOLTMASTER)", margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Il Direttore Tecnico / Project Manager:', margin + 4, y + 9);
  doc.text(`Ing. Roberto Fontana · Data: ${new Date().toLocaleDateString('it-IT')}`, margin + 4, y + 13);
  doc.line(margin + 5, y + sigH - 4, margin + sigW - 5, y + sigH - 4);

  // Committenza / D.L.
  const sig2X = margin + sigW + 12;
  doc.roundedRect(sig2X, y, sigW, sigH, 2, 2, 'D');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PER IL COMMITTENTE E LA DIREZIONE LAVORI', sig2X + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Visto e approvato per conformità cronoprogramma e SAL:', sig2X + 4, y + 9);
  doc.text('Firma Direttore dei Lavori / Committente:', sig2X + 4, y + 13);
  doc.line(sig2X + 5, y + sigH - 4, sig2X + sigW - 5, y + sigH - 4);

  drawFooter(2, '/ 2');

  const safeCodice = cantiere.codice.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`VoltMaster_Scheda_Commessa_Gantt_SAL_${safeCodice}.pdf`);
}
