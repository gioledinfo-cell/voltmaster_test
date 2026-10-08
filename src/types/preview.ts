export type SupportedFileType =
  | 'image'
  | 'pdf'
  | 'spreadsheet' // xlsx, xls, csv
  | 'document'    // docx, doc
  | 'presentation'// pptx, ppt
  | 'text'        // txt, log, json, xml
  | 'video'       // mp4, webm
  | 'audio'       // mp3, wav
  | 'unknown';

export interface PreviewableFile {
  id: string;
  nome: string;
  tipo: string; // estensione es. 'jpg', 'pdf', 'xlsx', 'docx', 'mp4' o MIME type
  dimensioneKb: number;
  url: string; // URL temporaneo, blob URL o simulated signed URL
  thumbnailUrl?: string;
  dataCaricamento: string;
  autore: string;
  permessi?: string[]; // ruoli abilitati es. ['amministratore', 'responsabile', 'operatore', 'cliente']
  categoria?: 'sicurezza' | 'permessi' | 'certificazioni' | 'contratti' | 'foto' | 'ddt' | 'preventivo' | 'altro';
  cantiereId?: string;
  cantiereNome?: string;
  isSensibile?: boolean;
  watermarkText?: string;
  rawFile?: File;
  isRealFile?: boolean;
  // Dati strutturati opzionali per simulazione interattiva realistica
  contentData?: {
    // Per PDF: numero pagine, testo delle pagine
    pdfPages?: { pageNumber: number; title: string; content: string[] }[];
    totalPdfPages?: number;
    // Per Spreadsheet XLSX: schede e griglia celle
    sheetData?: {
      sheetName: string;
      headers: string[];
      rows: (string | number)[][];
      totalRows?: number;
      totalCols?: number;
    }[];
    // Per Documenti Word DOCX: paragrafi e sezioni
    docxData?: {
      title: string;
      sections: { heading: string; paragraphs: string[] }[];
    };
    // Per File di Testo / Log / JSON
    textContent?: string;
    // Per Audio/Video
    durationSeconds?: number;
  };
}

export function detectFileType(extensionOrMime: string, filename?: string): SupportedFileType {
  const ext = (filename ? filename.split('.').pop() : extensionOrMime) || '';
  const clean = ext.toLowerCase().replace('.', '').trim();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'image/jpeg', 'image/png', 'image/webp'].includes(clean)) {
    return 'image';
  }
  if (['pdf', 'application/pdf'].includes(clean)) {
    return 'pdf';
  }
  if (['xlsx', 'xls', 'csv'].includes(clean)) {
    return 'spreadsheet';
  }
  if (['docx', 'doc'].includes(clean)) {
    return 'document';
  }
  if (['pptx', 'ppt'].includes(clean)) {
    return 'presentation';
  }
  if (['txt', 'log', 'json', 'xml'].includes(clean)) {
    return 'text';
  }
  if (['mp4', 'webm', 'mov'].includes(clean)) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(clean)) {
    return 'audio';
  }
  return 'unknown';
}

export function formatFileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  const mb = (kb / 1024).toFixed(1);
  return `${mb} MB`;
}
