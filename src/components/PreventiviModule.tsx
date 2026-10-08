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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Preventivo, PreventivoStato, VocePreventivo } from '../types';
import { PreventivoPrintModal } from './PreventivoPrintModal';
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
    addPreventivo,
    updatePreventivo,
    convertPreventivoToCantiere,
    setActiveTab,
    setSelectedCantiereId,
    showToast,
    currentUser,
  } = useApp();

  const [selectedPrevId, setSelectedPrevId] = useState<string>(preventivi[0]?.id || '');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printModalPrev, setPrintModalPrev] = useState<Preventivo | null>(null);

  // New Preventivo form
  const [newClienteId, setNewClienteId] = useState(clienti[0]?.id || '');
  const [newOggetto, setNewOggetto] = useState('');
  const [newIvaPerc, setNewIvaPerc] = useState(22);
  const [newNote, setNewNote] = useState('Condizioni generali: Pagamento 30% all’ordine, 40% a SAL, 30% a collaudo DiCo.');
  const [voci, setVoci] = useState<Omit<VocePreventivo, 'id'>[]>([
    {
      descrizione: 'Fornitura e posa cavo FG16OR12 e collegamenti in quadro',
      categoria: 'materiale',
      quantita: 100,
      unitaMisura: 'm',
      prezzoUnitario: 14.5,
      totale: 1450,
    },
    {
      descrizione: 'Manodopera specializzata per posa canaline e collaudo CEI 64-8',
      categoria: 'manodopera',
      quantita: 24,
      unitaMisura: 'ore',
      prezzoUnitario: 42,
      totale: 1008,
    },
  ]);

  const activePrev = preventivi.find((p) => p.id === selectedPrevId) || preventivi[0];

  const handleAddVoceRow = () => {
    setVoci((prev) => [
      ...prev,
      {
        descrizione: 'Nuova voce capitolato elettrico',
        categoria: 'materiale',
        quantita: 1,
        unitaMisura: 'pz',
        prezzoUnitario: 100,
        totale: 100,
      },
    ]);
  };

  const handleUpdateVoce = (idx: number, updates: Partial<Omit<VocePreventivo, 'id'>>) => {
    setVoci((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...updates };
        updated.totale = updated.quantita * updated.prezzoUnitario;
        return updated;
      })
    );
  };

  const handleRemoveVoce = (idx: number) => {
    setVoci((prev) => prev.filter((_, i) => i !== idx));
  };

  const calculateFormTotals = () => {
    const imponibile = voci.reduce((acc, v) => acc + v.totale, 0);
    const ivaImporto = (imponibile * newIvaPerc) / 100;
    const totale = imponibile + ivaImporto;
    return { imponibile, ivaImporto, totale };
  };

  const handleCreatePreventivo = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clienti.find((c) => c.id === newClienteId);
    if (!cliente) return;

    const { imponibile, ivaImporto, totale } = calculateFormTotals();
    const nextNum = preventivi.length + 91;
    const numero = `PREV-2026-0${nextNum}`;

    const newPrev = addPreventivo({
      numero,
      clienteId: cliente.id,
      clienteNome: cliente.ragioneSociale,
      oggetto: newOggetto,
      dataEmissione: new Date().toISOString().split('T')[0],
      dataScadenza: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
      stato: 'inviato',
      voci: voci.map((v, i) => ({ ...v, id: `v-${i + 1}` })),
      imponibile,
      ivaPercentuale: newIvaPerc,
      ivaImporto,
      totale,
      note: newNote,
    });

    setIsNewModalOpen(false);
    setSelectedPrevId(newPrev.id);
  };

  const handleConvertToCantiere = (prevId: string) => {
    const created = convertPreventivoToCantiere(prevId);
    if (created) {
      setSelectedCantiereId(created.id);
      setActiveTab('cantieri');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Preventivi & Capitolati Impianti</h1>
          <p className="text-xs text-slate-400">
            Computo metrico, manodopera, materiali e conversione diretta in cantiere operativo
          </p>
        </div>

        {currentUser.role !== 'operatore' && currentUser.role !== 'cliente' && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuovo Preventivo
          </button>
        )}
      </div>

      {/* Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs text-slate-400">Elenco Offerte Commerciali ({preventivi.length})</div>

          <div className="space-y-2.5">
            {preventivi.map((prev) => {
              const isSelected = activePrev?.id === prev.id;
              return (
                <div
                  key={prev.id}
                  onClick={() => setSelectedPrevId(prev.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{prev.numero}</span>
                        <span className="text-slate-400 dark:text-slate-600">·</span>
                        <span className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {prev.stato}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {prev.oggetto}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">{prev.clienteNome}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-100">
                        € {Math.round(prev.totale).toLocaleString('it-IT')}
                      </div>
                      <div className="text-[10px] text-slate-500">IVA {prev.ivaPercentuale}% inclusa</div>
                    </div>
                  </div>

                  {/* Quick Actions Strip */}
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    {prev.cantiereIdCreato ? (
                      <div className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cantiere attivo</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">
                        Emesso: {prev.dataEmissione}
                      </span>
                    )}

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const cli = clienti.find((c) => c.id === prev.clienteId || c.ragioneSociale === prev.clienteNome);
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-5 lg:p-6 shadow-xl space-y-6">
              {/* Top info and actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      {activePrev.numero}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">Emesso il {activePrev.dataEmissione}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">Scadenza: {activePrev.dataScadenza}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{activePrev.oggetto}</h2>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Cliente: <strong>{activePrev.clienteNome}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => {
                      const cli = clienti.find((c) => c.id === activePrev.clienteId || c.ragioneSociale === activePrev.clienteNome);
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
                      const cli = clienti.find((c) => c.id === activePrev.clienteId || c.ragioneSociale === activePrev.clienteNome);
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
                      Accetta & Trasforma in Cantiere
                    </button>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Dettaglio Voci e Forniture
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Descrizione</th>
                        <th className="py-2.5 px-3 text-center">Tipo</th>
                        <th className="py-2.5 px-3 text-right">Q.tà</th>
                        <th className="py-2.5 px-3 text-right">Prezzo Unit.</th>
                        <th className="py-2.5 px-3 text-right">Totale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {activePrev.voci.map((voce) => (
                        <tr key={voce.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{voce.descrizione}</td>
                          <td className="py-2.5 px-3 text-center text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                            {voce.categoria.replace('_', ' ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {voce.quantita} {voce.unitaMisura}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                            € {voce.prezzoUnitario.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                            € {voce.totale.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Imponibile Totale Lavori:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">€ {activePrev.imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>IVA ({activePrev.ivaPercentuale}%):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">€ {activePrev.ivaImporto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Totale Preventivo (IVA Inclusa):</span>
                  <span className="font-mono text-base">€ {activePrev.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Notes */}
              {activePrev.note && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 block mb-1">Note e Condizioni di Pagamento:</strong>
                  {activePrev.note}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl">
              Nessun preventivo selezionato.
            </div>
          )}
        </div>
      </div>

      {/* CREATE PREVENTIVO MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Nuovo Preventivo Impianti</h3>
            <p className="text-xs text-slate-400 mb-4">
              Composizione offerta economica per cliente
            </p>

            <form onSubmit={handleCreatePreventivo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cliente:</label>
                  <select
                    value={newClienteId}
                    onChange={(e) => setNewClienteId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-100 focus:border-amber-500"
                  >
                    {clienti.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ragioneSociale}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Aliquota IVA (%):</label>
                  <select
                    value={newIvaPerc}
                    onChange={(e) => setNewIvaPerc(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-100 focus:border-amber-500"
                  >
                    <option value={22}>22% (Ordinaria)</option>
                    <option value={10}>10% (Manutenzione Condomini/Abitativo)</option>
                    <option value={4}>4% (Prima casa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Oggetto dell'intervento:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Realizzazione Dorsale Quadri e Linee Prese Stabilimento B"
                  value={newOggetto}
                  onChange={(e) => setNewOggetto(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-100 focus:border-amber-500"
                />
              </div>

              {/* Dynamic Voci Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-200">Voci di Capitolato / Manodopera:</label>
                  <button
                    type="button"
                    onClick={handleAddVoceRow}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    + Aggiungi Voce
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {voci.map((v, i) => (
                    <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-2">
                      <input
                        type="text"
                        value={v.descrizione}
                        onChange={(e) => handleUpdateVoce(i, { descrizione: e.target.value })}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                        placeholder="Descrizione fornitura/lavoro"
                      />
                      <input
                        type="number"
                        value={v.quantita}
                        onChange={(e) => handleUpdateVoce(i, { quantita: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-right font-mono text-slate-900 dark:text-slate-100"
                        title="Quantità"
                      />
                      <input
                        type="text"
                        value={v.unitaMisura}
                        onChange={(e) => handleUpdateVoce(i, { unitaMisura: e.target.value })}
                        className="w-12 px-1 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-700 dark:text-slate-300"
                        title="Unità"
                      />
                      <input
                        type="number"
                        value={v.prezzoUnitario}
                        onChange={(e) => handleUpdateVoce(i, { prezzoUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-right font-mono text-amber-600 dark:text-amber-400 font-bold"
                        title="Prezzo Unitario"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVoce(i)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Elimina voce"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form totals summary */}
              {(() => {
                const { imponibile, ivaImporto, totale } = calculateFormTotals();
                return (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Totale Calcolato con IVA {newIvaPerc}%:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">
                      € {totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Emetti Preventivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preventivo Official Print & PDF Preview Modal */}
      {printModalPrev && (
        <PreventivoPrintModal
          preventivo={printModalPrev}
          onClose={() => setPrintModalPrev(null)}
        />
      )}
    </div>
  );
};
