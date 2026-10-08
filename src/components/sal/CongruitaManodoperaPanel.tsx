import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Calculator,
  Building2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  ExternalLink,
  ShieldAlert,
  FileText,
  BadgeAlert,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatoAvanzamentoLavori, CategoriaCongruita, AttestazioneEdilconnect } from '../../types/sal';
import {
  TABELLA_CONGRUITA_DM143,
  CASSE_EDILI_TERRITORIALI,
  SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO,
  calcolaCongruitaManodoperaSAL,
  calcolaOreTotaliRolCantiere,
  richiediAttestazioneEdilconnect,
  calcolaRegolarizzazioneCassaEdile,
} from '../../services/congruitaService';

interface CongruitaManodoperaPanelProps {
  initialSalId?: string;
  onSelectSal?: (salId: string) => void;
  standalone?: boolean;
}

export const CongruitaManodoperaPanel: React.FC<CongruitaManodoperaPanelProps> = ({
  initialSalId,
  onSelectSal,
  standalone = true,
}) => {
  const { sals, rols, cantieri, showToast, updateSal } = useApp();

  const [selectedSalId, setSelectedSalId] = useState<string>(
    initialSalId || sals[0]?.id || ''
  );
  const [categoria, setCategoria] = useState<CategoriaCongruita>('OG11_OS30');
  const [costoOrario, setCostoOrario] = useState<number>(35.0);
  const [giustificativiEuro, setGiustificativiEuro] = useState<number>(0);
  const [usaCumulato, setUsaCumulato] = useState<boolean>(true);
  const [percentualeCustom, setPercentualeCustom] = useState<number>(14.0);
  const [isSimulatingSubappalto, setIsSimulatingSubappalto] = useState<boolean>(false);
  const [isFatturaFinaleChecked, setIsFatturaFinaleChecked] = useState<boolean>(false);
  const [cassaEdileSelezionata, setCassaEdileSelezionata] = useState<string>(
    CASSE_EDILI_TERRITORIALI[0]
  );
  const [isVerifyingCnce, setIsVerifyingCnce] = useState<boolean>(false);
  const [attestazioneGenerata, setAttestazioneGenerata] = useState<AttestazioneEdilconnect | null>(null);
  const [mostraModaleAttestato, setMostraModaleAttestato] = useState<boolean>(false);
  const [mostraModaleRegolarizzazione, setMostraModaleRegolarizzazione] = useState<boolean>(false);

  // Active SAL
  const activeSal = useMemo(() => {
    return sals.find((s) => s.id === selectedSalId) || sals[0];
  }, [sals, selectedSalId]);

  // Determine if this is a final SAL by nature or by user toggle
  const isSalFinaleEffettivo = useMemo(() => {
    if (!activeSal) return false;
    return (
      isFatturaFinaleChecked ||
      activeSal.isSalFinale ||
      activeSal.codiceSal.toLowerCase().includes('finale') ||
      activeSal.codiceSal.toLowerCase().includes('saldo') ||
      activeSal.percentualeAvanzamentoGlobale >= 95
    );
  }, [activeSal, isFatturaFinaleChecked]);

  // Congruità calculation in real time
  const congruita = useMemo(() => {
    if (!activeSal) return null;
    const calc = calcolaCongruitaManodoperaSAL(
      { ...activeSal, isSalFinale: isSalFinaleEffettivo },
      rols,
      categoria,
      costoOrario,
      categoria === 'CUSTOM' ? percentualeCustom : undefined,
      giustificativiEuro,
      usaCumulato
    );

    // Se l'utente ha generato un'attestazione in questa sessione, manteniamola
    if (attestazioneGenerata) {
      calc.attestazioneEdilconnect = attestazioneGenerata;
      calc.bloccoFatturazioneFinale = !attestazioneGenerata.isFatturazioneFinaleSbloccata;
    }

    return calc;
  }, [
    activeSal,
    rols,
    categoria,
    costoOrario,
    percentualeCustom,
    giustificativiEuro,
    usaCumulato,
    isSalFinaleEffettivo,
    attestazioneGenerata,
  ]);

  // Ore ROL statistics
  const statsOre = useMemo(() => {
    if (!activeSal) return { oreTotali: 0, oreOrdinarie: 0, oreStraordinarie: 0, oreSquadra: 0, conteggioRol: 0 };
    return calcolaOreTotaliRolCantiere(
      activeSal.cantiereId,
      activeSal.cantiereNome,
      rols,
      usaCumulato ? undefined : activeSal.periodoInizio,
      activeSal.dataEmissione
    );
  }, [activeSal, rols, usaCumulato]);

  if (!activeSal || !congruita) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        Nessun SAL disponibile per la verifica della congruità.
      </div>
    );
  }

  const catInfo = TABELLA_CONGRUITA_DM143[categoria];

  // Visual Gauge percent clamp (0 to 45%)
  const gaugeMin = congruita.percentualeMinimaTabellare;
  const gaugeCurrent = Math.min(Math.max(congruita.percentualeIncidenzaEffettiva, 0), 45);
  const gaugeTargetPos = (gaugeMin / 45) * 100;
  const gaugeCurrentPos = (gaugeCurrent / 45) * 100;

  // Richiesta / Verifica in tempo reale CNCE Edilconnect
  const handleVerificaCnceEdilconnect = () => {
    setIsVerifyingCnce(true);
    setTimeout(() => {
      const nuovaAttestazione = richiediAttestazioneEdilconnect(
        activeSal,
        congruita,
        cassaEdileSelezionata
      );
      setAttestazioneGenerata(nuovaAttestazione);
      setIsVerifyingCnce(false);

      if (nuovaAttestazione.isFatturazioneFinaleSbloccata) {
        showToast(
          `✓ Attestazione CNCE Edilconnect rilasciata! Protocollo: ${nuovaAttestazione.protocollo}. Fatturazione finale autorizzata.`,
          'success'
        );
      } else {
        showToast(
          `⚠ Attestazione CNCE sospesa: Incidenza ${congruita.percentualeIncidenzaEffettiva}% < ${congruita.percentualeMinimaTabellare}%. Fatturazione finale bloccata fino a regolarizzazione.`,
          'warning'
        );
      }
    }, 600);
  };

  const regolarizzazione = calcolaRegolarizzazioneCassaEdile(congruita);

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER D.M. 143/2021 & CNCE STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3.5 rounded-2xl border shrink-0 ${
                congruita.isCongruo
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {congruita.isCongruo ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  Calcolo Congruità Manodopera D.M. 143/2021
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider border ${
                    congruita.isCongruo
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 animate-pulse'
                  }`}
                >
                  {congruita.isCongruo
                    ? '✓ SOGLIA 14% RISPETTATA · CNCE Rilasciabile'
                    : '⚠ SOTTO SOGLIA 14% · Blocco Fattura Finale'}
                </span>

                {isSalFinaleEffettivo && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    Fase: SAL Finale a Saldo
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Verifica in tempo reale dell'incidenza minima della manodopera per la categoria <strong>OG11/OS30 Impianti Elettrici (soglia minima 14.28%)</strong> e controllo propedeutico all'emissione dell'attestazione CNCE Edilconnect prima della fatturazione finale.
              </p>
            </div>
          </div>

          {/* Quick Select SAL and Print Action */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <select
              value={selectedSalId}
              onChange={(e) => {
                setSelectedSalId(e.target.value);
                setAttestazioneGenerata(null);
                if (onSelectSal) onSelectSal(e.target.value);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {sals.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codiceSal} - {s.cantiereNome} (€ {s.totaleLavoriCumulati.toLocaleString('it-IT')})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setMostraModaleAttestato(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Attestato CNCE A4</span>
            </button>
          </div>
        </div>

        {/* 2. REAL-TIME CNCE EDILCONNECT VERIFICATION STRIP & FINAL INVOICING BANNER */}
        <div
          className={`p-4 rounded-xl border text-xs transition-all ${
            congruita.bloccoFatturazioneFinale
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/70 text-rose-900 dark:text-rose-200'
              : congruita.isCongruo
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/70 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/70 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  congruita.bloccoFatturazioneFinale
                    ? 'bg-rose-500 text-white animate-pulse'
                    : congruita.isCongruo
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {congruita.bloccoFatturazioneFinale ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap font-bold text-sm">
                  <span>
                    {congruita.bloccoFatturazioneFinale
                      ? '⛔ BLOCCO PREVENTIVO FATTURAZIONE FINALE (D.M. 143/2021)'
                      : congruita.isCongruo
                      ? '✓ FATTURAZIONE FINALE SBLOCCATA: CNCE Edilconnect Conforme'
                      : 'ATTENZIONE: Verifica Congruità in Corso (Fattura Intermedia)'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border font-semibold">
                    CNCE Edilconnect LIVE
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-95">
                  {congruita.bloccoFatturazioneFinale ? (
                    congruita.motivoBlocco
                  ) : congruita.isCongruo ? (
                    <>
                      L'incidenza manodopera registrata (<strong>{congruita.percentualeIncidenzaEffettiva}%</strong>) supera la soglia minima di legge per impianti elettrici (<strong>{congruita.percentualeMinimaTabellare}%</strong>). L'attestazione CNCE Edilconnect può essere rilasciata senza riserve, consentendo l'emissione della fattura di saldo e la liquidazione finale da parte del Committente/DL.
                    </>
                  ) : (
                    <>
                      Incidenza provvisoria pari a <strong>{congruita.percentualeIncidenzaEffettiva}%</strong> contro la soglia minima di <strong>{congruita.percentualeMinimaTabellare}%</strong>. Prima di procedere alla chiusura del cantiere o all'emissione della fattura finale di saldo, è necessario colmare il fabbisogno per evitare il blocco del pagamento.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={handleVerificaCnceEdilconnect}
                disabled={isVerifyingCnce}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
                  congruita.isCongruo
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingCnce ? 'animate-spin' : ''}`} />
                <span>
                  {isVerifyingCnce ? 'Interrogazione CNCE...' : 'Verifica Live Edilconnect'}
                </span>
              </button>

              {!congruita.isCongruo && (
                <button
                  type="button"
                  onClick={() => setMostraModaleRegolarizzazione(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Regolarizza (€{Math.abs(congruita.differenzaEuro).toLocaleString('it-IT')})</span>
                </button>
              )}
            </div>
          </div>

          {/* Dati Protocollo Telematico Edilconnect generato */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Protocollo CNCE Edilconnect:</span>
              <strong className="text-slate-800 dark:text-slate-100">{congruita.attestazioneEdilconnect?.protocollo}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Cassa Edile Competente:</span>
              <strong className="text-slate-800 dark:text-slate-100">{congruita.attestazioneEdilconnect?.cassaEdileCompetente}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px]">Stato DURC Online / Rilascio:</span>
              <strong className={congruita.isCongruo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {congruita.attestazioneEdilconnect?.stato === 'rilasciata'
                  ? '✓ RILASCIATA (Attestazione Valida)'
                  : '⚠ REGOLARIZZAZIONE ENTRO 15 GG'}
              </strong>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE CALCULATION CONTROLS */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-500" />
              <span>Parametri di Calcolo e Categoria Ministeriale:</span>
            </span>

            {/* Final invoice toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={isSalFinaleEffettivo}
                onChange={(e) => setIsFatturaFinaleChecked(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
              />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Simula Fase Finale a Saldo (Check Blocco Fattura Attivo)
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Category selection */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria di Lavorazione (D.M. 143/2021):
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaCongruita)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                {Object.values(TABELLA_CONGRUITA_DM143).map((cat) => (
                  <option key={cat.codice} value={cat.codice}>
                    {cat.nome} — Min. {cat.percentualeMinima}%
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block line-clamp-1">
                {catInfo.descrizione}
              </span>
            </div>

            {/* Cassa Edile Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cassa Edile Territoriale:
              </label>
              <select
                value={cassaEdileSelezionata}
                onChange={(e) => setCassaEdileSelezionata(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                {CASSE_EDILI_TERRITORIALI.map((ce) => (
                  <option key={ce} value={ce}>
                    {ce}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Portale CNCE Edilconnect locale
              </span>
            </div>

            {/* Hourly cost */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Costo Orario Convenzionale (€/h):
              </label>
              <input
                type="number"
                step="0.5"
                min="15"
                max="80"
                value={costoOrario}
                onChange={(e) => setCostoOrario(parseFloat(e.target.value) || 35)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Tabella CCNL Elettrici / Cassa Edile
              </span>
            </div>
          </div>

          {/* Subcontractor and justification simulation toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsSimulatingSubappalto(!isSimulatingSubappalto)}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isSimulatingSubappalto
                  ? 'Nascondi inserimento Giustificativi / Subappalti'
                  : 'Aggiungi Giustificativi autorizzati (Subappalto / Noli a caldo con manodopera art. 5)'}
              </span>
            </button>

            {congruita.isCongruo ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Supera la soglia del 14% di +€ {congruita.differenzaEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold font-mono flex items-center gap-1 animate-pulse">
                <XCircle className="w-3.5 h-3.5" />
                <span>Gap dal 14%: € {Math.abs(congruita.differenzaEuro).toLocaleString('it-IT', { minimumFractionDigits: 2 })} ({congruita.oreMancanti} ore)</span>
              </span>
            )}
          </div>

          {isSimulatingSubappalto && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Importo Giustificativo Manodopera Esterna / Subappalti autorizzati (€):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={giustificativiEuro}
                  onChange={(e) => setGiustificativiEuro(parseFloat(e.target.value) || 0)}
                  className="w-48 px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="es. 4500"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">
                  Sommato alla manodopera diretta ai fini del calcolo CNCE (art. 5 D.M. 143/2021).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. VISUAL GAUGE / PROGRESS INDICATOR (WITH 14% EMPHASIS) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">
              Indicatore di Congruità D.M. 143/2021 (OG11/OS30 Impianti Elettrici)
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-500">
                Soglia Minima di Legge: <strong className="text-amber-500">{congruita.percentualeMinimaTabellare}%</strong>
              </span>
              <span
                className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                  congruita.isCongruo
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white animate-pulse'
                }`}
              >
                Incidenza Reale: {congruita.percentualeIncidenzaEffettiva}%
              </span>
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="relative h-6 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            {/* Target threshold line */}
            <div
              className="absolute top-0 bottom-0 z-20 w-1.5 bg-amber-500 shadow-md"
              style={{ left: `${gaugeTargetPos}%` }}
              title={`Soglia minima di legge: ${congruita.percentualeMinimaTabellare}%`}
            />

            {/* Progress Bar Fill */}
            <div
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-mono font-black ${
                congruita.isCongruo
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950'
                  : 'bg-gradient-to-r from-rose-600 to-rose-400 text-white'
              }`}
              style={{ width: `${gaugeCurrentPos}%` }}
            >
              {congruita.percentualeIncidenzaEffettiva}%
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>0%</span>
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <span>▲ Soglia Minima di Legge: {congruita.percentualeMinimaTabellare}%</span>
              <span>(OG11/OS30 D.M. 143/2021)</span>
            </span>
            <span>45%</span>
          </div>
        </div>

        {/* 5. 4-CARDS BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Card 1: Importo Lavori SAL */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Importo Lavori Imponibile
            </span>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              € {congruita.importoLavoriImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {usaCumulato ? 'Cumulato al SAL' : 'Periodo SAL'}
            </span>
          </div>

          {/* Card 2: Fabbisogno Minimo */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
              Fabbisogno Minimo ({congruita.percentualeMinimaTabellare}%)
            </span>
            <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              € {congruita.fabbisognoMinimoManodoperaEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Minimo CNCE Edilconnect
            </span>
          </div>

          {/* Card 3: Manodopera Effettiva ROL */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Manodopera Rilevata (ROL)
            </span>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              € {congruita.valoreManodoperaEffettivaEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
              {congruita.oreRegistrateRol} ore @ €{costoOrario}/h
            </span>
          </div>

          {/* Card 4: Esito & Surplus / Gap */}
          <div
            className={`p-3.5 rounded-xl border ${
              congruita.isCongruo
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
            }`}
          >
            <span
              className={`text-[10px] uppercase font-bold block ${
                congruita.isCongruo ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
              }`}
            >
              {congruita.isCongruo ? 'Surplus di Congruità' : 'Fabbisogno Mancante (Gap)'}
            </span>
            <div
              className={`text-lg font-black font-mono mt-1 ${
                congruita.isCongruo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {congruita.isCongruo ? '+' : '-'}€{' '}
              {Math.abs(congruita.differenzaEuro).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
              {congruita.isCongruo
                ? `+${congruita.differenzaPercentuale}% sopra soglia 14%`
                : `${congruita.oreMancanti} ore-uomo da integrare`}
            </span>
          </div>
        </div>

        {/* 6. DETTAGLI NORMATIVI D.M. 143/2021 & CNCE */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Prescrizioni operative per il rilascio dell'attestazione CNCE Edilconnect prima della fatturazione finale:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>
                  <strong>Obbligo di legge:</strong> Il D.M. 143/2021 impone la verifica per tutti i lavori pubblici e per i lavori privati di importo pari o superiore a € 70.000 (questo cantiere ammonta a € {congruita.importoLavoriImponibile.toLocaleString('it-IT')}).
                </li>
                <li>
                  <strong>Momento della verifica:</strong> L'attestazione di congruità deve essere richiesta all'atto della chiusura dei lavori o contestualmente all'emissione dell'ultimo SAL prima della fattura finale di saldo.
                </li>
                <li>
                  <strong>Sanzione di blocco:</strong> In mancanza di attestazione positiva o di regolarizzazione entro 15 giorni con versamento della quota mancante, la Cassa Edile segnala l'impresa alla Banca Nazionale delle Imprese Irregolari (BNCF), con decadenza del DURC e blocco del pagamento finale da parte del Committente.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE ANTEPRIMA ATTESTATO CNCE EDILCONNECT (A4 STAMPABILE) */}
      {mostraModaleAttestato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-sm sm:text-base">
                  Attestato Ufficiale di Congruità CNCE Edilconnect (D.M. 143/2021)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostraModaleAttestato(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 sm:p-8 bg-slate-100 dark:bg-slate-950/60 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl p-8 border border-slate-300 shadow-xl space-y-6 text-xs print:p-0 print:border-none print:shadow-none">
                {/* Intestazione CNCE */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                      COMMISSIONE NAZIONALE PARITETICA PER LE CASSE EDILI
                    </div>
                    <h2 className="text-base font-black tracking-tight text-slate-900 mt-0.5">
                      CNCE EDILCONNECT · ATTESTAZIONE DI CONGRUITÀ
                    </h2>
                    <span className="text-[10px] text-slate-600 block mt-0.5 font-semibold">
                      Ai sensi del Decreto Ministeriale n. 143 del 25 giugno 2021
                    </span>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-600">
                    <div>Protocollo: <strong>{congruita.attestazioneEdilconnect?.protocollo}</strong></div>
                    <div>Data Rilascio: <strong>{new Date().toLocaleDateString('it-IT')}</strong></div>
                  </div>
                </div>

                {/* Dati Impresa & Cantiere */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Impresa Richiedente:</span>
                    <strong className="text-slate-900 block text-xs">VOLTMASTER IMPIANTI S.R.L.</strong>
                    <span className="text-slate-600">P.IVA: 08234590154 · REA MI-2194830</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cassa Edile Rilascio:</span>
                    <strong className="text-slate-900 block">{congruita.attestazioneEdilconnect?.cassaEdileCompetente}</strong>
                    <span className="text-slate-600">Codice Univoco: {congruita.attestazioneEdilconnect?.codiceUnivocoVerifica}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cantiere Oggetto di Verifica:</span>
                    <strong className="text-slate-900">{activeSal.cantiereNome}</strong>
                    <div className="text-slate-600">Committente: {activeSal.committenteNome} · Codice Commessa: {activeSal.cantiereId.toUpperCase()}</div>
                  </div>
                </div>

                {/* Quadro Economico & Incidenza Manodopera */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Quadro di Controllo Incidenza Manodopera
                  </div>
                  <div className="divide-y divide-slate-200">
                    <div className="flex justify-between p-2">
                      <span>Categoria di lavorazione prevalente:</span>
                      <span className="font-bold">{catInfo.nome}</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span>Soglia minima di legge (D.M. 143/2021):</span>
                      <span className="font-mono font-bold text-amber-700">{congruita.percentualeMinimaTabellare}%</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span>Valore imponibile dei lavori eseguiti:</span>
                      <span className="font-mono font-bold">€ {congruita.importoLavoriImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span>Valore complessivo manodopera rilevata (ROL + subappalti):</span>
                      <span className="font-mono font-bold">€ {congruita.valoreManodoperaEffettivaEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ({congruita.oreRegistrateRol} ore)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-sm">
                      <span>Percentuale di Incidenza Effettiva:</span>
                      <span className={`font-mono font-black ${congruita.isCongruo ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {congruita.percentualeIncidenzaEffettiva}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Esito Formale */}
                <div
                  className={`p-4 rounded-xl border text-center space-y-1 ${
                    congruita.isCongruo
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="font-black text-sm uppercase tracking-wide">
                    {congruita.isCongruo
                      ? 'ESITO: CONGRUITA POSITIVAMENTE ATTESTATA'
                      : 'ESITO: MANCATO RAGGIUNGIMENTO DELLA CONGRUITA'}
                  </div>
                  <p className="text-[11px]">
                    {congruita.isCongruo
                      ? 'La manodopera denunciata soddisfa i requisiti minimi di legge. Autorizzata l’emissione della fattura finale di saldo.'
                      : 'Fatturazione finale bloccata fino al perfezionamento della procedura di regolarizzazione art. 5 D.M. 143/2021.'}
                  </p>
                </div>

                {/* Timbri e Riconoscimento */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-[10px]">
                  <div className="border border-dashed border-slate-300 p-3 rounded text-center">
                    <span className="text-slate-500 block mb-8">Sigillo Telematico Edilconnect:</span>
                    <span className="font-mono text-[9px] text-slate-400">SHA256: 7fa012...89be</span>
                  </div>
                  <div className="border border-dashed border-slate-300 p-3 rounded text-center">
                    <span className="text-slate-500 block mb-8">La Cassa Edile Competente:</span>
                    <span className="font-bold text-slate-700">{cassaEdileSelezionata}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Valido per esibizione alla Stazione Appaltante o Committenza Privata</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostraModaleAttestato(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE PROCEDURA DI REGOLARIZZAZIONE CASSA EDILE */}
      {mostraModaleRegolarizzazione && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500/10">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Coins className="w-5 h-5" />
                <h3 className="font-black text-sm sm:text-base">
                  Procedura di Regolarizzazione Cassa Edile (Art. 5 D.M. 143/2021)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostraModaleRegolarizzazione(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                In caso di mancato raggiungimento della soglia minima (14% per OG11/OS30), il D.M. 143/2021 consente all'impresa di versare la differenza di manodopera alla Cassa Edile competente entro <strong>{regolarizzazione.termineGiorni} giorni</strong> per sbloccare l'attestazione ed evitare l'iscrizione in BNCF.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Importo da versare:</span>
                  <span className="font-mono font-black text-lg text-rose-600 dark:text-rose-400">
                    € {regolarizzazione.importoRegolarizzazioneEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                  <span>Ore-uomo equivalenti:</span>
                  <span>{regolarizzazione.oreEquivalenti} ore</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                  <span>Ente destinatario:</span>
                  <span>{cassaEdileSelezionata}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Causale bollettino PagoPA / Bonifico:</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300 font-bold mt-0.5 select-all">
                    {regolarizzazione.causaleBollettino}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Simula versamento e sblocco
                    const attestazioneSbloccata: AttestazioneEdilconnect = {
                      protocollo: congruita.attestazioneEdilconnect?.protocollo || 'CNCE-REG-2026',
                      codiceUnivocoVerifica: congruita.attestazioneEdilconnect?.codiceUnivocoVerifica || 'AUTH-REG',
                      dataRichiesta: new Date().toISOString().split('T')[0],
                      dataRilascio: new Date().toISOString().split('T')[0],
                      cassaEdileCompetente: cassaEdileSelezionata,
                      stato: 'rilasciata',
                      isFatturazioneFinaleSbloccata: true,
                      note: `Regolarizzazione economica di € ${regolarizzazione.importoRegolarizzazioneEuro.toLocaleString('it-IT')} registrata con successo ai sensi dell'art. 5 D.M. 143/2021. Fatturazione finale sbloccata.`,
                    };
                    setAttestazioneGenerata(attestazioneSbloccata);
                    setMostraModaleRegolarizzazione(false);
                    showToast('Regolarizzazione registrata con successo! Attestazione CNCE rilasciata e fatturazione finale sbloccata.', 'success');
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center shadow-md cursor-pointer"
                >
                  Conferma Versamento Regolarizzazione & Sblocca Fattura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
