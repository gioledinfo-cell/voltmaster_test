import * as XLSX from 'xlsx';
import { ArticoloMagazzino } from '../types';
import { generateUniqueId } from './idGenerator';

export interface RemaTarlazziParsedRow {
  codiceSku: string;
  nome: string;
  prezzoUnitarioAcquisto: number;
  prezzoListinoVendita: number;
  unitaMisura: string;
  barcodeEan: string;
  categoria: ArticoloMagazzino['categoria'];
  fornitore: string;
  siglaMarchio?: string;
  quantitaConfezione?: number;
}

export interface RemaTarlazziDiffItem {
  id: string;
  status: 'new' | 'updated' | 'unchanged';
  item: RemaTarlazziParsedRow;
  existingItem?: ArticoloMagazzino;
  oldPrezzoAcquisto?: number;
  newPrezzoAcquisto: number;
  oldPrezzoListino?: number;
  newPrezzoListino: number;
  prezzoAcquistoDiff?: number;
  prezzoListinoDiff?: number;
}

export interface RemaTarlazziImportSummary {
  totalRowsFound: number;
  validParsed: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  sheetUsed: string;
  diffs: RemaTarlazziDiffItem[];
}

/**
 * Pulisce una stringa di testo o numero convertendola in numero decimale
 */
export function parsePriceNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val * 100) / 100;

  const str = String(val).trim().replace(/[€\s]/g, '');
  if (!str) return 0;

  // Gestione formato italiano (1.250,50 o 12,50) o inglese (1,250.50 o 12.50)
  let normalized = str;
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Formato italiano: 1.250,50
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato inglese: 1,250.50
      normalized = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    normalized = str.replace(',', '.');
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Normalizza l'unità di misura secondo le convenzioni di cantiere VoltMaster
 * ('NR' -> 'pz', 'ML' -> 'm', etc.)
 */
export function normalizeUnitaMisura(rawUm: unknown): string {
  if (!rawUm) return 'pz';
  const u = String(rawUm).trim().toUpperCase();

  switch (u) {
    case 'NR':
    case 'N.':
    case 'PZ':
    case 'PEZZO':
    case 'PEZZI':
      return 'pz';
    case 'ML':
    case 'M':
    case 'MT':
    case 'METRO':
    case 'METRI':
      return 'm';
    case 'KG':
    case 'CHILO':
    case 'CHILI':
      return 'kg';
    case 'CF':
    case 'CONF':
    case 'CONFEZIONE':
    case 'SCAT':
    case 'SC':
      return 'conf';
    case 'KT':
    case 'KIT':
      return 'kit';
    case 'RT':
    case 'ROT':
    case 'ROTOLO':
      return 'rotolo';
    default:
      return u.toLowerCase();
  }
}

/**
 * Deduce la categoria merceologica interna dall'anagrafica RemaTarlazzi
 */
export function guessCategoryFromDescription(desc: string, sku: string = ''): ArticoloMagazzino['categoria'] {
  const text = `${desc} ${sku}`.toLowerCase();

  if (
    text.includes('cavo') ||
    text.includes('cordina') ||
    text.includes('fg16') ||
    text.includes('fs18') ||
    text.includes('fror') ||
    text.includes('h07v-k') ||
    text.includes('rg59') ||
    text.includes('matassa') ||
    text.includes('bobina')
  ) {
    return 'cavi_elettrici';
  }

  if (
    text.includes('differenzial') ||
    text.includes('magnetotermic') ||
    text.includes('centralin') ||
    text.includes('quadro') ||
    text.includes('interruttore modulare') ||
    text.includes('sezionator') ||
    text.includes('salvavita') ||
    text.includes('contattor') ||
    text.includes('scaricator') ||
    text.includes('relè') ||
    text.includes('morsett')
  ) {
    return 'quadri_modulari';
  }

  if (
    text.includes('presa') ||
    text.includes('pulsante') ||
    text.includes('deviator') ||
    text.includes('invertitor') ||
    text.includes('placca') ||
    text.includes('bipasso') ||
    text.includes('schuko') ||
    text.includes('supporto 3m') ||
    text.includes('copriforo') ||
    text.includes('interruttore 1p') ||
    text.includes('living now') ||
    text.includes('matix') ||
    text.includes('plana') ||
    text.includes('arké')
  ) {
    return 'apparecchi_comando';
  }

  if (
    text.includes('tubo') ||
    text.includes('corrugat') ||
    text.includes('canalin') ||
    text.includes('canale') ||
    text.includes('passerell') ||
    text.includes('guaina') ||
    text.includes('raccordo') ||
    text.includes('curva') ||
    text.includes('cassetta') ||
    text.includes('scatola 503') ||
    text.includes('504') ||
    text.includes('pt6')
  ) {
    return 'tubi_canaline';
  }

  if (
    text.includes('faro') ||
    text.includes('lampad') ||
    text.includes('led') ||
    text.includes('plafonier') ||
    text.includes('downlight') ||
    text.includes('striscia') ||
    text.includes('emergenza') ||
    text.includes('proiettor') ||
    text.includes('faretto')
  ) {
    return 'illuminazione';
  }

  if (
    text.includes('inverter') ||
    text.includes('fotovoltaic') ||
    text.includes('fv') ||
    text.includes('batteria') ||
    text.includes('accumul') ||
    text.includes('ottimizzator') ||
    text.includes('modulo solare')
  ) {
    return 'fotovoltaico_accumulo';
  }

  return 'materiale_vario';
}

/**
 * Trova l'indice della colonna confrontando vari sinonimi
 */
function findColIndex(headers: string[], synonyms: string[]): number {
  const cleanHeaders = headers.map((h) =>
    h
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  );

  for (const syn of synonyms) {
    const cleanSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idx = cleanHeaders.findIndex((h) => h === cleanSyn || h.includes(cleanSyn));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Esegue il parsing del file Excel / CSV del listino RemaTarlazzi (foglio 'LISRTAXLS')
 */
export async function parseRemaTarlazziFile(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  existingMagazzino: ArticoloMagazzino[]
): Promise<RemaTarlazziImportSummary> {
  let buffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    buffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    buffer = fileOrBuffer.buffer as ArrayBuffer;
  } else {
    buffer = fileOrBuffer;
  }

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Il file Excel non contiene alcun foglio di lavoro.');
  }

  // 1. Cerca il foglio 'LISRTAXLS' (priorità assoluta tracciato RemaTarlazzi)
  let targetSheetName = workbook.SheetNames[0];
  const remaSheet = workbook.SheetNames.find(
    (name) => name.toUpperCase() === 'LISRTAXLS' || name.toUpperCase().includes('LISRT')
  );
  if (remaSheet) {
    targetSheetName = remaSheet;
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error(`Impossibile leggere il foglio "${targetSheetName}".`);
  }

  // Converti in matrice di righe
  const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length < 2) {
    throw new Error(`Il foglio "${targetSheetName}" non contiene dati sufficienti (richiesta riga di intestazione e dati).`);
  }

  // Trova la riga di header (potrebbe essere la riga 0 o la riga 1)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const row = rawRows[r];
    if (Array.isArray(row)) {
      const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
      if (
        rowStr.includes('cod') ||
        rowStr.includes('art') ||
        rowStr.includes('descrizione') ||
        rowStr.includes('prezzo')
      ) {
        headerRowIdx = r;
        break;
      }
    }
  }

  const headerRow: string[] = (rawRows[headerRowIdx] || []).map((c) => String(c || '').trim());

  // Mappatura colonne del tracciato RemaTarlazzi
  const colSku = findColIndex(headerRow, [
    'Cod.Art.RemaTarlazzi',
    'CodArtRemaTarlazzi',
    'Cod. Art. RemaTarlazzi',
    'Codice Articolo Rema',
    'Cod.Articolo Rema',
    'Cod.Art.Rema',
    'Codice Articolo',
    'Cod.Art.',
    'CodArt',
    'SKU',
  ]);

  const colDesc = findColIndex(headerRow, [
    'Descrizione Articolo',
    'DescrizioneArticolo',
    'Descrizione',
    'Descriz.',
    'Articolo',
    'Denominazione',
  ]);

  const colPrezzoCliente = findColIndex(headerRow, [
    'Prezzo Cliente',
    'PrezzoCliente',
    'Prezzo Netto',
    'Netto Cliente',
    'Prezzo Acquisto',
    'PrezzoAcquisto',
    'Netto',
    'Costo Acquisto',
  ]);

  const colPrezzoListino = findColIndex(headerRow, [
    'Prezzo Listino',
    'PrezzoListino',
    'Listino Base',
    'Listino',
    'Prezzo Vendita',
    'Prezzo Base',
  ]);

  const colUm = findColIndex(headerRow, [
    'Unità di Misura',
    'Unita di Misura',
    'UnitaDiMisura',
    'Unita Misura',
    'U.M.',
    'UM',
  ]);

  const colBarcode = findColIndex(headerRow, [
    'Barcode Produttore',
    'BarcodeProduttore',
    'Barcode',
    'EAN',
    'EAN13',
    'Codice a Barre',
    'CodiceBarre',
  ]);

  if (colSku === -1 && colDesc === -1) {
    throw new Error(
      `Colonne obbligatorie non trovate nel foglio "${targetSheetName}". Colonne disponibili: ${headerRow.join(
        ', '
      )}. Tracciato atteso: 'Cod.Art.RemaTarlazzi', 'Descrizione Articolo', 'Prezzo Cliente', 'Prezzo Listino', 'Unità di Misura', 'Barcode Produttore'.`
    );
  }

  // Costruisci mappe di confronto veloce con il magazzino esistente
  const existingSkuMap = new Map<string, ArticoloMagazzino>();
  const existingBarcodeMap = new Map<string, ArticoloMagazzino>();

  existingMagazzino.forEach((art) => {
    if (art.codiceSku) {
      existingSkuMap.set(art.codiceSku.trim().toLowerCase(), art);
    }
    if (art.barcodeEan) {
      existingBarcodeMap.set(art.barcodeEan.trim(), art);
    }
  });

  const diffs: RemaTarlazziDiffItem[] = [];
  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let totalRowsFound = 0;

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;

    totalRowsFound++;

    const rawSku = colSku !== -1 ? String(row[colSku] || '').trim() : '';
    const rawDesc = colDesc !== -1 ? String(row[colDesc] || '').trim() : '';

    if (!rawSku && !rawDesc) continue;

    const codiceSku = rawSku || `RT-${String(r).padStart(5, '0')}`;
    const nome = rawDesc || `Articolo RemaTarlazzi ${codiceSku}`;

    const rawPrezzoCliente = colPrezzoCliente !== -1 ? row[colPrezzoCliente] : 0;
    const rawPrezzoListino = colPrezzoListino !== -1 ? row[colPrezzoListino] : 0;

    let prezzoUnitarioAcquisto = parsePriceNumber(rawPrezzoCliente);
    let prezzoListinoVendita = parsePriceNumber(rawPrezzoListino);

    // Se manca il prezzo listino ma c'è quello d'acquisto, calcola un markup standard del 35%
    if (prezzoListinoVendita === 0 && prezzoUnitarioAcquisto > 0) {
      prezzoListinoVendita = Math.round(prezzoUnitarioAcquisto * 1.35 * 100) / 100;
    }
    // Se manca il prezzo d'acquisto ma c'è il listino, applica sconto acquisto tipico del 40%
    if (prezzoUnitarioAcquisto === 0 && prezzoListinoVendita > 0) {
      prezzoUnitarioAcquisto = Math.round(prezzoListinoVendita * 0.6 * 100) / 100;
    }

    const unitaMisura = colUm !== -1 ? normalizeUnitaMisura(row[colUm]) : 'pz';
    const barcodeEan = colBarcode !== -1 ? String(row[colBarcode] || '').trim() : '';

    const categoria = guessCategoryFromDescription(nome, codiceSku);

    const parsedRow: RemaTarlazziParsedRow = {
      codiceSku,
      nome,
      prezzoUnitarioAcquisto,
      prezzoListinoVendita,
      unitaMisura,
      barcodeEan,
      categoria,
      fornitore: 'RemaTarlazzi',
    };

    // Confronta con gli articoli già a magazzino
    const matchBySku = existingSkuMap.get(codiceSku.toLowerCase());
    const matchByBarcode = barcodeEan ? existingBarcodeMap.get(barcodeEan) : undefined;
    const existing = matchBySku || matchByBarcode;

    if (existing) {
      // Articolo già presente a catalogo
      const oldAcq = existing.prezzoUnitarioAcquisto;
      const oldVen = existing.prezzoListinoVendita;
      const acqDiff = Math.round((prezzoUnitarioAcquisto - oldAcq) * 100) / 100;
      const venDiff = Math.round((prezzoListinoVendita - oldVen) * 100) / 100;

      const isChanged =
        Math.abs(acqDiff) > 0.009 ||
        Math.abs(venDiff) > 0.009 ||
        (barcodeEan && barcodeEan !== existing.barcodeEan);

      if (isChanged) {
        updatedCount++;
        diffs.push({
          id: existing.id,
          status: 'updated',
          item: parsedRow,
          existingItem: existing,
          oldPrezzoAcquisto: oldAcq,
          newPrezzoAcquisto: prezzoUnitarioAcquisto,
          oldPrezzoListino: oldVen,
          newPrezzoListino: prezzoListinoVendita,
          prezzoAcquistoDiff: acqDiff,
          prezzoListinoDiff: venDiff,
        });
      } else {
        unchangedCount++;
        diffs.push({
          id: existing.id,
          status: 'unchanged',
          item: parsedRow,
          existingItem: existing,
          oldPrezzoAcquisto: oldAcq,
          newPrezzoAcquisto: prezzoUnitarioAcquisto,
          oldPrezzoListino: oldVen,
          newPrezzoListino: prezzoListinoVendita,
          prezzoAcquistoDiff: 0,
          prezzoListinoDiff: 0,
        });
      }
    } else {
      // Articolo nuovo, da inserire con giacenza 0
      newCount++;
      diffs.push({
        id: generateUniqueId('art'),
        status: 'new',
        item: parsedRow,
        newPrezzoAcquisto: prezzoUnitarioAcquisto,
        newPrezzoListino: prezzoListinoVendita,
      });
    }
  }

  return {
    totalRowsFound,
    validParsed: diffs.length,
    newCount,
    updatedCount,
    unchangedCount,
    sheetUsed: targetSheetName,
    diffs,
  };
}

/**
 * Converte le differenze confermate in aggiornamenti effettivi per il magazzino VoltMaster
 */
export function applyRemaTarlazziDiffsToCatalog(
  diffs: RemaTarlazziDiffItem[],
  existingMagazzino: ArticoloMagazzino[]
): {
  updatedCatalog: ArticoloMagazzino[];
  appliedCount: number;
} {
  const map = new Map<string, ArticoloMagazzino>();
  existingMagazzino.forEach((a) => map.set(a.id, { ...a }));

  let appliedCount = 0;

  for (const diff of diffs) {
    if (diff.status === 'unchanged') continue;

    if (diff.status === 'updated' && diff.existingItem) {
      const current = map.get(diff.existingItem.id);
      if (current) {
        map.set(diff.existingItem.id, {
          ...current,
          prezzoUnitarioAcquisto: diff.newPrezzoAcquisto,
          prezzoListinoVendita: diff.newPrezzoListino,
          barcodeEan: diff.item.barcodeEan || current.barcodeEan,
          unitaMisura: diff.item.unitaMisura || current.unitaMisura,
          fornitore: 'RemaTarlazzi',
        });
        appliedCount++;
      }
    } else if (diff.status === 'new') {
      const newArt: ArticoloMagazzino = {
        id: diff.id,
        codiceSku: diff.item.codiceSku,
        nome: diff.item.nome,
        categoria: diff.item.categoria,
        giacenza: 0, // Iniziale a 0 come da specifica utente
        scortaMinima: 10,
        unitaMisura: diff.item.unitaMisura,
        prezzoUnitarioAcquisto: diff.newPrezzoAcquisto,
        prezzoListinoVendita: diff.newPrezzoListino,
        ubicazioneScaffale: 'Fornitore RemaTarlazzi - Da Ordinare',
        fornitore: 'RemaTarlazzi',
        qrCode: `MAT-${diff.item.codiceSku}`,
        barcodeEan: diff.item.barcodeEan || undefined,
        siglaMarchio: diff.item.siglaMarchio || 'REMA',
      };
      map.set(newArt.id, newArt);
      appliedCount++;
    }
  }

  return {
    updatedCatalog: Array.from(map.values()),
    appliedCount,
  };
}

/**
 * Converte le differenze del file Excel in aggiornamenti per il Listino Fornitore RemaTarlazzi
 */
export function applyRemaTarlazziDiffsToListinoFornitore(
  diffs: RemaTarlazziDiffItem[],
  existingListino: any[]
): any[] {
  const map = new Map<string, any>();
  existingListino.forEach((a) => map.set(a.codiceFornitore.toLowerCase(), { ...a }));

  for (const diff of diffs) {
    const key = diff.item.codiceSku.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      map.set(key, {
        ...existing,
        descrizione: diff.item.nome || existing.descrizione,
        prezzoAcquisto: diff.newPrezzoAcquisto,
        prezzoListino: diff.newPrezzoListino,
        unitaMisura: diff.item.unitaMisura || existing.unitaMisura,
        barcodeEan: diff.item.barcodeEan || existing.barcodeEan,
      });
    } else {
      const newItem = {
        id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        codiceFornitore: diff.item.codiceSku,
        marchio: diff.item.siglaMarchio || 'RemaTarlazzi',
        siglaMarchio: diff.item.siglaMarchio || 'REMA',
        descrizione: diff.item.nome,
        unitaMisura: diff.item.unitaMisura,
        prezzoAcquisto: diff.newPrezzoAcquisto,
        prezzoListino: diff.newPrezzoListino,
        fornitore: 'RemaTarlazzi',
        categoria: diff.item.categoria,
        barcodeEan: diff.item.barcodeEan || undefined,
      };
      map.set(key, newItem);
    }
  }

  return Array.from(map.values());
}

/**
 * Genera un file Excel demo (.xlsx) conforme al tracciato ufficiale RemaTarlazzi (foglio 'LISRTAXLS')
 */
export function generateSampleRemaTarlazziExcel(): void {
  const data = [
    [
      'Cod.Art.RemaTarlazzi',
      'Descrizione Articolo',
      'Prezzo Cliente',
      'Prezzo Listino',
      'Unità di Misura',
      'Barcode Produttore',
    ],
    ['RT-BT-K4001', 'BTicino Living Now Interruttore 1P 10AX 250V AC', '3,45', '7,20', 'NR', '8012199991201'],
    ['RT-BT-K4140', 'BTicino Living Now Presa Bipasso 2P+T 10/16A', '4,85', '9,90', 'NR', '8012199991202'],
    ['RT-BT-K4003', 'BTicino Living Now Deviatore 1P 10AX 250V AC', '4,20', '8,50', 'NR', '8012199991203'],
    ['RT-PRY-FG16-3G25', 'Prysmian Cavo FG16OR16 3G2.5 mm² CPR Cca-s1b,d1,a1', '1,42', '2,40', 'ML', '8024220019284'],
    ['RT-PRY-FG16-5G6', 'Prysmian Cavo FG16OR16 5G6 mm² per dorsale linea', '3,95', '6,80', 'ML', '8024220019291'],
    ['RT-SCH-A9F74116', 'Schneider Acti9 iC60N Interruttore Magnetotermico 1P+N C16 6kA', '9,80', '18,50', 'NR', '3606480439812'],
    ['RT-SCH-A9R11225', 'Schneider Acti9 iID Differenziale Puro 2P 25A 30mA Tipo A', '24,50', '49,00', 'NR', '3606480439829'],
    ['RT-GEW-GW40003', 'Gewiss Centralino da incasso 12 moduli IP40 porta fumé', '11,20', '22,40', 'NR', '8011564010034'],
    ['RT-GEW-DX15020', 'Gewiss Tubo corrugato pieghevole medio ICTA 3422 d.20mm', '0,32', '0,65', 'ML', '8011564010041'],
    ['RT-PHI-LED-6060', 'Philips CoreLine Pannello LED 60x60 34W 4000K UGR<19', '28,90', '58,00', 'NR', '8718699380123'],
    ['RT-VMR-14008', 'Vimar Plana Interruttore 1P 16AX 250V AC Bianco', '2,90', '5,80', 'NR', '8007352014088'],
    ['RT-ABB-S201-C10', 'ABB Interruttore Magnetotermico S201L C10 1P 4.5kA', '6,70', '13,20', 'NR', '7612270100122'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Imposta larghezza colonne
  ws['!cols'] = [
    { wch: 22 }, // Cod.Art.RemaTarlazzi
    { wch: 45 }, // Descrizione Articolo
    { wch: 15 }, // Prezzo Cliente
    { wch: 15 }, // Prezzo Listino
    { wch: 16 }, // Unità di Misura
    { wch: 20 }, // Barcode Produttore
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LISRTAXLS');

  XLSX.writeFile(wb, 'Listino_RemaTarlazzi_LISRTAXLS_VoltMaster.xlsx');
}
