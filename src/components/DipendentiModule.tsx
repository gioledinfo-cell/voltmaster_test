import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Calendar,
  Award,
  Truck,
  Phone,
  Mail,
  FileText,
  UserCheck,
  Workflow,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Dipendente } from '../types';

interface DipendentiModuleProps {
  onOpenOrganigramma?: () => void;
}

export const DipendentiModule: React.FC<DipendentiModuleProps> = ({ onOpenOrganigramma }) => {
  const { dipendenti, rols, veicoli } = useApp();
  const [selectedDipendente, setSelectedDipendente] = useState<Dipendente | null>(dipendenti[0] || null);
  const [repartoFilter, setRepartoFilter] = useState<string>('tutti');
  const filteredDipendenti = dipendenti.filter(d => repartoFilter === 'tutti' || d.reparto === repartoFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Schemi a Blocchi Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span>Personale Tecnico & Qualifiche CEI</span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              20 Figure
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestione organico, monte ore mensili da ROL, abilitazioni PES/PAV/PEI e ferie/permessi
          </p>
        </div>

        {onOpenOrganigramma && (
          <button
            onClick={onOpenOrganigramma}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02]"
          >
            <Workflow className="w-4 h-4" />
            <span>Schemi a Blocchi dei Ruoli</span>
          </button>
        )}
      </div>

      {/* Reparto Filter Tabs for 20 dipendenti */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-1">Filtra 20 Dipendenti:</span>
        {[
          { key: 'tutti', label: 'Tutti (20)' },
          { key: 'contabilita', label: 'Contabilità (3)' },
          { key: 'ufficio_tecnico', label: 'Ufficio Tecnico (4)' },
          { key: 'capocantiere', label: 'Capi Cantiere (4)' },
          { key: 'operaio', label: 'Operai (4)' },
          { key: 'apprendista', label: 'Apprendisti (5)' },
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => setRepartoFilter(btn.key)}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              repartoFilter === btn.key
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Technicians List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dipendenti e Installatori ({dipendenti.length})</div>

          <div className="space-y-2.5">
            {filteredDipendenti.map((dip) => {
              const isSelected = selectedDipendente?.id === dip.id;
              const veicolo = veicoli.find((v) => v.id === dip.veicoloAssegnatoId);

              return (
                <div
                  key={dip.id}
                  onClick={() => setSelectedDipendente(dip)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/50 dark:bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {dip.nome} {dip.cognome}
                      </h3>
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                        {dip.ruoloAziendale}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {dip.codiceFiscale}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {dip.oreLavorateMeseCorrente} h / mese
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[200px]">
                      {veicolo ? `Furgone: ${veicolo.targa}` : 'Nessun mezzo fisso'}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {dip.patentini.length} Patentini attivi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Technician Detail (7 cols) */}
        <div className="lg:col-span-7">
          {selectedDipendente ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                    {selectedDipendente.nome[0]}{selectedDipendente.cognome[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedDipendente.nome} {selectedDipendente.cognome}
                    </h2>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{selectedDipendente.ruoloAziendale}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Assunto il: {selectedDipendente.dataAssunzione} · Costo orario: {selectedDipendente.costoRiservato || selectedDipendente.costoOrario === 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 italic font-medium">
                          <span>🔒 Riservato Direzione</span>
                        </span>
                      ) : (
                        <strong className="font-mono text-slate-700 dark:text-slate-300">€ {selectedDipendente.costoOrario}/h</strong>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDipendente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDipendente.email}</span>
                  </div>
                </div>
              </div>

              {/* Hours and Leave Balance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Saldo Ore, Ferie & Permessi
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ore Lavorate Mese</span>
                    <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {selectedDipendente.oreLavorateMeseCorrente} h
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ferie Residue</span>
                    <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {selectedDipendente.ferieDisponibiliGiorni} gg
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Permessi ROL</span>
                    <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {selectedDipendente.permessiDisponibiliOre} h
                    </span>
                  </div>
                </div>
              </div>

              {/* Certifications and Licences */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Patentini & Abilitazioni di Sicurezza (Norma CEI 11-27)
                </h4>
                <div className="space-y-2">
                  {selectedDipendente.patentini.map((pat, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{pat}</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">
                        VALIDO
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected ROL History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ultimi Rapporti Giornalieri Eseguiti
                </h4>
                <div className="space-y-2">
                  {rols
                    .filter((r) => r.operatoreId === selectedDipendente.id || r.operatoreNome.includes(selectedDipendente.cognome))
                    .map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{r.numero}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-800 dark:text-slate-300 font-semibold">{r.cantiereTitolo}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{r.descrizioneLavori}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.oreTotali} h</span>
                          <div className="text-[10px] text-slate-500">{r.data}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              Nessun tecnico selezionato.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
