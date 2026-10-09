import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FaseGanttCantiere } from '../types/ganttAllocazioni';
import { VoceMaterialePreventivo, VoceManodoperaPreventivo } from '../types';

export interface VoceComputoMetrico {
  id: string;
  codiceTariffa: string;
  descrizione: string;
  categoria: string;
  unitaMisura: string;
  quantita: number;
  prezzoUnitario: number;
  totaleImporto: number;
  tipo: 'materiale' | 'manodopera' | 'noleggio' | 'fornitura_posa';
}

export interface CategoriaComputo {
  nome: string;
  importo: number;
  vociCount: number;
  percentualeSuTotale: number;
}

export interface ComputoMetricoImportResult {
  titolo: string;
  softwareSorgente: 'ACCA PriMus (.xpwe)' | 'Excel (.xlsx/.xls)' | 'CSV / Testo' | 'Template Preimpostato';
  autore?: string;
  dataComputo: string;
  totaleImporto: number;
  totaleVoci: number;
  categorie: CategoriaComputo[];
  voci: VoceComputoMetrico[];
}

/**
 * Normalizza le categorie comuni del settore impiantistico/edile
 */
function normalizeCategory(rawCat?: string, desc?: string): string {
  const text = `${rawCat || ''} ${desc || ''}`.toLowerCase();
  if (text.includes('murari') || text.includes('tracc') || text.includes('demoliz') || text.includes('scavo')) {
    return 'Opere Murarie & Tracce';
  }
  if (text.includes('tub') || text.includes('canal') || text.includes('passerell') || text.includes('corrugat')) {
    return 'Posa Tubazioni & Canali';
  }
  if (text.includes('cav') || text.includes('infilagg') || text.includes('corda') || text.includes('dorsal')) {
    return 'Infilaggio Cavi & Linee';
  }
  if (text.includes('quadr') || text.includes('interrutt') || text.includes('centralin') || text.includes('differenz')) {
    return 'Quadri Elettrici & Protezioni';
  }
  if (text.includes('placc') || text.includes('frutt') || text.includes('pres') || text.includes('interr') || text.includes('illumin')) {
    return 'Apparecchiature & Frutti';
  }
  if (text.includes('collaud') || text.includes('certific') || text.includes('verific') || text.includes('rilascio')) {
    return 'Collaudo & Certificazioni (DM 37/08)';
  }
  if (text.includes('sicurezz') || text.includes('dpi') || text.includes('pontegg') || text.includes('linea vita')) {
    return 'Oneri della Sicurezza (D.Lgs. 81/08)';
  }
  return rawCat?.trim() || 'Lavorazioni Impiantistiche Generali';
}

/**
 * Parsing di file .xpwe (Formato XML standard PriMus - ACCA Software)
 */
export function parseXpweComputo(xmlString: string, fileName?: string): ComputoMetricoImportResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Verifica se ci sono errori di parsing XML
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Formato XML .xpwe non valido o corrotto.');
  }

  const voci: VoceComputoMetrico[] = [];

  // Nei file .xpwe PriMus, gli elementi tipici sono <EP> (Elenco Prezzi), <MIS> (Misurazioni / Voci di computo), o <VOCE> / <Articolo>
  const misElements = xmlDoc.querySelectorAll('MIS, Misurazione, VoceComputo, Articolo, EP');

  if (misElements.length > 0) {
    misElements.forEach((el, idx) => {
      const cod =
        el.querySelector('Codice, CodArt, Tariffa, ID')?.textContent?.trim() ||
        `XPWE-${String(idx + 1).padStart(3, '0')}`;
      const desc =
        el.querySelector('DescrEstesa, Descrizione, Descr, Dst')?.textContent?.trim() ||
        el.getAttribute('descrizione') ||
        'Lavorazione da computo PriMus';
      const catRaw =
        el.querySelector('Capitolo, Categoria, Parte, Categ')?.textContent?.trim() ||
        'Impianto Elettrico';
      const um =
        el.querySelector('UM, UnitaMisura, Um')?.textContent?.trim() || 'corpo';
      const qtaStr =
        el.querySelector('Quantita, Qta, TotaleQta, MIS')?.textContent?.replace(',', '.') || '1';
      const prezzoStr =
        el.querySelector('Prezzo, PrezzoUnitario, Prezzo1, Tariffa')?.textContent?.replace(',', '.') || '0';

      const quantita = Math.max(0.01, parseFloat(qtaStr) || 1);
      const prezzoUnitario = Math.max(0, parseFloat(prezzoStr) || 0);
      const totaleImporto = Math.round(quantita * prezzoUnitario * 100) / 100;
      const categoria = normalizeCategory(catRaw, desc);

      let tipo: VoceComputoMetrico['tipo'] = 'fornitura_posa';
      if (desc.toLowerCase().includes('manodopera') || desc.toLowerCase().includes('operaio') || um.toLowerCase() === 'h' || um.toLowerCase() === 'ore') {
        tipo = 'manodopera';
      } else if (desc.toLowerCase().includes('noleggio') || desc.toLowerCase().includes('piattaforma') || desc.toLowerCase().includes('ponteggio')) {
        tipo = 'noleggio';
      }

      voci.push({
        id: `xpwe-${Date.now()}-${idx}`,
        codiceTariffa: cod,
        descrizione: desc,
        categoria,
        unitaMisura: um,
        quantita,
        prezzoUnitario,
        totaleImporto,
        tipo,
      });
    });
  }

  // Se l'XML ha una struttura diversa (es. esportazione semplificata), raccogliamo i tag generici
  if (voci.length === 0) {
    // Prova a scorrere tutti i nodi con attributi tariffa o prezzo
    const allNodes = xmlDoc.getElementsByTagName('*');
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      if (node.tagName.toLowerCase().includes('voce') || node.tagName.toLowerCase().includes('item')) {
        const desc = node.textContent?.trim().slice(0, 140) || 'Voce di computo';
        voci.push({
          id: `xpwe-${Date.now()}-${i}`,
          codiceTariffa: `TAR-${i + 1}`,
          descrizione: desc,
          categoria: 'Lavorazioni Elettriche Generali',
          unitaMisura: 'corpo',
          quantita: 1,
          prezzoUnitario: 150,
          totaleImporto: 150,
          tipo: 'fornitura_posa',
        });
      }
    }
  }

  if (voci.length === 0) {
    throw new Error('Nessuna voce di computo rilevata nel file .xpwe. Verificare che il file contenga elementi di Elenco Prezzi o Misurazioni.');
  }

  return aggregateComputoResult(
    voci,
    fileName ? `Computo da ${fileName}` : 'Computo Metrico PriMus ACCA',
    'ACCA PriMus (.xpwe)'
  );
}

/**
 * Parsing di file Excel (.xlsx / .xls) o CSV
 */
export function parseExcelOrCsvComputo(
  dataBuffer: ArrayBuffer | string,
  fileName: string
): ComputoMetricoImportResult {
  let rows: any[] = [];

  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (isCsv && typeof dataBuffer === 'string') {
    const parsedCsv = Papa.parse(dataBuffer, { header: true, skipEmptyLines: true });
    rows = parsedCsv.data as any[];
  } else {
    const workbook = XLSX.read(dataBuffer, { type: typeof dataBuffer === 'string' ? 'string' : 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Il file Excel non contiene fogli di lavoro validi.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  if (!rows || rows.length === 0) {
    throw new Error('Il file non contiene righe o dati elaborabili.');
  }

  const voci: VoceComputoMetrico[] = [];

  rows.forEach((row, idx) => {
    // Ricerca euristica dei nomi delle colonne
    const keys = Object.keys(row);
    const findVal = (...fieldNames: string[]) => {
      for (const fn of fieldNames) {
        const foundKey = keys.find((k) => k.toLowerCase().trim().includes(fn.toLowerCase()));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const cod = findVal('codice', 'tariffa', 'art', 'id') || `VOX-${String(idx + 1).padStart(3, '0')}`;
    const desc = findVal('descrizione', 'descr', 'lavorazione', 'opera', 'articolo', 'testo') || '';
    const cat = findVal('categoria', 'capitolo', 'fase', 'gruppo', 'parte') || 'Lavorazioni Impiantistiche';
    const um = findVal('um', 'u.m.', 'unita', 'misura') || 'corpo';

    const qtaStr = findVal('quantita', 'qta', 'q.ta', 'misura', 'totale qta').replace(',', '.');
    const prezzoStr = findVal('prezzo', 'tariffa unitaria', 'costo unitario', 'prezzo unitario', 'unitario').replace('€', '').replace(',', '.');
    const totStr = findVal('totale', 'importo', 'subtotale').replace('€', '').replace(',', '.');

    if (!desc && !cod && !prezzoStr) return; // Salta intestazioni o righe vuote

    const quantita = Math.max(0.01, parseFloat(qtaStr) || 1);
    let prezzoUnitario = parseFloat(prezzoStr) || 0;
    let totaleImporto = parseFloat(totStr) || 0;

    if (totaleImporto > 0 && prezzoUnitario === 0) {
      prezzoUnitario = Math.round((totaleImporto / quantita) * 100) / 100;
    } else if (prezzoUnitario > 0 && totaleImporto === 0) {
      totaleImporto = Math.round(quantita * prezzoUnitario * 100) / 100;
    }

    if (totaleImporto === 0 && prezzoUnitario === 0) {
      prezzoUnitario = 45.0; // Stima default
      totaleImporto = Math.round(quantita * prezzoUnitario * 100) / 100;
    }

    const cleanedDesc = desc || `Lavorazione cod. ${cod}`;
    const categoria = normalizeCategory(cat, cleanedDesc);

    let tipo: VoceComputoMetrico['tipo'] = 'fornitura_posa';
    if (cleanedDesc.toLowerCase().includes('manodopera') || cleanedDesc.toLowerCase().includes('operaio') || um.toLowerCase() === 'h' || um.toLowerCase() === 'ore') {
      tipo = 'manodopera';
    } else if (cleanedDesc.toLowerCase().includes('noleggio') || cleanedDesc.toLowerCase().includes('piattaforma')) {
      tipo = 'noleggio';
    }

    voci.push({
      id: `xl-${Date.now()}-${idx}`,
      codiceTariffa: cod,
      descrizione: cleanedDesc,
      categoria,
      unitaMisura: um,
      quantita,
      prezzoUnitario,
      totaleImporto,
      tipo,
    });
  });

  if (voci.length === 0) {
    throw new Error('Nessuna riga di computo valida individuata nelle colonne del file.');
  }

  return aggregateComputoResult(
    voci,
    fileName ? `Computo da ${fileName}` : 'Computo Metrico da File Excel/CSV',
    isCsv ? 'CSV / Testo' : 'Excel (.xlsx/.xls)'
  );
}

/**
 * Aggrega le categorie e calcola i totali generali
 */
function aggregateComputoResult(
  voci: VoceComputoMetrico[],
  titolo: string,
  softwareSorgente: ComputoMetricoImportResult['softwareSorgente']
): ComputoMetricoImportResult {
  const catMap = new Map<string, { importo: number; vociCount: number }>();
  let totaleImporto = 0;

  voci.forEach((v) => {
    totaleImporto += v.totaleImporto;
    const existing = catMap.get(v.categoria) || { importo: 0, vociCount: 0 };
    existing.importo += v.totaleImporto;
    existing.vociCount += 1;
    catMap.set(v.categoria, existing);
  });

  totaleImporto = Math.round(totaleImporto * 100) / 100;

  const categorie: CategoriaComputo[] = Array.from(catMap.entries()).map(([nome, data]) => ({
    nome,
    importo: Math.round(data.importo * 100) / 100,
    vociCount: data.vociCount,
    percentualeSuTotale: totaleImporto > 0 ? Math.round((data.importo / totaleImporto) * 1000) / 10 : 0,
  }));

  // Ordina le categorie per importo decrescente
  categorie.sort((a, b) => b.importo - a.importo);

  return {
    titolo,
    softwareSorgente,
    autore: 'Ufficio Tecnico di Progettazione',
    dataComputo: new Date().toISOString().split('T')[0],
    totaleImporto,
    totaleVoci: voci.length,
    categorie,
    voci,
  };
}

/**
 * Esempio 1 Realistico: Computo Metrico Impianto Elettrico PriMus .xpwe
 */
export function getSampleXpweXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PriMusComputo xmlns="http://www.acca.it/primus/xpwe" Versione="1.2">
  <Intestazione>
    <Oggetto>Riqualificazione Impianto Elettrico e Dati Uffici Direzionali</Oggetto>
    <Committente>Immobiliare Centro Direzionale S.p.A.</Committente>
    <Progettista>Ing. Marco Silvestri - Studio Tecnico Associato</Progettista>
    <Data>2026-10-09</Data>
  </Intestazione>
  <ElencoVoci>
    <MIS>
      <Tariffa>E.01.10.05</Tariffa>
      <Capitolo>Opere Murarie &amp; Tracce</Capitolo>
      <DescrEstesa>Esecuzione di tracce su muratura in laterizio forato per incasso tubazioni protettive elettriche, compreso successivo ripristino con malta di calce e cemento.</DescrEstesa>
      <UM>m</UM>
      <Quantita>180.00</Quantita>
      <PrezzoUnitario>16.50</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.02.15.20</Tariffa>
      <Capitolo>Posa Tubazioni &amp; Canali</Capitolo>
      <DescrEstesa>Fornitura e posa in opera di canale portacavi metallico zincato forato dim. 200x50 mm con coperchio a scatto, accessori di curva, derivazioni e staffaggio ogni 1.5 m a soffitto.</DescrEstesa>
      <UM>m</UM>
      <Quantita>95.00</Quantita>
      <PrezzoUnitario>38.80</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.02.20.10</Tariffa>
      <Capitolo>Posa Tubazioni &amp; Canali</Capitolo>
      <DescrEstesa>Posa di tubazione flessibile corrugata in polipropilene autoestinguente serie pesante diametro 25 mm incassata a pavimento o parete.</DescrEstesa>
      <UM>m</UM>
      <Quantita>320.00</Quantita>
      <PrezzoUnitario>6.40</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.03.05.15</Tariffa>
      <Capitolo>Infilaggio Cavi &amp; Linee</Capitolo>
      <DescrEstesa>Infilaggio di cavo multipolare FG16OR16 0.6/1kV sezione 5G6 mmq per dorsale principale distribuzione quadri di piano.</DescrEstesa>
      <UM>m</UM>
      <Quantita>140.00</Quantita>
      <PrezzoUnitario>12.20</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.03.10.40</Tariffa>
      <Capitolo>Infilaggio Cavi &amp; Linee</Capitolo>
      <DescrEstesa>Infilaggio di conduttori unipolari FS17 450/750V sezione 3x2.5 mmq per circuiti prese e forza motrice 16A.</DescrEstesa>
      <UM>m</UM>
      <Quantita>450.00</Quantita>
      <PrezzoUnitario>4.10</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.04.01.10</Tariffa>
      <Capitolo>Quadri Elettrici &amp; Protezioni</Capitolo>
      <DescrEstesa>Quadro elettrico generale in carpenteria metallica IP55 da parete dim. 800x1000x250 con interruttore generale 4P 100A, 8 partenze magnetotermiche differenziali, cablaggio interno e siglatura.</DescrEstesa>
      <UM>cad</UM>
      <Quantita>2.00</Quantita>
      <PrezzoUnitario>2450.00</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.05.20.05</Tariffa>
      <Capitolo>Apparecchiature &amp; Frutti</Capitolo>
      <DescrEstesa>Fornitura e posa di punto presa standard bivalente 10/16A + Schuko serie civile su scatola 503 con supporto e placca tecnopolimero.</DescrEstesa>
      <UM>cad</UM>
      <Quantita>64.00</Quantita>
      <PrezzoUnitario>26.50</PrezzoUnitario>
    </MIS>
    <MIS>
      <Tariffa>E.06.10.00</Tariffa>
      <Capitolo>Collaudo &amp; Certificazioni (DM 37/08)</Capitolo>
      <DescrEstesa>Verifiche strumentali secondo CEI 64-8 (resistenza di isolamento, continuità conduttori di terra, prova tempi scatto differenziali) e rilascio Dichiarazione di Conformità DiCo ex DM 37/08 con as-built.</DescrEstesa>
      <UM>corpo</UM>
      <Quantita>1.00</Quantita>
      <PrezzoUnitario>1200.00</PrezzoUnitario>
    </MIS>
  </ElencoVoci>
</PriMusComputo>`;
}

/**
 * Esempio 2: Dati Tabellari Excel di Computo Metrico
 */
export function getSampleExcelComputoData(): any[] {
  return [
    {
      'Codice Tariffa': 'EL-IND-01',
      'Capitolo Lavorazione': 'Opere Murarie & Tracce',
      'Descrizione Articolo': 'Carotaggio su pareti in c.a. per passaggio canali dorsali diametro 150 mm',
      'U.M.': 'cad',
      'Quantità': 8,
      'Prezzo Unitario': 120.0,
      'Importo Totale': 960.0,
    },
    {
      'Codice Tariffa': 'EL-IND-02',
      'Capitolo Lavorazione': 'Posa Tubazioni & Canali',
      'Descrizione Articolo': 'Passerella a filo metallico elettrozincata Bpresa 300x60 completa di mensole e montanti pesanti',
      'U.M.': 'm',
      'Quantità': 120,
      'Prezzo Unitario': 45.0,
      'Importo Totale': 5400.0,
    },
    {
      'Codice Tariffa': 'EL-IND-03',
      'Capitolo Lavorazione': 'Infilaggio Cavi & Linee',
      'Descrizione Articolo': 'Cavo FG16M16 4x25+16T mmq per alimentazione quadro macchine utensili CNC',
      'U.M.': 'm',
      'Quantità': 85,
      'Prezzo Unitario': 34.5,
      'Importo Totale': 2932.5,
    },
    {
      'Codice Tariffa': 'EL-IND-04',
      'Capitolo Lavorazione': 'Quadri Elettrici & Protezioni',
      'Descrizione Articolo': 'Quadro Power Center Bassa Tensione 400A con sezionatore e sgancio di emergenza',
      'U.M.': 'cad',
      'Quantità': 1,
      'Prezzo Unitario': 5200.0,
      'Importo Totale': 5200.0,
    },
    {
      'Codice Tariffa': 'EL-IND-05',
      'Capitolo Lavorazione': 'Apparecchiature & Frutti',
      'Descrizione Articolo': 'Armatura industriale LED high-bay 150W IP65 21000 lumen con aggancio a catena',
      'U.M.': 'cad',
      'Quantità': 24,
      'Prezzo Unitario': 185.0,
      'Importo Totale': 4440.0,
    },
    {
      'Codice Tariffa': 'EL-IND-06',
      'Capitolo Lavorazione': 'Collaudo & Certificazioni (DM 37/08)',
      'Descrizione Articolo': 'Collaudo elettrico e termografia a infrarossi su quadro generale in condizioni di carico nominale',
      'U.M.': 'corpo',
      'Quantità': 1,
      'Prezzo Unitario': 1500.0,
      'Importo Totale': 1500.0,
    },
  ];
}

/**
 * Trasforma il risultato del computo in voci per Preventivo
 */
export function convertComputoToPreventivoVoci(computo: ComputoMetricoImportResult): {
  materiali: VoceMaterialePreventivo[];
  manodopera: VoceManodoperaPreventivo[];
} {
  const materiali: VoceMaterialePreventivo[] = [];
  const manodopera: VoceManodoperaPreventivo[] = [];

  computo.voci.forEach((v, idx) => {
    if (v.tipo === 'manodopera') {
      manodopera.push({
        id: `prev-mo-${Date.now()}-${idx}`,
        descrizione: `[${v.codiceTariffa}] ${v.descrizione}`,
        oreStimate: v.quantita,
        tariffaOrariaApplicata: v.prezzoUnitario,
        totale: v.totaleImporto,
      });
    } else {
      // Voci materiale / fornitura e posa
      const costoAcquisto = Math.round(v.prezzoUnitario * 0.75 * 100) / 100; // Stima costo acquisto (33% margine)
      materiali.push({
        id: `prev-mat-${Date.now()}-${idx}`,
        codiceSku: v.codiceTariffa,
        descrizione: v.descrizione,
        unitaMisura: v.unitaMisura,
        quantita: v.quantita,
        costoAcquistoUnitario: costoAcquisto,
        ricaricoPercentuale: 33.3,
        prezzoVenditaUnitario: v.prezzoUnitario,
        totaleCosto: Math.round(costoAcquisto * v.quantita * 100) / 100,
        totaleVendita: v.totaleImporto,
      });
    }
  });

  return { materiali, manodopera };
}

/**
 * Trasforma le categorie del computo in Fasi di Cantiere per Cronoprogramma Gantt
 */
export function convertComputoToGanttFasi(
  computo: ComputoMetricoImportResult,
  cantiereId: string,
  startDateStr: string = '2026-10-15'
): FaseGanttCantiere[] {
  const phases: FaseGanttCantiere[] = [];

  let currentDate = new Date(startDateStr);

  computo.categorie.forEach((cat, index) => {
    // Stima durata in giorni lavorativi basata sull'importo della categoria
    // Regola tipica: ~800€ - 1200€ al giorno per squadra di 2 operai
    const estimatedDays = Math.max(3, Math.min(20, Math.ceil(cat.importo / 900)));

    const dateInizio = new Date(currentDate);
    const dateFine = new Date(currentDate);
    dateFine.setDate(dateFine.getDate() + estimatedDays);

    const dateInizioStr = dateInizio.toISOString().split('T')[0];
    const dateFineStr = dateFine.toISOString().split('T')[0];

    // Avanza la data corrente per la fase successiva (con 1 giorno di overlap)
    currentDate.setDate(currentDate.getDate() + Math.max(1, estimatedDays - 1));

    phases.push({
      id: `fase-comp-${Date.now()}-${index}`,
      cantiereId,
      cantiereTitolo: computo.titolo,
      titoloFase: cat.nome,
      importoFaseEuro: cat.importo,
      dataInizio: dateInizioStr,
      dataFine: dateFineStr,
      coloreBarra: getPhaseColor(index),
      stato: index === 0 ? 'in_corso' : 'non_iniziata',
      percentualeAvanzamento: index === 0 ? 15 : 0,
      dipendentiAssegnati: ['Marco Rossi (Capocantiere)', 'Davide Riva (PES/PAV)'],
      attrezzatureAssegnate: index === 1 ? ['Piattaforma PLE-01'] : [],
      veicoliAssegnati: ['Fiat Doblò Cargo'],
    });
  });

  return phases;
}

function getPhaseColor(index: number): string {
  const colors = [
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316', // orange
  ];
  return colors[index % colors.length];
}
