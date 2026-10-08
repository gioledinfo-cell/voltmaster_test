/**
 * Utilità di compressione e ridimensionamento immagini via HTML5 Canvas
 * Progetto: VoltMaster - Gestionale Impianti Elettrici
 *
 * Ottimizzato per foto scattate in cantiere dagli operatori (fotocamere smartphone da 12MP - 48MP):
 * - Ridimensionamento automatico a massimo 1600px di larghezza preservando l'aspect ratio
 * - Compressione JPEG con qualità predefinita 0.75
 * - Generazione di Blob leggero e stringa base64 (Data URL)
 * - Gestione corretta della memoria con rilascio automatico degli ObjectURL
 */

export interface CompressionOptions {
  /** Larghezza massima in pixel (default: 1600px) */
  maxWidth?: number;
  /** Altezza massima in pixel opzionale (se non specificata, calcolata proporzionalmente) */
  maxHeight?: number;
  /** Qualità di compressione tra 0.0 e 1.0 (default: 0.75) */
  quality?: number;
  /** Formato di output (default: 'image/jpeg') */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
  /** Se vero, riempie lo sfondo con bianco prima del disegno (essenziale per JPEG da PNG trasparenti) */
  fillBackground?: boolean;
}

export type ImageCompressionOptions = CompressionOptions;

export interface CompressionResult {
  /** Oggetto File pronto per upload a server / storage */
  file: File;
  /** Oggetto Blob compresso leggero */
  blob: Blob;
  /** Stringa Data URL / Base64 per anteprima immediata o salvataggio inline */
  dataUrl: string;
  /** Alias di dataUrl */
  base64: string;
  /** Dimensione originaria del file in byte */
  originalSize: number;
  /** Dimensione compressa in byte */
  compressedSize: number;
  /** Percentuale di riduzione della dimensione (0 - 100%) */
  reductionPercentage: number;
  /** Dimensioni finali e originali dell'immagine */
  dimensions: {
    width: number;
    height: number;
    originalWidth?: number;
    originalHeight?: number;
  };
  /** Nome del file generato */
  fileName: string;
  /** MIME type del file compresso */
  mimeType: string;
}

export type ImageCompressionResult = CompressionResult;

/**
 * Calcola le dimensioni target mantenendo il rapporto d'aspetto (aspect ratio) originale.
 * Limita la larghezza al valore specificato (default 1600px) e l'altezza se specificata.
 */
export const calculateTargetDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 1600,
  maxHeight?: number
): { width: number; height: number } => {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: maxWidth, height: maxWidth };
  }

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  // Se è specificata un'altezza massima, usa il fattore di scala restrittivo tra larghezza e altezza
  if (maxHeight && maxHeight > 0) {
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }
  } else {
    // Vincolo primario: massimo maxWidth (1600px) di larghezza
    if (targetWidth > maxWidth) {
      const ratio = maxWidth / targetWidth;
      targetWidth = maxWidth;
      targetHeight = Math.round(targetHeight * ratio);
    }
  }

  return {
    width: Math.max(1, targetWidth),
    height: Math.max(1, targetHeight),
  };
};

/**
 * Formatta i byte in una stringa leggibile (es. "1.25 MB", "340 KB")
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Funzione principale: Comprime e ridimensiona un file o blob immagine usando HTML5 Canvas.
 * Parametri di default conformi alle specifiche di cantiere:
 * - maxWidth: 1600px
 * - quality: 0.75
 * - format: 'image/jpeg'
 */
export const compressImage = async (
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 1600,
    maxHeight,
    quality = 0.75,
    format = 'image/jpeg',
    fillBackground = true,
  } = options;

  // Se non è un'immagine valida, restituisce errore controllato
  if (fileOrBlob.type && !fileOrBlob.type.startsWith('image/')) {
    throw new Error(`Il file fornito non è un'immagine supportata (tipo: ${fileOrBlob.type || 'sconosciuto'}).`);
  }

  const originalSize = fileOrBlob.size;
  const originalFileName = fileOrBlob instanceof File ? fileOrBlob.name : 'foto_cantiere.jpg';

  return new Promise((resolve, reject) => {
    // Utilizziamo un ObjectURL per il caricamento ad alte prestazioni senza duplicare RAM per foto pesanti
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Impossibile decodificare l\'immagine sorgente. Il file potrebbe essere danneggiato o non supportato dal browser.'));
    };

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        // Calcolo dimensioni target (massimo 1600px di larghezza proporzionale)
        const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
          originalWidth,
          originalHeight,
          maxWidth,
          maxHeight
        );

        // Creazione del Canvas HTML5
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
        if (!ctx) {
          cleanup();
          reject(new Error('Inizializzazione del contesto Canvas 2D fallita nel browser.'));
          return;
        }

        // Impostazione algoritmo di ricampionamento ad alta qualità
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Se JPEG e richiesto sfondo, colora il fondo di bianco per gestire trasparenze
        if ((format === 'image/jpeg' || fillBackground) && format !== 'image/png') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Rendering dell'immagine ridimensionata sul canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Estrazione base64 / Data URL
        const dataUrl = canvas.toDataURL(format, quality);

        // Conversione in Blob compresso leggero
        canvas.toBlob(
          (blob) => {
            cleanup();

            if (!blob) {
              reject(new Error('Errore durante la generazione del Blob compresso da Canvas.'));
              return;
            }

            // Calcolo estensione e nome file appropriati
            const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
            const baseName = originalFileName.replace(/\.[^/.]+$/, '') || 'foto_cantiere';
            const compressedFileName = `${baseName}_1600.${ext}`;

            // Creazione dell'istanza File standard
            const compressedFile = new File([blob], compressedFileName, {
              type: format,
              lastModified: Date.now(),
            });

            const compressedSize = blob.size;
            const reduction = originalSize > 0
              ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
              : 0;

            resolve({
              file: compressedFile,
              blob,
              dataUrl,
              base64: dataUrl,
              originalSize,
              compressedSize,
              reductionPercentage: reduction,
              dimensions: {
                width: targetWidth,
                height: targetHeight,
                originalWidth,
                originalHeight,
              },
              fileName: compressedFileName,
              mimeType: format,
            });
          },
          format,
          quality
        );
      } catch (drawErr) {
        cleanup();
        reject(drawErr instanceof Error ? drawErr : new Error('Errore imprevisto durante l\'elaborazione su Canvas.'));
      }
    };

    img.src = objectUrl;
  });
};

/**
 * Alias retrocompatibile con il resto del codebase di VoltMaster.
 * Mantiene la firma compatibile con le chiamate esistenti.
 */
export const compressImageFile = async (
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> => {
  return compressImage(file, options);
};

/**
 * Utilità rapida: converte direttamente un File o Blob in stringa Base64 compressa
 */
export const compressImageToBase64 = async (
  fileOrBlob: File | Blob,
  options?: CompressionOptions
): Promise<string> => {
  const result = await compressImage(fileOrBlob, options);
  return result.dataUrl;
};

/**
 * Utilità rapida: converte direttamente un File o Blob in un Blob compresso leggero
 */
export const compressImageToBlob = async (
  fileOrBlob: File | Blob,
  options?: CompressionOptions
): Promise<Blob> => {
  const result = await compressImage(fileOrBlob, options);
  return result.blob;
};

export interface DualCompressionResult {
  full: CompressionResult;
  thumbnail: CompressionResult;
  stats: {
    originalFormatted: string;
    compressedFormatted: string;
    savedFormatted: string;
    reductionPercentage: number;
  };
}

/**
 * Comprime l'immagine ad alta risoluzione (max 1600px) e genera contestualmente
 * un thumbnail ultraleggero (~200px) per caricamenti fulminei nei lightbox e gallerie di cantiere.
 */
export const compressImageWithThumbnail = async (
  file: File,
  options?: {
    fullOptions?: CompressionOptions;
    thumbOptions?: CompressionOptions;
  }
): Promise<DualCompressionResult> => {
  const full = await compressImage(file, {
    maxWidth: 1600,
    quality: 0.76,
    format: 'image/jpeg',
    ...options?.fullOptions,
  });

  const thumbnail = await compressImage(file, {
    maxWidth: 240,
    maxHeight: 240,
    quality: 0.65,
    format: 'image/jpeg',
    ...options?.thumbOptions,
  });

  const savedBytes = Math.max(0, full.originalSize - full.compressedSize);

  return {
    full,
    thumbnail,
    stats: {
      originalFormatted: formatFileSize(full.originalSize),
      compressedFormatted: formatFileSize(full.compressedSize),
      savedFormatted: formatFileSize(savedBytes),
      reductionPercentage: full.reductionPercentage,
    },
  };
};

/**
 * Comprime una lista di file contemporaneamente con tracciamento avanzamento
 */
export const compressMultipleImages = async (
  files: File[],
  options?: CompressionOptions,
  onProgress?: (processed: number, total: number) => void
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    try {
      const res = await compressImage(file, options);
      results.push(res);
    } catch (err) {
      console.warn(`Impossibile comprimere il file ${file.name}:`, err);
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
};

