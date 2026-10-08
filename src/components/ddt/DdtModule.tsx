import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Calendar,
  Eye,
  Trash2,
  FileText,
  Building2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentoDiTrasporto, StatoDDT } from '../../types/ddt';
import { DdtPrintModal } from './DdtPrintModal';
import { DdtFormModal } from './DdtFormModal';
import { DdtDetailModal } from './DdtDetailModal';
import { exportDdtsToCsv } from '../../utils/ddtExportService';
import { exportDdtToExcel, generateDdtPdf } from '../../services/exportService';

export const DdtModule: React.FC = () => {
  const { ddts, cantieri, deleteDdt, confermaConsegnaDdt, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterCantiere, setFilterCantiere] = useState<string>('tutti');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDdtForDetail, setSelectedDdtForDetail] = useState<DocumentoDiTrasporto | null>(null);
  const [selectedDdtForPrint, setSelectedDdtForPrint] = useState<DocumentoDiTrasporto | null>(null);

  // Filtered DDTs
  const filteredDdts = ddts.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.numeroDdt.toLowerCase().includes(q) ||
      d.cantiereNome.toLowerCase().includes(q) ||
      d.cantiereCitta.toLowerCase().includes(q) ||
      d.clienteNome.toLowerCase().includes(q) ||
      (d.veicoloTarga && d.veicoloTarga.toLowerCase().includes(q)) ||
      (d.autistaNome && d.autistaNome.toLowerCase().includes(q));

    const matchesStato = filterStato === 'tutti' || d.stato === filterStato;
    const matchesCantiere = filterCantiere === 'tutti' || d.cantiereId === filterCantiere;

    return matchesSearch && matchesStato && matchesCantiere;
  });

  // KPI Metrics
  const totalDdts = ddts.length;
  const inViaggioCount = ddts.filter((d) => d.stato === 'in_viaggio').length;
  const consegnatiCount = ddts.filter((d) => d.stato === 'consegnato').length;
  const totalColli = ddts.reduce((acc, d) => acc + d.numeroColli, 0);
  const totalPesoKg = ddts.reduce((acc, d) => acc + d.pesoTotaleKg, 0);

  const getStatusBadge = (stato: StatoDDT) => {
    switch (stato) {
      case 'consegnato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Consegnato
          </span>
        );
      case 'in_viaggio':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <Truck className="w-3 h-3" />
            In Transito
          </span>
        );
      case 'bozza':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Bozza
          </span>
        );
      case 'annullato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-500/30">
            Annullato
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Module Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <span>Documenti di Trasporto (DDT) & Flotta Cantiere</span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              D.P.R. 472/96
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestione carichi furgoni, causali di trasporto, scarico magazzino integrato e firme di consegna a cantiere
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportDdtToExcel(filteredDdts)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            title="Esporta registro ufficiale in foglio Excel (.XLSX)"
          >
            <FileText className="w-4 h-4" />
            <span>Esporta Excel (.XLSX)</span>
          </button>

          <button
            onClick={() => exportDdtsToCsv(ddts)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo DDT</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>DDT Totali Emessi</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{totalDdts}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Anno in corso 2026</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>In Transito su Strada</span>
            <Truck className="w-4 h-4 text-amber-500 animate-bounce" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">{inViaggioCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Furgoni verso cantiere</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Consegnati & Convalidati</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{consegnatiCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Firmati a piè d’opera</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Colli & Peso Trasportato</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {totalColli} <span className="text-sm font-normal text-slate-500">colli</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{totalPesoKg.toLocaleString()} kg totali</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cerca DDT per numero, cantiere, cliente, targa o autista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            {['tutti', 'in_viaggio', 'consegnato', 'bozza'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStato(st)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                  filterStato === st
                    ? 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Cantiere Filter */}
          <select
            value={filterCantiere}
            onChange={(e) => setFilterCantiere(e.target.value)}
            className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:border-amber-500"
          >
            <option value="tutti">Tutti i cantieri</option>
            {cantieri.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice} - {c.citta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DDTs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Numero DDT & Data</th>
                <th className="py-3 px-4">Destinazione Cantiere</th>
                <th className="py-3 px-4">Vettore / Automezzo</th>
                <th className="py-3 px-4">Causale</th>
                <th className="py-3 px-4 text-center">Colli / Peso</th>
                <th className="py-3 px-4 text-center">Stato</th>
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDdts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nessun Documento di Trasporto trovato corrispondente ai filtri.
                  </td>
                </tr>
              ) : (
                filteredDdts.map((ddt) => (
                  <tr
                    key={ddt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-950 dark:text-slate-100 text-sm">
                        {ddt.numeroDdt}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{ddt.dataEmissione}</span>
                        {ddt.oraPartenza && <span className="font-mono">({ddt.oraPartenza})</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {ddt.cantiereNome}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{ddt.cantiereIndirizzo}, {ddt.cantiereCitta}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ddt.clienteNome}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {ddt.veicoloTarga || 'Mezzo proprio'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                        {ddt.autistaNome || 'Incaricato'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="capitalize font-medium">
                        {ddt.causaleTrasporto.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {ddt.righe.length} voci materiali
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {ddt.numeroColli} colli
                      </div>
                      <div className="text-[10px] text-slate-500">{ddt.pesoTotaleKg} kg</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(ddt.stato)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ddt.stato === 'in_viaggio' && (
                          <button
                            onClick={() => confermaConsegnaDdt(ddt.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Conferma Consegna al Cantiere"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedDdtForPrint(ddt)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Stampa Formato Ufficiale D.P.R. 472/96"
                        >
                          <Printer className="w-4 h-4 text-amber-500" />
                        </button>

                        <button
                          onClick={() => setSelectedDdtForDetail(ddt)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Visualizza Dettaglio"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteDdt(ddt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Elimina DDT"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isNewModalOpen && <DdtFormModal onClose={() => setIsNewModalOpen(false)} />}

      {selectedDdtForDetail && (
        <DdtDetailModal
          ddt={selectedDdtForDetail}
          onClose={() => setSelectedDdtForDetail(null)}
          onOpenPrint={(ddt) => {
            setSelectedDdtForDetail(null);
            setSelectedDdtForPrint(ddt);
          }}
        />
      )}

      {selectedDdtForPrint && (
        <DdtPrintModal
          ddt={selectedDdtForPrint}
          onClose={() => setSelectedDdtForPrint(null)}
        />
      )}
    </div>
  );
};
