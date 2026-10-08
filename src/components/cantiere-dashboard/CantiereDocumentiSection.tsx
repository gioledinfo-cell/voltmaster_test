import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  FileCheck,
  Award,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
} from 'lucide-react';
import { CantiereDocumentoItem, CategoriaDocumentoCantiere, StatoValiditaDocumento } from '../../types/cantiereDashboard';
import { useFilePreview } from '../../context/FilePreviewContext';
import { PreviewableFile } from '../../types/preview';

interface CantiereDocumentiSectionProps {
  documenti: CantiereDocumentoItem[];
  onVisualizzaDocumento?: (doc: CantiereDocumentoItem) => void;
}

export const CantiereDocumentiSection: React.FC<CantiereDocumentiSectionProps> = ({
  documenti,
  onVisualizzaDocumento,
}) => {
  const { openPreview } = useFilePreview();
  const [activeCategory, setActiveCategory] = useState<CategoriaDocumentoCantiere | 'tutti'>('tutti');

  const categories: { id: CategoriaDocumentoCantiere | 'tutti'; label: string; icon: React.ReactNode }[] = [
    { id: 'tutti', label: 'Tutti i Documenti', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'sicurezza_pos', label: 'Sicurezza & POS', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'permessi', label: 'Permessi & Pratiche', icon: <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'certificazioni', label: 'Certificazioni & DiCo', icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'contratti', label: 'Contratti & SAL', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const filtered = documenti.filter((d) => {
    return activeCategory === 'tutti' || d.categoria === activeCategory;
  });

  const getValidityBadge = (stato: StatoValiditaDocumento) => {
    switch (stato) {
      case 'valido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
            <CheckCircle2 className="w-3 h-3" /> Valido
          </span>
        );
      case 'in_scadenza':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
            <Clock className="w-3 h-3" /> In Scadenza
          </span>
        );
      case 'scaduto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
            <AlertTriangle className="w-3 h-3" /> Scaduto
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Documenti Inerenti & Conformità Cantiere</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {documenti.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Classificazione per POS/Sicurezza D.Lgs 81/08, permessi edilizi, relazioni tecniche DiCo DM 37/08 e contratti.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">
            Nessun documento presente nella categoria selezionata.
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {doc.categoria.replace('_', ' ')}
                  </span>
                  {getValidityBadge(doc.statoValidita)}
                </div>

                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 leading-snug">
                  {doc.titolo}
                </h4>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{doc.formato.toUpperCase()}</span>
                  <span>·</span>
                  <span>{doc.dimensioneKb} KB</span>
                  {doc.codiceProtocollo && (
                    <>
                      <span>·</span>
                      <span>Prot: {doc.codiceProtocollo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="text-slate-600 dark:text-slate-400">
                  {doc.dataScadenza ? (
                    <span>Scadenza: <strong className={`font-mono ${doc.statoValidita === 'scaduto' ? 'text-rose-600 dark:text-rose-400' : doc.statoValidita === 'in_scadenza' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{doc.dataScadenza}</strong></span>
                  ) : (
                    <span>Emissione: <strong className="font-mono text-slate-700 dark:text-slate-300">{doc.dataEmissione}</strong></span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (onVisualizzaDocumento) {
                      onVisualizzaDocumento(doc);
                    } else {
                      const prevFile: PreviewableFile = {
                        id: doc.id,
                        nome: `${doc.titolo}.${doc.formato}`,
                        tipo: doc.formato,
                        dimensioneKb: doc.dimensioneKb,
                        url: doc.urlSimulato || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        dataCaricamento: doc.dataEmissione,
                        autore: 'Ufficio Sicurezza Cantiere',
                        categoria: doc.categoria as any,
                        isSensibile: doc.categoria === 'sicurezza_pos',
                      };
                      openPreview(prevFile);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Anteprima Inline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
