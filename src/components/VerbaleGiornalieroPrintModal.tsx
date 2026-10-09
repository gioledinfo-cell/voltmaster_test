import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Sun, CloudRain, AlertTriangle, Image as ImageIcon, FileText } from 'lucide-react';
import { GiornaleLavoriItem } from '../types/giornaleLavori';

interface Props {
  giornale: GiornaleLavoriItem;
  onClose: () => void;
}

export const VerbaleGiornalieroPrintModal: React.FC<Props> = ({ giornale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const totalWorkerHours = giornale.maestranze.reduce((sum, m) => sum + (m.presente ? m.oreSvolte : 0), 0);
  const totalDowntimeHours = giornale.imprevisti.reduce((sum, i) => sum + i.oreFermo, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Top Header - No print */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Verbale Giornaliero Cantiere — D.M. 49/2018
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  {giornale.numeroVerbale}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direzione Lavori & Giornale dei Lavori Digitale · {giornale.cantiereTitolo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Stampa / Salva PDF Ufficiale
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 font-sans leading-normal">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="text-xl font-black text-slate-950 tracking-wider">VOLTMASTER ELETTOIMPIANTI S.R.L.</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mt-0.5">
                IMPIANTI ELETTRICI INDUSTRIALI · CABINE MT/BT · AUTOMAZIONE & FOTOVOLTAICO
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Via dell'Elettronica 12, 20138 Milano (MI) · P.IVA 09248100159 · PEC: voltmaster@pec.it
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-950 text-amber-400 text-xs font-black uppercase px-3 py-1 rounded tracking-wider">
                VERBALE GIORNALIERO DL
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">{giornale.numeroVerbale}</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Data: <strong className="text-slate-900">{new Date(giornale.data).toLocaleDateString('it-IT')}</strong>
              </div>
            </div>
          </div>

          {/* Context Meta Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                DATI COMMESSA & CANTIERE
              </span>
              <div className="font-bold text-slate-900 text-sm mb-0.5">{giornale.cantiereTitolo}</div>
              <div className="text-slate-700">Committente: <strong>{giornale.clienteNome}</strong></div>
              {giornale.faseGanttTitolo && (
                <div className="text-slate-700 mt-1 bg-amber-50 text-amber-900 p-1.5 rounded border border-amber-200 font-medium">
                  Fase Cronoprogramma: {giornale.faseGanttTitolo}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                RESPONSABILI & DIREZIONE LAVORI
              </span>
              <div className="text-slate-800 mb-1">
                Direttore dei Lavori (DL): <strong className="text-slate-900">{giornale.direttoreLavoriNome}</strong>
              </div>
              <div className="text-slate-800 mb-1">
                Capocantiere Impresa: <strong className="text-slate-900">{giornale.capocantiereNome}</strong>
              </div>
              <div className="text-emerald-700 font-bold flex items-center gap-1 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Stato Approvazione DL: <span className="uppercase">{giornale.statoApprovazioneDL.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Meteo & Cantiere Status Box */}
          <div className="mb-6 bg-slate-900 text-white p-4 rounded-lg border border-slate-800 text-xs">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">CONDIZIONI METEO</span>
                <div className="text-sm font-bold uppercase text-slate-100 flex items-center gap-2">
                  <span>{giornale.meteo.condizione}</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    ({giornale.meteo.temperaturaMin}°C / {giornale.meteo.temperaturaMax}°C)
                  </span>
                </div>
                {giornale.meteo.impraticabilitaCantiere && (
                  <span className="inline-block mt-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ⚠️ IMPRATICABILITÀ REGISTRATA
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">MAESTRANZE & RISORSE</span>
                <div className="text-sm font-mono font-bold text-slate-100">
                  {giornale.maestranze.filter((m) => m.presente).length} Tecnici Presenti
                </div>
                <div className="text-xs text-slate-300 font-mono">Totale: {totalWorkerHours} ore-uomo</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">AVANZAMENTO OPERATIVO</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-emerald-300 font-mono">{giornale.avanzamentoPercentuale}%</span>
                  <div className="flex-1 bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${giornale.avanzamentoPercentuale}%` }} />
                  </div>
                </div>
                {giornale.quantitaPosata && (
                  <div className="text-[11px] text-slate-300 mt-1 truncate">{giornale.quantitaPosata}</div>
                )}
              </div>
            </div>
          </div>

          {/* Lavorazioni Eseguite */}
          <div className="mb-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
              1. LAVORAZIONI ESEGUITE IN GIORNATA
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
              {giornale.lavorazioniEseguite}
            </div>
          </div>

          {/* Maestranze e Subappalti */}
          <div className="mb-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
              2. MAESTRANZE E PERSONALE OPERATIVO PRESENTE ({giornale.maestranze.length} UNITÀ)
            </h4>
            <table className="w-full text-left border border-slate-200 rounded-lg text-xs overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <th className="p-2">Operatore / Tecnico</th>
                  <th className="p-2">Qualifica / Ruolo</th>
                  <th className="p-2">Impresa / Ditta</th>
                  <th className="p-2 text-right">Ore Presente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {giornale.maestranze.map((m, idx) => (
                  <tr key={idx} className={m.presente ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                    <td className="p-2 font-semibold">{m.nome}</td>
                    <td className="p-2 text-slate-600">{m.ruolo}</td>
                    <td className="p-2 font-medium text-slate-700">{m.ditta}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {m.presente ? `${m.oreSvolte} h` : 'Assente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Macchinari e Attrezzature */}
          {giornale.attrezzature && giornale.attrezzature.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                3. MACCHINARI & ATTREZZATURE IMPIEGATE
              </h4>
              <table className="w-full text-left border border-slate-200 rounded-lg text-xs overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <th className="p-2">Macchinario / Mezzo</th>
                    <th className="p-2">Matricola / Targa</th>
                    <th className="p-2">Operatore Abilitato</th>
                    <th className="p-2 text-right">Ore Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {giornale.attrezzature.map((a, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold">{a.nome}</td>
                      <td className="p-2 font-mono text-slate-600">{a.matricolaTarga || 'N/A'}</td>
                      <td className="p-2 text-slate-700">{a.operatoreUtilizzatore || 'Squadra VoltMaster'}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">{a.oreUtilizzo} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Imprevisti e Fermi Cantiere */}
          {giornale.imprevisti && giornale.imprevisti.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-xs">
              <h4 className="font-extrabold text-red-900 uppercase tracking-wider mb-2 text-xs flex items-center justify-between">
                <span>4. IMPREVISTI, ANOMALIE E FERMI CANTIERE</span>
                <span className="font-mono text-red-800">Totale Fermi: {totalDowntimeHours} ore</span>
              </h4>
              <div className="space-y-2">
                {giornale.imprevisti.map((imp, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-red-200 rounded text-red-950">
                    <div className="flex justify-between font-bold">
                      <span>Ora {imp.oraRiscontro} — Causa: [{imp.causa.toUpperCase()}]</span>
                      <span className="font-mono text-red-700">-{imp.oreFermo} h</span>
                    </div>
                    <p className="mt-1 text-slate-800">{imp.descrizione}</p>
                    {imp.azioniIntraprese && (
                      <p className="mt-1 text-emerald-800 font-medium">✔️ Azione: {imp.azioniIntraprese}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note Direzione Lavori & Sicurezza */}
          {giornale.noteSicurezzaDL && (
            <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950">
              <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1">
                🛡️ NOTE DIREZIONE LAVORI & PRESORIZIONI SICUREZZA
              </span>
              <p className="leading-relaxed text-amber-900 font-medium">{giornale.noteSicurezzaDL}</p>
            </div>
          )}

          {/* Galleria Foto */}
          {giornale.fotoGalleria && giornale.fotoGalleria.length > 0 && (
            <div className="mb-6 print:break-before-auto">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 mb-3">
                5. DOCUMENTAZIONE FOTOGRAFICA DI GIORNATA ({giornale.fotoGalleria.length} FOTO)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {giornale.fotoGalleria.map((foto, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <img src={foto.url} alt={foto.didascalia} className="w-full h-32 object-cover" />
                    <div className="p-2 text-[10px]">
                      <div className="font-bold text-slate-900 truncate">{foto.didascalia}</div>
                      <div className="text-slate-500 font-mono mt-0.5">Ora: {foto.oraScatto} · {foto.categoria}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Seal Box */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">IL CAPOCANTIERE / ESPERTO</span>
                <span className="font-bold text-slate-900">{giornale.capocantiereNome}</span>
              </div>
              <div className="text-center font-mono text-xs text-slate-400 italic">
                [Firmato digitalmente tramite VoltMaster App]
              </div>
              <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-1 font-mono">
                Sigillo: {giornale.sigilloDigitaleHash?.substring(0, 24)}...
              </div>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">IL DIRETTORE DEI LAVORI (DL)</span>
                <span className="font-bold text-slate-900">{giornale.direttoreLavoriNome}</span>
              </div>
              <div className="text-center font-mono text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                VERBALE VISTATO E APPROVATO DL
              </div>
              <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-1 font-mono">
                Approvazione: {giornale.firmaDLDataOra ? new Date(giornale.firmaDLDataOra).toLocaleString('it-IT') : 'Certificata'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
