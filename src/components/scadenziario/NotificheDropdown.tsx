import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Calendar,
  X,
  FileText,
  Wrench,
  Truck,
  HardHat,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificaSistema, CategoriaScadenza } from '../../types/scadenze';

interface NotificheDropdownProps {
  onClose: () => void;
  onOpenScadenzaDetail?: (scadenzaId: string) => void;
}

export const NotificheDropdown: React.FC<NotificheDropdownProps> = ({
  onClose,
  onOpenScadenzaDetail,
}) => {
  const {
    notifiche,
    segnaNotificaLetta,
    segnaTutteNotificheLette,
    eliminaNotifica,
    setActiveTab,
  } = useApp();

  const [filter, setFilter] = useState<'tutte' | 'non_lette' | 'critiche'>('tutte');

  const getCategoryIcon = (cat?: CategoriaScadenza | 'generale') => {
    switch (cat) {
      case 'durc':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'taratura_cei64':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'revisione_veicoli':
        return <Truck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'patentini_sicurezza':
        return <HardHat className="w-3.5 h-3.5 text-purple-400" />;
      case 'cantieri_sicurezza':
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getLivelloBadge = (livello: NotificaSistema['livello']) => {
    switch (livello) {
      case 'rosso':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Critico / Scaduto
          </span>
        );
      case 'arancione':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Alert 15 gg
          </span>
        );
      case 'giallo':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Alert 30 gg
          </span>
        );
      case 'verde':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Rinnovato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Info
          </span>
        );
    }
  };

  const nonLetteCount = notifiche.filter((n) => !n.letta).length;
  const criticheCount = notifiche.filter((n) => n.livello === 'rosso' || n.livello === 'arancione').length;

  const filteredNotifiche = notifiche.filter((n) => {
    if (filter === 'non_lette') return !n.letta;
    if (filter === 'critiche') return n.livello === 'rosso' || n.livello === 'arancione';
    return true;
  });

  const handleOpenScadenziario = (scadenzaId?: string) => {
    setActiveTab('scadenziario');
    onClose();
    if (scadenzaId && onOpenScadenzaDetail) {
      setTimeout(() => {
        onOpenScadenzaDetail(scadenzaId);
      }, 100);
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20 dark:border-amber-500/30">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Centro Notifiche & Alert
              {nonLetteCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {nonLetteCount} nuove
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Scadenze D.Lgs 81/08, DURC, Strumenti CEI & Mezzi
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Quick Actions */}
      <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('tutte')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors ${
              filter === 'tutte'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Tutte ({notifiche.length})
          </button>
          <button
            onClick={() => setFilter('non_lette')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors ${
              filter === 'non_lette'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Non lette ({nonLetteCount})
          </button>
          <button
            onClick={() => setFilter('critiche')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              filter === 'critiche'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            Critiche ({criticheCount})
          </button>
        </div>

        {nonLetteCount > 0 && (
          <button
            onClick={segnaTutteNotificheLette}
            className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-1 py-1 px-1.5 rounded hover:bg-amber-500/10 transition-colors"
            title="Segna tutte come lette"
          >
            <CheckCheck className="w-3 h-3" />
            Segna lette
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] p-1">
        {filteredNotifiche.length === 0 ? (
          <div className="py-8 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-2">
              <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nessuna notifica in questa vista</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Tutte le prescrizioni e scadenze risultano gestite regolarmente.
            </p>
          </div>
        ) : (
          filteredNotifiche.map((notifica) => (
            <div
              key={notifica.id}
              className={`p-3 rounded-xl transition-all ${
                !notifica.letta
                  ? 'bg-amber-500/5 dark:bg-slate-800/60 hover:bg-amber-500/10 dark:hover:bg-slate-800 border border-amber-500/20 dark:border-slate-700/60'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-850/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                    {getCategoryIcon(notifica.categoria)}
                  </div>
                  {getLivelloBadge(notifica.livello)}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {notifica.dataOra.split(' ')[0]}
                  </span>
                  {!notifica.letta && (
                    <button
                      onClick={() => segnaNotificaLetta(notifica.id)}
                      className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                      title="Segna come letta"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => eliminaNotifica(notifica.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h4
                className={`text-xs font-bold mt-1.5 leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors ${
                  !notifica.letta ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => handleOpenScadenziario(notifica.scadenzaId)}
              >
                {notifica.titolo}
              </h4>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {notifica.messaggio}
              </p>

              {notifica.scadenzaId && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenScadenziario(notifica.scadenzaId)}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Apri nello Scadenziario
                  </button>

                  {notifica.giorniRimanenti !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        notifica.giorniRimanenti < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : notifica.giorniRimanenti <= 15
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {notifica.giorniRimanenti < 0
                        ? `Scaduto da ${Math.abs(notifica.giorniRimanenti)} gg`
                        : `Scade tra ${notifica.giorniRimanenti} gg`}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer link to Scadenziario */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={() => handleOpenScadenziario()}
          className="w-full py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Apri Scadenziario Visivo a Semaforo</span>
        </button>
      </div>
    </div>
  );
};
