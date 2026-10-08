import React, { useState } from 'react';
import {
  X,
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  Check,
  ShieldCheck,
  Boxes,
  Volume2,
} from 'lucide-react';
import { PaccoZonaVerde, Veicolo } from '../../types';
import { useApp } from '../../context/AppContext';
import { playSuccessChime } from '../../utils/audioChime';

interface ConfermaCaricoPaccoModalProps {
  pacco: PaccoZonaVerde;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfermaCaricoPaccoModal: React.FC<ConfermaCaricoPaccoModalProps> = ({
  pacco,
  onClose,
  onSuccess,
}) => {
  const { currentUser, veicoli, confermaCaricoPacco, showToast } = useApp();

  // Furgone selezionato (default a quello assegnato o primo disponibile)
  const [furgoneSelezionato, setFurgoneSelezionato] = useState<string>(
    pacco.furgoneAssegnato || (veicoli[0] ? `${veicoli[0].modello} (${veicoli[0].targa})` : '')
  );

  // Note aggiuntive dell'operatore durante il carico
  const [noteOperatore, setNoteOperatore] = useState('');

  // Checklist interattiva di verifica fisica articoli
  const [checkedItems, setCheckedItems] = useState<{ [sku: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCheck = (sku: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }));
  };

  const handleSelectAll = () => {
    const all: { [sku: string]: boolean } = {};
    pacco.righeMateriale.forEach((r) => {
      all[r.sku] = true;
    });
    setCheckedItems(all);
  };

  const allChecked =
    pacco.righeMateriale.length > 0 &&
    pacco.righeMateriale.every((r) => checkedItems[r.sku]);

  const handleConfirmCarico = () => {
    setIsSubmitting(true);

    try {
      // 1. Chiamata al metodo di contesto per aggiornare lo stato del pacco
      const result = confermaCaricoPacco(
        pacco.id,
        {
          id: currentUser.id,
          nome: currentUser.name,
        },
        furgoneSelezionato
      );

      // 2. Feedback sonoro immediato via Web Audio API
      playSuccessChime();

      // 3. Feedback visivo
      showToast(
        `Pacco ${pacco.id} preso in carico! Rimosso dalla Zona Verde e caricato sul mezzo.`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Errore durante la conferma del carico pacco:', err);
      showToast('Si è verificato un errore durante la registrazione del carico.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Presa in Carico Pacco sul Mezzo</h3>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                  {pacco.id}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Verifica spunta materiali e conferma caricamento dal magazzino "Zona Verde"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-100 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Card Destinazione Cantiere */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Cantiere di Destinazione
              </span>
              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-800 dark:text-slate-200">
                {pacco.codiceCantiere}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              {pacco.cantiereTitolo}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {pacco.indirizzoCantiere}
            </div>
            {pacco.clienteNome && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>Cliente: {pacco.clienteNome}</span>
              </div>
            )}
          </div>

          {/* Selezione / Conferma Furgone & Operatore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Furgone su cui si carica:
              </label>
              <select
                value={furgoneSelezionato}
                onChange={(e) => setFurgoneSelezionato(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                {veicoli.map((v) => {
                  const val = `${v.modello} (${v.targa})`;
                  return (
                    <option key={v.id} value={val}>
                      {val} {v.autistaAssegnatoNome ? `- ${v.autistaAssegnatoNome}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operatore che effettua il carico:
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>{currentUser.name} ({currentUser.role})</span>
              </div>
            </div>
          </div>

          {/* Note di Manipolazione Magazzino */}
          {pacco.noteDiCarico && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Note preparatore Zona Verde:</span>
                <p className="mt-0.5">{pacco.noteDiCarico}</p>
              </div>
            </div>
          )}

          {/* Checklist Materiali da Verificare */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span>Verifica Spunta Contenuto ({pacco.righeMateriale.length} articoli):</span>
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Spunta tutti
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 max-h-52 overflow-y-auto">
              {pacco.righeMateriale.map((riga) => {
                const isChecked = !!checkedItems[riga.sku];
                return (
                  <div
                    key={riga.sku}
                    onClick={() => toggleCheck(riga.sku)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {riga.descrizione}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          SKU: {riga.sku} {riga.matricola ? `· Matr: ${riga.matricola}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {riga.quantita} {riga.um}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con Pulsante Azione Rapida */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Segnale acustico alla conferma</span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={handleConfirmCarico}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Conferma Carico sul Mezzo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
