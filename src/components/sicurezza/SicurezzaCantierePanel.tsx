import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  FileCheck,
  Users,
  HardHat,
  Plus,
  Calendar,
  Building2,
  Clock,
  Printer,
  Download,
  AlertCircle,
  Check,
  ExternalLink,
  Lock,
  Stethoscope,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CruscottoSicurezzaCantiere,
  DocumentoSicurezzaCantiere,
  IdoneitaSanitariaLavoratore,
} from '../../types/sicurezzaCantiere';
import {
  getCruscottoSicurezzaCantiere,
  INITIAL_DOCUMENTI_SICUREZZA,
  getRegistroIdoneitaDipendenti,
} from '../../data/mockSicurezza';

interface SicurezzaCantierePanelProps {
  cantiereId?: string;
  onSelectCantiere?: (cantiereId: string) => void;
}

export const SicurezzaCantierePanel: React.FC<SicurezzaCantierePanelProps> = ({
  cantiereId: initialCantiereId,
}) => {
  const { cantieri, showToast, currentUser } = useApp();
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(
    initialCantiereId || cantieri[0]?.id || 'CNT-01'
  );

  const [cruscotto, setCruscotto] = useState<CruscottoSicurezzaCantiere>(() =>
    getCruscottoSicurezzaCantiere(selectedCantiereId)
  );

  const [documenti, setDocumenti] = useState<DocumentoSicurezzaCantiere[]>(() =>
    INITIAL_DOCUMENTI_SICUREZZA.filter((d) => d.cantiereId === selectedCantiereId)
  );

  const [registroOperatori, setRegistroOperatori] = useState<IdoneitaSanitariaLavoratore[]>(() =>
    getRegistroIdoneitaDipendenti()
  );

  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('tutti');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubappaltoModalOpen, setIsSubappaltoModalOpen] = useState(false);

  // GDPR & D.Lgs. 81/08: Segregazione dati sanitari (RSPP / Medico Competente)
  const [isRsppSimulationActive, setIsRsppSimulationActive] = useState<boolean>(() => {
    return currentUser.role === 'amministratore' || (currentUser.role as string).toLowerCase().includes('rspp');
  });

  // Modulo Subappalti & Qualifica Ditte Esterne (DURC 120 giorni ex Art. 90 D.Lgs. 81/08)
  const [subappaltatori, setSubappaltatori] = useState([
    {
      id: 'SUB-01',
      ragioneSociale: 'Edilstrutture Milanesi S.r.l.',
      partitaIva: '08129480153',
      lavorazione: 'Opere murarie, tracce, carotaggi e forometrie',
      protocolloDurc: 'INAIL_42819033',
      dataRilascioDurc: '2026-08-15',
      dataScadenzaDurc: '2026-12-13', // 120 giorni
      posApprovato: true,
      visuraCamerale: true,
      organicoMedio: 8,
      referente: 'Ing. M. Bellini (335 1294812)',
    },
    {
      id: 'SUB-02',
      ragioneSociale: 'Clima & Reti Impianti S.n.c.',
      partitaIva: '04910280158',
      lavorazione: 'Canalizzazioni aria e impianti di climatizzazione VRF',
      protocolloDurc: 'INPS_39012481',
      dataRilascioDurc: '2026-06-01',
      dataScadenzaDurc: '2026-09-29', // Scaduto
      posApprovato: true,
      visuraCamerale: true,
      organicoMedio: 4,
      referente: 'P.I. L. Ferri (347 9821034)',
    },
    {
      id: 'SUB-03',
      ragioneSociale: 'SicurData Cablaggi Speciali S.r.l.',
      partitaIva: '09381020150',
      lavorazione: 'Posa fibra ottica e collaudo certificato OTDR',
      protocolloDurc: 'INAIL_43901249',
      dataRilascioDurc: '2026-09-10',
      dataScadenzaDurc: '2027-01-08',
      posApprovato: false, // In attesa di approvazione dal CSE
      visuraCamerale: true,
      organicoMedio: 6,
      referente: 'Sig. R. Marchesi (338 5541290)',
    },
  ]);

  // Form nuovo subappalto
  const [subRagione, setSubRagione] = useState('');
  const [subPiva, setSubPiva] = useState('');
  const [subLavorazione, setSubLavorazione] = useState('');
  const [subProtocollo, setSubProtocollo] = useState('');
  const [subRilascio, setSubRilascio] = useState(new Date().toISOString().split('T')[0]);
  const [subReferente, setSubReferente] = useState('');

  // Form nuovo documento
  const [nuovoTipo, setNuovoTipo] = useState<string>('DURC_SUBAPPALTO');
  const [nuovoTitolo, setNuovoTitolo] = useState('');
  const [nuovoSoggetto, setNuovoSoggetto] = useState('');
  const [nuovoProtocollo, setNuovoProtocollo] = useState('');
  const [nuovaScadenza, setNuovaScadenza] = useState('2026-12-31');

  useEffect(() => {
    setCruscotto(getCruscottoSicurezzaCantiere(selectedCantiereId));
    setDocumenti(INITIAL_DOCUMENTI_SICUREZZA.filter((d) => d.cantiereId === selectedCantiereId));
  }, [selectedCantiereId]);

  const currentCantiere = cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0];
  const assegnatiIds = currentCantiere?.operatoriAssegnatiIds || [];
  const operatoriCantiere = registroOperatori.filter((op) =>
    assegnatiIds.includes(op.dipendenteId)
  );

  const handleAddDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoTitolo || !nuovoSoggetto) {
      showToast('Compila i campi obbligatori del documento', 'error');
      return;
    }

    const doc: DocumentoSicurezzaCantiere = {
      id: `SIC-${Date.now().toString(36)}`,
      cantiereId: selectedCantiereId,
      tipo: nuovoTipo as any,
      titolo: nuovoTitolo,
      soggetto: nuovoSoggetto,
      protocolloNumero: nuovoProtocollo || `PROT-${Date.now().toString(36).toUpperCase()}`,
      dataRilascio: new Date().toISOString().split('T')[0],
      dataScadenza: nuovaScadenza,
      stato: 'valido',
      approvatoDa: `${currentUser.name} (${currentUser.role})`,
      dataApprovazione: new Date().toISOString().split('T')[0],
      noteConformita: 'Verificato e acquisito agli atti di cantiere.',
      obbligatorioPerAccesso: true,
    };

    setDocumenti((prev) => [doc, ...prev]);
    setIsAddModalOpen(false);
    setNuovoTitolo('');
    setNuovoSoggetto('');
    setNuovoProtocollo('');
    showToast('Documento di sicurezza registrato agli atti del cantiere!', 'success');
  };

  const filteredDocs = documenti.filter((d) => {
    if (filtroTipoDoc === 'tutti') return true;
    return d.tipo === filtroTipoDoc;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Cantiere Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Conformità D.Lgs. 81/2008 & Titolo IV Cantieri</span>
            </span>
            <span className="text-xs text-slate-500">
              Coordinatore Sicurezza (CSE): <strong>{cruscotto.coordinatoreSicurezzaCSE}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1.5">
            Cruscotto Sicurezza, DURC & Idoneità Lavoratori
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Verifica in tempo reale la regolarità contributiva, i POS approvati e il blocco automatico di accesso per visite mediche scadute.
          </p>
        </div>

        {/* Cantiere Switcher */}
        <div className="w-full md:w-72 shrink-0">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Seleziona Commessa / Cantiere:
          </label>
          <select
            value={selectedCantiereId}
            onChange={(e) => setSelectedCantiereId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {cantieri.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice} — {c.titolo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATO SEMAFORICO GLOBALE & METRICHE CHIAVE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Card 1: Semaforo Cantiere */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            cruscotto.statoGlobaleCantiere === 'verde_conforme'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
              : cruscotto.statoGlobaleCantiere === 'giallo_attenzione'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Stato Cantiere</span>
            {cruscotto.statoGlobaleCantiere === 'verde_conforme' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : cruscotto.statoGlobaleCantiere === 'giallo_attenzione' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div className="text-xl font-black mt-2">
            {cruscotto.statoGlobaleCantiere === 'verde_conforme'
              ? 'CONFORME (ACCESSO APERTO)'
              : cruscotto.statoGlobaleCantiere === 'giallo_attenzione'
              ? 'ATTENZIONE SCADENZE'
              : 'BLOCCO CANTIERE D.LGS 81'}
          </div>
          <div className="text-[11px] opacity-80 mt-1">
            {cruscotto.statoGlobaleCantiere === 'verde_conforme'
              ? 'DURC e POS regolari. Tutte le idoneità sono valide.'
              : cruscotto.statoGlobaleCantiere === 'giallo_attenzione'
              ? 'Scadenze entro 30gg presenti. Rinnovare preventivamente.'
              : 'Rilevate irregolarità o visite mediche scadute. Accesso sospeso.'}
          </div>
        </div>

        {/* Card 2: DURC Aziendale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>D.U.R.C. VoltMaster</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              REGOLARE
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {cruscotto.durcAziendale.protocollo}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Scadenza: <strong>{cruscotto.durcAziendale.scadenza}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              {cruscotto.durcAziendale.giorniRimanenti} gg rimasti
            </span>
          </div>
        </div>

        {/* Card 3: P.O.S. (Piano Operativo Sicurezza) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>P.O.S. Cantiere</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
              APPROVATO CSE
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {cruscotto.posCantiere.revisione}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Validato da: <strong>{cruscotto.posCantiere.approvatoDa || 'CSE Cantiere'}</strong>
          </div>
        </div>

        {/* Card 4: Idoneità Squadra & Blocco */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Operatori Assegnati</span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {operatoriCantiere.length} operai
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {cruscotto.operatoriIdonei} Idonei
            </div>
            {cruscotto.operatoriBloccati > 0 && (
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                {cruscotto.operatoriBloccati} Bloccati
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {cruscotto.operatoriBloccati === 0
              ? 'Nessun blocco sanitario o mancata abilitazione'
              : 'Intervento urgente: rinnovare visita medica prima dell\'accesso'}
          </div>
        </div>
      </div>

      {/* SEZIONE 1: TABELLA IDONEITÀ OPERATORI DI CANTIERE CON BLOCCO AUTOMATICO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-500" />
              <span>Registro Idoneità Lavoratori Assegnati (Art. 41 D.Lgs 81/08)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Controllo automatico delle visite mediche periodiche e dei patentini PES/PAV, PLE e Lavori in Quota con blocco timbratura.
            </p>
          </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Privacy Sanitaria GDPR */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isRsppSimulationActive;
                  setIsRsppSimulationActive(nextState);
                  showToast(
                    nextState
                      ? 'Modalità RSPP / Medico Competente abilitata: consultazione dettagli sanitari autorizzata.'
                      : 'Modalità Preposto attiva: dati sanitari mascherati ai sensi dell\'Art. 9 GDPR.',
                    'info'
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                  isRsppSimulationActive
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Attiva/disattiva la vista privilegiata RSPP/Medico per il trattamento dei dati sanitari"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isRsppSimulationActive ? 'Vista RSPP / Medico (Dati Visibili)' : 'Vista Preposto (GDPR Mascherato)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blockedOp = operatoriCantiere.find((o) => o.bloccatoIngresso) || registroOperatori.find((o) => o.bloccatoIngresso);
                  if (blockedOp) {
                    showToast(
                      `🚨 TEST BLOCCO D.LGS 81/08 ATTIVO: Tentativo di timbratura per ${blockedOp.nomeCompleto} bloccato! Visita medica scaduta (${blockedOp.visitaMedicaScadenza}). Accesso al cantiere non consentito.`,
                      'error'
                    );
                  } else {
                    showToast(
                      'Tutti i lavoratori attualmente assegnati a questa commessa risultano idonei e in regola.',
                      'info'
                    );
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Testa il blocco di sicurezza automatico in tempo reale"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Testa Blocco Timbratura Lavoratore</span>
              </button>

              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                Sorveglianza Sanitaria: <strong>Dott.ssa M. Grassi</strong>
              </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">Lavoratore / Matricola</th>
                <th className="py-2.5 px-3">Mansione di Cantiere</th>
                <th className="py-2.5 px-3">Visita Medica & Scadenza</th>
                <th className="py-2.5 px-3">Abilitazioni (PES/PAV, PLE, Quota)</th>
                <th className="py-2.5 px-3">Stato di Accesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {operatoriCantiere.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nessun lavoratore attualmente assegnato a questo cantiere.
                  </td>
                </tr>
              ) : (
                operatoriCantiere.map((op) => {
                  const isBlocked = op.bloccatoIngresso;

                  return (
                    <tr
                      key={op.dipendenteId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isBlocked ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      {/* Lavoratore */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{op.nomeCompleto}</span>
                          <span className="font-mono text-[10px] text-slate-400">[{op.matricola}]</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{op.reparto.replace('_', ' ')}</div>
                      </td>

                      {/* Mansione */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{op.ruoloAziendale}</span>
                      </td>

                      {/* Visita Medica - Con Segregazione GDPR ex Art. 9 Reg. UE 2016/679 */}
                      <td className="py-3 px-3">
                        {isRsppSimulationActive ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                              <span className={`font-mono font-bold ${
                                op.giorniAllaScadenza < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : op.giorniAllaScadenza <= 30
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {op.visitaMedicaScadenza}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {op.giorniAllaScadenza < 0 ? (
                                <span className="text-rose-600 font-bold">SCADUTA DA {Math.abs(op.giorniAllaScadenza)} GG</span>
                              ) : op.giorniAllaScadenza <= 30 ? (
                                <span className="text-amber-600 font-semibold">In scadenza tra {op.giorniAllaScadenza} gg</span>
                              ) : (
                                <span className="text-emerald-600">Idoneità valida ({op.giorniAllaScadenza} gg)</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              <Lock className="w-3 h-3 text-purple-500 shrink-0" />
                              <span>DATI SANITARI RISERVATI</span>
                            </div>
                            <div className="text-[9px] text-slate-400 italic">
                              Art. 9 GDPR · Visibili solo a RSPP / Medico
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Patentini */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {op.patentiniAbilitazioni.slice(0, 3).map((pat, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                pat.valido
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through'
                              }`}
                              title={pat.denominazione}
                            >
                              {pat.tipo.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Stato Accesso / Blocco */}
                      <td className="py-3 px-3">
                        {isBlocked ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>ACCESSO BLOCCATO</span>
                            </span>
                            <div className="text-[9px] text-rose-600 dark:text-rose-400 max-w-xs leading-tight">
                              {isRsppSimulationActive ? op.motivoBlocco : 'Blocco per prescrizioni di sicurezza (Art. 41 D.Lgs 81/08)'}
                            </div>
                          </div>
                        ) : op.giorniAllaScadenza <= 30 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>IDONEO (PRE-ALLERTA)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>IDONEO AL CANTIERE</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEZIONE 2: SCRIVANIA SUBAPPALTATORI & QUALIFICA FORNITORI (DURC 120 GG - ART. 90 D.LGS. 81/08) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span>Qualifica Subappaltatori & Verifica DURC 120 Giorni (Art. 90 D.Lgs 81/08)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {subappaltatori.length} Imprese
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Controllo idoneità tecnico-professionale delle ditte terze. Il cancello si blocca se il DURC è scaduto o il P.O.S. non è approvato dal CSE.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSubappaltoModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Ditta Subappalto</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">Impresa Subappaltatrice / P.IVA</th>
                <th className="py-2.5 px-3">Lavorazione Affidata</th>
                <th className="py-2.5 px-3">DURC On-Line (Protocollo & Scadenza 120gg)</th>
                <th className="py-2.5 px-3">P.O.S. di Subappalto</th>
                <th className="py-2.5 px-3">Semaforo Accesso Cancello</th>
                <th className="py-2.5 px-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subappaltatori.map((sub) => {
                const oggi = new Date();
                const scad = new Date(sub.dataScadenzaDurc);
                const diffDays = Math.ceil((scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
                const isDurcScaduto = diffDays <= 0;
                const isDurcInScadenza = diffDays > 0 && diffDays <= 15;
                const isBloccato = isDurcScaduto || !sub.posApprovato;

                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isBloccato ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    {/* Ditta */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{sub.ragioneSociale}</div>
                      <div className="font-mono text-[10px] text-slate-400">P.IVA: {sub.partitaIva}</div>
                      <div className="text-[10px] text-slate-500">{sub.referente}</div>
                    </td>

                    {/* Lavorazione */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{sub.lavorazione}</span>
                      <div className="text-[10px] text-slate-500">Organico medio: {sub.organicoMedio} operai</div>
                    </td>

                    {/* DURC */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{sub.protocolloDurc}</div>
                      <div className="text-[10px] text-slate-500">Rilascio: {sub.dataRilascioDurc}</div>
                      <div className="mt-0.5">
                        {isDurcScaduto ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            SCADUTO IL {sub.dataScadenzaDurc} ({Math.abs(diffDays)} gg fa)
                          </span>
                        ) : isDurcInScadenza ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Scadenza {sub.dataScadenzaDurc} (tra {diffDays} gg)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">
                            Valido fino al {sub.dataScadenzaDurc} ({diffDays} gg residui)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* POS */}
                    <td className="py-3 px-3">
                      {sub.posApprovato ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>P.O.S. APPROVATO CSE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>P.O.S. DA APPROVARE</span>
                        </span>
                      )}
                    </td>

                    {/* Semaforo Accesso */}
                    <td className="py-3 px-3">
                      {isBloccato ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>ACCESSO INTERDETTO</span>
                          </span>
                          <div className="text-[9px] text-rose-600 font-medium">
                            {isDurcScaduto ? 'DURC scaduto ex Art. 90' : 'Manca validazione POS'}
                          </div>
                        </div>
                      ) : isDurcInScadenza ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>AUTORIZZATO (PRE-ALLERTA)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AUTORIZZATO AL CANCELLO</span>
                        </span>
                      )}
                    </td>

                    {/* Azioni */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const nuovaScad = new Date();
                          nuovaScad.setDate(nuovaScad.getDate() + 120);
                          const nuovaScadStr = nuovaScad.toISOString().split('T')[0];
                          const nuovoRilascio = new Date().toISOString().split('T')[0];
                          
                          setSubappaltatori(prev => prev.map(s => {
                            if (s.id === sub.id) {
                              return {
                                ...s,
                                dataRilascioDurc: nuovoRilascio,
                                dataScadenzaDurc: nuovaScadStr,
                                protocolloDurc: `INAIL_${Math.floor(40000000 + Math.random() * 9999999)}`,
                                posApprovato: true,
                              };
                            }
                            return s;
                          }));

                          showToast(`DURC per ${sub.ragioneSociale} rinnovato con successo per 120 giorni! Cancello sbloccato.`, 'success');
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        Rinnova DURC (+120gg)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEZIONE 2: ARCHIVIO DOCUMENTALE SICUREZZA CANTIERE (DURC, POS, PSC, DICO) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Fascicolo Tecnico Documenti Sicurezza & Subappalti ({filteredDocs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Attestazioni DURC, verbali POS approvati e certificati obbligatori per l'esibizione agli organi di vigilanza.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro per tipo */}
            <select
              value={filtroTipoDoc}
              onChange={(e) => setFiltroTipoDoc(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="tutti">Tutti i Documenti</option>
              <option value="DURC_AZIENDALE">DURC Aziendale</option>
              <option value="DURC_SUBAPPALTO">DURC Subappalto</option>
              <option value="POS">P.O.S.</option>
              <option value="PSC">P.S.C.</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Documento</span>
            </button>
          </div>
        </div>

        {/* Griglia Documenti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/20">
                  {doc.tipo.replace('_', ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  doc.stato === 'valido'
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                }`}>
                  {doc.stato === 'valido' ? 'REGOLARE' : 'NON CONFORME'}
                </span>
              </div>

              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                {doc.titolo}
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>Soggetto: <strong className="text-slate-700 dark:text-slate-300">{doc.soggetto}</strong></div>
                <div>Protocollo: <span className="font-mono text-slate-600 dark:text-slate-400">{doc.protocolloNumero}</span></div>
                {doc.dataScadenza && (
                  <div>Scadenza: <strong className="text-slate-700 dark:text-slate-300">{doc.dataScadenza}</strong></div>
                )}
                {doc.approvatoDa && (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Approvato da: {doc.approvatoDa}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {doc.fileAllegatoNome || 'Documento agli atti'}
                </span>
                <button
                  onClick={() => showToast(`Download del documento ${doc.titolo} completato.`, 'success')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
                  title="Scarica allegato"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AGGIUNGI DOCUMENTO DI SICUREZZA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Registra Documento di Conformità Cantiere</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDocumento} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Tipologia Documento
                </label>
                <select
                  value={nuovoTipo}
                  onChange={(e) => setNuovoTipo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                >
                  <option value="DURC_SUBAPPALTO">DURC Subappaltatore</option>
                  <option value="POS">P.O.S. (Piano Operativo di Sicurezza)</option>
                  <option value="PSC">P.S.C. (Piano Sicurezza e Coordinamento)</option>
                  <option value="NOMINA_CSE">Nomina Coordinatore CSE</option>
                  <option value="PIANO_EMERGENZA">Piano di Emergenza ed Evacuazione</option>
                  <option value="DICO_DM37">Dichiarazione di Conformità DM 37/08</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Titolo Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. DURC Subappalto Impianti Fotovoltaici"
                  value={nuovoTitolo}
                  onChange={(e) => setNuovoTitolo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Impresa / Professionista Emittente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. ElettroMontaggi S.r.l. - P.IVA 01234567890"
                  value={nuovoSoggetto}
                  onChange={(e) => setNuovoSoggetto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Protocollo / Numero
                  </label>
                  <input
                    type="text"
                    placeholder="es. INPS_3982104"
                    value={nuovoProtocollo}
                    onChange={(e) => setNuovoProtocollo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Data di Scadenza
                  </label>
                  <input
                    type="date"
                    value={nuovaScadenza}
                    onChange={(e) => setNuovaScadenza(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  Registra Agli Atti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGGIUNGI IMPRESA SUBAPPALTO & DURC 120GG */}
      {isSubappaltoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Qualifica Subappaltatore & Registrazione DURC (Art. 90)</span>
              </h3>
              <button
                onClick={() => setIsSubappaltoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!subRagione || !subPiva) {
                  showToast('Ragione sociale e P.IVA obbligatorie', 'error');
                  return;
                }

                const rilascioDate = new Date(subRilascio);
                const scadenzaDate = new Date(rilascioDate);
                scadenzaDate.setDate(scadenzaDate.getDate() + 120);

                const nuovaDitta = {
                  id: `SUB-${Date.now().toString(36).toUpperCase()}`,
                  ragioneSociale: subRagione,
                  partitaIva: subPiva,
                  lavorazione: subLavorazione || 'Lavorazioni specialistiche impiantistiche',
                  protocolloDurc: subProtocollo || `INAIL_${Math.floor(40000000 + Math.random() * 9999999)}`,
                  dataRilascioDurc: subRilascio,
                  dataScadenzaDurc: scadenzaDate.toISOString().split('T')[0],
                  posApprovato: true,
                  visuraCamerale: true,
                  organicoMedio: 5,
                  referente: subReferente || 'Ufficio Tecnico (02 998877)',
                };

                setSubappaltatori(prev => [nuovaDitta, ...prev]);
                setIsSubappaltoModalOpen(false);
                setSubRagione('');
                setSubPiva('');
                setSubLavorazione('');
                setSubProtocollo('');
                setSubReferente('');
                showToast(`Impresa ${subRagione} qualificata con DURC valido per 120 giorni!`, 'success');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Ragione Sociale Impresa Subappaltatrice *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. ElettroTermica Brianza S.r.l."
                  value={subRagione}
                  onChange={(e) => setSubRagione(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Partita IVA / Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. 08912340156"
                    value={subPiva}
                    onChange={(e) => setSubPiva(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Protocollo DURC On-Line
                  </label>
                  <input
                    type="text"
                    placeholder="es. INAIL_42918401"
                    value={subProtocollo}
                    onChange={(e) => setSubProtocollo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Lavorazione Affidata in Subappalto
                </label>
                <input
                  type="text"
                  placeholder="es. Posa canalizzazioni, infilaggio cavi speciali e blindosbarre"
                  value={subLavorazione}
                  onChange={(e) => setSubLavorazione(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Data Rilascio DURC (Inizio 120gg)
                  </label>
                  <input
                    type="date"
                    value={subRilascio}
                    onChange={(e) => setSubRilascio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Referente / Recapito Telefonico
                  </label>
                  <input
                    type="text"
                    placeholder="es. Geom. Rossi (340 1234567)"
                    value={subReferente}
                    onChange={(e) => setSubReferente(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-800 dark:text-indigo-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifica di Idoneità Tecnico-Professionale Automatica</span>
                </div>
                <p>
                  La scadenza viene calcolata a 120 giorni solari dalla data di rilascio. In caso di superamento dei termini, l'accesso al cantiere dei lavoratori della ditta verrà interdetto al cancello.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubappaltoModalOpen(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  Registra Subappaltatore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
