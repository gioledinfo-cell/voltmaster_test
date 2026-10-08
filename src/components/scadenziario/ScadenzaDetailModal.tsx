import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  Send,
  Copy,
  Check,
  FileText,
  CreditCard,
  Trash2,
  ExternalLink,
  MessageSquare,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScadenzaItem, calcolaSemaforoScadenza, getBadgeColorSemaforo } from '../../types/scadenze';

interface ScadenzaDetailModalProps {
  scadenza: ScadenzaItem;
  onClose: () => void;
  onOpenRinnovo: (scadenza: ScadenzaItem) => void;
}

export const ScadenzaDetailModal: React.FC<ScadenzaDetailModalProps> = ({
  scadenza,
  onClose,
  onOpenRinnovo,
}) => {
  const { deleteScadenza, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'scheda' | 'storico' | 'sollecito'>('scheda');
  const [copied, setCopied] = useState(false);

  const calc = calcolaSemaforoScadenza(scadenza.dataScadenza);
  const badge = getBadgeColorSemaforo(calc.stato);

  const getNormativaRiferimento = () => {
    switch (scadenza.categoria) {
      case 'durc':
        return 'D.M. 30/01/2015 - D.Lgs 81/08 art. 90 (Verifica idoneità tecnico-professionale e regolarità contributiva INPS/INAIL/Cassa Edile. Validità 120 giorni).';
      case 'taratura_cei64':
        return 'Norma CEI 64-8 Parte 6 (Verifiche periodiche) & Guida CEI 0-11. Riferibilità metrologica dei campioni con taratura annuale rilasciata da laboratori accreditati Accredia.';
      case 'revisione_veicoli':
        return 'D.Lgs 285/1992 (Codice della Strada) art. 80. Revisione periodica obbligatoria biennale e copertura assicurativa RCA ex L. 990/1969 per autocarri categoria N1.';
      case 'patentini_sicurezza':
        return 'Norma CEI 11-27 ed. V (Lavori elettrici BT/MT) e D.Lgs 81/08 art. 37, 77, 82. Aggiornamento quinquennale qualifica PES/PAV e sorveglianza sanitaria periodica.';
      case 'cantieri_sicurezza':
      default:
        return 'D.Lgs 81/08 Titolo IV - Cantieri temporanei o mobili (POS ex Allegato XV, PSC e coperture assicurative Contractor All Risks).';
    }
  };

  // Generatore di testo per sollecito via email o messaggio
  const testoSollecito = `OGGETTO: Sollecito e Promemoria Scadenza - ${scadenza.titolo}

Spett.le ${scadenza.soggetto},
in riferimento al nostro monitoraggio interno della conformità e sicurezza (VoltMaster Impianti S.r.l.), vi informiamo che la seguente scadenza risulta in scadenza / scaduta:

- Adempimento: ${scadenza.titolo}
- Riferimento: ${scadenza.soggetto} (${scadenza.ruoloORipartizione || 'N/D'})
- Data di Scadenza: ${scadenza.dataScadenza}
- Stato Attuale: ${badge.label} (${calc.giorniRimanenti < 0 ? `Scaduto da ${Math.abs(calc.giorniRimanenti)} giorni` : `${calc.giorniRimanenti} giorni rimanenti`})
- Protocollo / Certificato: ${scadenza.protocolloONumero || 'Da rinnovare'}
- Ente / Laboratorio: ${scadenza.enteRilascio || 'Struttura preposta'}

Prescrizione operativa:
${scadenza.note || 'Si richiede di provvedere con massima urgenza alla trasmissione del documento rinnovato o alla conferma di avvenuto collaudo/corso.'}

Distinti saluti,
Ufficio Tecnico & RSPP Sicurezza
VoltMaster Impianti S.r.l. - Milano`;

  const handleCopySollecito = () => {
    navigator.clipboard.writeText(testoSollecito);
    setCopied(true);
    showToast('Testo sollecito copiato negli appunti!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${badge.bg} ${badge.border} ${badge.text}`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${badge.iconBg} inline-block animate-pulse`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black uppercase border ${badge.bg} ${badge.border} ${badge.text}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {calc.giorniRimanenti < 0
                    ? `Scaduto da ${Math.abs(calc.giorniRimanenti)} gg`
                    : `Mancano ${calc.giorniRimanenti} gg`}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  Priorità {scadenza.priorita.toUpperCase()}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-snug">
                {scadenza.titolo}
              </h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {scadenza.soggetto} {scadenza.ruoloORipartizione && `· ${scadenza.ruoloORipartizione}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('scheda')}
            className={`py-3 px-3 font-bold border-b-2 transition-colors ${
              activeTab === 'scheda'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Scheda Conformità
          </button>
          <button
            onClick={() => setActiveTab('storico')}
            className={`py-3 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'storico'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Storico Rinnovi ({scadenza.storicoRinnovi?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sollecito')}
            className={`py-3 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sollecito'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Invia Sollecito / Promemoria
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'scheda' && (
            <div className="space-y-4">
              {/* Key Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Data di Scadenza
                  </span>
                  <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                    {scadenza.dataScadenza}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Giorni Rimanenti
                  </span>
                  <span
                    className={`text-sm font-mono font-extrabold mt-0.5 block ${
                      calc.giorniRimanenti < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : calc.giorniRimanenti <= 15
                        ? 'text-orange-600 dark:text-orange-400'
                        : calc.giorniRimanenti <= 30
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {calc.giorniRimanenti < 0
                      ? `-${Math.abs(calc.giorniRimanenti)} gg`
                      : `+${calc.giorniRimanenti} gg`}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Ultimo Rinnovo
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-1 block">
                    {scadenza.dataUltimoRinnovo || 'Dato iniziale'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    Costo Rinnovo
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {scadenza.costoRinnovoPrevisto
                      ? `€ ${scadenza.costoRinnovoPrevisto.toFixed(2)}`
                      : 'Gratuito / N/D'}
                  </span>
                </div>
              </div>

              {/* Protocol and Certification */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Numero Protocollo / Certificato / Targa:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {scadenza.protocolloONumero || 'Nessun identificativo'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Ente Rilascio / Laboratorio Accreditato:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {scadenza.enteRilascio || 'Non specificato'}
                  </span>
                </div>
                {scadenza.documentoAllegatoNome && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Documento Archiviato:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {scadenza.documentoAllegatoNome}
                    </span>
                  </div>
                )}
              </div>

              {/* Note e Prescrizioni */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Prescrizioni Operative & Istruzioni di Cantiere
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {scadenza.note || scadenza.descrizione}
                </p>
              </div>

              {/* Legal Reference Framework */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                <h5 className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Quadro Normativo Applicabile
                </h5>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80 leading-relaxed font-sans">
                  {getNormativaRiferimento()}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'storico' && (
            <div className="space-y-3">
              {(!scadenza.storicoRinnovi || scadenza.storicoRinnovi.length === 0) ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                  <p className="text-xs font-semibold">Nessun rinnovo registrato precedentemente</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Questa voce è attualmente alla sua scadenza originale o non sono stati archiviati cicli passati.
                  </p>
                </div>
              ) : (
                scadenza.storicoRinnovi.map((st, i) => (
                  <div
                    key={st.id || i}
                    className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Rinnovato il {st.dataRinnovo}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                        da {st.operatoreNome}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>Vecchia scadenza: <strong className="text-slate-700 dark:text-slate-300">{st.scadenzaPrecedente}</strong></span>
                      <span>→</span>
                      <span>Nuova scadenza: <strong className="text-emerald-600 dark:text-emerald-400">{st.nuovaScadenza}</strong></span>
                    </div>

                    {st.nuovoProtocollo && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Protocollo: <span className="text-amber-600 dark:text-amber-400">{st.nuovoProtocollo}</span>
                      </div>
                    )}

                    {st.note && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200 dark:border-slate-900">
                        "{st.note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sollecito' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  Messaggio di Sollecito Preformattato
                </span>
                <button
                  onClick={handleCopySollecito}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiato!' : 'Copia Testo'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={testoSollecito}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed resize-none focus:outline-none shadow-sm"
              />

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Canali pronti all'uso:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      `Sollecito Scadenza: ${scadenza.titolo}`
                    )}&body=${encodeURIComponent(testoSollecito)}`}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    Apri Client Email
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(testoSollecito)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Invia WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Sei sicuro di voler eliminare la scadenza "${scadenza.titolo}"?`)) {
                deleteScadenza(scadenza.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-xl flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Elimina Voce</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRinnovo(scadenza);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rinnova Scadenza Ora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
