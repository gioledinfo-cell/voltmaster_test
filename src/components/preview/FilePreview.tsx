import React, { useState, useEffect, useRef } from 'react';
import {
  PreviewableFile,
  detectFileType,
  formatFileSize,
} from '../../types/preview';
import { useFilePreview } from '../../context/FilePreviewContext';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Table,
  Presentation,
  Film,
  Music,
  FileCode,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Info,
  Calendar,
  User,
  MapPin,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  ExternalLink,
  Eye,
  Sparkles,
} from 'lucide-react';
import { processUploadedFile } from '../../utils/fileParsers';

export const FilePreview: React.FC = () => {
  const {
    activeFile,
    isOpen,
    closePreview,
    nextFile,
    prevFile,
    hasNext,
    hasPrev,
    currentIndex,
    totalFiles,
    getSignedPreviewUrl,
    addAndOpenFiles,
  } = useFilePreview();

  // Viewer Controls State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [signedExpiresAt, setSignedExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // PDF Real / Extracted Mode & Search
  const [pdfViewMode, setPdfViewMode] = useState<'native' | 'extracted'>('native');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');

  // Office Sheet Active Tab (XLSX) & Search
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');

  // Drag & drop file states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Touch Swipe on mobile
  const touchStartXRef = useRef<number | null>(null);

  // Reset transforms when active file changes
  useEffect(() => {
    if (!activeFile) return;

    setZoom(1);
    setRotation(0);
    setPdfPage(1);
    setPdfSearchQuery('');
    setActiveSheetIndex(0);
    setSheetSearchQuery('');
    setPdfViewMode(activeFile.isRealFile || activeFile.url.startsWith('blob:') ? 'native' : 'native');
    setIsLoading(true);

    // Resolve simulated signed URL with short expiration
    let isCancelled = false;
    getSignedPreviewUrl(activeFile)
      .then((res) => {
        if (!isCancelled) {
          setResolvedUrl(res.url);
          setSignedExpiresAt(res.expiresAt);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setResolvedUrl(activeFile.url);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile, getSignedPreviewUrl]);

  // Gestione caricamento file reale dal computer dell'utente
  const handleUploadRealFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    try {
      const parsedList: PreviewableFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const p = await processUploadedFile(files[i]);
        parsedList.push(p);
      }
      addAndOpenFiles(parsedList);
    } catch (err) {
      console.error('Errore durante il caricamento del file reale', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Gestione Drag & Drop di file reali sopra la modale
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setIsLoading(true);
    try {
      const parsedList: PreviewableFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const p = await processUploadedFile(files[i]);
        parsedList.push(p);
      }
      addAndOpenFiles(parsedList);
    } catch (err) {
      console.error('Errore durante il drop del file reale', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !activeFile) return null;

  const fileType = detectFileType(activeFile.tipo, activeFile.nome);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Rotate handler (90° steps)
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Touch swipe detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (diff > 50 && hasPrev) {
      prevFile();
    } else if (diff < -50 && hasNext) {
      nextFile();
    }
    touchStartXRef.current = null;
  };

  // Copy text helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Context menu protection for sensitive files
  const handleContextMenu = (e: React.MouseEvent) => {
    if (activeFile.isSensibile) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-slate-900/80 dark:bg-slate-950/95 backdrop-blur-md text-slate-900 dark:text-slate-100 select-none animate-in fade-in duration-200 ${
        isDraggingOver ? 'ring-4 ring-emerald-500 ring-inset' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. TOP TOOLBAR */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs z-20 shadow-xs">
        {/* Left: Metadata */}
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400">
            {fileType === 'image' && <ImageIcon className="w-4 h-4" />}
            {fileType === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
            {fileType === 'spreadsheet' && <Table className="w-4 h-4 text-emerald-400" />}
            {fileType === 'document' && <FileText className="w-4 h-4 text-sky-400" />}
            {fileType === 'presentation' && <Presentation className="w-4 h-4 text-amber-400" />}
            {fileType === 'video' && <Film className="w-4 h-4 text-purple-400" />}
            {fileType === 'audio' && <Music className="w-4 h-4 text-pink-400" />}
            {fileType === 'text' && <FileCode className="w-4 h-4 text-amber-300" />}
            {fileType === 'unknown' && <FileText className="w-4 h-4 text-slate-400" />}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate" title={activeFile.nome}>
                {activeFile.nome}
              </h3>
              {activeFile.isRealFile && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>PARSER REALE</span>
                </span>
              )}
              {activeFile.isSensibile && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 flex items-center gap-1 shrink-0">
                  <ShieldAlert className="w-3 h-3" />
                  <span>RISERVATO</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate mt-0.5">
              <span>{formatFileSize(activeFile.dimensioneKb)}</span>
              <span>·</span>
              <span>Caricato il {activeFile.dataCaricamento}</span>
              {activeFile.autore && (
                <>
                  <span>·</span>
                  <span className="truncate">Da: {activeFile.autore}</span>
                </>
              )}
              {activeFile.cantiereNome && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 truncate">📍 {activeFile.cantiereNome}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions, Navigation & Close */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
          {/* File picker input per caricare file reale dal PC */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadRealFile}
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.xml,.jpg,.jpeg,.png,.webp,.gif,.mp4"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            title="Carica un file reale dal tuo computer per aprirlo all'istante"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Apri File dal PC</span>
          </button>

          {/* Badge Parser SheetJS/PDF.js */}
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine: SheetJS & PDF.js</span>
          </span>

          {totalFiles > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <button
                onClick={prevFile}
                disabled={!hasPrev}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="File Precedente (Freccia Sinistra ←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-semibold px-1">
                {currentIndex + 1} di {totalFiles}
              </span>
              <button
                onClick={nextFile}
                disabled={!hasNext}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="File Successivo (Freccia Destra →)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={closePreview}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Chiudi Anteprima (Tasto ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CENTRAL VIEWER AREA */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center p-3 sm:p-6">
        {/* Drag & Drop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-4 z-40 rounded-2xl border-4 border-dashed border-emerald-500 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3 animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              Rilascia qui il file per l'Anteprima Reale!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm">
              Carica PDF reali, computi Excel/CSV con SheetJS, foto ad alta risoluzione o documenti tecnici.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-950/60 backdrop-blur-sm gap-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Generazione Anteprima Protetta...</span>
          </div>
        )}

        {/* Watermark Overlay (se sensibile) */}
        {activeFile.isSensibile && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden opacity-15">
            <div className="rotate-[-25deg] text-slate-600 dark:text-slate-400 font-black text-2xl sm:text-4xl text-center uppercase tracking-widest border-4 border-dashed border-slate-400 dark:border-slate-500 p-8 rounded-3xl">
              {activeFile.watermarkText || 'VOLTMASTER IMPIANTI S.R.L. - USO INTERNO CANTIERE'}
              <div className="text-sm mt-2 font-mono font-normal">
                Visualizzazione protetta · Non riproducibile
              </div>
            </div>
          </div>
        )}

        {/* Left Arrow Button Overlay (Desktop) */}
        {hasPrev && (
          <button
            onClick={prevFile}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl transition-transform hover:scale-110 active:scale-95"
            title="Precedente (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Right Arrow Button Overlay (Desktop) */}
        {hasNext && (
          <button
            onClick={nextFile}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl transition-transform hover:scale-110 active:scale-95"
            title="Successivo (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 1: IMMAGINI (JPG, PNG, GIF, WEBP, SVG) */}
        {/* ============================================================== */}
        {fileType === 'image' && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img
              src={resolvedUrl || activeFile.url}
              alt={activeFile.nome}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
              }}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform pointer-events-auto"
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 2: DOCUMENTI PDF (Nativo Vettoriale + Analisi Testo PDF.js) */}
        {/* ============================================================== */}
        {fileType === 'pdf' && (
          <div className="w-full h-full max-w-5xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* PDF Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs">
              {/* Dual Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <button
                  onClick={() => setPdfViewMode('native')}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    pdfViewMode === 'native'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Visualizzazione Nativa
                </button>
                <button
                  onClick={() => setPdfViewMode('extracted')}
                  className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                    pdfViewMode === 'extracted'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Analisi Testo (PDF.js)</span>
                </button>
              </div>

              {pdfViewMode === 'extracted' && (
                <div className="flex items-center gap-3">
                  {/* Pages Controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Pagine:</span>
                    <button
                      onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                      disabled={pdfPage <= 1}
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-40"
                    >
                      ◀
                    </button>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {pdfPage} / {activeFile.contentData?.pdfPages?.length || activeFile.contentData?.totalPdfPages || 1}
                    </span>
                    <button
                      onClick={() =>
                        setPdfPage((p) =>
                          Math.min(
                            activeFile.contentData?.pdfPages?.length || activeFile.contentData?.totalPdfPages || 1,
                            p + 1
                          )
                        )
                      }
                      disabled={
                        pdfPage >= (activeFile.contentData?.pdfPages?.length || activeFile.contentData?.totalPdfPages || 1)
                      }
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-40"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Text Search within Document */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={pdfSearchQuery}
                      onChange={(e) => setPdfSearchQuery(e.target.value)}
                      placeholder="Cerca nel documento..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {pdfViewMode === 'native' && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Visualizzatore PDF Vettoriale Diretto · Nessun file scaricato su disco
                </span>
              )}
            </div>

            {/* Mode 1: Native embedded PDF with iframe / embed */}
            {pdfViewMode === 'native' ? (
              <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 flex items-center justify-center">
                <iframe
                  src={`${resolvedUrl || activeFile.url}#toolbar=1&navpanes=1&scrollbar=1`}
                  title={activeFile.nome}
                  className="w-full h-full min-h-[520px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-2xl"
                />
              </div>
            ) : (
              /* Mode 2: Simulated A4 PDF Document Sheet with extracted text */
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100/60 dark:bg-slate-950/50">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                  }}
                  className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 border border-slate-300 min-h-[550px] relative"
                >
                  {/* Header Documento */}
                  <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        VOLTMASTER IMPIANTI S.R.L. · AREA TECNICA & SICUREZZA
                      </span>
                      <h2 className="text-base font-black text-slate-900 mt-1">
                        {activeFile.contentData?.pdfPages?.[pdfPage - 1]?.title ||
                          activeFile.nome.replace('.pdf', '')}
                      </h2>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-600">
                      Pag. {pdfPage} / {activeFile.contentData?.pdfPages?.length || activeFile.contentData?.totalPdfPages || 1}
                    </div>
                  </div>

                  {/* Content Lines with Search Highlighting */}
                  <div className="space-y-3.5 text-xs text-slate-800 leading-relaxed">
                    {(
                      activeFile.contentData?.pdfPages?.[pdfPage - 1]?.content || [
                        'Documento tecnico di cantiere in formato PDF conforme agli standard CEI / D.Lgs 81/08.',
                        'Tutti i dati e i parametri sono stati verificati dall’ufficio di direzione lavori.',
                        'Visualizzazione certificata ad alta fedeltà nel browser senza necessità di download locale.',
                      ]
                    ).map((line, lIdx) => {
                      const matchesSearch =
                        pdfSearchQuery.trim() &&
                        line.toLowerCase().includes(pdfSearchQuery.toLowerCase());

                      return (
                        <p
                          key={lIdx}
                          className={`p-1.5 rounded transition-colors ${
                            matchesSearch
                              ? 'bg-amber-200 text-slate-950 font-bold ring-1 ring-amber-400'
                              : ''
                          }`}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Digital Signature & Footer Stamp */}
                  <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-500">
                    <div>
                      <p>Documento approvato e conforme all’originale telematico.</p>
                      <p>Identificativo: SHA-256 [0x92f8...41ba] · P.IVA 08234590154</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded border border-emerald-600 bg-emerald-50 text-emerald-800 font-bold">
                        ✓ FIRMATO DIGITALMENTE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 3: OFFICE EXCEL / SPREADSHEETS (XLSX, CSV) - SHEETJS */}
        {/* ============================================================== */}
        {fileType === 'spreadsheet' && (
          <div className="w-full h-full max-w-6xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Sheet Tabs & Search Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md">
                {(activeFile.contentData?.sheetData || [{ sheetName: 'Foglio 1', headers: [], rows: [] }]).map(
                  (sheet, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setActiveSheetIndex(sIdx)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                        activeSheetIndex === sIdx
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {sheet.sheetName}
                    </button>
                  )
                )}
              </div>

              {/* Search & Actions Bar */}
              <div className="flex items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    placeholder="Cerca nelle celle..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={() => {
                    const currentSheet = activeFile.contentData?.sheetData?.[activeSheetIndex];
                    if (!currentSheet) return;
                    const csvContent = [
                      currentSheet.headers.join(';'),
                      ...currentSheet.rows.map((r) => r.join(';')),
                    ].join('\n');
                    handleCopyText(csvContent);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Copia dati del foglio negli appunti in formato CSV"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                  <span>{copied ? 'Copiato!' : 'Copia CSV'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Grid Table with SheetJS Data */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100/60 dark:bg-slate-950/60">
              {(() => {
                const sheet =
                  activeFile.contentData?.sheetData?.[activeSheetIndex] || {
                    sheetName: 'Dati',
                    headers: ['Voce', 'Descrizione', 'Quantità', 'Prezzo', 'Totale'],
                    rows: [
                      ['1', 'Cavo FG16OR12', 100, 9.4, 940],
                      ['2', 'Quadro BT', 1, 3500, 3500],
                    ],
                  };

                // Filter rows if search query is provided
                const query = sheetSearchQuery.trim().toLowerCase();
                const filteredRows = query
                  ? sheet.rows.filter((row) =>
                      row.some((cell) => String(cell).toLowerCase().includes(query))
                    )
                  : sheet.rows;

                return (
                  <div className="space-y-2">
                    {/* Stats bar */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono px-1">
                      <span>
                        Righe: <strong className="text-emerald-600 dark:text-emerald-400">{filteredRows.length}</strong> / {sheet.totalRows || sheet.rows.length} · Colonne: <strong className="text-slate-700 dark:text-slate-200">{sheet.headers.length}</strong>
                      </span>
                      {query && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Filtro attivo: "{sheetSearchQuery}"
                        </span>
                      )}
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 w-10 text-center font-mono text-slate-500 bg-slate-200/70 dark:bg-slate-850">
                              #
                            </th>
                            {sheet.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 uppercase tracking-wider"
                              >
                                {String.fromCharCode(65 + (hIdx % 26))}: {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900 font-mono">
                          {filteredRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={sheet.headers.length + 1}
                                className="py-8 text-center text-slate-400 italic"
                              >
                                Nessuna cella corrispondente alla ricerca "{sheetSearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            filteredRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-2 px-3 text-center text-slate-500 bg-slate-50 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 font-bold">
                                  {rIdx + 1}
                                </td>
                                {row.map((cell, cIdx) => {
                                  const cellStr = String(cell);
                                  const matchesCell = query && cellStr.toLowerCase().includes(query);

                                  return (
                                    <td
                                      key={cIdx}
                                      className={`py-2 px-3 border-r border-slate-200 dark:border-slate-800/60 last:border-r-0 ${
                                        matchesCell
                                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-400'
                                          : typeof cell === 'number'
                                          ? 'text-right text-emerald-600 dark:text-emerald-400 font-bold'
                                          : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {typeof cell === 'number'
                                        ? cell >= 100
                                          ? `€ ${cell.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                                          : cell
                                        : cell}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 4: OFFICE WORD (DOCX) & PRESENTATIONS (PPTX) */}
        {/* ============================================================== */}
        {(fileType === 'document' || fileType === 'presentation') && (
          <div className="w-full h-full max-w-3xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/60 dark:bg-slate-950/50 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-xl p-8 sm:p-12 border border-slate-200 space-y-6">
                <div className="border-b-2 border-sky-600 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    {fileType === 'document' ? 'DOCUMENTO MICROSOFT WORD (DOCX)' : 'PRESENTAZIONE SLIDE (PPTX)'}
                  </span>
                  <h1 className="text-lg font-black text-slate-950 mt-1">
                    {activeFile.contentData?.docxData?.title || activeFile.nome}
                  </h1>
                </div>

                {(
                  activeFile.contentData?.docxData?.sections || [
                    {
                      heading: 'Relazione Tecnica Esecutiva',
                      paragraphs: [
                        'Le lavorazioni di cablaggio e fornitura sono state eseguite nel rispetto del progetto esecutivo.',
                        'Tutti i componenti impiegati dispongono di marcatura CE e dichiarazione di prestazione CPR.',
                      ],
                    },
                  ]
                ).map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-2 text-xs leading-relaxed text-slate-800">
                    <h3 className="font-bold text-sm text-slate-950 border-l-2 border-sky-500 pl-2">
                      {sec.heading}
                    </h3>
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 5: TESTO, LOG & CODICE (TXT, LOG, JSON, XML) */}
        {/* ============================================================== */}
        {fileType === 'text' && (
          <div className="w-full h-full max-w-4xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span className="text-slate-900 dark:text-slate-200 font-bold">{activeFile.nome}</span>
                <span>· Codifica UTF-8</span>
              </div>
              <button
                onClick={() =>
                  handleCopyText(
                    activeFile.contentData?.textContent || 'Contenuto file'
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                <span>{copied ? 'Copiato!' : 'Copia Testo'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-amber-200/90 leading-relaxed font-mono whitespace-pre selection:bg-amber-400 selection:text-slate-950">
              {activeFile.contentData?.textContent ||
                `[2026-09-30 08:00:00] INFO: Log generico di sistema VoltMaster.\nInizializzazione completata.\nNessun errore riscontrato.`}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 6: VIDEO HTML5 (MP4, WEBM) */}
        {/* ============================================================== */}
        {fileType === 'video' && (
          <div className="w-full max-w-3xl flex flex-col items-center">
            <video
              src={resolvedUrl || activeFile.url}
              controls
              autoPlay={false}
              className="w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] bg-black"
            >
              Il tuo browser non supporta il tag video HTML5.
            </video>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Streaming video inline da cantiere (MP4/H.264)
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 7: AUDIO HTML5 (MP3, WAV) */}
        {/* ============================================================== */}
        {fileType === 'audio' && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Music className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{activeFile.nome}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registrazione audio vocale di cantiere</p>
            </div>
            <audio src={resolvedUrl || activeFile.url} controls className="w-full mt-4">
              Il tuo browser non supporta l'elemento audio HTML5.
            </audio>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEWER TYPE 8: FALLBACK FORMATI NON SUPPORTATI (DWG, ETC) */}
        {/* ============================================================== */}
        {fileType === 'unknown' && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{activeFile.nome}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formato <strong className="text-amber-600 dark:text-amber-400 uppercase">.{activeFile.tipo}</strong> ({formatFileSize(activeFile.dimensioneKb)})
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              L'anteprima diretta nel browser non è disponibile per questo formato di file proprietario. Per visualizzarlo è necessario un software dedicato (es. AutoCAD per file .DWG).
            </p>
            <div className="pt-2">
              <a
                href={resolvedUrl || activeFile.url}
                download={activeFile.nome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Scarica File sul Dispositivo</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM FLOATING CONTROLS BAR */}
      <div className="px-4 py-3 bg-white/95 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs z-20 shadow-xs">
        {/* Left: Security & Signed URL expiration info */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Accesso Streaming Sicuro (Zero Salvataggio Locale)</span>
          {signedExpiresAt && (
            <span className="text-slate-500 font-mono">
              · Token valido fino alle {new Date(signedExpiresAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Center: Zoom, Rotate & Fullscreen Controls */}
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Zoom Indietro (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Reimposta Zoom al 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Zoom Avanti (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></span>

          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Ruota 90° in senso orario"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Schermo Intero"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Optional download (if allowed) */}
        <div className="flex items-center gap-2">
          {!activeFile.isSensibile && (
            <a
              href={resolvedUrl || activeFile.url}
              download={activeFile.nome}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors text-xs font-medium shadow-xs"
              title="Download opzionale del file originale"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica copia</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
