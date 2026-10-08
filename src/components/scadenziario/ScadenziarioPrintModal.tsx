import React from 'react';
import { X, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ScadenzaItem, calcolaSemaforoScadenza, getBadgeColorSemaforo } from '../../types/scadenze';

interface ScadenziarioPrintModalProps {
  scadenze: ScadenzaItem[];
  onClose: () => void;
  filtroCategoria?: string;
  filtroSemaforo?: string;
}

export const ScadenziarioPrintModal: React.FC<ScadenziarioPrintModalProps> = ({
  scadenze,
  onClose,
  filtroCategoria,
  filtroSemaforo,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const rows = scadenze.map((s) => {
    const calc = calcolaSemaforoScadenza(s.dataScadenza);
    const badge = getBadgeColorSemaforo(calc.stato);
    return { s, calc, badge };
  });

  // Ordina per urgenza (scaduti prima)
  rows.sort((a, b) => a.calc.giorniRimanenti - b.calc.giorniRimanenti);

  const scadutiCount = rows.filter((r) => r.calc.stato === 'scaduto').length;
  const urgentiCount = rows.filter((r) => r.calc.stato === 'urgente_15gg').length;
  const attenzioneCount = rows.filter((r) => r.calc.stato === 'attenzione_30gg').length;
  const regolariCount = rows.filter((r) => r.calc.stato === 'regolare').length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Anteprima di Stampa A4 · Registro Scadenze & Conformità Normativa
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Documento</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (White A4 Style) */}
        <div className="bg-slate-100 dark:bg-slate-950 p-2 sm:p-6 overflow-auto max-h-[80vh] flex justify-center">
          <div className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-relaxed font-sans">
            {/* Header Aziendale Ufficiale */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950">
                  VOLTMASTER IMPIANTI S.R.L.
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Impianti Elettrici Industriali, Cabine MT/BT, Domotica & Energie Rinnovabili
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Via dell'Innovazione Elettrica 42, 20126 Milano (MI) · P.IVA / C.F. 09876543210
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-mono font-bold text-[11px] px-2.5 py-1 rounded">
                  REGISTRO SICUREZZA 81/08
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Data Stampa: {new Date().toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>

            {/* Titolo e Riferimento Normativo */}
            <div className="mb-6 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                REGISTRO GENERALE DELLE SCADENZE, ABILITAZIONI & VERIFICHE PERIODICHE
              </h2>
              <p className="text-[10px] text-slate-600 italic mt-0.5">
                Redatto ai sensi del D.Lgs 81/2008, Norma CEI 64-8 Parte 6, Norma CEI 11-27 e Codice della Strada art. 80
              </p>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-4 gap-3 mb-6 p-3 bg-slate-100 rounded-lg border border-slate-300">
              <div className="text-center border-r border-slate-300">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">
                  🔴 Scadute (Critiche)
                </span>
                <span className="text-base font-black text-rose-700 font-mono">
                  {scadutiCount}
                </span>
              </div>
              <div className="text-center border-r border-slate-300">
                <span className="text-[10px] uppercase font-bold text-orange-700 block">
                  🟠 Alert 15 Giorni
                </span>
                <span className="text-base font-black text-orange-700 font-mono">
                  {urgentiCount}
                </span>
              </div>
              <div className="text-center border-r border-slate-300">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">
                  🟡 Alert 30 Giorni
                </span>
                <span className="text-base font-black text-amber-700 font-mono">
                  {attenzioneCount}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  🟢 Regolari / In corso
                </span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {regolariCount}
                </span>
              </div>
            </div>

            {/* Tabella Dettagliata delle Scadenze */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-[10px] border border-slate-400 border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                    <th className="p-1.5 border-r border-slate-300 text-center w-24">SEMAFORO</th>
                    <th className="p-1.5 border-r border-slate-300 text-left">ADEMPIMENTO & SOGGETTO</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-24">SCADENZA</th>
                    <th className="p-1.5 border-r border-slate-300 text-left">PROTOCOLLO / RIF.</th>
                    <th className="p-1.5 border-r border-slate-300 text-left">ENTE / LABORATORIO</th>
                    <th className="p-1.5 text-left">PRESCRIZIONI OPERATIVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {rows.map(({ s, calc, badge }) => (
                    <tr
                      key={s.id}
                      className={
                        calc.stato === 'scaduto'
                          ? 'bg-rose-50/80'
                          : calc.stato === 'urgente_15gg'
                          ? 'bg-orange-50/60'
                          : ''
                      }
                    >
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            calc.stato === 'scaduto'
                              ? 'bg-rose-200 text-rose-900 border border-rose-400'
                              : calc.stato === 'urgente_15gg'
                              ? 'bg-orange-200 text-orange-900 border border-orange-400'
                              : calc.stato === 'attenzione_30gg'
                              ? 'bg-amber-200 text-amber-900 border border-amber-400'
                              : 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                          }`}
                        >
                          {calc.stato === 'scaduto'
                            ? `SCADUTO (${Math.abs(calc.giorniRimanenti)}g)`
                            : calc.stato === 'urgente_15gg'
                            ? `15 GG (${calc.giorniRimanenti}g)`
                            : calc.stato === 'attenzione_30gg'
                            ? `30 GG (${calc.giorniRimanenti}g)`
                            : 'REGOLARE'}
                        </span>
                      </td>

                      <td className="p-1.5 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{s.titolo}</div>
                        <div className="text-slate-600 text-[9px]">
                          {s.soggetto} {s.ruoloORipartizione && `(${s.ruoloORipartizione})`}
                        </div>
                      </td>

                      <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">
                        {s.dataScadenza}
                      </td>

                      <td className="p-1.5 border-r border-slate-300 font-mono text-slate-700">
                        {s.protocolloONumero || '-'}
                      </td>

                      <td className="p-1.5 border-r border-slate-300 text-slate-700">
                        {s.enteRilascio || '-'}
                      </td>

                      <td className="p-1.5 text-slate-600 leading-tight">
                        {s.note || s.descrizione}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note Legali e Firme Ufficiali */}
            <div className="border-t border-slate-400 pt-5 mt-8">
              <p className="text-[9px] text-slate-500 mb-8 italic">
                Il presente documento attesta lo stato di conformità normativa degli strumenti di misura CEI 64-8, delle qualifiche PES/PAV del personale operante su parti attive, dei mezzi aziendali e della regolarità contributiva DURC. Ogni anomalia evidenziata in rosso costituisce blocco operativo con diffida d'uso.
              </p>

              <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
                <div>
                  <div className="border-b border-slate-400 pb-12 mb-1" />
                  <span className="font-bold block text-slate-900">Il Datore di Lavoro</span>
                  <span className="text-slate-500 text-[9px]">Marco Rossi</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-12 mb-1" />
                  <span className="font-bold block text-slate-900">Il Responsabile RSPP</span>
                  <span className="text-slate-500 text-[9px]">Ing. Roberto Fontana</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-12 mb-1" />
                  <span className="font-bold block text-slate-900">Il Medico Competente</span>
                  <span className="text-slate-500 text-[9px]">Dott.ssa Laura Conti</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
