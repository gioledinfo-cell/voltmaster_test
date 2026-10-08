import React, { useState } from 'react';
import { X, CheckCircle2, QrCode, Wrench, Clock, FileSignature, ArrowRight, ArrowLeft, ShieldCheck, Box } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SignatureModal } from './SignatureModal';

interface FlussoCantiereModalProps {
  onClose: () => void;
}

export const FlussoCantiereModal: React.FC<FlussoCantiereModalProps> = ({ onClose }) => {
  const { cantieri, lavorazioni, magazzino, attrezzature, addROL, showToast, currentUser } = useApp();

  const [step, setStep] = useState<number>(1);
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(cantieri[0]?.id || '');
  const [selectedLavorazioneId, setSelectedLavorazioneId] = useState<string>('');
  const [selectedAttrezzatureIds, setSelectedAttrezzatureIds] = useState<string[]>([]);
  const [selectedMateriali, setSelectedMateriali] = useState<{ id: string; nome: string; quantita: number; unita: string }[]>([]);
  
  // Work log fields
  const [oreOrdinarie, setOreOrdinarie] = useState<number>(8);
  const [oreStraordinarie, setOreStraordinarie] = useState<number>(0);
  const [descrizioneLavori, setDescrizioneLavori] = useState<string>('Completata posa canalizzazioni e infilaggio cavi dorsale BT.');
  const [noteOperatore, setNoteOperatore] = useState<string>('Verificata assenza tensione con voltmetro certificato prima dell’intervento.');

  // Signature state
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<{ url: string; name: string; timestamp: string } | null>(null);
  const [abilitaFirmaEInvioCliente, setAbilitaFirmaEInvioCliente] = useState<boolean>(false);

  const currentCantiere = cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0];
  const cantiereLavorazioni = lavorazioni.filter((l) => l.cantiereId === selectedCantiereId);

  const handleToggleAttrezzatura = (id: string) => {
    setSelectedAttrezzatureIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddMateriale = (matId: string) => {
    const item = magazzino.find((m) => m.id === matId);
    if (!item) return;
    if (selectedMateriali.some((m) => m.id === matId)) return;
    setSelectedMateriali((prev) => [
      ...prev,
      { id: item.id, nome: item.nome, quantita: 10, unita: item.unitaMisura },
    ]);
  };

  const handleFinalSubmit = () => {
    if (!currentCantiere) return;

    const lav = lavorazioni.find((l) => l.id === selectedLavorazioneId);

    const newRol = addROL({
      data: new Date().toISOString().split('T')[0],
      operatoreId: currentUser.id,
      operatoreNome: currentUser.name,
      cantiereId: currentCantiere.id,
      cantiereTitolo: currentCantiere.titolo,
      clienteNome: currentCantiere.clienteNome,
      lavorazioneId: lav ? lav.id : undefined,
      lavorazioneTitolo: lav ? lav.titolo : undefined,
      oreOrdinarie,
      oreStraordinarie,
      oreTotali: oreOrdinarie + oreStraordinarie,
      descrizioneLavori,
      materialiUtilizzati: selectedMateriali.map((m) => ({
        nome: m.nome,
        quantita: m.quantita,
        unita: m.unita,
      })),
      noteOperatore,
      abilitaFirmaEInvioCliente,
      stato: abilitaFirmaEInvioCliente && signatureData ? 'inviato' : 'bozza',
      firmaClientePresente: abilitaFirmaEInvioCliente && !!signatureData,
      firmaClienteNome: abilitaFirmaEInvioCliente ? signatureData?.name : undefined,
      firmaClienteDataUrl: abilitaFirmaEInvioCliente ? signatureData?.url : undefined,
      firmaClienteTimestamp: abilitaFirmaEInvioCliente ? signatureData?.timestamp : undefined,
      bloccatoModifiche: abilitaFirmaEInvioCliente && !!signatureData,
    });

    if (abilitaFirmaEInvioCliente && signatureData) {
      showToast(`Flusso cantiere concluso! ROL ${newRol.numero} firmato dal committente e inviato.`, 'success');
    } else {
      showToast(`Flusso cantiere concluso! ROL interno ${newRol.numero} salvato per la contabilità.`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl my-3 sm:my-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              Procedura Operativa Standard Cantiere
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Step {step} di 4</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {step === 1 && '1. Ingresso in Cantiere & Check QR Code'}
            {step === 2 && '2. Attrezzature & Materiali di Lavoro'}
            {step === 3 && '3. Esecuzione Attività & Ore Lavorate'}
            {step === 4 && '4. Firma Cliente & Chiusura Lavorazione'}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: CANTIERE SELECTION / SCAN */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              All'arrivo sul luogo dell'intervento, identifica il cantiere scansionando il QR Code all'ingresso o selezionandolo dall'elenco degli incarichi attivi.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Seleziona Cantiere Assegnato:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                {cantieri.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCantiereId(c.id);
                      if (cantiereLavorazioni[0]) {
                        setSelectedLavorazioneId(cantiereLavorazioni[0].id);
                      }
                    }}
                    className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all ${
                      selectedCantiereId === c.id
                        ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-slate-100 ring-1 ring-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{c.codice}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">· {c.citta}</span>
                      </div>
                      <div className="text-xs font-semibold mt-0.5 text-slate-900 dark:text-slate-100">{c.titolo}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.clienteNome}</div>
                    </div>
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                      <QrCode className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {currentCantiere && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <div className="text-slate-700 dark:text-slate-400 mb-1 font-semibold">Note di Sicurezza e DPI Obbligatori Cantiere:</div>
                <div className="text-amber-700 dark:text-amber-300/90 leading-relaxed font-medium">
                  {currentCantiere.noteSicurezza || 'DPI standard (Scarpe antinfortunistiche S3, Casco CE EN 397, Guanti isolanti 1000V).'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ATTREZZATURE & MATERIALI */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Registra gli strumenti di collaudo / attrezzature prelevate e i materiali caricati a bordo furgone per questo cantiere.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Strumenti e Attrezzature in Uso:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attrezzature.map((att) => {
                  const isChecked = selectedAttrezzatureIds.includes(att.id);
                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => handleToggleAttrezzatura(att.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-slate-100 ring-1 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-400 dark:border-slate-600'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="truncate text-xs">
                        <div className="font-medium truncate text-slate-900 dark:text-slate-100">{att.nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{att.matricola}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Materiali da Magazzino Assegnati:
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Clicca per aggiungere</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {magazzino.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAddMateriale(m.id)}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded text-[11px] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {m.nome.split(' ')[0]} {m.nome.split(' ')[1]}
                  </button>
                ))}
              </div>

              {selectedMateriali.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950/60">
                  {selectedMateriali.map((mat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-800/60 text-xs last:border-none">
                      <span className="truncate pr-2 text-slate-800 dark:text-slate-200">{mat.nome}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          value={mat.quantita}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setSelectedMateriali((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantita: val } : item))
                            );
                          }}
                          className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-right font-mono text-xs text-amber-600 dark:text-amber-400 font-bold"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 w-8">{mat.unita}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-dashed border-slate-200 dark:border-slate-800">
                  Nessun materiale ancora aggiunto. Clicca sui pulsanti sopra per aggiungere cavi o apparecchi.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: WORK EXECUTION & HOURS LOGGING */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Lavorazione Pianificata di Riferimento:
              </label>
              <select
                value={selectedLavorazioneId}
                onChange={(e) => setSelectedLavorazioneId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">Attività straordinaria o non pianificata (Testo Libero)</option>
                {cantiereLavorazioni.map((lav) => (
                  <option key={lav.id} value={lav.id}>
                    [{lav.fase}] {lav.titolo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ore Ordinarie:</label>
                <input
                  type="number"
                  step="0.5"
                  value={oreOrdinarie}
                  onChange={(e) => setOreOrdinarie(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ore Straordinarie:</label>
                <input
                  type="number"
                  step="0.5"
                  value={oreStraordinarie}
                  onChange={(e) => setOreStraordinarie(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descrizione Dettagliata dei Lavori Svolti:
              </label>
              <textarea
                rows={3}
                value={descrizioneLavori}
                onChange={(e) => setDescrizioneLavori(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="Descrivi precisamente le attività eseguite, misure effettuate o anomalie riscontrate..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Note Operative / Prescrizioni per il prossimo intervento:
              </label>
              <input
                type="text"
                value={noteOperatore}
                onChange={(e) => setNoteOperatore(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4: CLIENT SIGNATURE & CLOSURE */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Al termine della giornata o dell'intervento, presenta il riepilogo al referente in cantiere per la firma grafometrica sul dispositivo.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cantiere:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{currentCantiere.titolo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Committente:</span>
                <span className="text-slate-900 dark:text-slate-200">{currentCantiere.clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operatore:</span>
                <span className="text-slate-900 dark:text-slate-200">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ore Totali Registrate:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {oreOrdinarie + oreStraordinarie} ore ({oreOrdinarie} ord. + {oreStraordinarie} straord.)
                </span>
              </div>
            </div>

            {/* Option: Firma e Invio al Committente (Default: Disattivata) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg border ${
                      abilitaFirmaEInvioCliente
                        ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Firma e Invio al Committente
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          abilitaFirmaEInvioCliente
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {abilitaFirmaEInvioCliente ? 'ATTIVATA' : 'DISATTIVATA (Predefinita)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {abilitaFirmaEInvioCliente
                        ? 'Richiede la firma touch del committente sul dispositivo prima dell’invio.'
                        : 'Opzione disattivata di default: il rapporto resta per esclusivo uso interno (cantiere e contabilità).'}
                    </div>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => {
                    setAbilitaFirmaEInvioCliente((prev) => {
                      const next = !prev;
                      if (!next) setSignatureData(null);
                      return next;
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    abilitaFirmaEInvioCliente ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                  role="switch"
                  aria-checked={abilitaFirmaEInvioCliente}
                  title="Attiva/Disattiva firma e invio al cliente"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      abilitaFirmaEInvioCliente ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Signature acquisition when activated */}
              {abilitaFirmaEInvioCliente && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Firma Grafometrica Cliente:
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {signatureData
                        ? `Firmato da ${signatureData.name} (${signatureData.timestamp})`
                        : 'Non ancora acquisita'}
                    </div>
                  </div>

                  {signatureData ? (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-24 bg-white rounded p-1 border border-slate-300 flex items-center justify-center">
                        <img src={signatureData.url} alt="Firma" className="max-h-full max-w-full" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSigning(true)}
                        className="text-[11px] text-amber-600 dark:text-amber-400 underline hover:text-amber-500"
                      >
                        Modifica
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSigning(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <FileSignature className="w-4 h-4" />
                      Acquisisci Firma Touch
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>
                {abilitaFirmaEInvioCliente
                  ? 'Il ROL verrà certificato con firma committente e inviato per contabilità e cliente.'
                  : 'Il ROL verrà salvato come rapporto interno di cantiere per verifiche e contabilità.'}
              </span>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200 dark:border-slate-800 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Indietro</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-95 ml-auto"
            >
              <span>Avanti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-95 ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {abilitaFirmaEInvioCliente
                  ? 'Concludi, Firma e Invia'
                  : 'Concludi e Salva ROL Interno'}
              </span>
            </button>
          )}
        </div>

        {/* Embedded Signature Modal if triggered */}
        {isSigning && (
          <SignatureModal
            cantiereTitolo={currentCantiere.titolo}
            clienteNome={currentCantiere.clienteNome}
            rolNumero="Nuovo ROL di Chiusura"
            onClose={() => setIsSigning(false)}
            onSaveSignature={(url, name, timestamp) => {
              setSignatureData({ url, name, timestamp });
              setIsSigning(false);
              showToast('Firma cliente acquisita regolarmente!');
            }}
          />
        )}
      </div>
    </div>
  );
};
