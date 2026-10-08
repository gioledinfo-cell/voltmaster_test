import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronRight,
  Eye,
  Building2,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLPrintModal } from './ROLPrintModal';

export const ContabilitaDashboard: React.FC = () => {
  const { rols, cantieri, dipendenti, approveROL, rejectROL, showToast, setActiveTab } = useApp();
  const [filterPeriodo, setFilterPeriodo] = useState<'mese' | 'tutti'>('mese');
  const [selectedRepartoFilter, setSelectedRepartoFilter] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [printingROL, setPrintingROL] = useState<any | null>(null);

  // Filter ROLs
  const pendingRols = rols.filter((r) => r.stato === 'inviato');
  const approvedRols = rols.filter((r) => r.stato === 'approvato');

  // KPI calculations
  const totalOreApprovate = approvedRols.reduce((acc, r) => acc + r.oreTotali, 0);
  const totalOrePendenti = pendingRols.reduce((acc, r) => acc + r.oreTotali, 0);

  // Manodopera cost calculation from approved ROLs
  const totaleCostoManodopera = approvedRols.reduce((acc, r) => {
    const dip = dipendenti.find((d) => d.id === r.operatoreId || `${d.nome} ${d.cognome}` === r.operatoreNome);
    const hourlyCost = dip ? dip.costoOrario : 32;
    return acc + r.oreTotali * hourlyCost;
  }, 0);

  // Total budget and consuntivato
  const totaleBudgetCantieri = cantieri.reduce((acc, c) => acc + c.budgetTotale, 0);
  const totaleConsuntivato = cantieri.reduce((acc, c) => acc + c.costiConsuntivati, 0);
  const margineGlobalePercent = totaleBudgetCantieri > 0
    ? Math.round(((totaleBudgetCantieri - totaleConsuntivato) / totaleBudgetCantieri) * 100)
    : 0;

  // Filtered ROLs table
  const displayedRols = rols.filter((r) => {
    const matchesSearch =
      r.operatoreNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cantiereTitolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.numero.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner specific for Contabilità */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-purple-950/70 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-purple-800/40 rounded-2xl p-5 sm:p-6 shadow-xs dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                  Interfaccia 1 di 3 · 3 Addetti
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Ufficio Amministrazione & HR</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Pannello Controllo Gestione, ROL & Paghe
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Validazione ore campo per consulente del lavoro, consuntivazione manodopera e marginalità commesse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                showToast('Report ore esportato in formato Excel per consulente paghe', 'success');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Esporta Foglio Paghe</span>
            </button>
            <button
              onClick={() => setActiveTab('cantieri')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-purple-600/20"
            >
              <Building2 className="w-4 h-4" />
              <span>Analisi Margini Cantieri</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ROL da Validare */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ROL da Validare (Paghe)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{pendingRols.length}</span>
            <span className="text-xs text-slate-400">({totalOrePendenti} ore da approvare)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {pendingRols.length > 0 ? 'Richiede visto prima della chiusura mese' : 'Tutti i rapportini sono validati'}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Ore Validate Mese */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ore Certificate a Campo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalOreApprovate} h</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+12% vs mese prec.</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Distribuite sui 13 tecnici in cantiere
          </div>
        </div>

        {/* Card 3: Costo Manodopera Consuntivato */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Costo Reale Manodopera</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">
              € {totaleCostoManodopera.toLocaleString('it-IT')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Calcolato per singolo costo orario dipendente
          </div>
        </div>

        {/* Card 4: Margine Globale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Marginalità Media Commesse</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{margineGlobalePercent}%</span>
            <span className="text-xs text-slate-400 font-mono">
              (Budget: €{(totaleBudgetCantieri / 1000).toFixed(0)}k)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Residuo utile su tutti i cantieri attivi
          </div>
        </div>
      </div>

      {/* Main Section: ROL Validation Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Coda di Validazione ROL (Rapportini Operativi di Lavoro)
              </h2>
              {pendingRols.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded font-mono font-bold">
                  {pendingRols.length} da verificare
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Approva le ore registrate da Capi Cantiere, Operai e Apprendisti prima del passaggio a busta paga
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca dipendente, cantiere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Table of ROLs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Num. ROL / Data</th>
                <th className="py-2.5 px-3">Tecnico & Reparto</th>
                <th className="py-2.5 px-3">Cantiere / Cliente</th>
                <th className="py-2.5 px-3">Ore Ord / Str</th>
                <th className="py-2.5 px-3">Costo Calcolato</th>
                <th className="py-2.5 px-3">Firma Cliente</th>
                <th className="py-2.5 px-3">Stato</th>
                <th className="py-2.5 px-3 text-right">Azioni Contabili</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {displayedRols.map((rol) => {
                const dip = dipendenti.find(
                  (d) => d.id === rol.operatoreId || `${d.nome} ${d.cognome}` === rol.operatoreNome
                );
                const hourlyCost = dip ? dip.costoOrario : 32;
                const totalCost = rol.oreTotali * hourlyCost;

                return (
                  <tr key={rol.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-200">{rol.numero}</div>
                      <div className="text-[10px] text-slate-500">{rol.data}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">{rol.operatoreNome}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 capitalize">
                        {dip ? `${dip.reparto.replace('_', ' ')} (€${dip.costoOrario}/h)` : 'Operativo'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]" title={rol.cantiereTitolo}>
                        {rol.cantiereTitolo}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{rol.clienteNome}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{rol.oreOrdinarie}h</span>
                      {rol.oreStraordinarie > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 ml-1 font-bold">+{rol.oreStraordinarie}h str.</span>
                      )}
                      <div className="text-[10px] text-slate-500 font-sans">Tot: {rol.oreTotali}h</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-700 dark:text-purple-300 font-bold">
                      € {totalCost.toLocaleString('it-IT')}
                    </td>
                    <td className="py-3 px-3">
                      {rol.firmaClientePresente ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Firmato
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Non richiesta</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {rol.stato === 'inviato' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 animate-pulse">
                          In Attesa Visto
                        </span>
                      ) : rol.stato === 'approvato' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                          Approvato Paghe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                          Respinto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintingROL(rol)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Stampa / Visualizza PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {rol.stato === 'inviato' && (
                          <>
                            <button
                              onClick={() => approveROL(rol.id, 'Verificato e validato da Ufficio Contabilità')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors"
                              title="Approva e manda alle paghe"
                            >
                              Approva
                            </button>
                            <button
                              onClick={() => {
                                const motivo = prompt('Motivo del rifiuto del ROL:');
                                if (motivo) rejectROL(rol.id, motivo);
                              }}
                              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded text-[11px] transition-colors"
                              title="Respingi per rettifica"
                            >
                              Respingi
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROL Print Modal */}
      {printingROL && (
        <ROLPrintModal rol={printingROL} onClose={() => setPrintingROL(null)} />
      )}
    </div>
  );
};
