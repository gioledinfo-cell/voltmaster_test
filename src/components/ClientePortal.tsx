import React, { useState } from 'react';
import {
  UserCircle2,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  Send,
  Download,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priorita } from '../types';
import { ROLPrintModal } from './ROLPrintModal';

export const ClientePortal: React.FC = () => {
  const {
    cantieri,
    rols,
    documenti,
    segnalazioni,
    addSegnalazione,
    currentUser,
    showToast,
  } = useApp();

  // Find client's cantieri (defaulting to the first client's or assigned)
  const clientCantieri = cantieri.filter((c) =>
    currentUser.assignedClientId ? c.clienteId === currentUser.assignedClientId : true
  );

  const activeCantiere = clientCantieri[0] || cantieri[0];
  const cantiereRols = rols.filter((r) => r.cantiereId === activeCantiere?.id);
  const cantiereDocs = documenti.filter((d) => d.cantiereId === activeCantiere?.id);
  const clientSegnalazioni = segnalazioni.filter((s) => s.cantiereId === activeCantiere?.id);

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketTitolo, setTicketTitolo] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriorita, setTicketPriorita] = useState<Priorita>('media');
  const [selectedRolToPrint, setSelectedRolToPrint] = useState<any>(null);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCantiere) return;

    addSegnalazione({
      cantiereId: activeCantiere.id,
      cantiereTitolo: activeCantiere.titolo,
      clienteId: activeCantiere.clienteId,
      clienteNome: activeCantiere.clienteNome,
      data: new Date().toISOString().replace('T', ' ').slice(0, 16),
      titolo: ticketTitolo,
      descrizione: ticketDesc,
      priorita: ticketPriorita,
      stato: 'aperta',
    });

    setIsNewTicketOpen(false);
    setTicketTitolo('');
    setTicketDesc('');
    showToast('Segnalazione inviata! L’ufficio tecnico risponderà a breve.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Portale Riservato Committente</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {activeCantiere?.clienteNome || 'Area Clienti'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Monitora l'avanzamento dei lavori, i rapporti giornalieri firmati (ROL) e la documentazione tecnica del tuo impianto.
            </p>
          </div>

          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuova Richiesta / Segnalazione
          </button>
        </div>
      </div>

      {activeCantiere ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cantiere Progress Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      {activeCantiere.codice}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{activeCantiere.citta}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{activeCantiere.titolo}</h2>
                  <div className="text-xs text-slate-400 mt-0.5">{activeCantiere.indirizzo}</div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {activeCantiere.avanzamentoPercentuale}%
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avanzamento</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${activeCantiere.avanzamentoPercentuale}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Responsabile Lavori</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{activeCantiere.responsabileNome}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Data Avvio</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{activeCantiere.dataInizio}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Consegna Prevista</span>
                  <span className="font-mono text-amber-400">{activeCantiere.dataFinePrevista}</span>
                </div>
              </div>
            </div>

            {/* Signed ROL Reports History */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Rapporti Intervento Giornalieri (ROL) Firmati
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {cantiereRols.length} rapporti
                </span>
              </div>

              <div className="space-y-2.5">
                {cantiereRols.map((rol) => (
                  <div
                    key={rol.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{rol.numero}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-mono">{rol.data}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rol.oreTotali} ore lavorate
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rol.descrizioneLavori}</p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Firmato sul posto da: {rol.firmaClienteNome || 'Committente'} ✓
                      </span>
                      <button
                        onClick={() => setSelectedRolToPrint(rol)}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Scarica / Stampa PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Documents & DiCo Downloads */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Documentazione Impianto, DiCo & Schemi
                </h3>
                <span className="text-xs text-slate-400">{cantiereDocs.length} documenti</span>
              </div>

              <div className="space-y-2">
                {cantiereDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.titolo}</div>
                      <div className="text-[11px] text-slate-500">
                        Tipo: {doc.tipo.replace('_', ' ').toUpperCase()} · Formato: {doc.formato.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => showToast(`Scaricato documento ufficiale: ${doc.titolo}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Scarica
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Payments / SAL & Ticketing (1 col) */}
          <div className="space-y-6">
            {/* SAL and Invoicing Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Contabilità & SAL Lavori
                </h3>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Importo Contrattuale:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    € {activeCantiere.budgetTotale.toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">SAL 1 (Acconto 30%):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saldato ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">SAL 2 (Avanzamento 60%):</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">In emissione</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Saldo Finale a Collaudo:</span>
                  <span className="text-slate-500 font-mono">A collaudo finale</span>
                </div>
              </div>
            </div>

            {/* Client Ticketing & Support */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs dark:shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Le Tue Segnalazioni
                  </h3>
                </div>
                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                >
                  + Nuova
                </button>
              </div>

              <div className="space-y-2">
                {clientSegnalazioni.length > 0 ? (
                  clientSegnalazioni.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {ticket.titolo}
                        </span>
                        <span className="text-[10px] uppercase font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {ticket.stato}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {ticket.descrizione}
                      </p>
                      {ticket.rispostaAzienda && (
                        <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-300">
                          <strong className="block text-slate-500 dark:text-slate-400 text-[10px]">Risposta Ufficio Tecnico:</strong>
                          {ticket.rispostaAzienda}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500 text-xs italic">
                    Nessuna segnalazione attiva. Clicca su "+ Nuova" per richiedere modifiche o chiarimenti.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          Nessun cantiere associato a questo profilo cliente.
        </div>
      )}

      {/* NEW TICKET MODAL */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewTicketOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Invia Segnalazione o Richiesta</h3>
            <p className="text-xs text-slate-400 mb-4">
              Comunicazione diretta al responsabile di cantiere
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Oggetto della Richiesta:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Richiesta punto presa aggiuntivo quadro secondario"
                  value={ticketTitolo}
                  onChange={(e) => setTicketTitolo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priorità:</label>
                <select
                  value={ticketPriorita}
                  onChange={(e) => setTicketPriorita(e.target.value as Priorita)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  <option value="bassa">Bassa (Informativa)</option>
                  <option value="media">Media (Modifica programmabile)</option>
                  <option value="alta">Alta (Blocco lavori o modifica urgente)</option>
                  <option value="urgente">Urgente (Anomalia / Emergenza)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Descrizione Dettagliata:</label>
                <textarea
                  rows={3}
                  required
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  placeholder="Fornisci indicazioni precise, ubicazione o foto..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Invia Segnalazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROL Print Modal from Client Portal */}
      {selectedRolToPrint && (
        <ROLPrintModal
          rol={selectedRolToPrint}
          onClose={() => setSelectedRolToPrint(null)}
        />
      )}
    </div>
  );
};
