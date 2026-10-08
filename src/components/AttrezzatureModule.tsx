import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  ShieldCheck,
  X,
  Warehouse,
  Truck,
  Phone,
  Package,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Attrezzatura, AttrezzaturaStato } from '../types';
import { ResourceThumbnail } from './preview/ResourceThumbnail';
import { generateUniqueId } from '../utils/idGenerator';

export const AttrezzatureModule: React.FC = () => {
  const {
    attrezzature,
    cantieri,
    dipendenti,
    depositi,
    addAttrezzatura,
    updateAttrezzatura,
    openQRModal,
    showToast,
    currentUser,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterPosizione, setFilterPosizione] = useState<string>('tutti');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAttrezzatura, setSelectedAttrezzatura] = useState<Attrezzatura | null>(attrezzature[0] || null);

  // New Equipment Form
  const [codice, setCodice] = useState('');
  const [nome, setNome] = useState('');
  const [marcaModello, setMarcaModello] = useState('');
  const [matricola, setMatricola] = useState('');
  const [posizione, setPosizione] = useState('Deposito Centrale Sede');
  const [responsabile, setResponsabile] = useState('');
  const [fornitore, setFornitore] = useState('');
  const [dataManutenzione, setDataManutenzione] = useState('2026-10-30');
  const [dataGaranzia, setDataGaranzia] = useState('2027-12-31');
  const [contenitore, setContenitore] = useState('Valigia Rigida IP67');

  // Filtered equipment
  const filtered = attrezzature.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.nome.toLowerCase().includes(q) ||
      a.codiceUnivoco.toLowerCase().includes(q) ||
      a.matricola.toLowerCase().includes(q) ||
      (a.titolo && a.titolo.toLowerCase().includes(q)) ||
      (a.operResponsabile && a.operResponsabile.toLowerCase().includes(q)) ||
      (a.posizione && a.posizione.toLowerCase().includes(q));

    const matchesStato = filterStato === 'tutti' || a.stato === filterStato;
    const matchesPos = filterPosizione === 'tutti' || (a.posizione && a.posizione.toLowerCase() === filterPosizione.toLowerCase());

    return matchesSearch && matchesStato && matchesPos;
  });

  const allPositions = Array.from(new Set(attrezzature.map((a) => a.posizione).filter(Boolean)));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Inserisci il nome dello strumento o attrezzatura.', 'warning');
      return;
    }
    const cleanCodice = codice.trim().toUpperCase() || generateUniqueId('ATT').toUpperCase();
    const created = addAttrezzatura({
      codiceUnivoco: cleanCodice,
      nome: nome || cleanCodice,
      titolo: nome,
      marcaModello: marcaModello || 'Strumento di Misura CEI',
      attrezzo: marcaModello,
      matricola: matricola || `SN-${Math.floor(Math.random() * 89999 + 10000)}`,
      codMatricola: matricola,
      stato: 'disponibile',
      posizione: posizione || 'Deposito Centrale Sede',
      operResponsabile: responsabile || (dipendenti[0]?.nome + ' ' + dipendenti[0]?.cognome),
      fornitore,
      dataAcquisto: new Date().toISOString().split('T')[0],
      dAcquisto: new Date().toISOString().split('T')[0],
      prossimaTaratura: dataManutenzione,
      dataManutenzione,
      dataGaranzia,
      contenitore,
      storicoManutenzioni: [
        {
          data: new Date().toISOString().split('T')[0],
          descrizione: 'Collaudo iniziale e messa in servizio conformità CE',
          esito: 'Conforme',
        },
      ],
      qrCode: `QR-ATT-${cleanCodice}`,
    });

    setIsNewModalOpen(false);
    setSelectedAttrezzatura(created);
  };

  const getStatusBadge = (stato: AttrezzaturaStato) => {
    switch (stato) {
      case 'disponibile':
        return <span className="text-emerald-400 font-semibold font-mono text-[11px]">Disponibile</span>;
      case 'assegnata':
        return <span className="text-amber-400 font-semibold font-mono text-[11px]">In Uso / Assegnata</span>;
      case 'in_manutenzione':
        return <span className="text-rose-400 font-semibold font-mono text-[11px]">In Manutenzione</span>;
      case 'taratura_scaduta':
        return <span className="text-rose-500 font-black font-mono text-[11px]">Taratura Scaduta!</span>;
      default:
        return <span className="text-slate-400 font-mono text-[11px]">{stato}</span>;
    }
  };

  // Helper to resolve linked employee
  const resolveDipendente = (nomeResp?: string) => {
    if (!nomeResp) return null;
    return dipendenti.find(
      (d) =>
        `${d.nome} ${d.cognome}`.toLowerCase() === nomeResp.toLowerCase() ||
        d.matricola?.toLowerCase() === nomeResp.toLowerCase() ||
        d.nome.toLowerCase() === nomeResp.toLowerCase()
    );
  };

  // Helper to resolve linked location (deposito vs cantiere)
  const resolvePosizione = (posName?: string) => {
    if (!posName) return null;
    const clean = posName.toLowerCase();
    const dep = depositi.find((d) => d.titolo.toLowerCase() === clean || d.tecnoCodice.toLowerCase() === clean);
    if (dep) return { type: 'deposito' as const, data: dep };

    const cnt = cantieri.find(
      (c) =>
        c.titolo.toLowerCase() === clean ||
        (c.codCantiere && c.codCantiere.toLowerCase() === clean) ||
        c.titolo.toLowerCase().includes(clean) ||
        clean.includes(c.codice.toLowerCase())
    );
    if (cnt) return { type: 'cantiere' as const, data: cnt };

    return { type: 'altro' as const, name: posName };
  };

  const selectedResp = selectedAttrezzatura ? resolveDipendente(selectedAttrezzatura.operResponsabile) : null;
  const selectedPos = selectedAttrezzatura ? resolvePosizione(selectedAttrezzatura.posizione) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Inventario Attrezzature & Asset (Attrezzatura.csv)</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Strumenti di misura CEI 64-8, matricole e collegamenti relazionali con <strong>Elenco Dipendenti</strong> e <strong>Depositi/Cantieri</strong>
          </p>
        </div>

        {currentUser.role !== 'cliente' && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuovo Strumento
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca per codice, matricola, fornitore, responsabile, posizione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter by Posizione */}
        <select
          value={filterPosizione}
          onChange={(e) => setFilterPosizione(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="tutti">Tutte le Posizioni ({attrezzature.length})</option>
          {allPositions.map((pos) => (
            <option key={pos} value={pos}>
              {pos} ({attrezzature.filter((a) => a.posizione === pos).length})
            </option>
          ))}
        </select>

        {/* Filter by Stato */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          {['tutti', 'disponibile', 'assegnata', 'taratura_scaduta'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStato(st)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                filterStato === st
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st === 'taratura_scaduta' ? 'Scaduta' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Strumentazione censita ({filtered.length})</span>
            <span className="text-amber-400 font-mono">
              {attrezzature.filter((a) => a.stato === 'taratura_scaduta').length} in scadenza/scadute
            </span>
          </div>

          <div className="space-y-2.5">
            {filtered.map((att) => {
              const isSelected = selectedAttrezzatura?.id === att.id;
              const isScaduta = att.stato === 'taratura_scaduta' || att.dataManutenzione?.includes('2026-03');

              return (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttrezzatura(att)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-500 dark:bg-slate-900 dark:border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ResourceThumbnail
                      imageUrl={att.fotoUrl}
                      category="attrezzatura"
                      alt={att.titolo || att.nome}
                      code={att.idAttrezzo || att.codiceUnivoco}
                      title={att.titolo || att.nome}
                      subtitle={`Matricola: ${att.codMatricola || att.matricola} · Posizione: ${att.posizione}`}
                      size="mobile"
                      clickable={true}
                      details={[
                        { label: 'Matricola', value: att.codMatricola || att.matricola },
                        { label: 'Stato', value: att.stato },
                        { label: 'Posizione', value: att.posizione || 'Deposito Sede' },
                        { label: 'Responsabile', value: att.operResponsabile || 'Aziendale' },
                        { label: 'Taratura', value: att.dataManutenzione || att.prossimaTaratura },
                      ]}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {att.idAttrezzo || att.codiceUnivoco}
                          </span>
                          {getStatusBadge(att.stato)}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQRModal({
                              title: att.titolo || att.nome,
                              code: att.qrCode,
                              subtitle: `${att.idAttrezzo || att.codiceUnivoco} · Matr: ${att.codMatricola || att.matricola}`,
                              type: 'attrezzatura',
                            });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
                          title="Stampa etichetta QR attrezzo"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {att.titolo || att.nome}
                      </h3>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {att.attrezzo || att.marcaModello}
                      </div>

                      {/* Location & Responsible Strip */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[140px]">
                          📍 <strong className="text-slate-700 dark:text-slate-300">{att.posizione || 'Deposito Sede'}</strong>
                        </span>
                        <span className={`font-mono ${isScaduta ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                          Taratura: {att.dataManutenzione || att.prossimaTaratura}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail (7 cols) */}
        <div className="lg:col-span-7">
          {selectedAttrezzatura ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 shadow-xs dark:shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3.5">
                  <ResourceThumbnail
                    imageUrl={selectedAttrezzatura.fotoUrl}
                    category="attrezzatura"
                    alt={selectedAttrezzatura.titolo || selectedAttrezzatura.nome}
                    code={selectedAttrezzatura.idAttrezzo || selectedAttrezzatura.codiceUnivoco}
                    title={selectedAttrezzatura.titolo || selectedAttrezzatura.nome}
                    subtitle={`Matricola: ${selectedAttrezzatura.codMatricola || selectedAttrezzatura.matricola}`}
                    size="xl"
                    clickable={true}
                    details={[
                      { label: 'Matricola', value: selectedAttrezzatura.codMatricola || selectedAttrezzatura.matricola },
                      { label: 'Stato', value: selectedAttrezzatura.stato },
                      { label: 'Posizione', value: selectedAttrezzatura.posizione || 'Deposito Sede' },
                      { label: 'Responsabile', value: selectedAttrezzatura.operResponsabile || 'Aziendale' },
                      { label: 'Taratura', value: selectedAttrezzatura.dataManutenzione || selectedAttrezzatura.prossimaTaratura },
                    ]}
                  />

                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-amber-500 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                        {selectedAttrezzatura.idAttrezzo || selectedAttrezzatura.codiceUnivoco}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {selectedAttrezzatura.tecnoCodice || 'N/D'}
                      </span>
                      <span className="text-slate-500">·</span>
                      {getStatusBadge(selectedAttrezzatura.stato)}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                      {selectedAttrezzatura.titolo || selectedAttrezzatura.nome}
                    </h2>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {selectedAttrezzatura.attrezzo || selectedAttrezzatura.marcaModello} · Matricola:{' '}
                      <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                        {selectedAttrezzatura.codMatricola || selectedAttrezzatura.matricola}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      openQRModal({
                        title: selectedAttrezzatura.titolo || selectedAttrezzatura.nome,
                        code: selectedAttrezzatura.qrCode,
                        subtitle: `${selectedAttrezzatura.idAttrezzo || selectedAttrezzatura.codiceUnivoco} · Matr: ${selectedAttrezzatura.codMatricola || selectedAttrezzatura.matricola}`,
                        type: 'attrezzatura',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-amber-500" />
                    Etichetta QR
                  </button>
                </div>
              </div>

              {/* RELATIONAL CONNECTION 1: RESPONSABILE COLLEGATO A DIPENDENTI */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Responsabile Strumento (Elenco_dipendeti.csv)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    Foreign Key Risolta
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedAttrezzatura.operResponsabile || 'Non assegnato'}
                    </p>
                    {selectedResp && (
                      <p className="text-xs text-purple-300 mt-0.5">
                        Matricola: <span className="font-mono font-semibold">{selectedResp.matricola || selectedResp.id}</span> · {selectedResp.qualifica || selectedResp.ruoloAziendale}
                      </p>
                    )}
                  </div>

                  {selectedResp && (
                    <div className="flex items-center gap-1 text-xs text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedResp.tel || selectedResp.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RELATIONAL CONNECTION 2: POSIZIONE COLLEGATA A DEPOSITI / CANTIERI */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Posizione Attuale (Elenco_Depositi.csv / Registro_Cantieri.csv)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                    Collocazione Asset
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedAttrezzatura.posizione || 'Deposito Centrale Sede'}
                      </p>
                      {selectedPos?.type === 'deposito' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          {selectedPos.data.tipologia.includes('Furgone') ? (
                            <Truck className="w-3 h-3" />
                          ) : (
                            <Warehouse className="w-3 h-3" />
                          )}
                          {selectedPos.data.tipologia}
                        </span>
                      )}
                      {selectedPos?.type === 'cantiere' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Cantiere Operativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contenitore stoccaggio: <strong className="text-slate-800 dark:text-slate-200">{selectedAttrezzatura.contenitore || 'Valigia Standard'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical & Compliance Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Prossima Manutenzione</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
                    {selectedAttrezzatura.dataManutenzione || selectedAttrezzatura.prossimaTaratura}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Verifica periodica</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Scadenza Garanzia</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
                    {selectedAttrezzatura.dataGaranzia || 'N/D'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Copertura fornitore</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Fornitore</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate mt-0.5">
                    {selectedAttrezzatura.fornitore || 'Distributore autorizzato'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Canale acquisto</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Data Acquisto</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 block mt-0.5">
                    {selectedAttrezzatura.dAcquisto || selectedAttrezzatura.dataAcquisto}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Immatricolazione</span>
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Certificati di Taratura & Manutenzioni
                </h4>
                {selectedAttrezzatura.storicoManutenzioni && selectedAttrezzatura.storicoManutenzioni.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAttrezzatura.storicoManutenzioni.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{item.data}</span>
                            <span className="text-slate-400 dark:text-slate-600">·</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold">{item.esito}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{item.descrizione}</div>
                        </div>

                        {item.costo && (
                          <div className="font-mono text-slate-700 dark:text-slate-300">€ {item.costo.toFixed(2)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 dark:bg-slate-950/60 rounded border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs text-center italic">
                    Nessuna registrazione pregressa di manutenzione.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              Nessuno strumento selezionato.
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Censisci Nuova Attrezzatura / Asset</h3>
            <p className="text-xs text-slate-400 mb-4">
              Mappatura su <strong>Attrezzatura.csv</strong> con assegnazione a deposito o cantiere
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">ID Attrezzo / Codice:</label>
                  <input
                    type="text"
                    required
                    placeholder="es. STR-CEI-02"
                    value={codice}
                    onChange={(e) => setCodice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Codice Matricola:</label>
                  <input
                    type="text"
                    required
                    placeholder="es. MAT-2026-99"
                    value={matricola}
                    onChange={(e) => setMatricola(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Descrizione / Titolo:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Termocamera Infrarossi FLIR E8-XT con certificato calibrazione"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tipologia / Attrezzo:</label>
                  <input
                    type="text"
                    placeholder="es. Termocamera Quadri"
                    value={marcaModello}
                    onChange={(e) => setMarcaModello(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fornitore:</label>
                  <input
                    type="text"
                    placeholder="es. Asita S.r.l."
                    value={fornitore}
                    onChange={(e) => setFornitore(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Posizione Dropdown linked to Depositi & Cantieri */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Posizione / Collocazione (Depositi & Cantieri):
                </label>
                <select
                  value={posizione}
                  onChange={(e) => setPosizione(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  <optgroup label="Depositi & Furgoni">
                    {depositi.map((dep) => (
                      <option key={dep.titolo} value={dep.titolo}>
                        [DEPOSITO] {dep.titolo} ({dep.tipologia})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cantieri Operativi">
                    {cantieri.map((cnt) => (
                      <option key={cnt.id} value={cnt.titolo}>
                        [CANTIERE] {cnt.codice} - {cnt.titolo}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Responsabile Dropdown linked to Dipendenti */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Operatore Responsabile (Elenco Dipendenti):
                </label>
                <select
                  value={responsabile}
                  onChange={(e) => setResponsabile(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  <option value="">-- Seleziona Responsabile --</option>
                  {dipendenti.map((d) => (
                    <option key={d.matricola || d.id} value={`${d.nome} ${d.cognome}`}>
                      {d.nome} {d.cognome} ({d.matricola || d.id}) - {d.qualifica || d.ruoloAziendale}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Data Prossima Manutenzione:</label>
                  <input
                    type="date"
                    value={dataManutenzione}
                    onChange={(e) => setDataManutenzione(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Data Garanzia:</label>
                  <input
                    type="date"
                    value={dataGaranzia}
                    onChange={(e) => setDataGaranzia(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  Salva Strumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
