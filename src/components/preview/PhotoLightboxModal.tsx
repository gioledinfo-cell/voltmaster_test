import React, { useEffect } from 'react';
import { X, ZoomIn, Download, ExternalLink, ShieldCheck, Tag, Info } from 'lucide-react';

export interface PhotoLightboxData {
  imageUrl: string;
  title: string;
  code?: string;
  category?: string;
  subtitle?: string;
  details?: { label: string; value: string | number }[];
}

interface PhotoLightboxModalProps {
  data: PhotoLightboxData | null;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80">
          <div className="flex items-center gap-2 min-w-0">
            {data.category && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {data.category}
              </span>
            )}
            {data.code && (
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {data.code}
              </span>
            )}
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {data.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Chiudi (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-res Image Viewing Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-2 min-h-[300px] sm:min-h-[380px] overflow-hidden">
          <img
            src={data.imageUrl}
            alt={data.title}
            className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg shadow-lg select-none"
            loading="eager"
          />
        </div>

        {/* Bottom Details Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {data.title}
              </div>
              {data.subtitle && (
                <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  {data.subtitle}
                </div>
              )}
            </div>

            <a
              href={data.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apri originale</span>
            </a>
          </div>

          {data.details && data.details.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {data.details.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{item.label}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
