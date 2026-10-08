import Papa from 'papaparse';
import { CsvDatasetType, TableMetaConfig } from '../types/powerApps';

export const CSV_TABLE_CONFIGS: Record<CsvDatasetType, TableMetaConfig> = {
  dipendenti: {
    type: 'dipendenti',
    fileName: 'Elenco_dipendeti.csv',
    title: 'Elenco Dipendenti',
    description: 'Anagrafica personale, matricole, ruoli di campo e account Microsoft',
    primaryKey: 'Matricola',
    expectedHeaders: [
      'Matricola',
      'Title',
      'Cognome',
      'Operatore_Microsoft',
      'Qualifica',
      'Operatore_In_Campo',
      'Attrezzatura_Matricola',
      'Assunzione',
      'Tel',
    ],
  },
  veicoli: {
    type: 'veicoli',
    fileName: 'Elenco_veicoli.csv',
    title: 'Elenco Veicoli & Flotta',
    description: 'Parco mezzi aziendale, targhe, allestimenti e ultimi rifornimenti',
    primaryKey: 'ID',
    expectedHeaders: [
      'ID',
      'Targa',
      'Veicolo',
      'Modello/Tipologia',
      'Euro',
      'Data_acquisto',
      'Stato',
      'Assegnato',
      'Km_veicolo_Ultimo_Rifornimento',
      'N_tot_Ultimo_Rifornimento',
      'Data_Ultimo_Rifornimento',
      'Operatore_Ultimo_Rifornimento',
      'Qta_Ultimo_Rifornimento',
      'Note',
    ],
  },
  attrezzature: {
    type: 'attrezzature',
    fileName: 'Attrezzatura.csv',
    title: 'Inventario Attrezzature & Asset',
    description: 'Strumenti di misura CEI 64-8, macchinari, garanzie, manutenzioni e collocazione',
    primaryKey: 'ID',
    expectedHeaders: [
      'ID',
      'ID_Attrezzo',
      'ID_Asset',
      'Tecno_Codice',
      'Attrezzo',
      'Titolo',
      'Posizione',
      'N_Lista',
      'Cod Matricola',
      'D. Acquisto',
      'Fornitore',
      'Oper. Responsabi',
      'Data Demolizione',
      'Data Garanzia',
      'Data_Manutezione',
      'Contenitore',
    ],
  },
  depositi: {
    type: 'depositi',
    fileName: 'Elenco_Depositi.csv',
    title: 'Elenco Depositi & Hub',
    description: 'Magazzini centrali, hub logistici, furgoni mobili e container di cantiere',
    primaryKey: 'Titolo',
    expectedHeaders: ['Titolo', 'Tecno_Codice', 'Tipologia'],
  },
  cantieri: {
    type: 'cantieri',
    fileName: 'Registro_Cantieri (1).csv',
    title: 'Registro Cantieri & Commesse',
    description: 'Commesse attive e chiuse, codici cliente, responsabili e date inizio',
    primaryKey: 'ID',
    expectedHeaders: [
      'ID',
      'COD_CANTIERE',
      'CANTIERE',
      'CLIENTE',
      'COD_CLIENTE',
      'Cantiere_Aperto',
      'Assegnato',
      'Data_Inizio',
    ],
  },
  rifornimenti: {
    type: 'rifornimenti',
    fileName: 'Registro_carburante.csv',
    title: 'Registro Carburante & Erogazioni',
    description: 'Prelievi alla cisterna aziendale o rifornimenti con km veicolo e totalizzatore',
    primaryKey: 'ID',
    expectedHeaders: [
      'ID',
      'Data/ora creazione',
      'ID_Veicolo',
      'Targa',
      'Modello_Veicolo',
      'Operatore',
      'Quantità_litri',
      'Km_veicolo',
      'N_totalizzatore',
      'Note',
    ],
  },
  carichi_carburante: {
    type: 'carichi_carburante',
    fileName: 'Registro_Carico_Carburante_2023.csv',
    title: 'Registro Carico Cisterna Carburante',
    description: 'Forniture esterne di gasolio per la cisterna aziendale con verifiche scarico',
    primaryKey: 'Titolo',
    expectedHeaders: [
      'Titolo',
      'Data',
      'Operatore',
      'Qta',
      'Qta_Eff',
      'N_Totaliz',
      'Data_Ultimo_Scarico',
      'Operatore_Ultimo_Scarico',
      'Veicolo_Ultimo',
      'Qta_Ultimo_Scarico',
    ],
  },
};

/**
 * Normalizes header string: removes UTF-8 BOM, trims, converts common variations
 */
function cleanHeader(h: string): string {
  return h.replace(/^\uFEFF/, '').trim();
}

/**
 * Detects which of the 7 schemas matches the headers of the uploaded CSV
 */
export function detectCsvSchema(rawHeaders: string[], fileName?: string): CsvDatasetType | null {
  const headers = rawHeaders.map(cleanHeader);
  const headerSet = new Set(headers.map((h) => h.toLowerCase()));

  // 1. Check Dipendenti
  if (
    headerSet.has('matricola') &&
    (headerSet.has('operatore_microsoft') || headerSet.has('operatore_in_campo') || headerSet.has('qualifica'))
  ) {
    return 'dipendenti';
  }

  // 2. Check Veicoli
  if (
    headerSet.has('targa') &&
    (headerSet.has('km_veicolo_ultimo_rifornimento') || headerSet.has('n_tot_ultimo_rifornimento') || headerSet.has('veicolo'))
  ) {
    return 'veicoli';
  }

  // 3. Check Attrezzatura
  if (
    (headerSet.has('id_attrezzo') || headerSet.has('attrezzo')) &&
    (headerSet.has('posizione') || headerSet.has('data_manutezione') || headerSet.has('data garanzia'))
  ) {
    return 'attrezzature';
  }

  // 4. Check Depositi
  if (
    headerSet.has('tipologia') &&
    headerSet.has('tecno_codice') &&
    !headerSet.has('attrezzo') &&
    !headerSet.has('cantiere')
  ) {
    return 'depositi';
  }

  // 5. Check Cantieri
  if (
    headerSet.has('cod_cantiere') ||
    (headerSet.has('cantiere') && headerSet.has('cantiere_aperto'))
  ) {
    return 'cantieri';
  }

  // 6. Check Carichi Carburante
  if (
    headerSet.has('qta_eff') ||
    headerSet.has('n_totaliz') ||
    headerSet.has('veicolo_ultimo')
  ) {
    return 'carichi_carburante';
  }

  // 7. Check Rifornimenti
  if (
    (headerSet.has('quantità_litri') || headerSet.has('quantita_litri') || headerSet.has('litri')) &&
    (headerSet.has('km_veicolo') || headerSet.has('n_totalizzatore') || headerSet.has('id_veicolo'))
  ) {
    return 'rifornimenti';
  }

  // Fallback by filename pattern if headers were partially altered
  if (fileName) {
    const fn = fileName.toLowerCase();
    if (fn.includes('dipendeti') || fn.includes('dipendenti')) return 'dipendenti';
    if (fn.includes('veicoli')) return 'veicoli';
    if (fn.includes('attrezzatur')) return 'attrezzature';
    if (fn.includes('deposit')) return 'depositi';
    if (fn.includes('cantier')) return 'cantieri';
    if (fn.includes('carico')) return 'carichi_carburante';
    if (fn.includes('carburante') || fn.includes('riforniment')) return 'rifornimenti';
  }

  return null;
}

/**
 * Normalizes number fields (converts Italian decimal comma to dot, trims)
 */
function parseNumberValue(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses and maps CSV raw objects to typed records according to the detected schema
 */
export function normalizeParsedRows(schemaType: CsvDatasetType, rawRows: Record<string, any>[]): any[] {
  return rawRows
    .filter((row) => Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== ''))
    .map((row, index) => {
      // Create a case-insensitive lookup map
      const lookup: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        lookup[cleanHeader(key).toLowerCase()] = row[key];
      });

      const get = (expectedName: string, fallback = ''): string => {
        const val = lookup[expectedName.toLowerCase()];
        return val !== null && val !== undefined ? String(val).trim() : fallback;
      };

      const getNum = (expectedName: string, fallback = 0): number => {
        const val = lookup[expectedName.toLowerCase()];
        return parseNumberValue(val ?? fallback);
      };

      switch (schemaType) {
        case 'dipendenti': {
          const mat = get('Matricola') || `DIP-${String(index + 1).padStart(2, '0')}`;
          return {
            Matricola: mat,
            Title: get('Title', get('Nome', 'Dipendente')),
            Cognome: get('Cognome', ''),
            Operatore_Microsoft: get('Operatore_Microsoft', ''),
            Qualifica: get('Qualifica', 'Operaio'),
            Operatore_In_Campo: get('Operatore_In_Campo', 'Sì'),
            Attrezzatura_Matricola: get('Attrezzatura_Matricola', ''),
            Assunzione: get('Assunzione', new Date().toISOString().split('T')[0]),
            Tel: get('Tel', ''),
          };
        }

        case 'veicoli': {
          const id = get('ID') || `VEI-${String(index + 1).padStart(2, '0')}`;
          return {
            ID: id,
            Targa: get('Targa', 'ND').toUpperCase(),
            Veicolo: get('Veicolo', get('Modello/Tipologia', 'Veicolo Aziendale')),
            'Modello/Tipologia': get('Modello/Tipologia', get('Veicolo', '')),
            Euro: get('Euro', 'Euro 6'),
            Data_acquisto: get('Data_acquisto', '2022-01-01'),
            Stato: get('Stato', 'Attivo'),
            Assegnato: get('Assegnato', 'Parco Comune'),
            Km_veicolo_Ultimo_Rifornimento: getNum('Km_veicolo_Ultimo_Rifornimento', 0),
            N_tot_Ultimo_Rifornimento: getNum('N_tot_Ultimo_Rifornimento', 0),
            Data_Ultimo_Rifornimento: get('Data_Ultimo_Rifornimento', ''),
            Operatore_Ultimo_Rifornimento: get('Operatore_Ultimo_Rifornimento', ''),
            Qta_Ultimo_Rifornimento: getNum('Qta_Ultimo_Rifornimento', 0),
            Note: get('Note', ''),
          };
        }

        case 'attrezzature': {
          const id = get('ID') || `ATT-${String(index + 1).padStart(3, '0')}`;
          return {
            ID: id,
            ID_Attrezzo: get('ID_Attrezzo', `STR-${String(index + 1).padStart(2, '0')}`),
            ID_Asset: get('ID_Asset', ''),
            Tecno_Codice: get('Tecno_Codice', ''),
            Attrezzo: get('Attrezzo', get('Titolo', 'Attrezzatura')),
            Titolo: get('Titolo', get('Attrezzo', '')),
            Posizione: get('Posizione', 'Deposito Centrale Sede'),
            N_Lista: get('N_Lista', ''),
            'Cod Matricola': get('Cod Matricola', get('Matricola', '')),
            'D. Acquisto': get('D. Acquisto', get('Data Acquisto', '2023-01-01')),
            Fornitore: get('Fornitore', ''),
            'Oper. Responsabi': get('Oper. Responsabi', get('Responsabile', '')),
            'Data Demolizione': get('Data Demolizione', ''),
            'Data Garanzia': get('Data Garanzia', ''),
            Data_Manutezione: get('Data_Manutezione', get('Data Manutenzione', '')),
            Contenitore: get('Contenitore', ''),
          };
        }

        case 'depositi': {
          const tit = get('Titolo') || `Deposito ${index + 1}`;
          return {
            Titolo: tit,
            Tecno_Codice: get('Tecno_Codice', `DEP-${index + 1}`),
            Tipologia: get('Tipologia', 'Magazzino'),
          };
        }

        case 'cantieri': {
          const id = get('ID') || `CNT-${String(index + 1).padStart(2, '0')}`;
          return {
            ID: id,
            COD_CANTIERE: get('COD_CANTIERE', `CANT-${index + 1}`),
            CANTIERE: get('CANTIERE', 'Cantiere Operativo'),
            CLIENTE: get('CLIENTE', 'Cliente'),
            COD_CLIENTE: get('COD_CLIENTE', ''),
            Cantiere_Aperto: get('Cantiere_Aperto', 'Sì'),
            Assegnato: get('Assegnato', ''),
            Data_Inizio: get('Data_Inizio', new Date().toISOString().split('T')[0]),
          };
        }

        case 'rifornimenti': {
          const id = get('ID') || `RIF-${String(index + 1).padStart(3, '0')}`;
          return {
            ID: id,
            'Data/ora creazione': get('Data/ora creazione', get('Data', new Date().toISOString().replace('T', ' ').substring(0, 16))),
            ID_Veicolo: get('ID_Veicolo', ''),
            Targa: get('Targa', '').toUpperCase(),
            Modello_Veicolo: get('Modello_Veicolo', ''),
            Operatore: get('Operatore', ''),
            Quantità_litri: getNum('Quantità_litri', getNum('Quantita_litri', getNum('Litri', 0))),
            Km_veicolo: getNum('Km_veicolo', 0),
            N_totalizzatore: getNum('N_totalizzatore', 0),
            Note: get('Note', ''),
          };
        }

        case 'carichi_carburante': {
          const tit = get('Titolo') || `Carico Carburante ${index + 1}`;
          return {
            Titolo: tit,
            Data: get('Data', new Date().toISOString().split('T')[0]),
            Operatore: get('Operatore', ''),
            Qta: getNum('Qta', 0),
            Qta_Eff: getNum('Qta_Eff', getNum('Qta', 0)),
            N_Totaliz: getNum('N_Totaliz', 0),
            Data_Ultimo_Scarico: get('Data_Ultimo_Scarico', ''),
            Operatore_Ultimo_Scarico: get('Operatore_Ultimo_Scarico', ''),
            Veicolo_Ultimo: get('Veicolo_Ultimo', ''),
            Qta_Ultimo_Scarico: getNum('Qta_Ultimo_Scarico', 0),
          };
        }
      }
    });
}

/**
 * Parses an uploaded CSV File, validates its schema and normalizes rows
 */
export async function parseCsvFile(file: File): Promise<{
  schemaType: CsvDatasetType;
  rows: any[];
  headers: string[];
  totalParsed: number;
  fileName: string;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (h) => cleanHeader(h),
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const detectedSchema = detectCsvSchema(rawHeaders, file.name);

        if (!detectedSchema) {
          reject(
            new Error(
              `Impossibile riconoscere lo schema del file "${file.name}". Intestazioni rilevate: [${rawHeaders.slice(0, 5).join(', ')}...]. Verifica che corrisponda a uno dei 7 file previsti da Microsoft Power Apps.`
            )
          );
          return;
        }

        const normalized = normalizeParsedRows(detectedSchema, results.data);
        const parsingErrors = results.errors.map((e) => `Riga ${e.row}: ${e.message}`);

        resolve({
          schemaType: detectedSchema,
          rows: normalized,
          headers: rawHeaders,
          totalParsed: normalized.length,
          fileName: file.name,
          errors: parsingErrors,
        });
      },
      error: (err) => {
        reject(new Error(`Errore durante il parsing CSV: ${err.message}`));
      },
    });
  });
}

/**
 * Generates and triggers download of a standardized CSV file for any of the 7 datasets.
 * Includes UTF-8 BOM (\uFEFF) for immediate compatibility with Microsoft Excel in Italian / EU locale.
 */
export function exportToCsv(schemaType: CsvDatasetType, rows: any[], customFileName?: string) {
  const config = CSV_TABLE_CONFIGS[schemaType];
  const fileName = customFileName || config.fileName;

  // Ensure fields are sorted by expectedHeaders
  const columns = config.expectedHeaders;

  const csvContent = Papa.unparse({
    fields: columns,
    data: rows.map((row) => {
      const sanitizedRow: Record<string, any> = {};
      columns.forEach((col) => {
        sanitizedRow[col] = row[col] !== undefined && row[col] !== null ? row[col] : '';
      });
      return sanitizedRow;
    }),
  }, {
    delimiter: ';', // Semicolon is the standard European/Italian Excel CSV delimiter
    quotes: true,
  });

  // Prepend UTF-8 BOM so Excel opens with proper accents and formatting
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
