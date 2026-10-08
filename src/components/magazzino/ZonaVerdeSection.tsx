import React, { useState } from 'react';
import {
  Boxes,
  Package,
  Truck,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Filter,
  User,
  ShieldCheck,
  AlertTriangle,
  ScanLine,
  ArrowRight,
  Eye,
  FileText,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaccoZonaVerde, StatoTransitoPacco } from '../../types';

export const ZonaVerdeSection: React.FC = () => {
  const {
    pacchiZonaVerde,
    setSelectedPaccoStampa,
    setActivePaccoCaricoModal,
    setIsNuovoPaccoModalOpen,
    openScanner,
    updatePaccoZonaVerde,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterCantiere, setFilterCantiere] = useState<string>('tutti');

  // Calcolo KPI
  const prontiCount = pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length;
  const caricatiCount = pacchiZonaVerde.filter((p) => p.statoTransito === 'CARICATO_SU_MEZZO').length;
  const consegnatiCount = pacchiZonaVerde.filter((p) => p.statoTransito === 'CONSEGNATO_CANTIERE').length;
  const totaleArticoli = pacchiZonaVerde.reduce(
    (acc, p) => acc + p.righeMateriale.reduce((sum, r) => sum + r.quantita, 0),
    0
  );

  // Lista Cantieri unici per filtro
  const cantieriUnici = Array.from(new Set(pacchiZonaVerde.map((p) => p.cantiereTitolo)));

  // Filtraggio
  const filteredPacchi = pacchiZonaVerde.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.codiceCantiere.toLowerCase().includes(search.toLowerCase()) ||
      p.cantiereTitolo.toLowerCase().includes(search.toLowerCase()) ||
      (p.furgoneAssegnato && p.furgoneAssegnato.toLowerCase().includes(search.toLowerCase())) ||
      (p.operatoreRitiro && p.operatoreRitiro.toLowerCase().includes(search.toLowerCase())) ||
      p.righeMateriale.some(
        (r) =>
          r.sku.toLowerCase().includes(search.toLowerCase()) ||
          r.descrizione.toLowerCase().includes(search.toLowerCase())
      );

    const matchStato = filterStato === 'tutti' || p.statoTransito === filterStato;
    const matchCantiere = filterCantiere === 'tutti' || p.cantiereTitolo === filterCantiere;

    return matchSearch && matchStato && matchCantiere;
  });

  const handleSegnaConsegnato = (pacco: PaccoZonaVerde) => {
    const nowStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    updatePaccoZonaVerde(pacco.id, {
      statoTransito: 'CONSEGNATO_CANTIERE',
      timestampConsegna: nowStr,
    });
    showToast(`Pacco ${pacco.id} contrassegnato come Consegnato in Cantiere.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Banner Introduttivo & Workflow Logistico */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Zona Verde: Area Stoccaggio Temporaneo & Ritiro Mezzi
              </h3>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full font-bold">
                SEGNATE COLLO A5
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Il magazzino prepara e imballa i materiali ordinati dai cantieri apponendo il segnacollo A5 con QR Code.
              Gli operatori o autisti prima della partenza inquadrano il QR da smartphone per la presa in carico istantanea.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={openScanner}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-xs"
          >
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Scansiona QR Carico</span>
          </button>

          <button
            onClick={() => setIsNuovoPaccoModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Prepara Nuovo Pacco</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Pronti in Zona Verde */}
        <div
          onClick={() => setFilterStato(filterStato === 'PRONTO_ZONA_VERDE' ? 'tutti' : 'PRONTO_ZONA_VERDE')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStato === 'PRONTO_ZONA_VERDE'
              ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Pronti in Zona Verde</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {prontiCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            In attesa di carico su furgone
          </div>
        </div>

        {/* Caricati / In Transito */}
        <div
          onClick={() => setFilterStato(filterStato === 'CARICATO_SU_MEZZO' ? 'tutti' : 'CARICATO_SU_MEZZO')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStato === 'CARICATO_SU_MEZZO'
              ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Caricati su Mezzo</span>
            <Truck className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {caricatiCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            In viaggio verso il cantiere
          </div>
        </div>

        {/* Consegnati */}
        <div
          onClick={() => setFilterStato(filterStato === 'CONSEGNATO_CANTIERE' ? 'tutti' : 'CONSEGNATO_CANTIERE')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filterStato === 'CONSEGNATO_CANTIERE'
              ? 'bg-slate-500/15 border-slate-500 ring-1 ring-slate-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Consegnati in Cantiere</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
            {consegnatiCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Scaricati e confermati dal preposto
          </div>
        </div>

        {/* Totale Articoli Pronti */}
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Totale Articoli Gestiti</span>
            <Package className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totaleArticoli}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Componenti & cavi preparati
          </div>
        </div>
      </div>

      {/* Barra Filtri e Ricerca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Ricerca */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca per codice pacco (PK-..), cantiere, furgone o articolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Filtro Stato */}
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="PRONTO_ZONA_VERDE">🟢 Pronti Zona Verde ({prontiCount})</option>
            <option value="CARICATO_SU_MEZZO">🔵 Caricati su Mezzo ({caricatiCount})</option>
            <option value="CONSEGNATO_CANTIERE">⚪ Consegnati ({consegnatiCount})</option>
          </select>

          {/* Filtro Cantiere */}
          <select
            value={filterCantiere}
            onChange={(e) => setFilterCantiere(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="tutti">Tutti i cantieri</option>
            {cantieriUnici.map((titolo) => (
              <option key={titolo} value={titolo}>
                {titolo}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Mostrati <strong>{filteredPacchi.length}</strong> di <strong>{pacchiZonaVerde.length}</strong> pacchi
        </div>
      </div>

      {/* Grid delle Spedizioni / Pacchi */}
      {filteredPacchi.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nessun pacco trovato con i filtri correnti
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Modifica i criteri di ricerca o prepara un nuovo collo per la Zona Verde.
          </p>
          <button
            onClick={() => setIsNuovoPaccoModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            + Prepara Nuovo Pacco
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPacchi.map((pacco) => {
            const isPronto = pacco.statoTransito === 'PRONTO_ZONA_VERDE';
            const isCaricato = pacco.statoTransito === 'CARICATO_SU_MEZZO';
            const isConsegnato = pacco.statoTransito === 'CONSEGNATO_CANTIERE';

            return (
              <div
                key={pacco.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPronto
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/50 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : isCaricato
                    ? 'bg-white dark:bg-slate-900 border-cyan-500/50 shadow-sm shadow-cyan-500/5'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">
                          {pacco.id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {pacco.numeroCollo || 'Collo Singolo'}
                        </span>
                        {pacco.pesoKg && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {pacco.pesoKg} kg
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Prep: {pacco.dataPreparazione} · Magazziniere: {pacco.magazzinierePreparatore}
                      </div>
                    </div>

                    {/* Stato Badge */}
                    <div>
                      {isPronto && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          PRONTO IN ZONA VERDE
                        </span>
                      )}
                      {isCaricato && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                          <Truck className="w-3 h-3" />
                          CARICATO SU MEZZO
                        </span>
                      )}
                      {isConsegnato && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3" />
                          CONSEGNATO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informazioni Cantiere & Logistica */}
                  <div className="py-3 space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>Destinazione:</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                        [{pacco.codiceCantiere}] {pacco.cantiereTitolo}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {pacco.indirizzoCantiere} {pacco.clienteNome ? `· ${pacco.clienteNome}` : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Furgone Assegnato:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {pacco.furgoneAssegnato || 'Da assegnare'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operatore Ritiro:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {pacco.operatoreRitiro || 'Qualsiasi operatore'}
                        </span>
                      </div>
                    </div>

                    {/* Stato Transito Log */}
                    {pacco.timestampCarico && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-between font-mono">
                        <span>Caricato: {pacco.timestampCarico}</span>
                        <span>Autista: {pacco.operatoreCaricoNome}</span>
                      </div>
                    )}

                    {/* Righe Materiale Anteprima */}
                    <div className="mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                        <span>Contenuto ({pacco.righeMateriale.length} posizioni):</span>
                        <span className="font-mono">{pacco.tipoImballo || 'Pallet'}</span>
                      </div>
                      <ul className="space-y-1">
                        {pacco.righeMateriale.slice(0, 3).map((r, idx) => (
                          <li key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="truncate pr-2 text-slate-700 dark:text-slate-300">
                              <strong className="font-mono text-slate-900 dark:text-slate-100 mr-1.5">{r.sku}</strong>
                              {r.descrizione}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                              {r.quantita} {r.um}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {pacco.righeMateriale.length > 3 && (
                        <div className="text-[10px] text-slate-400 italic mt-1 text-center">
                          + altri {pacco.righeMateriale.length - 3} articoli inclusi
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedPaccoStampa(pacco)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Stampa Segnacollo A5"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Stampa A5</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isPronto && (
                      <button
                        onClick={() => setActivePaccoCaricoModal(pacco)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Carica Mezzo</span>
                      </button>
                    )}

                    {isCaricato && (
                      <button
                        onClick={() => handleSegnaConsegnato(pacco)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Consegna</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
