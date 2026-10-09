import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  FileCheck,
  Building2,
  X,
  Download,
  Share2,
  Eye,
  Package,
  Wrench,
  Percent,
  Edit,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Preventivo, PreventivoStato } from '../types';
import { PreventivoPrintModal } from './PreventivoPrintModal';
import { CreateQuoteModal } from './CreateQuoteModal';
import { ImportComputoModal } from './computo/ImportComputoModal';
import {
  downloadPreventivoPdf,
  printPreventivoPdfDirectly,
  sharePreventivoPdf,
} from '../services/preventivoPdfService';

export const PreventiviModule: React.FC = () => {
  const {
    preventivi,
    clienti,
    cantieri,
    magazzino,
    addPreventivo,
    updatePreventivo,
    convertPreventivoToCantiere,
    setActiveTab,
    setSelectedCantiereId,
    showToast,
    currentUser,
  } = useApp();

  const [selectedPrevId, setSelectedPrevId] = useState<string>(preventivi[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportComputoOpen, setIsImportComputoOpen] = useState(false);
  const [editingPreventivo, setEditingPreventivo] = useState<Preventivo | null>(null);
  const [printModalPrev, setPrintModalPrev] = useState<Preventivo | null>(null);

  const activePrev = preventivi.find((p) => p.id === selectedPrevId) || preventivi[0];

  const handleOpenNewModal = () => {
    setEditingPreventivo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prev: Preventivo) => {
    setEditingPreventivo(prev);
    setIsModalOpen(true);
  };

  const handleSavePreventivo = (quotePayload: Omit<Preventivo, 'id'>) => {
    if (editingPreventivo) {
      updatePreventivo(editingPreventivo.id, quotePayload);
      showToast(`Preventivo ${quotePayload.numero} aggiornato con successo!`, 'success');
      setSelectedPrevId(editingPreventivo.id);
    } else {
      const created = addPreventivo(quotePayload);
      showToast(`Preventivo ${created.numero} emesso con successo!`, 'success');
      setSelectedPrevId(created.id);
    }
    setIsModalOpen(false);
    setEditingPreventivo(null);
  };

  const handleConvertToCantiere = (prevId: string) => {
    const created = convertPreventivoToCantiere(prevId);
    if (created) {
      setSelectedCantiereId(created.id);
      setActiveTab('cantieri');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-500" />
            <span>Preventivi & Capitolati Impianti</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calcolo economico modulare (Materiali con ricarico %, Manodopera a tariffa oraria, Imponibile Netto e Quota IVA)
          </p>
        </div>

        {currentUser.role !== 'operatore' && currentUser.role !== 'cliente' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsImportComputoOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition-all border border-amber-500/30 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Importa Computo (.xpwe / Excel)</span>
            </button>
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Preventivo Modulare</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Elenco Offerte Commerciali ({preventivi.length})</span>
            <span className="font-mono text-[11px]">Ordina per emissione</span>
          </div>

          <div className="space-y-2.5">
            {preventivi.map((prev) => {
              const isSelected = activePrev?.id === prev.id;
              const subMat = prev.subtotaleMateriali ?? prev.voci.filter(v => v.categoria === 'materiale').reduce((a, b) => a + b.totale, 0);
              const subMan = prev.subtotaleManodopera ?? prev.voci.filter(v => v.categoria === 'manodopera' || v.categoria === 'pratica_tecnica').reduce((a, b) => a + b.totale, 0);
              const impNetto = prev.totaleImponibile ?? prev.imponibile;
              const totIvato = prev.totaleIvato ?? prev.totale;
              const aliquota = prev.aliquotaIva ?? prev.ivaPercentuale ?? 22;

              return (
                <div
                  key={prev.id}
                  onClick={() => setSelectedPrevId(prev.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {prev.numero}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">·</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${
                            prev.stato === 'accettato'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : prev.stato === 'inviato'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {prev.stato}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {prev.oggetto}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {prev.clienteNome}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        € {Math.round(totIvato).toLocaleString('it-IT')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        IVA {aliquota}% incl.
                      </div>
                    </div>
                  </div>

                  {/* Micro Breakdown Badge */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-blue-600 dark:text-blue-400">
                        Mat: €{Math.round(subMat)}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Man: €{Math.round(subMan)}
                      </span>
                    </div>

                    {prev.percentualeScontoMaggiorazione > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold font-mono">
                        {prev.tipoAggiustamento === 'sconto' ? '-' : '+'}
                        {prev.percentualeScontoMaggiorazione}%
                      </span>
                    )}
                  </div>

                  {/* Quick Actions Strip */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    {prev.cantiereIdCreato ? (
                      <div className="text-emerald-500 flex items-center gap-1 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cantiere avviato</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Emesso: {prev.dataEmissione}
                      </span>
                    )}

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModal(prev)}
                        className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Modifica Preventivo"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const cli = clienti.find(
                            (c) => c.id === prev.clienteId || c.ragioneSociale === prev.clienteNome
                          );
                          const cnt = cantieri.find((c) => c.id === prev.cantiereIdCreato);
                          downloadPreventivoPdf(prev, cli, cnt);
                          showToast(`PDF del Preventivo ${prev.numero} scaricato!`, 'success');
                        }}
                        className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Scarica PDF Preventivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setPrintModalPrev(prev)}
                        className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Anteprima e Stampa A4"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail (7 cols) */}
        <div className="lg:col-span-7">
          {activePrev ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 lg:p-6 space-y-6">
              {/* Top info and actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-mono text-amber-500 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      {activePrev.numero}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Emesso il {activePrev.dataEmissione}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Scadenza: {activePrev.dataScadenza}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {activePrev.oggetto}
                  </h2>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Committente: <strong>{activePrev.clienteNome}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => handleOpenEditModal(activePrev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    title="Modifica parametri e voci del preventivo"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                    <span>Modifica</span>
                  </button>

                  <button
                    onClick={() => {
                      const cli = clienti.find(
                        (c) => c.id === activePrev.clienteId || c.ragioneSociale === activePrev.clienteNome
                      );
                      const cnt = cantieri.find((c) => c.id === activePrev.cantiereIdCreato);
                      downloadPreventivoPdf(activePrev, cli, cnt);
                      showToast(`PDF del Preventivo ${activePrev.numero} scaricato!`, 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                    title="Scarica PDF Preventivo con layout ufficiale"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica PDF</span>
                  </button>

                  <button
                    onClick={() => setPrintModalPrev(activePrev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    title="Visualizza anteprima A4 e stampa"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Stampa A4</span>
                  </button>

                  <button
                    onClick={async () => {
                      const cli = clienti.find(
                        (c) => c.id === activePrev.clienteId || c.ragioneSociale === activePrev.clienteNome
                      );
                      const cnt = cantieri.find((c) => c.id === activePrev.cantiereIdCreato);
                      const shared = await sharePreventivoPdf(activePrev, cli, cnt);
                      if (shared) showToast('Preventivo condiviso con successo!', 'success');
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    title="Condividi Preventivo"
                  >
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>

                  {/* Convert to Cantiere Button */}
                  {currentUser.role !== 'cliente' && !activePrev.cantiereIdCreato && (
                    <button
                      onClick={() => handleConvertToCantiere(activePrev.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Accetta & Crea Cantiere</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SEZIONE 1 DETTAGLIO MATERIALI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      1. Voci Materiali & Forniture
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    Subtotale: €{' '}
                    {(
                      activePrev.subtotaleMateriali ??
                      activePrev.voci
                        .filter((v) => v.categoria === 'materiale')
                        .reduce((a, b) => a + b.totale, 0)
                    ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Descrizione</th>
                        <th className="py-2 px-2 text-right">Q.tà</th>
                        <th className="py-2 px-2 text-right">Costo Acq.</th>
                        <th className="py-2 px-2 text-right">% Ric.</th>
                        <th className="py-2 px-2 text-right">Pr. Vendita</th>
                        <th className="py-2 px-3 text-right">Totale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {activePrev.materiali && activePrev.materiali.length > 0 ? (
                        activePrev.materiali.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {m.descrizione}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                              {m.quantita} {m.unitaMisura}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-500">
                              € {m.costoAcquistoUnitario.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-blue-600 dark:text-blue-400 font-bold">
                              {m.ricaricoPercentuale ?? activePrev.percentualeRicaricoMateriali ?? 30}%
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-800 dark:text-slate-200 font-semibold">
                              € {m.prezzoVenditaUnitario.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              € {m.totaleVendita.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Fallback voci standard
                        activePrev.voci
                          .filter((v) => v.categoria === 'materiale')
                          .map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                                {v.descrizione}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                {v.quantita} {v.unitaMisura}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-500">
                                € {(v.prezzoUnitario / 1.3).toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-blue-600 dark:text-blue-400 font-bold">
                                {activePrev.percentualeRicaricoMateriali || 30}%
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                € {v.prezzoUnitario.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                € {v.totale.toFixed(2)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEZIONE 2 DETTAGLIO MANODOPERA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      2. Manodopera & Servizi Specializzati
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    Subtotale: €{' '}
                    {(
                      activePrev.subtotaleManodopera ??
                      activePrev.voci
                        .filter(
                          (v) => v.categoria === 'manodopera' || v.categoria === 'pratica_tecnica'
                        )
                        .reduce((a, b) => a + b.totale, 0)
                    ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Descrizione Prestazione</th>
                        <th className="py-2 px-3 text-right w-24">Ore Stimate</th>
                        <th className="py-2 px-3 text-right w-32">Tariffa Oraria</th>
                        <th className="py-2 px-3 text-right w-32">Subtotale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {activePrev.manodopera && activePrev.manodopera.length > 0 ? (
                        activePrev.manodopera.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {m.descrizione}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              {m.oreStimate} ore
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              € {m.tariffaOrariaApplicata.toFixed(2)} /h
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              € {m.totale.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        activePrev.voci
                          .filter(
                            (v) => v.categoria === 'manodopera' || v.categoria === 'pratica_tecnica'
                          )
                          .map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                                {v.descrizione}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                {v.quantita} {v.unitaMisura}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                € {v.prezzoUnitario.toFixed(2)} /h
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                € {v.totale.toFixed(2)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEZIONE 3 QUADRO ECONOMICO RIASSUNTIVO COMPLETO */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Quadro Economico Riassuntivo
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tariffa Manodopera Base: €{(activePrev.tariffaOraria || 35).toFixed(2)}/h
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Totale Materiali (con ricarico {activePrev.percentualeRicaricoMateriali ?? 30}%):
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      €{' '}
                      {(
                        activePrev.subtotaleMateriali ??
                        activePrev.voci
                          .filter((v) => v.categoria === 'materiale')
                          .reduce((a, b) => a + b.totale, 0)
                      ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Totale Manodopera & Servizi:
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      €{' '}
                      {(
                        activePrev.subtotaleManodopera ??
                        activePrev.voci
                          .filter(
                            (v) => v.categoria === 'manodopera' || v.categoria === 'pratica_tecnica'
                          )
                          .reduce((a, b) => a + b.totale, 0)
                      ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {activePrev.percentualeScontoMaggiorazione > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                      <span>
                        {activePrev.tipoAggiustamento === 'sconto'
                          ? 'Sconto Commerciale'
                          : 'Maggiorazione Oneri'}{' '}
                        ({activePrev.percentualeScontoMaggiorazione}%):
                      </span>
                      <span className="font-mono">
                        {activePrev.tipoAggiustamento === 'sconto' ? '-' : '+'}€{' '}
                        {(
                          activePrev.quotaScontoMaggiorazione ||
                          ((activePrev.imponibile * activePrev.percentualeScontoMaggiorazione) / 100)
                        ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Imponibile Netto Lavori:</span>
                    <span className="font-mono text-sm">
                      €{' '}
                      {(activePrev.totaleImponibile ?? activePrev.imponibile).toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Quota IVA ({activePrev.aliquotaIva ?? activePrev.ivaPercentuale}%):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      €{' '}
                      {activePrev.ivaImporto.toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-300 dark:border-slate-700">
                    <span className="uppercase tracking-wider">TOTALE PREVENTIVO FINALE (IVA Inclusa):</span>
                    <span className="font-mono text-lg font-black">
                      €{' '}
                      {(activePrev.totaleIvato ?? activePrev.totale).toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {activePrev.note && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-1">
                    Note e Condizioni Contrattuali:
                  </strong>
                  {activePrev.note}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              Nessun preventivo selezionato.
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT PREVENTIVO MODULAR MODAL */}
      <CreateQuoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPreventivo(null);
        }}
        onSave={handleSavePreventivo}
        clienti={clienti}
        magazzino={magazzino}
        initialData={editingPreventivo}
      />

      {/* Preventivo Official Print & PDF Preview Modal */}
      {printModalPrev && (
        <PreventivoPrintModal
          preventivo={printModalPrev}
          onClose={() => setPrintModalPrev(null)}
        />
      )}

      {/* IMPORT COMPUTO METRICO MODAL (.xpwe / Excel) */}
      <ImportComputoModal
        isOpen={isImportComputoOpen}
        onClose={() => setIsImportComputoOpen(false)}
        onImportToPreventivo={(payload) => {
          handleSavePreventivo(payload);
          setIsImportComputoOpen(false);
        }}
      />
    </div>
  );
};

export default PreventiviModule;
