import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PresenzaCantiere } from '../../types';
import {
  Users,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  Zap,
  HardHat,
  X,
  Check,
  UserCheck,
  Layers,
  ChevronDown,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { PresenzeLulExportModal } from './PresenzeLulExportModal';

export const PresenzeModule: React.FC = () => {
  const {
    cantieri,
    dipendenti,
    presenze,
    addPresenza,
    updatePresenza,
    deletePresenza,
    timbraturaRapidaSquadra,
    approvaPresenza,
    currentUser,
    showToast,
  } = useApp();

  // Filters & State
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('tutti');
  const [selectedData, setSelectedData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDitta, setFilterDitta] = useState<'tutti' | 'interni' | 'subappalto'>('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSquadraModalOpen, setIsSquadraModalOpen] = useState(false);
  const [isLulModalOpen, setIsLulModalOpen] = useState(false);

  // New Single Entry Form State
  const [formCantiereId, setFormCantiereId] = useState(cantieri[0]?.id || '');
  const [formDipendenteId, setFormDipendenteId] = useState(dipendenti[0]?.id || '');
  const [formIsSubappalto, setFormIsSubappalto] = useState(false);
  const [formSubNome, setFormSubNome] = useState('');
  const [formSubMansione, setFormSubMansione] = useState('Elettricista di Cantiere');
  const [formSubDitta, setFormSubDitta] = useState('EuroMontaggi Impianti S.r.l.');
  const [formOraIngresso, setFormOraIngresso] = useState('07:30');
  const [formOraUscita, setFormOraUscita] = useState('16:30');
  const [formOreOrdinarie, setFormOreOrdinarie] = useState(8);
  const [formOreStraordinarie, setFormOreStraordinarie] = useState(0);
  const [formBuonoPasto, setFormBuonoPasto] = useState(true);
  const [formIndennita, setFormIndennita] = useState(15);
  const [formDpi, setFormDpi] = useState(true);
  const [formIdoneita, setFormIdoneita] = useState(true);
  const [formTesserino, setFormTesserino] = useState(true);
  const [formNote, setFormNote] = useState('');

  // Squadre predefinite
  const squadreDisponibili = [
    {
      nome: 'Squadra A - Media Tensione & Quadri BT',
      caposquadra: 'Matteo Bianchi',
      membriIds: ['dip-8', 'dip-11', 'dip-12'],
    },
    {
      nome: 'Squadra B - Fotovoltaico & Rinnovabili',
      caposquadra: 'Andrea Villa',
      membriIds: ['dip-9', 'dip-14'],
    },
    {
      nome: 'Squadra C - Terziario & Domotica KNX',
      caposquadra: 'Stefano Rizzi',
      membriIds: ['dip-10', 'dip-15'],
    },
  ];

  const [squadraSelezionata, setSquadraSelezionata] = useState(squadreDisponibili[0].nome);
  const [cantiereSquadraId, setCantiereSquadraId] = useState(cantieri[0]?.id || '');

  // Filtered attendance list
  const filteredPresenze = useMemo(() => {
    return presenze.filter((p) => {
      const matchCantiere = selectedCantiereId === 'tutti' || p.cantiereId === selectedCantiereId;
      const matchData = !selectedData || p.data === selectedData;
      const matchDitta =
        filterDitta === 'tutti'
          ? true
          : filterDitta === 'interni'
          ? p.ditta === 'interna'
          : p.ditta !== 'interna';
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.dipendenteNome.toLowerCase().includes(q) ||
        p.mansione.toLowerCase().includes(q) ||
        p.cantiereNome.toLowerCase().includes(q) ||
        (p.squadra && p.squadra.toLowerCase().includes(q));

      return matchCantiere && matchData && matchDitta && matchQuery;
    });
  }, [presenze, selectedCantiereId, selectedData, filterDitta, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const oggi = new Date().toISOString().split('T')[0];
    const presenzeOggi = presenze.filter((p) => p.data === oggi);
    const oreTotaliOggi = presenzeOggi.reduce((acc, p) => acc + p.oreOrdinarie + p.oreStraordinarie, 0);
    const costoTotaleOggi = presenzeOggi.reduce((acc, p) => acc + p.costoTotaleGiornaliero, 0);
    const conformiDpi = presenzeOggi.filter((p) => p.dpiVerificati && p.tesserinoRiconoscimento).length;
    const percDpi = presenzeOggi.length > 0 ? Math.round((conformiDpi / presenzeOggi.length) * 100) : 100;
    const subappaltiOggi = presenzeOggi.filter((p) => p.ditta !== 'interna').length;

    return {
      presentiOggi: presenzeOggi.length,
      oreTotaliOggi,
      costoTotaleOggi,
      percDpi,
      subappaltiOggi,
    };
  }, [presenze]);

  // Submit new individual attendance record
  const handleCreatePresenza = (e: React.FormEvent) => {
    e.preventDefault();
    const cantiereObj = cantieri.find((c) => c.id === formCantiereId) || cantieri[0];
    const dip = dipendenti.find((d) => d.id === formDipendenteId);

    const nome = formIsSubappalto ? formSubNome.trim() : `${dip?.nome} ${dip?.cognome}`;
    const mansione = formIsSubappalto ? formSubMansione.trim() : dip?.ruoloAziendale || 'Operatore';
    const ditta = formIsSubappalto ? formSubDitta.trim() : 'interna';
    const costo = formIsSubappalto ? 30 : dip?.costoOrario || 32;

    const ord = Number(formOreOrdinarie) || 8;
    const str = Number(formOreStraordinarie) || 0;
    const totCosto = ord * costo + str * costo * 1.3;

    // Controllo Idoneità Sanitaria D.Lgs 81/08
    if (!formIsSubappalto && dip && dip.visitaMedicaScadenza) {
      const scadenza = new Date(dip.visitaMedicaScadenza);
      const oggi = new Date('2026-10-08');
      if (scadenza < oggi) {
        showToast(
          `🚨 BLOCCO SICUREZZA D.LGS 81/08: L'operatore ${dip.nome} ${dip.cognome} ha la visita medica scaduta il ${dip.visitaMedicaScadenza}. Impossibile timbrare l'ingresso in cantiere!`,
          'error'
        );
        return;
      }
    }

    addPresenza({
      data: selectedData || new Date().toISOString().split('T')[0],
      dipendenteId: formIsSubappalto ? `sub-${Date.now()}` : formDipendenteId,
      dipendenteNome: nome || 'Operatore Cantiere',
      mansione,
      ditta,
      cantiereId: cantiereObj.id,
      cantiereNome: cantiereObj.titolo,
      oraIngresso: formOraIngresso,
      oraUscita: formOraUscita,
      oreOrdinarie: ord,
      oreStraordinarie: str,
      costoOrario: costo,
      costoTotaleGiornaliero: totCosto,
      buonoPasto: formBuonoPasto,
      indennitaTrasferta: Number(formIndennita) || 0,
      dpiVerificati: formDpi,
      idoneitaMedicaValida: formIdoneita,
      tesserinoRiconoscimento: formTesserino,
      note: formNote.trim(),
      approvatoDa: currentUser.name,
      stato: 'approvata',
    });

    setIsNewModalOpen(false);
    setFormSubNome('');
    setFormNote('');
  };

  // Submit quick team attendance
  const handleSquadraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const squadraObj = squadreDisponibili.find((s) => s.nome === squadraSelezionata);
    if (!squadraObj) return;

    timbraturaRapidaSquadra(
      cantiereSquadraId,
      squadraObj.nome,
      squadraObj.membriIds,
      selectedData || undefined
    );

    setIsSquadraModalOpen(false);
  };

  // Export CSV for Payroll / Cassa Edile
  const handleExportCsv = () => {
    const headers = [
      'Data',
      'Cantiere',
      'Operatore',
      'Mansione',
      'Ditta',
      'Squadra',
      'Ingresso',
      'Uscita',
      'Ore Ordinarie',
      'Ore Straordinarie',
      'Costo Orario €',
      'Costo Totale €',
      'Buono Pasto',
      'Indennità Trasferta €',
      'DPI Verificati',
      'Stato',
    ];

    const rows = filteredPresenze.map((p) => [
      p.data,
      `"${p.cantiereNome.replace(/"/g, '""')}"`,
      `"${p.dipendenteNome.replace(/"/g, '""')}"`,
      `"${p.mansione.replace(/"/g, '""')}"`,
      p.ditta === 'interna' ? 'VoltMaster (Interna)' : `"${p.ditta.replace(/"/g, '""')}"`,
      p.squadra ? `"${p.squadra.replace(/"/g, '""')}"` : '-',
      p.oraIngresso,
      p.oraUscita,
      p.oreOrdinarie,
      p.oreStraordinarie,
      p.costoOrario,
      p.costoTotaleGiornaliero.toFixed(2),
      p.buonoPasto ? 'SI' : 'NO',
      p.indennitaTrasferta,
      p.dpiVerificati ? 'CONFORME' : 'NON CONFORME',
      p.stato.toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheet_cantiere_${selectedData || 'completo'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Timesheet generato con successo!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <HardHat className="w-3.5 h-3.5" />
              <span>D.Lgs 81/08 · Controllo Idoneità, DPI & Cassa Edile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Presenze, Squadre & Timesheet di Cantiere
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Registrazione ore ordinarie e straordinarie, verifica dei dispositivi di protezione individuale (DPI), controllo tesserino identificativo di cantiere e monitoraggio costi manodopera in tempo reale.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsSquadraModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Timbratura Squadra</span>
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Nuova Registrazione</span>
            </button>

            <button
              onClick={() => setIsLulModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 border border-emerald-400/30"
              title="Esporta Prospetto Mensile Presenze & LUL per Consulente Paghe (Excel / CSV Zucchetti / TeamSystem)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export LUL & Paghe (Excel/CSV)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-semibold rounded-xl transition-colors"
              title="Esporta rapido Timesheet in formato CSV"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">CSV Rapido</span>
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Operai in Cantiere Oggi
            </span>
            <div className="text-xl font-mono font-black text-amber-400 mt-1">
              {kpis.presentiOggi} <span className="text-xs font-normal text-slate-400">persone</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {kpis.subappaltiOggi} in subappalto autorizzato
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ore Lavorate Oggi
            </span>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
              {kpis.oreTotaliOggi.toFixed(1)} <span className="text-xs font-normal text-slate-400">h</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">
              Su tutti i cantieri attivi
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Costo Manodopera Oggi
            </span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">
              € {kpis.costoTotaleOggi.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Consuntivato giornaliero
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Conformità DPI & Sicurezza
            </span>
            <div className="text-xl font-mono font-black text-cyan-400 mt-1">
              {kpis.percDpi}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Elmetto, scarpe S3, badge
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Data Selezionata
            </span>
            <input
              type="date"
              value={selectedData}
              onChange={(e) => setSelectedData(e.target.value)}
              className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-700 dark:text-amber-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {selectedData && (
              <button
                onClick={() => setSelectedData('')}
                className="text-[10px] text-slate-400 hover:text-amber-400 mt-0.5"
              >
                Mostra tutte le date
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Cantiere selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedCantiereId}
              onChange={(e) => setSelectedCantiereId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none max-w-[200px] truncate"
            >
              <option value="tutti">Tutti i Cantieri ({cantieri.length})</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titolo}
                </option>
              ))}
            </select>
          </div>

          {/* Ditta filter */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setFilterDitta('tutti')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterDitta === 'tutti' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilterDitta('interni')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterDitta === 'interni' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interni
            </button>
            <button
              onClick={() => setFilterDitta('subappalto')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterDitta === 'subappalto' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Subappalto
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca operaio, mansione o squadra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 3. Presenze Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Operatore & Mansione</th>
                <th className="py-3 px-4">Ditta / Squadra</th>
                <th className="py-3 px-4">Cantiere di Riferimento</th>
                <th className="py-3 px-4 text-center">Orari</th>
                <th className="py-3 px-4 text-right">Ore Ord / Str</th>
                <th className="py-3 px-4 text-right">Costo Consuntivato</th>
                <th className="py-3 px-4 text-center">Sicurezza DPI</th>
                <th className="py-3 px-4 text-center">Stato</th>
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 font-sans">
              {filteredPresenze.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    Nessuna presenza registrata con i filtri correnti. Usa "Timbratura Squadra" per generare le registrazioni di oggi.
                  </td>
                </tr>
              ) : (
                filteredPresenze.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {p.data}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.dipendenteNome}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{p.mansione}</div>
                    </td>

                    <td className="py-3 px-4">
                      {p.ditta === 'interna' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          VoltMaster (Interna)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {p.ditta}
                        </span>
                      )}
                      {p.squadra && <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{p.squadra}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{p.cantiereNome}</div>
                      {p.lavorazioneTitolo && (
                        <div className="text-[10px] text-slate-500 italic truncate max-w-xs">
                          Fase: {p.lavorazioneTitolo}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {p.oraIngresso} ➔ {p.oraUscita}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{p.oreOrdinarie}h</span>
                      {p.oreStraordinarie > 0 && (
                        <span className="ml-1 text-amber-400 font-bold text-[11px]">+{p.oreStraordinarie}h str</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      € {p.costoTotaleGiornaliero.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {p.dpiVerificati && p.tesserinoRiconoscimento ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          title="DPI III Cat. e tesserino di cantiere verificati all'ingresso"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>DPI OK</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          title="Attenzione: DPI o idoneità da regolarizzare"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Verificare</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {p.stato === 'approvata' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approvata</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => approvaPresenza(p.id, currentUser.name)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approva</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => deletePresenza(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Elimina registrazione"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Timbratura Rapida Squadra */}
      {isSquadraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsSquadraModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Automazione Giornaliera</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Timbratura Rapida Squadra Intera
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registra istantaneamente la presenza di tutti i componenti della squadra con orario standard (07:30 - 16:30, 8h ordinarie) e verifica automatica dei DPI.
              </p>
            </div>

            <form onSubmit={handleSquadraSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seleziona Squadra Operativa
                </label>
                <select
                  value={squadraSelezionata}
                  onChange={(e) => setSquadraSelezionata(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  {squadreDisponibili.map((s) => (
                    <option key={s.nome} value={s.nome}>
                      {s.nome} (Capo: {s.caposquadra}, {s.membriIds.length} operai)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantiere di Assegnazione
                </label>
                <select
                  value={cantiereSquadraId}
                  onChange={(e) => setCantiereSquadraId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verifica Conformità Lavoratori Squadra */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Verifica Idoneità Lavoratori (D.Lgs 81/08):</span>
                  <span className="text-[10px] text-slate-400">Controllo automatico</span>
                </div>
                <div className="space-y-1.5">
                  {(() => {
                    const squadraObj = squadreDisponibili.find((s) => s.nome === squadraSelezionata);
                    if (!squadraObj) return null;
                    const oggi = new Date('2026-10-08');
                    return squadraObj.membriIds.map((dipId) => {
                      const d = dipendenti.find((dip) => dip.id === dipId);
                      if (!d) return null;
                      const isExpired = d.visitaMedicaScadenza && new Date(d.visitaMedicaScadenza) < oggi;
                      return (
                        <div
                          key={d.id}
                          className={`p-2 rounded-lg flex items-center justify-between text-[11px] border ${
                            isExpired
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isExpired ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {d.nome} {d.cognome}
                            </span>
                          </div>
                          <span className="font-mono text-[10px]">
                            {isExpired ? (
                              <span className="text-rose-500 font-bold">🚨 Scaduta il {d.visitaMedicaScadenza} (Blocco)</span>
                            ) : (
                              <span className="text-emerald-500 font-bold">✓ Idoneo (Scad. {d.visitaMedicaScadenza || '2026-12'})</span>
                            )}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Parametri Applicati:</div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Orario:</span>
                  <span className="font-mono text-slate-200">07:30 ➔ 16:30 (8 ore ordinarie)</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Indennità Trasferta & Buono Pasto:</span>
                  <span className="font-mono text-slate-200">Abilitati (15€)</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Conformità DPI III Cat. e Tesserini:</span>
                  <span className="text-emerald-400 font-bold">Verificati e Convalidati</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSquadraModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Conferma Timbratura Squadra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Nuova Registrazione Singola */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>Registrazione Presenza & Timesheet Cantiere</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compila i dettagli orari e la conformità di sicurezza per operaio interno o ditta subappaltatrice.
              </p>
            </div>

            <form onSubmit={handleCreatePresenza} className="space-y-4 text-xs">
              {/* Tipo Lavoratore */}
              <div className="flex items-center gap-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="tipoLavoratore"
                    checked={!formIsSubappalto}
                    onChange={() => setFormIsSubappalto(false)}
                    className="accent-amber-500"
                  />
                  <span>Operaio Interno (VoltMaster)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="tipoLavoratore"
                    checked={formIsSubappalto}
                    onChange={() => setFormIsSubappalto(true)}
                    className="accent-amber-500"
                  />
                  <span>Ditta Subappalto Esterna</span>
                </label>
              </div>

              {/* Seleziona Dipendente o Ditta Esterna */}
              {!formIsSubappalto ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seleziona Dipendente
                  </label>
                  <select
                    value={formDipendenteId}
                    onChange={(e) => setFormDipendenteId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    {dipendenti.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.cognome} — {d.ruoloAziendale} {!d.costoRiservato && d.costoOrario > 0 ? `(€${d.costoOrario}/h)` : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selDip = dipendenti.find((d) => d.id === formDipendenteId);
                    if (selDip && selDip.visitaMedicaScadenza) {
                      const isExpired = new Date(selDip.visitaMedicaScadenza) < new Date('2026-10-08');
                      if (isExpired) {
                        return (
                          <div className="mt-1.5 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-500 text-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>🚨 <strong>Blocco D.Lgs 81/08:</strong> Visita medica scaduta il {selDip.visitaMedicaScadenza}. Timbratura non consentita.</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome e Cognome
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="es. Mario Rossi"
                      value={formSubNome}
                      onChange={(e) => setFormSubNome(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mansione
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubMansione}
                      onChange={(e) => setFormSubMansione(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ditta Subappaltatrice
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubDitta}
                      onChange={(e) => setFormSubDitta(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Cantiere */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantiere di Riferimento
                </label>
                <select
                  value={formCantiereId}
                  onChange={(e) => setFormCantiereId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titolo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orari e Ore */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ora Ingresso</label>
                  <input
                    type="time"
                    value={formOraIngresso}
                    onChange={(e) => setFormOraIngresso(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ora Uscita</label>
                  <input
                    type="time"
                    value={formOraUscita}
                    onChange={(e) => setFormOraUscita(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ore Ordinarie</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="12"
                    value={formOreOrdinarie}
                    onChange={(e) => setFormOreOrdinarie(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ore Straordinari</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={formOreStraordinarie}
                    onChange={(e) => setFormOreStraordinarie(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono text-amber-400"
                  />
                </div>
              </div>

              {/* Controlli di Sicurezza D.Lgs 81/08 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                  Checklist di Sicurezza all'Ingresso (D.Lgs 81/08)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDpi}
                      onChange={(e) => setFormDpi(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>DPI III Cat. Verificati</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIdoneita}
                      onChange={(e) => setFormIdoneita(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Idoneità Medica Valida</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTesserino}
                      onChange={(e) => setFormTesserino(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Tesserino Riconoscimento</span>
                  </label>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Operative / Lavorazioni Eseguite
                </label>
                <input
                  type="text"
                  placeholder="es. Cablaggio quadri piano terra, collaudo dorsale..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Presenza</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* LUL & Paghe Export Modal */}
      <PresenzeLulExportModal
        isOpen={isLulModalOpen}
        onClose={() => setIsLulModalOpen(false)}
        presenze={presenze}
        dipendenti={dipendenti}
        cantieri={cantieri}
        onShowToast={showToast}
      />
    </div>
  );
};
