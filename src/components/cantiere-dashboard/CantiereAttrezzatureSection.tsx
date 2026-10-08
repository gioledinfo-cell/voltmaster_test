import React from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { CantiereAttrezzaturaItem } from '../../types/cantiereDashboard';
import { ResourceThumbnail } from '../preview/ResourceThumbnail';

interface CantiereAttrezzatureSectionProps {
  attrezzature: CantiereAttrezzaturaItem[];
  onSegnalaAnomalia?: (item: CantiereAttrezzaturaItem) => void;
}

export const CantiereAttrezzatureSection: React.FC<CantiereAttrezzatureSectionProps> = ({
  attrezzature,
  onSegnalaAnomalia,
}) => {
  const getStatusBadge = (stato: CantiereAttrezzaturaItem['stato']) => {
    switch (stato) {
      case 'operativo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
            <CheckCircle2 className="w-3 h-3" /> Operativo
          </span>
        );
      case 'in_manutenzione':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
            <AlertTriangle className="w-3 h-3" /> In Manutenzione
          </span>
        );
      case 'da_verificare':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
            <Clock className="w-3 h-3" /> Da Verificare
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Attrezzature & Macchinari in Uso</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {attrezzature.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Elenco verificatori CEI 64-8, termocamere, trabattelli, scanalatrici e macchinari allocati in cantiere.
          </p>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Operativi: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{attrezzature.filter((a) => a.stato === 'operativo').length}</strong> / {attrezzature.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {attrezzature.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">
            Nessuna attrezzatura attualmente registrata su questo cantiere.
          </div>
        ) : (
          attrezzature.map((att) => (
            <div
              key={att.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <ResourceThumbnail
                  category="attrezzatura"
                  alt={att.nome}
                  code={att.codiceUnivoco}
                  title={att.nome}
                  subtitle={`${att.marcaModello} · Matricola: ${att.matricola}`}
                  size="md"
                  clickable={true}
                  details={[
                    { label: 'Matricola', value: att.matricola },
                    { label: 'Modello', value: att.marcaModello },
                    { label: 'Assegnato a', value: att.assegnatoA },
                    { label: 'Stato', value: att.stato },
                    { label: 'Revisione/Taratura', value: att.prossimaRevisioneTaratura },
                  ]}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-400 px-2 py-0.5 bg-cyan-50 dark:bg-cyan-500/10 rounded border border-cyan-200 dark:border-cyan-500/20 truncate">
                      {att.codiceUnivoco}
                    </span>
                    {getStatusBadge(att.stato)}
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1 leading-snug truncate">
                    {att.nome}
                  </h4>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{att.marcaModello}</div>
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Matricola: {att.matricola}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assegnato a:</span>
                  <span className="text-slate-800 dark:text-slate-300 font-medium truncate max-w-[140px] flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {att.assegnatoA}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Scadenza Taratura/Rev.:</span>
                  <span
                    className={`font-mono font-semibold ${
                      att.isScadenzaImminente ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {att.prossimaRevisioneTaratura}
                  </span>
                </div>
              </div>

              {att.isScadenzaImminente && (
                <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[10px] text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Taratura periodica in scadenza a breve</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
