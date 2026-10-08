import React from 'react';
import {
  X,
  Mail,
  BellRing,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Warehouse,
  ExternalLink,
} from 'lucide-react';
import { RichiestaMateriali } from '../../types/richiestaMateriali';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  richiesta: RichiestaMateriali | null;
  onGeneraDdt?: () => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  richiesta,
  onGeneraDdt,
}) => {
  if (!isOpen || !richiesta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Canale: Push + Email
                </span>
                <span className="text-xs text-slate-500">Inviata istantaneamente</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Log Notifica Magazzino ({richiesta.numero})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Push Notification Card */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Anteprima Notifica Push (Dispositivi Magazzino / Tablet)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 shadow-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs">VoltMaster Magazzino Alert</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ora</span>
                </div>
                <div className="font-semibold text-xs mt-0.5">
                  Richiesta {richiesta.numero} ({richiesta.priorita.toUpperCase()})
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {richiesta.richiedenteNome} ha richiesto {richiesta.righe.length} voci per &quot;{richiesta.cantiereTitolo}&quot;. Consegna entro {richiesta.dataPrevistaConsegna}.
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <span>2. Anteprima Messaggio Email (Server SMTP Magazzino)</span>
            </div>
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white text-slate-900 font-sans shadow-xs">
              {/* Email Meta */}
              <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                <div>
                  <strong>Da:</strong> Sistema Gestionale Cantiere &lt;noreply@voltmaster.it&gt;
                </div>
                <div>
                  <strong>A:</strong> {richiesta.notifica.destinatarioMagazzino} &lt;{richiesta.notifica.emailDestinatario}&gt;
                </div>
                <div>
                  <strong>Oggetto:</strong> [{richiesta.priorita === 'bloccante_fermo_cantiere' ? 'FERMO CANTIERE' : 'RICHIESTA'}] {richiesta.numero} - Materiale cantiere {richiesta.cantiereTitolo}
                </div>
                <div>
                  <strong>Data invio:</strong> {richiesta.notifica.inviatoIl}
                </div>
              </div>

              {/* Email Body */}
              <div className="p-4 sm:p-5 space-y-3.5 bg-white text-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="text-sm font-black text-slate-900">
                    VOLT<span className="text-amber-600">MASTER</span> LOGISTICA
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      richiesta.priorita === 'bloccante_fermo_cantiere'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : richiesta.priorita === 'urgente'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    PRIORITÀ: {richiesta.priorita.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-700">
                  Gentile Responsabile Magazzino,
                  <br />
                  il tecnico sul campo <strong>{richiesta.richiedenteNome}</strong> ({richiesta.richiedenteRuolo} - Tel. {richiesta.richiedenteTelefono}) ha inoltrato la richiesta di allestimento materiale per il seguente cantiere:
                </p>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div><strong>Cantiere:</strong> {richiesta.cantiereTitolo}</div>
                  <div><strong>Destinazione:</strong> {richiesta.indirizzoConsegna}</div>
                  <div><strong>Data richiesta consegna:</strong> {richiesta.dataPrevistaConsegna} ({richiesta.orarioPreferito})</div>
                  {richiesta.noteCantiere && (
                    <div><strong>Note dal campo:</strong> <em>&quot;{richiesta.noteCantiere}&quot;</em></div>
                  )}
                </div>

                <div className="font-bold text-xs text-slate-800 mt-2">
                  Elenco Materiali & Attrezzature Richieste:
                </div>

                <table className="w-full text-[11px] border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 text-left">
                    <tr>
                      <th className="p-1.5 border-b">Tipo</th>
                      <th className="p-1.5 border-b">Codice</th>
                      <th className="p-1.5 border-b">Descrizione</th>
                      <th className="p-1.5 border-b text-right">Q.tà Richiesta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {richiesta.righe.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1.5 border-b font-mono uppercase text-[10px] text-slate-500">{r.tipo}</td>
                        <td className="p-1.5 border-b font-mono">{r.codice}</td>
                        <td className="p-1.5 border-b font-medium">{r.descrizione}</td>
                        <td className="p-1.5 border-b text-right font-bold font-mono">
                          {r.quantitaRichiesta} {r.unitaMisura}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pt-2 text-[11px] text-slate-500 text-center">
                  Accedere al portale aziendale per emettere il Documento di Trasporto (DDT) o contrassegnare i colli come pronti al ritiro.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Chiudi
          </button>

          {onGeneraDdt && richiesta.stato !== 'ddt_emesso' && (
            <button
              onClick={() => {
                onClose();
                onGeneraDdt();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <span>Genera DDT di Trasporto per questa richiesta</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
