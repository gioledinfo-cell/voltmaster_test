import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {title || 'Conferma Eliminazione'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Sei sicuro di voler eliminare permanentemente questo record dall'archivio anagrafico?
            </p>
            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                {itemType}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 break-words mt-0.5 block">
                {itemName}
              </span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
              Questa azione non potrà essere annullata. Tutti i collegamenti storici verranno archiviati.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Elimina Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
