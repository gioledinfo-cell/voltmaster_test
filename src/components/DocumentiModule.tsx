import React, { useState, useMemo } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  FileCode,
  Image as ImageIcon,
  Download,
  Upload,
  Building2,
  CheckCircle2,
  X,
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  Table,
  Presentation,
  Film,
  Music,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentoTecnico, TipoDocumento } from '../types';
import { PreviewableFile, formatFileSize } from '../types/preview';
import { INITIAL_PREVIEW_FILES } from '../data/mockFiles';
import { FileThumbnail } from './preview/FileThumbnail';
import { useFilePreview } from '../context/FilePreviewContext';
import { processUploadedFile } from '../utils/fileParsers';

export const DocumentiModule: React.FC = () => {
  const { documenti, cantieri, addDocumento, showToast, currentUser } = useApp();
  const { openPreview, addAndOpenFiles } = useFilePreview();

  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('tutti');
  const [selectedCantiere, setSelectedCantiere] = useState<string>('tutti');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [realUploadedFiles, setRealUploadedFiles] = useState<PreviewableFile[]>([]);
  const realFileInputRef = React.useRef<HTMLInputElement>(null);

  // New Document Form
  const [titolo, setTitolo] = useState('');
  const [tipo, setTipo] = useState<TipoDocumento>('schema_elettrico');
  const [formato, setFormato] = useState<'pdf' | 'dwg' | 'jpg' | 'png' | 'xlsx' | 'docx' | 'txt'>('pdf');
  const [cantiereId, setCantiereId] = useState(cantieri[0]?.id || '');
  const [descrizione, setDescrizione] = useState('');

  // Gestione caricamento file reale da input o drag & drop
  const handleProcessFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      const parsedList: PreviewableFile[] = [];
      const currentCantiereObj = cantieri.find((c) => c.id === cantiereId) || cantieri[0];
      for (let i = 0; i < files.length; i++) {
        const parsed = await processUploadedFile(files[i], {
          cantiereNome: currentCantiereObj?.titolo,
          cantiereId: currentCantiereObj?.id,
          autore: currentUser.name,
        });
        parsedList.push(parsed);
      }
      setRealUploadedFiles((prev) => [...parsedList, ...prev]);
      addAndOpenFiles(parsedList);
      showToast(`${parsedList.length} file reale/i caricato/i con parser SheetJS & PDF.js!`, 'success');
    } catch (err) {
      console.error('Errore elaborazione file reale', err);
      showToast('Errore durante la lettura del file.', 'error');
    }
  };

  const handleRealFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRealFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Unione dei documenti storici con i file reali caricati e il catalogo mock
  const allPreviewableFiles: PreviewableFile[] = useMemo(() => {
    // Convert existing DocumentoTecnico to PreviewableFile
    const existingMapped: PreviewableFile[] = documenti.map((d) => ({
      id: d.id,
      nome: `${d.titolo}.${d.formato}`,
      tipo: d.formato,
      dimensioneKb: d.dimensioneKb,
      url: d.urlSimulato,
      thumbnailUrl: d.formato === 'jpg' || d.formato === 'png' ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80' : undefined,
      dataCaricamento: d.dataCaricamento,
      autore: d.caricatoDa,
      categoria:
        d.tipo === 'dico_conformita'
          ? 'certificazioni'
          : d.tipo === 'schema_elettrico'
          ? 'permessi'
          : d.tipo === 'foto_cantiere'
          ? 'foto'
          : 'sicurezza',
      cantiereId: d.cantiereId,
      cantiereNome: d.cantiereTitolo,
      isSensibile: d.tipo === 'dico_conformita',
      watermarkText: 'VOLTMASTER - USO INTERNO CANTIERE',
    }));

    // Merge in priority: Real uploaded files first, then catalog, then existing
    const map = new Map<string, PreviewableFile>();
    realUploadedFiles.forEach((f) => map.set(f.id, f));
    INITIAL_PREVIEW_FILES.forEach((f) => {
      if (!map.has(f.id)) map.set(f.id, f);
    });
    existingMapped.forEach((f) => {
      if (!map.has(f.id)) map.set(f.id, f);
    });

    return Array.from(map.values());
  }, [documenti, realUploadedFiles]);

  const filteredFiles = useMemo(() => {
    return allPreviewableFiles.filter((file) => {
      const matchesSearch =
        file.nome.toLowerCase().includes(search.toLowerCase()) ||
        (file.cantiereNome && file.cantiereNome.toLowerCase().includes(search.toLowerCase())) ||
        (file.autore && file.autore.toLowerCase().includes(search.toLowerCase()));

      const matchesTipo =
        filterTipo === 'tutti' ||
        file.tipo.toLowerCase() === filterTipo.toLowerCase() ||
        (filterTipo === 'immagini' && ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(file.tipo.toLowerCase())) ||
        (filterTipo === 'office' && ['xlsx', 'xls', 'docx', 'doc', 'pptx'].includes(file.tipo.toLowerCase())) ||
        (filterTipo === 'media' && ['mp4', 'mp3', 'webm', 'wav'].includes(file.tipo.toLowerCase()));

      const matchesCantiere =
        selectedCantiere === 'tutti' || file.cantiereId === selectedCantiere;

      return matchesSearch && matchesTipo && matchesCantiere;
    });
  }, [allPreviewableFiles, search, filterTipo, selectedCantiere]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cantiere = cantieri.find((c) => c.id === cantiereId);

    addDocumento({
      titolo,
      tipo,
      formato: formato as any,
      dimensioneKb: Math.floor(Math.random() * 4000 + 800),
      dataCaricamento: new Date().toISOString().split('T')[0],
      caricatoDa: currentUser.name,
      cantiereId: cantiere?.id,
      cantiereTitolo: cantiere?.titolo,
      urlSimulato: `/docs/${titolo.toLowerCase().replace(/\s+/g, '_')}.${formato}`,
      descrizione,
    });

    showToast(`Documento ${titolo} aggiunto con anteprima inline attiva!`, 'success');
    setIsUploadOpen(false);
    setTitolo('');
    setDescrizione('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/40 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizzatore Inline Integrato (Zero Download Locale)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Archivio Documenti, Schemi & File di Cantiere
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Consulta all'istante schemi unifilari, POS, DURC, computi Excel, verbali Word, log strumentali, foto e rilievi video direttamente nel browser in alta fedeltà.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista Griglia Miniature con Hover Zoom"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Miniature</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista Elenco Schede Dettagliate"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Elenco</span>
              </button>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Carica File</span>
            </button>
          </div>
        </div>

        {/* Quick Format Pill Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">PDF & POS</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Con navigazione pagine</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Excel XLSX</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Computi con celle vive</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Foto & Immagini</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Hover zoom 500ms</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Word & Slide</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">DOCX & PPTX viewer</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">Video & Audio</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Player HTML5 inline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real File Drag & Drop Zone (SheetJS & PDF.js) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleRealFileDrop}
        onClick={() => realFileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 ring-4 ring-emerald-500/20 shadow-xl'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/90 shadow-xs dark:shadow-md'
        }`}
      >
        <input
          type="file"
          ref={realFileInputRef}
          onChange={handleRealFileInputChange}
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.xml,.jpg,.jpeg,.png,.webp,.gif,.mp4"
          className="hidden"
        />

        <div className="flex items-center gap-3.5 text-left">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Trascina qui qualsiasi file dal tuo computer o clicca per caricare
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Engine Reale SheetJS & PDF.js</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supporto istantaneo per <strong>PDF multipagina</strong> con ricerca testo, <strong>fogli Excel/CSV</strong> con celle interattive, relazioni Word, foto e rilievi. Nessun salvataggio locale nei Download.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            realFileInputRef.current?.click();
          }}
          className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Scegli File dal PC</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome file, cantiere, autore o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Format filter */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="tutti">Tutti i Formati</option>
            <option value="pdf">Documenti PDF</option>
            <option value="immagini">Foto & Immagini (JPG, PNG)</option>
            <option value="office">Pacchetto Office (XLSX, DOCX, PPTX)</option>
            <option value="media">Video & Audio (MP4, MP3)</option>
            <option value="log">Log Strumentali & Testo</option>
            <option value="dwg">AutoCAD DWG (Fallback)</option>
          </select>

          {/* Cantiere filter */}
          <select
            value={selectedCantiere}
            onChange={(e) => setSelectedCantiere(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="tutti">Tutti i Cantieri</option>
            {cantieri.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice} - {c.titolo.slice(0, 25)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Display: Grid Thumbnails (Mode 1) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredFiles.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              <FolderLock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">Nessun file trovato per i filtri selezionati.</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <FileThumbnail
                key={file.id}
                file={file}
                fileList={filteredFiles}
                showHoverPreview={true}
              />
            ))
          )}
        </div>
      )}

      {/* Files Display: Detailed Cards (Mode 2) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              <FolderLock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">Nessun file trovato per i filtri selezionati.</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => openPreview(file, filteredFiles)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700">
                      .{file.tipo}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatFileSize(file.dimensioneKb)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                    {file.nome}
                  </h3>

                  {file.cantiereNome && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{file.cantiereNome}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>Autore: {file.autore}</span>
                    <span>·</span>
                    <span>{file.dataCaricamento}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {file.categoria || 'generale'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(file, filteredFiles);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Anteprima Inline</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs dark:shadow-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Caricamento Documento Tecnico o Foto</h3>
            <p className="text-xs text-slate-400 mb-4">
              I file caricati saranno subito pronti per l'anteprima inline protetta senza download forzato.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Titolo File / Documento:</label>
                <input
                  type="text"
                  required
                  placeholder="es. POS Cantiere Aggiornato Rev. 03 o Foto Cabina BT"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tipologia Documentale:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoDocumento)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="schema_elettrico">Schema Elettrico</option>
                    <option value="dico_conformita">Dichiarazione DM 37/08</option>
                    <option value="verbale_collaudo">Verbale Collaudo CEI 64-8</option>
                    <option value="manuale_tecnico">Manuale Tecnico Apparecchio</option>
                    <option value="foto_cantiere">Foto Documentale Cantiere</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Formato Estensione:</label>
                  <select
                    value={formato}
                    onChange={(e) => setFormato(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none font-mono uppercase"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="jpg">Foto JPG</option>
                    <option value="png">Foto PNG</option>
                    <option value="txt">Testo / Log (TXT)</option>
                    <option value="dwg">AutoCAD (DWG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cantiere di Riferimento:</label>
                <select
                  value={cantiereId}
                  onChange={(e) => setCantiereId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codice} - {c.titolo} ({c.clienteNome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Note & Descrizione:</label>
                <textarea
                  rows={2}
                  placeholder="Informazioni aggiuntive relative al documento..."
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Salva File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
