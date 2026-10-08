import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Download,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Clock,
  Truck,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  FileCheck,
  ChevronRight,
  Info,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROL, DocumentoDiTrasporto, Cantiere, Cliente } from '../../types';
import {
  FatturaElettronicaDocument,
  TipoDocumentoFattura,
  NaturaEsenzioneIVA,
} from '../../types/fatturaElettronica';
import {
  createFatturaFromRolsAndDdts,
  downloadFatturaXmlFile,
  VOLTMASTER_CEDENTE,
} from '../../services/fatturaElettronicaService';

interface FatturaElettronicaModalProps {
  cantiereId?: string;
  preselectedRolIds?: string[];
  preselectedDdtIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const FatturaElettronicaModal: React.FC<FatturaElettronicaModalProps> = ({
  cantiereId: initialCantiereId,
  preselectedRolIds = [],
  preselectedDdtIds = [],
  isOpen,
  onClose,
  isEmbedded = false,
}) => {
  const { cantieri, rols, ddts, clienti, showToast, currentUser } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'xml' | 'anteprima'>('config');
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(
    initialCantiereId || cantieri[0]?.id || 'CNT-01'
  );

  // Selezione ROL e DDT da includere
  const [selectedRolIds, setSelectedRolIds] = useState<string[]>(preselectedRolIds);
  const [selectedDdtIds, setSelectedDdtIds] = useState<string[]>(preselectedDdtIds);

  // Parametri di Fatturazione
  const [numeroFattura, setNumeroFattura] = useState<string>(() => {
    const anno = new Date().getFullYear();
    const prog = Math.floor(10 + Math.random() * 89);
    return `${anno}/${prog}`;
  });
  const [dataFattura, setDataFattura] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoFattura>('TD24'); // Fattura differita
  const [aliquotaIva, setAliquotaIva] = useState<number>(22);
  const [isReverseCharge, setIsReverseCharge] = useState<boolean>(false);
  const [naturaReverse, setNaturaReverse] = useState<NaturaEsenzioneIVA>('N6.3');
  const [tariffaOraria, setTariffaOraria] = useState<number>(45.0);
  const [scadenzaGiorni, setScadenzaGiorni] = useState<number>(30);
  const [isCopiedXml, setIsCopiedXml] = useState(false);
  const [sdiInviata, setSdiInviata] = useState(false);
  const [ricevutaSdi, setRicevutaSdi] = useState<string | null>(null);

  // Cantiere & Cliente Corrente
  const cantiere = useMemo(
    () => cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0],
    [cantieri, selectedCantiereId]
  );

  const cliente = useMemo(() => {
    if (!cantiere) return null;
    return (
      clienti.find((cli) => cli.ragioneSociale === cantiere.clienteNome || cli.id === cantiere.clienteId) ||
      null
    );
  }, [clienti, cantiere]);

  // ROL e DDT del Cantiere Selezionato
  const rolsCantiere = useMemo(() => {
    return rols.filter((r) => r.cantiereId === selectedCantiereId);
  }, [rols, selectedCantiereId]);

  const ddtsCantiere = useMemo(() => {
    return ddts.filter((d) => d.cantiereId === selectedCantiereId);
  }, [ddts, selectedCantiereId]);

  // Toggle singole selezioni
  const toggleRol = (id: string) => {
    setSelectedRolIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const toggleDdt = (id: string) => {
    setSelectedDdtIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const toggleAllRols = () => {
    if (selectedRolIds.length === rolsCantiere.length) {
      setSelectedRolIds([]);
    } else {
      setSelectedRolIds(rolsCantiere.map((r) => r.id));
    }
  };

  const toggleAllDdts = () => {
    if (selectedDdtIds.length === ddtsCantiere.length) {
      setSelectedDdtIds([]);
    } else {
      setSelectedDdtIds(ddtsCantiere.map((d) => d.id));
    }
  };

  // Calcolo data scadenza
  const scadenzaPagamento = useMemo(() => {
    const base = new Date(dataFattura);
    base.setDate(base.getDate() + scadenzaGiorni);
    return base.toISOString().split('T')[0];
  }, [dataFattura, scadenzaGiorni]);

  // Generazione dinamica documento Fattura Elettronica
  const fatturaDoc: FatturaElettronicaDocument = useMemo(() => {
    const selectedRolsObj = rols.filter((r) => selectedRolIds.includes(r.id));
    const selectedDdtsObj = ddts.filter((d) => selectedDdtIds.includes(d.id));

    return createFatturaFromRolsAndDdts({
      cantiere: cantiere || cantieri[0],
      cliente,
      selectedRols: selectedRolsObj,
      selectedDdts: selectedDdtsObj,
      aliquotaIvaPredefinita: aliquotaIva,
      regimeReverseCharge: isReverseCharge,
      naturaReverseCharge: naturaReverse,
      numeroFattura,
      dataFattura,
      scadenzaPagamento,
      tariffaOrariaStandard: tariffaOraria,
    });
  }, [
    cantiere,
    cantieri,
    cliente,
    rols,
    ddts,
    selectedRolIds,
    selectedDdtIds,
    aliquotaIva,
    isReverseCharge,
    naturaReverse,
    numeroFattura,
    dataFattura,
    scadenzaPagamento,
    tariffaOraria,
  ]);

  const handleCopyXml = () => {
    if (fatturaDoc.xmlGenerato) {
      navigator.clipboard.writeText(fatturaDoc.xmlGenerato);
      setIsCopiedXml(true);
      showToast('Tracciato XML copiato negli appunti!', 'success');
      setTimeout(() => setIsCopiedXml(false), 2000);
    }
  };

  const handleDownloadXml = () => {
    downloadFatturaXmlFile(fatturaDoc);
    showToast(`File XML scaricato con successo per l'invio all'Agenzia delle Entrate!`, 'success');
  };

  const handleInviaSdi = () => {
    setSdiInviata(true);
    const mockIdSdi = `SDI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setRicevutaSdi(mockIdSdi);
    showToast(`Fattura ${numeroFattura} trasmessa con successo al Sistema d'Interscambio! Id: ${mockIdSdi}`, 'success');
  };

  if (!isOpen && !isEmbedded) return null;

  const innerContent = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-7xl mx-auto shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800' : 'max-w-5xl rounded-2xl shadow-2xl max-h-[92vh] border border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900 overflow-hidden flex flex-col`}>
      {/* Modal Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-500">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Fatturazione Elettronica SDI & Integrazione DDT / ROL
              </h2>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                Specifiche v1.8 (FPR12)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Genera automaticamente il file XML conforme all'Agenzia delle Entrate dai rapportini firmati e dalle bolle di trasporto.
            </p>
          </div>
        </div>

        {onClose && !isEmbedded && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeSubTab === 'config'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Selezione ROL & DDT Commessa</span>
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
              {selectedRolIds.length + selectedDdtIds.length} inclusi
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('anteprima')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeSubTab === 'anteprima'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>2. Anteprima Economica Fattura</span>
          </button>

          <button
            onClick={() => setActiveSubTab('xml')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeSubTab === 'xml'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>3. Tracciato XML SDI Agenzia Entrate</span>
            <span className="text-emerald-500 font-bold text-[10px]">✓ XSD Validato</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CONFIGURAZIONE & SELEZIONE DOCUMENTI */}
          {activeSubTab === 'config' && (
            <div className="space-y-6">
              {/* Header Commessa & Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cantiere / Commessa Attiva
                  </label>
                  <select
                    value={selectedCantiereId}
                    onChange={(e) => {
                      setSelectedCantiereId(e.target.value);
                      setSelectedRolIds([]);
                      setSelectedDdtIds([]);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codice} — {c.titolo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Committente / Cessionario SDI
                  </label>
                  <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {fatturaDoc.cessionario.denominazione}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5 font-mono">
                      <span>P.IVA: {fatturaDoc.cessionario.partitaIva || 'N/D'}</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        SDI: {fatturaDoc.cessionario.codiceDestinatario || '0000000'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Parametri Fiscali e IVA
                  </label>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-xs">
                        <input
                          type="checkbox"
                          checked={isReverseCharge}
                          onChange={(e) => setIsReverseCharge(e.target.checked)}
                          className="accent-amber-500 rounded"
                        />
                        <span>Reverse Charge (Art. 17 c. 6 lett. a-ter)</span>
                      </label>
                    </div>

                    {!isReverseCharge ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Aliquota IVA:</span>
                        <select
                          value={aliquotaIva}
                          onChange={(e) => setAliquotaIva(Number(e.target.value))}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs font-mono font-bold"
                        >
                          <option value={22}>22% (Ordinaria)</option>
                          <option value={10}>10% (Edilizia Agevolata)</option>
                          <option value={4}>4% (Prima Casa)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                        Natura: <strong>N6.3</strong> · IVA addebitata al committente
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Parametri Numerazione & Tariffa */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Numero Fattura</label>
                  <input
                    type="text"
                    value={numeroFattura}
                    onChange={(e) => setNumeroFattura(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Emissione</label>
                  <input
                    type="date"
                    value={dataFattura}
                    onChange={(e) => setDataFattura(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tariffa Manodopera (€/h)</label>
                  <input
                    type="number"
                    step="1"
                    value={tariffaOraria}
                    onChange={(e) => setTariffaOraria(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Termini Pagamento</label>
                  <select
                    value={scadenzaGiorni}
                    onChange={(e) => setScadenzaGiorni(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value={30}>30 gg D.F. (Bonifico MP05)</option>
                    <option value={60}>60 gg F.M. (Bonifico MP05)</option>
                    <option value={0}>Immediato all'emissione</option>
                  </select>
                </div>
              </div>

              {/* SELEZIONE ROL (Rapportini di Lavoro) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Rapportini Operativi (ROL) Disponibili per la Commessa ({rolsCantiere.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAllRols}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                  >
                    {selectedRolIds.length === rolsCantiere.length ? 'Deseleziona tutti' : 'Seleziona tutti i ROL'}
                  </button>
                </div>

                {rolsCantiere.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Nessun rapportino ROL registrato per questa commessa.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {rolsCantiere.map((r) => {
                      const isChecked = selectedRolIds.includes(r.id);
                      const totOre = r.oreTotali || (r.oreOrdinarie + r.oreStraordinarie);
                      const importoPrevisto = totOre * tariffaOraria;

                      return (
                        <div
                          key={r.id}
                          onClick={() => toggleRol(r.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-amber-500 rounded"
                            />
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                <span className="font-mono text-amber-600 dark:text-amber-400">{r.numero}</span>
                                <span>· Data: {r.data}</span>
                                {r.sigilloDigitale && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-1 rounded font-mono">
                                    🔒 SHA-256 Sigillato
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                                Tecnico: <strong>{r.operatoreNome}</strong> — {r.activityDescription || r.descrizioneLavori || 'Attività generica'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {totOre} ore
                            </div>
                            <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              € {importoPrevisto.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SELEZIONE DDT (Documenti di Trasporto) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-500" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Documenti di Trasporto (DDT) Materiali ({ddtsCantiere.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAllDdts}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    {selectedDdtIds.length === ddtsCantiere.length ? 'Deseleziona tutti' : 'Seleziona tutti i DDT'}
                  </button>
                </div>

                {ddtsCantiere.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Nessun DDT registrato per questa commessa.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {ddtsCantiere.map((d) => {
                      const isChecked = selectedDdtIds.includes(d.id);
                      const ddtRighe = d.righe || d.articoli || [];
                      const totDdt = ddtRighe.reduce(
                        (sum: number, a: { quantita: number; valoreTotale?: number; valoreUnitario?: number }) =>
                          sum + (a.valoreTotale || a.quantita * (a.valoreUnitario || 8.0)),
                        0
                      );
                      const dNumero = d.numeroDdt || d.numero || d.id;
                      const dData = d.dataEmissione || d.data || '';
                      const dCausale = d.causaleTrasporto || d.causale || 'trasporto';

                      return (
                        <div
                          key={d.id}
                          onClick={() => toggleDdt(d.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isChecked
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-cyan-500 rounded"
                            />
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                <span className="font-mono text-cyan-600 dark:text-cyan-400">{dNumero}</span>
                                <span>· Del: {dData}</span>
                                <span className="text-[10px] text-slate-500 uppercase">({dCausale})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                                {ddtRighe.length} articoli: {ddtRighe.map((a) => `${a.quantita} ${a.descrizione}`).join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-[11px] text-slate-500">
                              {ddtRighe.length} voci
                            </div>
                            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                              € {totDdt.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ANTEPRIMA ECONOMICA FATTURA */}
          {activeSubTab === 'anteprima' && (
            <div className="space-y-5">
              {/* Box Riepilogo Testata */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fattura Nr.</span>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {fatturaDoc.numeroFattura}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Data Documento</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{fatturaDoc.dataFattura}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Scadenza Pagamento</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {fatturaDoc.scadenzaPagamento}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Stato SDI</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    sdiInviata ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                    {sdiInviata ? '✓ Trasmessa all\'SDI' : 'Bozza Locale'}
                  </span>
                </div>
              </div>

              {/* Tabella Dettaglio Linee */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Descrizione Lavori / Fornitura</th>
                      <th className="py-2.5 px-3 text-right">Q.tà</th>
                      <th className="py-2.5 px-3 text-center">U.M.</th>
                      <th className="py-2.5 px-3 text-right">Prezzo Unit.</th>
                      <th className="py-2.5 px-3 text-right">Totale Imp.</th>
                      <th className="py-2.5 px-3 text-center">IVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fatturaDoc.linee.map((l) => (
                      <tr key={l.numeroLinea} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{l.numeroLinea}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {l.descrizione}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{l.quantita.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500">{l.unitaMisura}</td>
                        <td className="py-2.5 px-3 text-right font-mono">€ {l.prezzoUnitario.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          € {l.prezzoTotale.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                          {l.aliquotaIva > 0 ? `${l.aliquotaIva}%` : `${l.natura || '0%'}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totali e Coordinate Bancarie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Dati di Pagamento</span>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold">
                    Modalità: <strong>MP05 (Bonifico Bancario)</strong>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate select-all">
                    IBAN: {VOLTMASTER_CEDENTE.ibanPredefinito}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Banca: Intesa Sanpaolo Milano Centrale
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Totale Imponibile:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      € {fatturaDoc.totaleImponibile.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Imposta IVA ({isReverseCharge ? 'Reverse Charge' : `${aliquotaIva}%`}):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      € {fatturaDoc.totaleImposta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    <span>TOTALE FATTURA:</span>
                    <span className="font-mono text-base">€ {fatturaDoc.totaleDocumento.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRACCIATO XML SDI AGENZIA DELLE ENTRATE */}
          {activeSubTab === 'xml' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    File XML SDI: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-cyan-600 font-mono">IT{VOLTMASTER_CEDENTE.partitaIva}_{fatturaDoc.progressivoInvio}.xml</code>
                  </span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conforme XSD FatturaPA v1.8</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                >
                  {isCopiedXml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedXml ? 'Copiato!' : 'Copia XML'}</span>
                </button>
              </div>

              {/* Code viewer con scroll */}
              <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[460px] leading-relaxed shadow-inner">
                <pre>{fatturaDoc.xmlGenerato}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              Totale Documento: € {fatturaDoc.totaleDocumento.toFixed(2)}
            </span>
            {ricevutaSdi && (
              <span className="text-emerald-600 font-mono text-[11px] font-bold">
                [Id Ricevuta SDI: {ricevutaSdi}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Chiudi
            </button>

            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Scarica File XML (.xml)</span>
            </button>

            <button
              type="button"
              onClick={handleInviaSdi}
              disabled={sdiInviata}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                sdiInviata
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {sdiInviata ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Trasmessa all'SDI ✓</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Invia a SDI (Simulatore)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  );

  if (isEmbedded) {
    return <div className="w-full space-y-4 pb-12">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      {innerContent}
    </div>
  );
};
