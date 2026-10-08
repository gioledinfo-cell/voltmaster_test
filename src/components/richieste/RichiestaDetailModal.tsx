import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Truck,
  Printer,
  Mail,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Phone,
  Calendar,
  Layers,
  FileText,
  Warehouse,
  Wrench,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RichiestaMateriali, StatoRichiestaMateriali } from '../../types/richiestaMateriali';
import { EmailNotificationModal } from './EmailNotificationModal';
import { RichiestaPickListPrintModal } from './RichiestaPickListPrintModal';
import { GeneraDdtModal } from './GeneraDdtModal';

interface RichiestaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  richiestaId: string | null;
}

export const RichiestaDetailModal: React.FC<RichiestaDetailModalProps> = ({
  isOpen,
  onClose,
  richiestaId,
}) => {
  const { richiesteMateriali, aggiornaStatoRichiesta, ddts, setActiveTab, showToast } = useApp();

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPickListModalOpen, setIsPickListModalOpen] = useState(false);
  const [isGeneraDdtModalOpen, setIsGeneraDdtModalOpen] = useState(false);

  if (!isOpen || !richiestaId) return null;

  const richiesta = richiesteMateriali.find((r) => r.id === richiestaId);
  if (!richiesta) return null;

  const ddtCollegato = richiesta.ddtCollegatoId
    ? ddts.find((d) => d.id === richiesta.ddtCollegatoId)
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                <PackagePlus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {richiesta.numero}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      richiesta.priorita === 'bloccante_fermo_cantiere'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                        : richiesta.priorita === 'urgente'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Priorità: {richiesta.priorita.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      richiesta.stato === 'ddt_emesso'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                        : richiesta.stato === 'in_preparazione'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : richiesta.stato === 'pronta'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Stato: {richiesta.stato.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  Richiesta Materiali per: {richiesta.cantiereTitolo}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* Quick Banner Alert for Push & Email Sent */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Notifica Magazzino Tracciata:</strong> Inviata via Push + Email a{' '}
                  <span className="font-mono">{richiesta.notifica.emailDestinatario}</span> alle{' '}
                  {richiesta.notifica.inviatoIl}.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="inline-flex items-center gap-1 font-bold underline hover:text-emerald-950 dark:hover:text-emerald-100 shrink-0 ml-2"
              >
                <span>Vedi Log Notifica</span>
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dati Cantiere & Richiedente Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dati Cantiere & Destinazione</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {richiesta.cantiereTitolo}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  <strong>Cliente:</strong> {richiesta.clienteNome}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  <strong>Indirizzo Consegna:</strong> {richiesta.indirizzoConsegna}
                </div>
                <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Consegna desiderata: <strong>{richiesta.dataPrevistaConsegna}</strong> ({richiesta.orarioPreferito})
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Richiedente sul Campo</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {richiesta.richiedenteNome}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  <strong>Mansione:</strong> {richiesta.richiedenteRuolo}
                </div>
                <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Telefono: <strong>{richiesta.richiedenteTelefono}</strong></span>
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  <strong>Inoltrata il:</strong> {richiesta.dataRichiesta}
                </div>
              </div>
            </div>

            {/* Note Cantiere */}
            {richiesta.noteCantiere && (
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                <strong className="text-amber-900 dark:text-amber-200">Note speciali dal tecnico in cantiere:</strong>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 italic">&quot;{richiesta.noteCantiere}&quot;</p>
              </div>
            )}

            {/* Distinta Voci con Magazzino Stock Live */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Distinta Materiali & Attrezzature ({richiesta.righe.length} voci)</span>
                </h3>
                <span className="text-[11px] text-slate-400">Verifica giacenze in tempo reale</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {richiesta.righe.map((r, idx) => (
                  <div key={r.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                              r.tipo === 'materiale'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                            }`}
                          >
                            {r.tipo}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {r.descrizione}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                          <span>Cod: <span className="font-mono">{r.codice}</span></span>
                          {r.quantitaDisponibileMagazzino !== undefined && (
                            <span
                              className={
                                r.quantitaDisponibileMagazzino >= r.quantitaRichiesta
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : 'text-rose-600 dark:text-rose-400 font-bold'
                              }
                            >
                              Giacenza magazzino: {r.quantitaDisponibileMagazzino} {r.unitaMisura}
                            </span>
                          )}
                        </div>
                        {r.note && <div className="text-[10px] text-slate-400 italic mt-0.5">{r.note}</div>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                        {r.quantitaRichiesta} {r.unitaMisura}
                      </div>
                      <div className="text-[10px] text-slate-400">Richiesti</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collegamento DDT se già emesso */}
            {richiesta.ddtCollegatoNumero && (
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-cyan-950 dark:text-cyan-200">
                      Spedizione Pianificata tramite Documento di Trasporto
                    </div>
                    <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono">
                      DDT N. {richiesta.ddtCollegatoNumero}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('ddt_trasporto');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  <span>Apri DDT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPickListModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Stampa Pick-List A4</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-purple-500" />
                <span>Log Notifiche</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {richiesta.stato === 'inviata' && (
                <button
                  type="button"
                  onClick={() => {
                    aggiornaStatoRichiesta(richiesta.id, 'in_preparazione');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>Prendi in Carico (In Allestimento)</span>
                </button>
              )}

              {richiesta.stato !== 'ddt_emesso' ? (
                <button
                  type="button"
                  onClick={() => setIsGeneraDdtModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>Genera DDT di Trasporto</span>
                </button>
              ) : (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DDT già emesso</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Modals */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        richiesta={richiesta}
        onGeneraDdt={() => setIsGeneraDdtModalOpen(true)}
      />

      <RichiestaPickListPrintModal
        isOpen={isPickListModalOpen}
        onClose={() => setIsPickListModalOpen(false)}
        richiesta={richiesta}
      />

      <GeneraDdtModal
        isOpen={isGeneraDdtModalOpen}
        onClose={() => setIsGeneraDdtModalOpen(false)}
        richiesta={richiesta}
      />
    </>
  );
};
