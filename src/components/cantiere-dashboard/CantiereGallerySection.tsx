import React, { useState } from 'react';
import {
  Camera,
  UploadCloud,
  Plus,
  Eye,
  Calendar,
  Layers,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { CantiereFotoAllegato } from '../../types/cantiereDashboard';
import { useFilePreview } from '../../context/FilePreviewContext';
import { PreviewableFile } from '../../types/preview';
import { compressImageFile, CompressionResult } from '../../utils/imageCompressor';
import {
  uploadFileToStorage,
  resolveStorageUrlSync,
} from '../../services/cloudStorageService';

interface CantiereGallerySectionProps {
  foto: CantiereFotoAllegato[];
  onUploadFoto?: (nuovaFoto: Omit<CantiereFotoAllegato, 'id'>) => void;
}

export const CantiereGallerySection: React.FC<CantiereGallerySectionProps> = ({
  foto,
  onUploadFoto,
}) => {
  const { openPreview } = useFilePreview();
  const [selectedPhoto, setSelectedPhoto] = useState<CantiereFotoAllegato | null>(null);
  const [selectedFase, setSelectedFase] = useState<string>('tutte');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form State
  const [titolo, setTitolo] = useState('');
  const [faseLavoro, setFaseLavoro] = useState('Posa Canaline & Tubazioni');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMetrics, setCompressionMetrics] = useState<CompressionResult | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await compressImageFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.82,
        format: 'image/webp',
      });
      // Salva nel Cloud Storage / Blob Store per evitare saturazione di memoria
      const stored = await uploadFileToStorage(result.blob, {
        folder: 'cantiere_gallery',
        fileName: file.name,
        mimeType: result.mimeType,
      });
      setCompressionMetrics(result);
      setPhotoDataUrl(stored.storageUri || stored.url);
      if (!titolo) {
        setTitolo(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error('Failed compressing image file:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim()) return;

    const sizeKb = compressionMetrics
      ? Math.round(compressionMetrics.compressedSize / 1024)
      : 280;

    if (onUploadFoto) {
      onUploadFoto({
        titolo: titolo.trim(),
        faseLavoro,
        url: photoDataUrl,
        data: new Date().toISOString().split('T')[0],
        caricatoDa: 'Capocantiere (Mobile)',
        dimensioneKb: sizeKb,
        isOggi: true,
      });
    }

    setTitolo('');
    setCompressionMetrics(null);
    setIsUploadOpen(false);
  };

  const fasiDisponibili = Array.from(new Set(foto.map((f) => f.faseLavoro)));

  const filtered = foto.filter((f) => {
    return selectedFase === 'tutte' || f.faseLavoro === selectedFase;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Foto & Allegati Visivi di Cantiere</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {foto.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracciamento fotografico SAL per committenti, stato avanzamento cablaggi e documentazione posa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase Filter */}
          <select
            value={selectedFase}
            onChange={(e) => setSelectedFase(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="tutte">Tutte le Fasi ({foto.length})</option>
            {fasiDisponibili.map((fase) => (
              <option key={fase} value={fase}>
                {fase}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors shadow-sm text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Carica Foto</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            Nessuna foto trovata per la fase selezionata.
          </div>
        ) : (
          filtered.map((item) => {
            const resolvedPhotoUrl = resolveStorageUrlSync(item.url);
            const previewFile: PreviewableFile = {
              id: item.id,
              nome: `${item.titolo}.jpg`,
              tipo: 'jpg',
              dimensioneKb: item.dimensioneKb || 1800,
              url: resolvedPhotoUrl,
              thumbnailUrl: resolvedPhotoUrl,
              dataCaricamento: item.data,
              autore: item.caricatoDa,
              categoria: 'foto',
            };

            const allPreviewFiles: PreviewableFile[] = filtered.map((f) => {
              const resUrl = resolveStorageUrlSync(f.url);
              return {
                id: f.id,
                nome: `${f.titolo}.jpg`,
                tipo: 'jpg',
                dimensioneKb: f.dimensioneKb || 1800,
                url: resUrl,
                thumbnailUrl: resUrl,
                dataCaricamento: f.data,
                autore: f.caricatoDa,
                categoria: 'foto',
              };
            });

            return (
              <div
                key={item.id}
                onClick={() => openPreview(previewFile, allPreviewFiles)}
                className="group relative rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm dark:shadow-md flex flex-col"
              >
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <img
                    src={resolvedPhotoUrl}
                    alt={item.titolo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Anteprima Fullscreen</span>
                    </span>
                  </div>

                  {item.isOggi && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500 text-slate-950 uppercase font-mono">
                      Oggi
                    </span>
                  )}
                </div>

                <div className="p-2.5 space-y-1">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-200 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    {item.titolo}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[120px]">{item.faseLavoro}</span>
                    <span className="font-mono">{item.data}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Quick Upload */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Caricamento Rapido Foto Cantiere</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggiungi documentazione visiva per il committente o verifica interna del montaggio.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Titolo / Didascalia Foto</label>
                <input
                  type="text"
                  placeholder="es. Cablaggio quadro secondario piano 1 terminato"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Fase Lavorativa Correlata</label>
                <select
                  value={faseLavoro}
                  onChange={(e) => setFaseLavoro(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                >
                  <option value="Posa Canaline & Tubazioni">Posa Canaline & Tubazioni</option>
                  <option value="Infilaggio Cavi & Dorsali">Infilaggio Cavi & Dorsali</option>
                  <option value="Montaggio & Cablaggio Quadri">Montaggio & Cablaggio Quadri</option>
                  <option value="Installazione Fotovoltaico & Stringhe">Installazione Fotovoltaico & Stringhe</option>
                  <option value="Collaudo & Prove Strumentali CEI 64-8">Collaudo & Prove Strumentali CEI 64-8</option>
                </select>
              </div>

              {/* Image Picker and Automatic Compression Zone */}
              <div className="p-4 border-2 border-dashed border-cyan-500/30 dark:border-cyan-500/20 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/30 text-center space-y-2 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <ImageIcon className="w-8 h-8 text-cyan-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isCompressing ? 'Compressione WebP HD in corso...' : 'Scatta foto o Seleziona File'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Miglioramento fotocamera cantiere: riduce automaticamente da 12MP-48MP a WebP &lt; 350KB.
                </div>

                {compressionMetrics && (
                  <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-left text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Compressione Ottimizzata con Successo!</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Originale: {Math.round(compressionMetrics.originalSize / 1024)} KB</span>
                      <span>➔ Compresso: {Math.round(compressionMetrics.compressedSize / 1024)} KB</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        (-{compressionMetrics.reductionPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
                >
                  Carica Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Photo Fullscreen Preview */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.titolo}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedPhoto.titolo}</h3>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Fase: <strong className="text-slate-800 dark:text-slate-200">{selectedPhoto.faseLavoro}</strong> · Caricata da: {selectedPhoto.caricatoDa}
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <span>Data: {selectedPhoto.data}</span>
                <span>{selectedPhoto.dimensioneKb} KB</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
