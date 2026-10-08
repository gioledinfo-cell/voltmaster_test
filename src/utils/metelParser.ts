import JSZip from 'jszip';
import { ArticoloMagazzino } from '../types';
import { generateUniqueId } from './idGenerator';

export interface MetelListinoRow {
  siglaMarchio: string;
  codiceArticolo: string;
  descrizione: string;
  prezzoListino: number;
  unitaMisura: string;
  quantitaConfezione: number;
  famigliaStatistica?: string;
  stato?: string;
  rawLine?: string;
}

export interface MetelBarcodeRow {
  siglaMarchio: string;
  codiceArticolo: string;
  barcodeEan: string;
}

export interface MetelParsedArticle {
  siglaMarchio: string;
  codiceArticolo: string;
  codiceCompleto: string;
  descrizione: string;
  prezzoListino: number;
  prezzoAcquisto: number;
  unitaMisura: string;
  quantitaConfezione: number;
  barcodeEan: string;
  categoria: ArticoloMagazzino['categoria'];
  fornitore: string;
  ubicazioneScaffale: string;
}

/**
 * Pulisce e formatta il prezzo METEL
 * Può essere nel formato:
 * - Con virgola o punto esplicito (es. "14,50" o "14.50")
 * - A lunghezza fissa con 2 o 3 decimali impliciti (es. "0000001450" -> 14.50)
 */
export function parseMetelPrice(raw: string): number {
  if (!raw) return 0;
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  // Se contiene già virgola o punto esplicito
  if (trimmed.includes(',') || trimmed.includes('.')) {
    const cleaned = trimmed.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  }

  // Se è un numero intero puro con zeri iniziali (es. "0000001450")
  const numericOnly = trimmed.replace(/[^0-9]/g, '');
  if (!numericOnly) return 0;

  const intVal = parseInt(numericOnly, 10);
  if (isNaN(intVal)) return 0;

  // Nel tracciato standard Metel il prezzo è espresso in centesimi (diviso 100)
  // Se la stringa ha lunghezza >= 6 e l'intero è grande, dividiamo per 100
  if (numericOnly.length >= 4) {
    return Math.round((intVal / 100) * 100) / 100;
  }

  return intVal;
}

/**
 * Deduce la categoria merceologica interna di VoltMaster basandosi su descrizione e marchio
 */
export function guessMetelCategory(
  descrizione: string,
  siglaMarchio: string
): ArticoloMagazzino['categoria'] {
  const d = descrizione.toLowerCase();
  const m = siglaMarchio.toUpperCase();

  if (
    d.includes('cavo') ||
    d.includes('cordina') ||
    d.includes('fg16') ||
    d.includes('n07v') ||
    d.includes('fror') ||
    d.includes('fs18') ||
    d.includes('matassa') ||
    d.includes('bobina') ||
    d.includes('bus knx') ||
    d.includes('utp') ||
    d.includes('ftp') ||
    d.includes('solare 1x') ||
    m === 'PRY' ||
    m === 'BAL' ||
    m === 'GCA'
  ) {
    return 'cavi_elettrici';
  }

  if (
    d.includes('magnetotermico') ||
    d.includes('differenziale') ||
    d.includes('interruttore') ||
    d.includes('salvavita') ||
    d.includes('btdin') ||
    d.includes('acti9') ||
    d.includes('quadro') ||
    d.includes('centralino') ||
    d.includes('sezionatore') ||
    d.includes('contattore') ||
    d.includes('scaricatore') ||
    d.includes('spd') ||
    d.includes('trasformatore') ||
    d.includes('modulare') ||
    d.includes('morsettiera') ||
    m === 'SCH' ||
    m === 'ABB' ||
    m === 'HAG'
  ) {
    return 'quadri_modulari';
  }

  if (
    d.includes('living') ||
    d.includes('matix') ||
    d.includes('axolute') ||
    d.includes('plana') ||
    d.includes('arké') ||
    d.includes('idea') ||
    d.includes('chorus') ||
    d.includes('presa') ||
    d.includes('pulsante') ||
    d.includes('deviatore') ||
    d.includes('invertitore') ||
    d.includes('placca') ||
    d.includes('supporto') ||
    d.includes('schuko') ||
    d.includes('bipasso') ||
    d.includes('dimmer') ||
    d.includes('cronotermostato') ||
    d.includes('termostato') ||
    m === 'BTI' ||
    m === 'VIM'
  ) {
    return 'apparecchi_comando';
  }

  if (
    d.includes('tubo') ||
    d.includes('corrugato') ||
    d.includes('canale') ||
    d.includes('canalina') ||
    d.includes('passerella') ||
    d.includes('raccordo') ||
    d.includes('curva') ||
    d.includes('guaina') ||
    d.includes('scatola 503') ||
    d.includes('scatola derivazione') ||
    d.includes('cassetta') ||
    m === 'DKC' ||
    m === 'BOC'
  ) {
    return 'tubi_canaline';
  }

  if (
    d.includes('led') ||
    d.includes('plafoniera') ||
    d.includes('faretto') ||
    d.includes('lampada') ||
    d.includes('proiettore') ||
    d.includes('emergenza') ||
    d.includes('pannello led') ||
    d.includes('striscia led') ||
    m === 'BEG' ||
    m === 'DIS' ||
    m === 'FOS' ||
    m === '3F'
  ) {
    return 'illuminazione';
  }

  if (
    d.includes('fotovoltaico') ||
    d.includes('inverter') ||
    d.includes('modulo fv') ||
    d.includes('mc4') ||
    d.includes('batteria') ||
    d.includes('accumulo') ||
    d.includes('colonnina') ||
    d.includes('wallbox') ||
    d.includes('stringa')
  ) {
    return 'fotovoltaico_accumulo';
  }

  return 'materiale_vario';
}

/**
 * Normalizza l'unità di misura METEL
 */
export function normalizeMetelUm(um: string): string {
  const u = (um || '').trim().toUpperCase();
  if (u === 'MT' || u === 'M' || u === 'ML') return 'm';
  if (u === 'PZ' || u === 'NR' || u === 'PC' || u === 'N.') return 'pz';
  if (u === 'CF' || u === 'CONF' || u === 'KT' || u === 'KIT') return 'kit';
  if (u === 'KG') return 'kg';
  if (u === 'BL' || u === 'BOB' || u === 'MAT') return 'bobina';
  if (u === 'BAR' || u === 'BA') return 'barre';
  return u ? u.toLowerCase() : 'pz';
}

/**
 * Parser per il file Listino METEL (tracciato standard a posizione fissa)
 * Posizioni standard Metel:
 * - 0..3 (3 char): Sigla Marchio (es. "BTI")
 * - 3..19 (16 char): Codice Articolo (es. "K4001          ")
 * - 19..64 (45 char): Descrizione Prodotto
 * - 64..75 (11 char): Prezzo Base Listino
 * - 75..84 (9 char): Moltiplicatore Prezzo / Valuta
 * - 84..87 (3 char): Unità di Misura (es. "PZ ")
 * - 87..92 (5 char): Quantità Confezione (es. "00001")
 */
export function parseMetelListinoText(content: string): MetelListinoRow[] {
  if (!content) return [];
  // Pulisce eventuali caratteri di controllo binari da documenti .doc/.rtf
  const cleanContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const lines = cleanContent.split(/\r?\n/);
  const rows: MetelListinoRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) continue;

    // Ignora eventuali righe di intestazione/trailer non standard (es. $$ or // or HEADER)
    if (
      line.startsWith('$$') ||
      line.startsWith('//') ||
      line.startsWith('HEADER') ||
      line.startsWith('TRAILER') ||
      line.startsWith('{\\rtf')
    ) {
      continue;
    }

    // Se la riga è delimitata da punto e virgola o tab o pipe (export CSV alternativo)
    if (line.includes(';') || line.includes('\t') || line.includes('|')) {
      const sep = line.includes(';') ? ';' : line.includes('\t') ? '\t' : '|';
      const parts = line.split(sep).map((p) => p.trim());
      if (parts.length >= 3) {
        const siglaMarchio = parts[0] || 'MET';
        const codiceArticolo = parts[1] || `ART-${i + 1}`;
        const descrizione = parts[2] || 'Articolo Elettrico';
        const prezzoListino = parts[3] ? parseMetelPrice(parts[3]) : 10;
        const unitaMisura = normalizeMetelUm(parts[4] || 'PZ');
        const quantitaConfezione = parseInt(parts[5] || '1', 10) || 1;

        if (codiceArticolo && codiceArticolo.length > 0) {
          rows.push({
            siglaMarchio,
            codiceArticolo,
            descrizione,
            prezzoListino: prezzoListino > 0 ? prezzoListino : 12.5,
            unitaMisura,
            quantitaConfezione,
            rawLine: line,
          });
          continue;
        }
      }
    }

    // Tracciato Metel standard a posizione fissa
    if (line.length >= 10) {
      const siglaMarchio = line.substring(0, 3).trim();
      const codiceArticolo = line.length >= 19 ? line.substring(3, 19).trim() : line.substring(3).trim();
      
      let descrizione = '';
      if (line.length > 64) {
        descrizione = line.substring(19, 64).trim();
      } else if (line.length > 19) {
        descrizione = line.substring(19).trim();
      } else {
        descrizione = `Materiale Elettrico ${siglaMarchio} ${codiceArticolo}`;
      }

      let rawPrezzo = '';
      if (line.length >= 75) {
        rawPrezzo = line.substring(64, 75).trim();
      }
      const parsedPrice = parseMetelPrice(rawPrezzo);
      const prezzoListino = parsedPrice > 0 ? parsedPrice : 14.5;

      let unitaMisura = 'pz';
      if (line.length >= 87) {
        unitaMisura = normalizeMetelUm(line.substring(84, 87));
      }

      let quantitaConfezione = 1;
      if (line.length >= 92) {
        const rawQta = line.substring(87, 92).trim();
        quantitaConfezione = parseInt(rawQta, 10) || 1;
      }

      const famigliaStatistica = line.length >= 95 ? line.substring(92, 95).trim() : undefined;
      const stato = line.length >= 98 ? line.substring(95, 98).trim() : undefined;

      if (siglaMarchio && codiceArticolo) {
        rows.push({
          siglaMarchio,
          codiceArticolo,
          descrizione: descrizione || `Articolo ${siglaMarchio} ${codiceArticolo}`,
          prezzoListino,
          unitaMisura,
          quantitaConfezione,
          famigliaStatistica,
          stato,
          rawLine: line,
        });
      }
    }
  }

  return rows;
}

/**
 * Parser per il file Barcode METEL (tracciato standard a posizione fissa)
 * Posizioni standard Metel Barcode:
 * - 0..3 (3 char): Sigla Marchio (es. "BTI")
 * - 3..19 (16 char): Codice Articolo (es. "K4001          ")
 * - 19..35 (16 char): Codice Barcode EAN-13 / EAN-8 (es. "8012199123456   ")
 */
export function parseMetelBarcodeText(content: string): Map<string, string> {
  if (!content) return new Map();
  const cleanContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const lines = cleanContent.split(/\r?\n/);
  const barcodeMap = new Map<string, string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) continue;
    if (line.startsWith('$$') || line.startsWith('//') || line.startsWith('HEADER')) continue;

    // Se delimitato da punto e virgola o tab
    if (line.includes(';') || line.includes('\t') || line.includes('|')) {
      const sep = line.includes(';') ? ';' : line.includes('\t') ? '\t' : '|';
      const parts = line.split(sep).map((p) => p.trim());
      if (parts.length >= 2) {
        const marchio = parts.length >= 3 ? parts[0] : '';
        const codice = parts.length >= 3 ? parts[1] : parts[0];
        const rawEan = parts.length >= 3 ? parts[2] : parts[1];
        const ean = (rawEan || '').replace(/[^0-9]/g, '');
        if (codice && ean) {
          if (marchio) barcodeMap.set(`${marchio}_${codice}`, ean);
          barcodeMap.set(codice, ean);
        }
        continue;
      }
    }

    // Posizione fissa
    if (line.length >= 10) {
      const siglaMarchio = line.substring(0, 3).trim();
      const codiceArticolo = line.length >= 19 ? line.substring(3, 19).trim() : line.substring(3).trim();
      const rawEan = line.length >= 35 ? line.substring(19, 35).trim() : line.substring(19).trim();
      const barcodeEan = rawEan.replace(/[^0-9]/g, '');

      if (codiceArticolo && barcodeEan) {
        barcodeMap.set(`${siglaMarchio}_${codiceArticolo}`, barcodeEan);
        barcodeMap.set(codiceArticolo, barcodeEan);
      }
    }
  }

  return barcodeMap;
}

/**
 * Estrae e legge i file METEL contenuti in un archivio ZIP
 */
export async function parseMetelZipFile(fileOrBuffer: File | ArrayBuffer | Blob): Promise<{
  listinoText?: string;
  barcodeText?: string;
  listinoFileName?: string;
  barcodeFileName?: string;
}> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(fileOrBuffer);

  let listinoText: string | undefined;
  let barcodeText: string | undefined;
  let listinoFileName: string | undefined;
  let barcodeFileName: string | undefined;

  const fileNames = Object.keys(loadedZip.files);

  for (const fileName of fileNames) {
    const file = loadedZip.files[fileName];
    if (file.dir) continue;

    const lower = fileName.toLowerCase();

    if (
      lower.includes('listino') ||
      lower.startsWith('lis') ||
      (lower.endsWith('.txt') && !lower.includes('barcode') && !lower.includes('ean'))
    ) {
      if (!listinoText) {
        listinoText = await file.async('string');
        listinoFileName = fileName;
      }
    } else if (
      lower.includes('barcode') ||
      lower.includes('ean') ||
      lower.startsWith('bar') ||
      lower.startsWith('eancode')
    ) {
      if (!barcodeText) {
        barcodeText = await file.async('string');
        barcodeFileName = fileName;
      }
    }
  }

  // Se è stato trovato solo un file di testo generico e nessun barcode specifico
  if (!listinoText && fileNames.length > 0) {
    for (const fileName of fileNames) {
      const file = loadedZip.files[fileName];
      if (!file.dir && fileName.endsWith('.txt')) {
        listinoText = await file.async('string');
        listinoFileName = fileName;
        break;
      }
    }
  }

  return {
    listinoText,
    barcodeText,
    listinoFileName,
    barcodeFileName,
  };
}

/**
 * Converte le righe METEL in oggetti completi `ArticoloMagazzino` per VoltMaster
 */
export function convertMetelToArticoliMagazzino(
  listinoRows: MetelListinoRow[],
  barcodeMap: Map<string, string>,
  options?: {
    fornitore?: string;
    scontoAcquistoPercent?: number; // es. 45 -> acquisto al 55% del listino
    giacenzaIniziale?: number;
    scortaMinima?: number;
    prefissoScaffale?: string;
  }
): ArticoloMagazzino[] {
  const fornitore = options?.fornitore || 'RemaTarlazzi';
  const scontoPercent = options?.scontoAcquistoPercent !== undefined ? options.scontoAcquistoPercent : 45;
  const multiplierAcquisto = Math.max(0.1, (100 - scontoPercent) / 100);
  const giacenzaDefault = options?.giacenzaIniziale !== undefined ? options.giacenzaIniziale : 20;
  const scortaMinDefault = options?.scortaMinima !== undefined ? options.scortaMinima : 5;
  const prefissoScaffale = options?.prefissoScaffale || 'Corsia RemaTarlazzi - Ripiano METEL';

  return listinoRows.map((row, index) => {
    const eanKeyWithBrand = `${row.siglaMarchio}_${row.codiceArticolo}`;
    const barcodeEan = barcodeMap.get(eanKeyWithBrand) || barcodeMap.get(row.codiceArticolo) || '';

    const codiceSku = row.siglaMarchio
      ? `${row.siglaMarchio}-${row.codiceArticolo}`
      : row.codiceArticolo;

    const prezzoListino = row.prezzoListino > 0 ? row.prezzoListino : 12.5;
    const prezzoAcquisto = Math.round(prezzoListino * multiplierAcquisto * 100) / 100;
    const categoria = guessMetelCategory(row.descrizione, row.siglaMarchio);

    // QR / Barcode scansionabile
    const qrCode = barcodeEan ? barcodeEan : `METEL-${row.siglaMarchio}-${row.codiceArticolo}`;

    return {
      id: generateUniqueId(`metel-${row.siglaMarchio || 'art'}`),
      codiceSku,
      nome: row.descrizione,
      categoria,
      giacenza: giacenzaDefault,
      scortaMinima: scortaMinDefault,
      unitaMisura: row.unitaMisura || 'pz',
      prezzoUnitarioAcquisto: prezzoAcquisto,
      prezzoListinoVendita: prezzoListino,
      ubicazioneScaffale: `${prefissoScaffale} (Settore ${row.siglaMarchio || 'GEN'})`,
      fornitore,
      qrCode,
      siglaMarchio: row.siglaMarchio,
      barcodeEan: barcodeEan || undefined,
      quantitaConfezione: row.quantitaConfezione,
    };
  });
}

/**
 * Dataset dimostrativo METEL RemaTarlazzi per test e anteprima immediata
 */
export const SAMPLE_METEL_REMATARLAZZI_DATA: {
  listinoText: string;
  barcodeText: string;
} = {
  listinoText: [
    'BTIK4001          LIVING NOW - INTERRUTTORE 1P 10AX 250V AC 1M 0000000890000000001PZ 00001   D',
    'BTIK4003          LIVING NOW - DEVIATORE 1P 10AX 250V AC 1M    0000000980000000001PZ 00001   D',
    'BTIK4004          LIVING NOW - INVERTITORE 1P 10AX 250V AC 1M  0000001420000000001PZ 00001   D',
    'BTIK4005          LIVING NOW - PULSANTE 1P NO 10A 250V AC 1M   0000001050000000001PZ 00001   D',
    'BTIK4141A         LIVING NOW - PRESA BIPASSO 2P+T 10/16A 1M    0000001120000000001PZ 00001   D',
    'BTIK4142          LIVING NOW - PRESA SCHUKO BIPASSO 2P+T 16A 2M0000001850000000001PZ 00001   D',
    'BTIK4703          LIVING NOW - SUPPORTO 3 MODULI PER SCATOLA 500000000340000000001PZ 00001   D',
    'BTIK4704          LIVING NOW - SUPPORTO 4 MODULI PER SCATOLA 500000000420000000001PZ 00001   D',
    'BTIKA4803MW       LIVING NOW - PLACCA 3 MODULI BIANCO SABBIA   0000001590000000001PZ 00001   D',
    'SCHA9F74116       ACTI9 IC60N - INTERRUTTORE MAGNETOTERMICO 1P+0000003850000000001PZ 00001   D',
    'SCHA9F74125       ACTI9 IC60N - INTERRUTTORE MAGNETOTERMICO 1P+0000004200000000001PZ 00001   D',
    'SCHA9F74463       ACTI9 IC60N - INTERRUTTORE MAGNETOTERMICO 4P 0000011500000000001PZ 00001   D',
    'SCHA9R11225       ACTI9 IID - DIFFERENZIALE PURO 2P 25A 30MA AC0000005400000000001PZ 00001   D',
    'SCHA9R11440       ACTI9 IID - DIFFERENZIALE PURO 4P 40A 30MA A 0000009800000000001PZ 00001   D',
    'SCHA9L16617       ACTI9 IPD - SCARICATORE DI SOVRATENSIONE SPD 0000014200000000001PZ 00001   D',
    'VIM14001          PLANA - INTERRUTTORE 1P 16AX BIANCO 1 MODULO 0000000620000000001PZ 00001   D',
    'VIM14003          PLANA - DEVIATORE 1P 16AX BIANCO 1 MODULO    0000000710000000001PZ 00001   D',
    'VIM14203          PLANA - PRESA 2P+T 16A BIPASSO BIANCO 1M     0000000780000000001PZ 00001   D',
    'VIM14210          PLANA - PRESA UNIVERSALE SICURY 2P+T 16A BIAN0000001450000000001PZ 00001   D',
    'VIM14613.01       PLANA - PLACCA 3 MODULI TECNOPOLIMERO BIANCO 0000000480000000001PZ 00001   D',
    'PRYFG16-3G2.5     CAVO FG16OR16 3G2.5 MMQ CPR Cca BOBINA 100M  0000000210000000001MT 00100   D',
    'PRYFG16-5G6       CAVO FG16OR16 5G6 MMQ CPR Cca A METRAGGIO   0000000580000000001MT 00050   D',
    'PRYFG16-4G16      CAVO FG16OR16 4G16 MMQ CPR Cca BT INDUSTRIALE0000001420000000001MT 00001   D',
    'PRYN07VK-BLU1.5   CORDINA UNIPOLARE N07V-K 1.5 MMQ BLU MATASSA 0000000048000000001MT 00100   D',
    'PRYN07VK-NR1.5    CORDINA UNIPOLARE N07V-K 1.5 MMQ NERO MATASSA0000000048000000001MT 00100   D',
    'PRYN07VK-GV2.5    CORDINA UNIPOLARE N07V-K 2.5 MMQ GIALLO/VERDE0000000076000000001MT 00100   D',
    'BEG1499           EMERGENZA LED IP65 24W AUTONOMIA 1H / 3H SE  0000004800000000001PZ 00001   D',
    'BEG8584           STILE IN LED PLAFONIERA EMERGENZA DA INCASSO 0000003600000000001PZ 00001   D',
    'DIS41434000       RODI LED - PROIETTORE INDUSTRIALE 150W 4000K 0000018900000000001PZ 00001   D',
    'DIS22081510       ECHO LED - PLAFONIERA STAGNA 2X58W LED 1500MM0000005200000000001PZ 00001   D',
    'ABBDS201C16AC30   INTERRUTTORE MAGNETOTERMICO DIFF DS201 1P+N 10000004450000000001PZ 00001   D',
    'ABBS203C32        INTERRUTTORE MAGNETOTERMICO S203 3P 32A 6KA  0000006200000000001PZ 00001   D',
    'GEWGW40004        QUADRO CENTRALINO DA INCASSO 12 MODULI IP40  0000002150000000001PZ 00001   D',
    'GEWGW40007        QUADRO CENTRALINO DA INCASSO 36 MODULI 3 FILE0000005800000000001PZ 00001   D',
    'DKC3500200        CANALE METALLICO ASOLATO ZINCATO 200X50 L=3M 0000001680000000001BA 00003   D',
  ].join('\n'),
  barcodeText: [
    'BTIK4001          8012199981012   1',
    'BTIK4003          8012199981036   1',
    'BTIK4004          8012199981043   1',
    'BTIK4005          8012199981050   1',
    'BTIK4141A         8012199981418   1',
    'BTIK4142          8012199981425   1',
    'BTIK4703          8012199984702   1',
    'BTIK4704          8012199984719   1',
    'BTIKA4803MW       8012199984801   1',
    'SCHA9F74116       3606480439818   1',
    'SCHA9F74125       3606480439825   1',
    'SCHA9F74463       3606480440128   1',
    'SCHA9R11225       3606480442016   1',
    'SCHA9R11440       3606480442054   1',
    'SCHA9L16617       3606480445673   1',
    'VIM14001          8007352136014   1',
    'VIM14003          8007352136038   1',
    'VIM14203          8007352136205   1',
    'VIM14210          8007352136212   1',
    'VIM14613.01       8007352136618   1',
    'PRYFG16-3G2.5     8019282012015   1',
    'PRYFG16-5G6       8019282012053   1',
    'PRYFG16-4G16      8019282012169   1',
    'PRYN07VK-BLU1.5   8019282013012   1',
    'PRYN07VK-NR1.5    8019282013029   1',
    'PRYN07VK-GV2.5    8019282013036   1',
    'BEG1499           8002219501499   1',
    'BEG8584           8002219508580   1',
    'DIS41434000       8012952143400   1',
    'DIS22081510       8012952208154   1',
    'ABBDS201C16AC30   8012542042129   1',
    'ABBS203C32        8012542032120   1',
    'GEWGW40004        8011564400048   1',
    'GEWGW40007        8011564400079   1',
    'DKC3500200        8051418350024   1',
  ].join('\n'),
};
