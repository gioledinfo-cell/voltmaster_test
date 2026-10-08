import React, { useState, useRef } from 'react';
import {
  PreviewableFile,
  detectFileType,
  formatFileSize,
} from '../../types/preview';
import { useFilePreview } from '../../context/FilePreviewContext';
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Film,
  Music,
  Table,
  Presentation,
  ShieldAlert,
  Eye,
  Calendar,
  User,
  Clock,
} from 'lucide-react';

interface FileThumbnailProps {
  file: PreviewableFile;
  fileList?: PreviewableFile[];
  showHoverPreview?: boolean;
  className?: string;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  fileList,
  showHoverPreview = true,
  className = '',
}) => {
  const { openPreview } = useFilePreview();
  const fileType = detectFileType(file.tipo, file.nome);

  // Stato per hover popup dopo 500ms
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!showHoverPreview) return;
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovered(false);
    openPreview(file, fileList);
  };

  const getTypeIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'spreadsheet':
        return <Table className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'presentation':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'text':
        return <FileCode className="w-5 h-5 text-amber-300" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadgeClass = () => {
    switch (fileType) {
      case 'image':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'pdf':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'spreadsheet':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'document':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'presentation':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'video':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'audio':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex flex-col justify-between shadow-xs h-full">
        {/* Visual Preview / Thumbnail Area */}
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800/80 mb-2.5">
          {fileType === 'image' || file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl || file.url}
              alt={file.nome}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center">
              <div className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner mb-1.5">
                {getTypeIcon()}
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                {file.tipo.toUpperCase()}
              </span>
            </div>
          )}

          {/* Quick Click Eye Badge */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-3.5 h-3.5" />
              <span>Anteprima Inline</span>
            </span>
          </div>

          {/* Sensitive / Watermark indicator */}
          {file.isSensibile && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/90 text-white shadow-sm flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>RISERVATO</span>
            </span>
          )}

          {/* File extension badge */}
          <span
            className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getTypeBadgeClass()} backdrop-blur-sm`}
          >
            {file.tipo.replace('.', '')}
          </span>
        </div>

        {/* File Metadata */}
        <div>
          <h4
            className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors"
            title={file.nome}
          >
            {file.nome}
          </h4>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{formatFileSize(file.dimensioneKb)}</span>
            <span>{file.dataCaricamento}</span>
          </div>
          {file.cantiereNome && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
              📍 {file.cantiereNome}
            </p>
          )}
        </div>
      </div>

      {/* Hover Preview Tooltip (attivato dopo 500ms) */}
      {isHovered && fileType === 'image' && (
        <div
          className="absolute z-50 -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none"
          style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25))' }}
        >
          <div className="relative rounded-lg overflow-hidden bg-black max-h-48 mb-2">
            <img
              src={file.url}
              alt={file.nome}
              className="w-full h-40 object-cover"
            />
          </div>
          <div className="text-[11px] text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white truncate">{file.nome}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
              {formatFileSize(file.dimensioneKb)} · Autore: {file.autore}
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
};
