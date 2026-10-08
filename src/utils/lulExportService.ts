import * as XLSX from 'xlsx';
import { PresenzaCantiere, Dipendente, Cantiere } from '../types';

export interface LulWorkerSummary {
  dipendenteId: string;
  nome: string;
  codiceFiscale: string;
  ditta: string;
  isSubappalto: boolean;
  mansione: string;
  giorniLavorati: number;
  oreOrdinarieTotali: number;
  oreStraordinarie25: number; // Straordinario feriale (+25%)
  oreStraordinarie50: number; // Straordinario festivo / sabato (+50%)
  oreTotali: number;
  buoniPastoTotali: number;
  indennitaTrasfertaTotale: number;
  costoOrarioMedio: number;
  costoTotaleConsuntivato: number;
}

export interface LulCantiereSummary {
  cantiereId: string;
  cantiereNome: string;
  oreOrdinarie: number;
  oreStraordinarie: number;
  oreTotali: number;
  costoTotale: number;
  numeroOperaiUnici: number;
}

/**
 * Determina se una data (YYYY-MM-DD) corrisponde a Sabato (6) o Domenica (0)
 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Calcola la suddivisione LUL aggregata per lavoratore
 */
export function computeLulWorkerSummaries(
  presenze: PresenzaCantiere[],
  dipendenti: Dipendente[]
): LulWorkerSummary[] {
  const dipMap = new Map<string, Dipendente>();
  dipendenti.forEach((d) => dipMap.set(d.id, d));

  const map = new Map<string, LulWorkerSummary>();

  for (const p of presenze) {
    const key = p.dipendenteId;
    const dip = dipMap.get(p.dipendenteId);
    const weekend = isWeekend(p.data);

    // Se weekend, lo straordinario o le ore lavorate extra hanno maggiorazione festiva del 50%
    const str25 = weekend ? 0 : p.oreStraordinarie;
    const str50 = weekend ? p.oreStraordinarie : 0;

    let existing = map.get(key);
    if (!existing) {
      existing = {
        dipendenteId: p.dipendenteId,
        nome: p.dipendenteNome,
        codiceFiscale: dip?.codiceFiscale || (p.ditta !== 'interna' ? 'P.IVA SUBAPPALTO' : 'ND'),
        ditta: p.ditta === 'interna' ? 'VoltMaster S.r.l.' : p.ditta,
        isSubappalto: p.ditta !== 'interna',
        mansione: p.mansione,
        giorniLavorati: 0,
        oreOrdinarieTotali: 0,
        oreStraordinarie25: 0,
        oreStraordinarie50: 0,
        oreTotali: 0,
        buoniPastoTotali: 0,
        indennitaTrasfertaTotale: 0,
        costoOrarioMedio: p.costoOrario,
        costoTotaleConsuntivato: 0,
      };
      map.set(key, existing);
    }

    existing.giorniLavorati += 1;
    existing.oreOrdinarieTotali += p.oreOrdinarie;
    existing.oreStraordinarie25 += str25;
    existing.oreStraordinarie50 += str50;
    existing.oreTotali += p.oreOrdinarie + p.oreStraordinarie;
    if (p.buonoPasto) existing.buoniPastoTotali += 1;
    existing.indennitaTrasfertaTotale += p.indennitaTrasferta || 0;
    existing.costoTotaleConsuntivato += p.costoTotaleGiornaliero;
  }

  return Array.from(map.values()).sort((a, b) => {
    // Prima i dipendenti interni, poi i subappalti
    if (a.isSubappalto !== b.isSubappalto) {
      return a.isSubappalto ? 1 : -1;
    }
    return a.nome.localeCompare(b.nome);
  });
}

/**
 * Calcola la ripartizione dei costi e ore per cantiere / commessa
 */
export function computeLulCantiereSummaries(
  presenze: PresenzaCantiere[]
): LulCantiereSummary[] {
  const map = new Map<string, { summary: LulCantiereSummary; operaiSet: Set<string> }>();

  for (const p of presenze) {
    let item = map.get(p.cantiereId);
    if (!item) {
      item = {
        summary: {
          cantiereId: p.cantiereId,
          cantiereNome: p.cantiereNome,
          oreOrdinarie: 0,
          oreStraordinarie: 0,
          oreTotali: 0,
          costoTotale: 0,
          numeroOperaiUnici: 0,
        },
        operaiSet: new Set<string>(),
      };
      map.set(p.cantiereId, item);
    }

    item.summary.oreOrdinarie += p.oreOrdinarie;
    item.summary.oreStraordinarie += p.oreStraordinarie;
    item.summary.oreTotali += p.oreOrdinarie + p.oreStraordinarie;
    item.summary.costoTotale += p.costoTotaleGiornaliero;
    item.operaiSet.add(p.dipendenteId);
  }

  const result: LulCantiereSummary[] = [];
  map.forEach(({ summary, operaiSet }) => {
    summary.numeroOperaiUnici = operaiSet.size;
    result.push(summary);
  });

  return result.sort((a, b) => b.costoTotale - a.costoTotale);
}

/**
 * Genera ed esporta il Workbook Excel (.xlsx) con SheetJS
 */
export function exportLulExcel(
  presenze: PresenzaCantiere[],
  dipendenti: Dipendente[],
  periodoLabel: string,
  aziendaNome = 'VoltMaster Impianti S.r.l.'
) {
  const workerSummaries = computeLulWorkerSummaries(presenze, dipendenti);
  const cantiereSummaries = computeLulCantiereSummaries(presenze);

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // FOGLIO 1: RIEPILOGO LUL DIPENDENTI E SUBAPPALTO
  // -------------------------------------------------------------
  const f1Data: (string | number)[][] = [
    [aziendaNome.toUpperCase(), '', '', '', '', '', '', '', '', '', '', '', ''],
    [`PROSPETTO MENSILE PRESENZE & LUL - PERIODO: ${periodoLabel.toUpperCase()}`, '', '', '', '', '', '', '', '', '', '', '', ''],
    [`Generato il: ${new Date().toLocaleDateString('it-IT')} ore ${new Date().toLocaleTimeString('it-IT')}`, '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    [
      'ID / Matricola',
      'Cognome e Nome',
      'Codice Fiscale / P.IVA',
      'Ditta Appartenenza',
      'Mansione / Livello',
      'Giorni Lavorati',
      'Ore Ordinarie',
      'Straord. 25% (Feriale)',
      'Straord. 50% (Festivo/Sab)',
      'Totale Ore',
      'Buoni Pasto (n°)',
      'Indennità Trasferta (€)',
      'Costo Orario Base (€)',
      'Costo Totale Consuntivo (€)',
    ],
  ];

  let totOrd = 0;
  let totStr25 = 0;
  let totStr50 = 0;
  let totOre = 0;
  let totBuoni = 0;
  let totTrasferta = 0;
  let totCosto = 0;

  for (const w of workerSummaries) {
    f1Data.push([
      w.dipendenteId,
      w.nome,
      w.codiceFiscale,
      w.ditta,
      w.mansione,
      w.giorniLavorati,
      w.oreOrdinarieTotali,
      w.oreStraordinarie25,
      w.oreStraordinarie50,
      w.oreTotali,
      w.buoniPastoTotali,
      w.indennitaTrasfertaTotale,
      w.costoOrarioMedio,
      Number(w.costoTotaleConsuntivato.toFixed(2)),
    ]);

    totOrd += w.oreOrdinarieTotali;
    totStr25 += w.oreStraordinarie25;
    totStr50 += w.oreStraordinarie50;
    totOre += w.oreTotali;
    totBuoni += w.buoniPastoTotali;
    totTrasferta += w.indennitaTrasfertaTotale;
    totCosto += w.costoTotaleConsuntivato;
  }

  // Riga Totali Generali
  f1Data.push([
    'TOTALI COMPLESSIVI',
    '',
    '',
    '',
    '',
    '',
    totOrd,
    totStr25,
    totStr50,
    totOre,
    totBuoni,
    totTrasferta,
    '',
    Number(totCosto.toFixed(2)),
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(f1Data);
  ws1['!cols'] = [
    { wch: 14 },
    { wch: 26 },
    { wch: 20 },
    { wch: 24 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo LUL Dipendenti');

  // -------------------------------------------------------------
  // FOGLIO 2: DETTAGLIO TIMBRATURE GIORNALIERE DI CANTIERE
  // -------------------------------------------------------------
  const f2Data: (string | number)[][] = [
    [`DETTAGLIO ANALITICO TIMBRATURE DI CANTIERE - ${periodoLabel.toUpperCase()}`],
    [],
    [
      'Data',
      'Giorno',
      'Cantiere Rif.',
      'Operaio / Tecnico',
      'Ditta',
      'Squadra',
      'Ingresso',
      'Uscita',
      'Ore Ord.',
      'Ore Straord.',
      'Maturazione Straord.',
      'Buono Pasto',
      'Trasferta (€)',
      'DPI & Idoneità',
      'Costo Giornaliero (€)',
      'Approvato Da',
      'Note Operative',
    ],
  ];

  const sortedPresenze = [...presenze].sort((a, b) => b.data.localeCompare(a.data));
  const weekDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  for (const p of sortedPresenze) {
    const dObj = new Date(p.data + 'T00:00:00');
    const dayName = weekDays[dObj.getDay()] || '';
    const isWk = isWeekend(p.data);

    f2Data.push([
      p.data,
      dayName,
      p.cantiereNome,
      p.dipendenteNome,
      p.ditta === 'interna' ? 'VoltMaster' : p.ditta,
      p.squadra || '-',
      p.oraIngresso,
      p.oraUscita,
      p.oreOrdinarie,
      p.oreStraordinarie,
      p.oreStraordinarie > 0 ? (isWk ? 'Festivo/Sab (+50%)' : 'Feriale (+25%)') : '-',
      p.buonoPasto ? 'SI' : 'NO',
      p.indennitaTrasferta || 0,
      p.dpiVerificati && p.tesserinoRiconoscimento ? 'CONFORME D.Lgs 81/08' : 'NON CONFORME',
      Number(p.costoTotaleGiornaliero.toFixed(2)),
      p.approvatoDa || 'In attesa',
      p.note || '',
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(f2Data);
  ws2['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Dettaglio Giornaliero');

  // -------------------------------------------------------------
  // FOGLIO 3: RIPARTIZIONE COMMESSE & CENTRI DI COSTO
  // -------------------------------------------------------------
  const f3Data: (string | number)[][] = [
    [`RIPARTIZIONE MANODOPERA PER COMMESSA / CENTRO DI COSTO`],
    [],
    [
      'Codice Cantiere',
      'Denominazione Commessa / Cantiere',
      'Operai Unici',
      'Ore Ordinarie Tot.',
      'Ore Straordinarie Tot.',
      'Totale Ore',
      'Costo Totale Manodopera (€)',
      '% Incidenza Costo',
    ],
  ];

  for (const c of cantiereSummaries) {
    const perc = totCosto > 0 ? ((c.costoTotale / totCosto) * 100).toFixed(1) + '%' : '0%';
    f3Data.push([
      c.cantiereId,
      c.cantiereNome,
      c.numeroOperaiUnici,
      c.oreOrdinarie,
      c.oreStraordinarie,
      c.oreTotali,
      Number(c.costoTotale.toFixed(2)),
      perc,
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(f3Data);
  ws3['!cols'] = [
    { wch: 16 },
    { wch: 40 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Costi per Commessa');

  // Salvataggio e download file .xlsx
  const safePeriodo = periodoLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Prospetto_Presenze_LUL_VoltMaster_${safePeriodo}.xlsx`);
}

/**
 * Genera il file CSV Standard compatibile con Zucchetti Paghe Web / TeamSystem B.Point
 */
export function exportLulZucchettiCsv(
  presenze: PresenzaCantiere[],
  dipendenti: Dipendente[],
  periodoLabel: string
) {
  const dipMap = new Map<string, Dipendente>();
  dipendenti.forEach((d) => dipMap.set(d.id, d));

  const headers = [
    'CodiceAzienda',
    'MatricolaDipendente',
    'CodiceFiscale',
    'CognomeNome',
    'DataPresenza',
    'CodiceVocePaga',
    'DescrizioneVoce',
    'QuantitaOre',
    'ImportoUnitario',
    'CodiceCentroDiCosto',
    'NomeCantiere',
    'Note',
  ];

  const rows: string[][] = [];

  for (const p of presenze) {
    const dip = dipMap.get(p.dipendenteId);
    const cf = dip?.codiceFiscale || (p.ditta !== 'interna' ? 'SUBAPPALTO' : 'ND');
    const matricola = p.dipendenteId.replace('dip-', '').padStart(5, '0');
    const safeCantiere = p.cantiereNome.replace(/;/g, ' ');
    const safeNote = (p.note || '').replace(/;/g, ' ');
    const weekend = isWeekend(p.data);

    // Voce 100: Ore Ordinarie
    if (p.oreOrdinarie > 0) {
      rows.push([
        'VOLT01',
        matricola,
        cf,
        p.dipendenteNome,
        p.data,
        '100',
        'Ore Ordinarie Cantiere',
        p.oreOrdinarie.toString(),
        p.costoOrario.toFixed(2),
        p.cantiereId,
        safeCantiere,
        safeNote,
      ]);
    }

    // Voce 120 / 125: Straordinari
    if (p.oreStraordinarie > 0) {
      if (weekend) {
        rows.push([
          'VOLT01',
          matricola,
          cf,
          p.dipendenteNome,
          p.data,
          '125',
          'Straordinario Festivo/Sabato 50%',
          p.oreStraordinarie.toString(),
          (p.costoOrario * 1.5).toFixed(2),
          p.cantiereId,
          safeCantiere,
          'Attività weekend autorizzata',
        ]);
      } else {
        rows.push([
          'VOLT01',
          matricola,
          cf,
          p.dipendenteNome,
          p.data,
          '120',
          'Straordinario Feriale 25%',
          p.oreStraordinarie.toString(),
          (p.costoOrario * 1.3).toFixed(2),
          p.cantiereId,
          safeCantiere,
          'Prolungamento orario cantiere',
        ]);
      }
    }

    // Voce 450: Buono Pasto (Quantità 1)
    if (p.buonoPasto) {
      rows.push([
        'VOLT01',
        matricola,
        cf,
        p.dipendenteNome,
        p.data,
        '450',
        'Buono Pasto Cantiere',
        '1',
        '7.00',
        p.cantiereId,
        safeCantiere,
        'Mensa o ticket cantiere',
      ]);
    }

    // Voce 600: Indennità Trasferta
    if (p.indennitaTrasferta && p.indennitaTrasferta > 0) {
      rows.push([
        'VOLT01',
        matricola,
        cf,
        p.dipendenteNome,
        p.data,
        '600',
        'Indennità Trasferta Forfettaria Cantiere',
        '1',
        p.indennitaTrasferta.toFixed(2),
        p.cantiereId,
        safeCantiere,
        'Distanza > 30km sede',
      ]);
    }
  }

  // BOM UTF-8 per corretta apertura con caratteri italiani in Excel
  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const safePeriodo = periodoLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tracciato_Paghe_Zucchetti_VoltMaster_${safePeriodo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
