import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Search,
  ScanLine,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Package,
  Layers,
  FileText,
  Building2,
  X,
  Database,
  Eye,
  Barcode,
  Zap,
  Tag,
  CheckCircle2,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ArticoloMagazzino } from '../types';
import { ResourceThumbnail } from './preview/ResourceThumbnail';
import { ZonaVerdeSection } from './magazzino/ZonaVerdeSection';
import { AggiornaListinoExcelModal } from './magazzino/AggiornaListinoExcelModal';
import { generateUniqueId } from '../utils/idGenerator';

export const MagazzinoModule: React.FC = () => {
  const {
    magazzino,
    movimenti,
    cantieri,
    pacchiZonaVerde,
    setIsNuovoPaccoModalOpen,
    addArticoloMagazzino,
    addMovimento,
    openQRModal,
    showToast,
    currentUser,
    offlineCacheInfo,
    openOfflineModal,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutti');
  const [selectedFornitore, setSelectedFornitore] = useState<string>('tutti');
  const [quickFilter, setQuickFilter] = useState<'tutti' | 'rematarlazzi' | 'sottoscorta'>('tutti');
  const [activeTab, setActiveTab] = useState<'articoli' | 'movimenti' | 'zona_verde'>('articoli');

  // New Article Modal
  const [isNewArticleOpen, setIsNewArticleOpen] = useState(false);
  const [isAggiornaListinoOpen, setIsAggiornaListinoOpen] = useState(false);
  const [sku, setSku] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<ArticoloMagazzino['categoria']>('cavi_elettrici');
  const [giacenza, setGiacenza] = useState(100);
  const [scortaMin, setScortaMin] = useState(30);
  const [unita, setUnita] = useState('m');
  const [prezzoAcq, setPrezzoAcq] = useState(5);
  const [prezzoVen, setPrezzoVen] = useState(8.5);
  const [scaffale, setScaffale] = useState('Corsia 2 - Ripiano B');
  const [fornitore, setFornitore] = useState('RemaTarlazzi');
  const [siglaMarchio, setSiglaMarchio] = useState('');
  const [barcodeEan, setBarcodeEan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  // Movement Modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movArticleId, setMovArticleId] = useState(magazzino[0]?.id || '');
  const [movTipo, setMovTipo] = useState<'carico_fornitore' | 'scarico_cantiere'>('scarico_cantiere');
  const [movQuantita, setMovQuantita] = useState(10);
  const [movCantiereId, setMovCantiereId] = useState(cantieri[0]?.id || '');
  const [movDocRif, setMovDocRif] = useState('DDT-2026/09');

  const remaCount = magazzino.filter((a) => a.fornitore === 'RemaTarlazzi').length;
  const sottoscortaCount = magazzino.filter((a) => a.giacenza <= a.scortaMinima).length;

  const filteredArticoli = magazzino.filter((a) => {
    const matchesSearch =
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.codiceSku.toLowerCase().includes(search.toLowerCase()) ||
      a.fornitore.toLowerCase().includes(search.toLowerCase()) ||
      (a.siglaMarchio && a.siglaMarchio.toLowerCase().includes(search.toLowerCase())) ||
      (a.barcodeEan && a.barcodeEan.includes(search));

    const matchesCat = selectedCategoria === 'tutti' || a.categoria === selectedCategoria;
    const matchesForn = selectedFornitore === 'tutti' || a.fornitore === selectedFornitore;

    let matchesQuick = true;
    if (quickFilter === 'rematarlazzi') {
      matchesQuick = a.fornitore === 'RemaTarlazzi';
    } else if (quickFilter === 'sottoscorta') {
      matchesQuick = a.giacenza <= a.scortaMinima;
    }

    return matchesSearch && matchesCat && matchesForn && matchesQuick;
  });

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = sku.trim().toUpperCase() || generateUniqueId('ART').toUpperCase();
    addArticoloMagazzino({
      codiceSku: cleanSku,
      nome,
      categoria,
      giacenza,
      scortaMinima: scortaMin,
      unitaMisura: unita,
      prezzoUnitarioAcquisto: prezzoAcq,
      prezzoListinoVendita: prezzoVen,
      ubicazioneScaffale: scaffale,
      fornitore,
      siglaMarchio: siglaMarchio.trim().toUpperCase() || undefined,
      barcodeEan: barcodeEan.trim() || undefined,
      fotoUrl: fotoUrl.trim() || undefined,
      qrCode: `QR-MAT-${cleanSku}`,
    });

    setIsNewArticleOpen(false);
    setSku('');
    setNome('');
    setSiglaMarchio('');
    setBarcodeEan('');
    setFotoUrl('');
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const art = magazzino.find((m) => m.id === movArticleId);
    if (!art) return;

    const cantiere = cantieri.find((c) => c.id === movCantiereId);

    addMovimento({
      data: new Date().toISOString().replace('T', ' ').slice(0, 16),
      tipo: movTipo,
      articoloId: art.id,
      articoloNome: art.nome,
      quantita: movQuantita,
      cantiereId: movTipo === 'scarico_cantiere' ? cantiere?.id : undefined,
      cantiereNome: movTipo === 'scarico_cantiere' ? cantiere?.titolo : undefined,
      operatoreNome: currentUser.name,
      documentoRif: movDocRif,
    });

    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Magazzino Elettrico & Materiali
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Listino RemaTarlazzi Attivo
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Tracciabilità materiali via QR/Barcode, scorte minime, listini fornitore e scarico su cantieri
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsAggiornaListinoOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Aggiorna i prezzi del catalogo e importa nuovi articoli dal file Excel RemaTarlazzi (foglio LISRTAXLS)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Aggiorna Listino Prezzi da Excel</span>
          </button>
          <button
            onClick={() => openOfflineModal('materiali')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-cyan-300 border border-cyan-200 dark:border-slate-700/80 text-xs font-semibold rounded-lg transition-colors shadow-xs"
            title="Visualizza i materiali e ricambi salvati in memoria locale per il cantiere"
          >
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Cache Offline ({offlineCacheInfo.materialiCount})</span>
          </button>
          <button
            onClick={() => setIsNuovoPaccoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Boxes className="w-4 h-4" />
            Segnacollo Zona Verde
          </button>
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            Movimenta Articolo
          </button>
          <button
            onClick={() => setIsNewArticleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuovo Articolo
          </button>
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setQuickFilter('tutti');
            setSelectedFornitore('tutti');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            quickFilter === 'tutti' && selectedFornitore === 'tutti'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Tutti i Materiali ({magazzino.length})
        </button>

        <button
          onClick={() => {
            setQuickFilter('rematarlazzi');
            setSelectedFornitore('RemaTarlazzi');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            quickFilter === 'rematarlazzi' || selectedFornitore === 'RemaTarlazzi'
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Listino RemaTarlazzi ({remaCount})</span>
        </button>

        <button
          onClick={() => {
            setQuickFilter('sottoscorta');
            setSelectedFornitore('tutti');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            quickFilter === 'sottoscorta'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sottoscorta ({sottoscortaCount})</span>
        </button>
      </div>

      {/* Segmented View Switcher & Search */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('articoli')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'articoli' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Inventario Materiali ({filteredArticoli.length})
          </button>
          <button
            onClick={() => setActiveTab('movimenti')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'movimenti' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Storico Movimenti ({movimenti.length})
          </button>
          <button
            onClick={() => setActiveTab('zona_verde')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'zona_verde'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Zona Verde ({pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length})</span>
          </button>
        </div>

        {activeTab === 'articoli' && (
          <div className="flex flex-wrap items-center gap-2 flex-1 lg:max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cerca SKU, nome cavo/apparecchio, EAN, marchio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:border-amber-500"
            >
              <option value="tutti">Tutte le categorie</option>
              <option value="cavi_elettrici">Cavi Elettrici (Prysmian, FS18, KNX)</option>
              <option value="quadri_modulari">Quadri & Modulari (Schneider, ABB, Gewiss)</option>
              <option value="apparecchi_comando">Serie Civili & Comando (Bticino, Vimar)</option>
              <option value="tubi_canaline">Tubi & Canaline (Gewiss, Bocchiotti, DKC)</option>
              <option value="illuminazione">Illuminazione LED & Emergenza (Beghelli, Disano)</option>
              <option value="materiale_vario">Materiale Vario & Minuteria (Wago, Fischer, 3M)</option>
            </select>

            <select
              value={selectedFornitore}
              onChange={(e) => {
                setSelectedFornitore(e.target.value);
                if (e.target.value === 'RemaTarlazzi') {
                  setQuickFilter('rematarlazzi');
                } else {
                  setQuickFilter('tutti');
                }
              }}
              className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:border-amber-500"
            >
              <option value="tutti">Tutti i Fornitori</option>
              <option value="RemaTarlazzi">RemaTarlazzi S.p.A. (Listino METEL)</option>
              <option value="Elettroforniture Spa">Elettroforniture Spa</option>
              <option value="Sonepar Italia">Sonepar Italia</option>
            </select>
          </div>
        )}
      </div>

      {/* ARTICLES TABLE VIEW (Desktop / Tablet) */}
      {activeTab === 'articoli' && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center">Foto</th>
                    <th className="py-3 px-4">Codice SKU / Marchio</th>
                    <th className="py-3 px-4">Descrizione Materiale & Barcode EAN</th>
                    <th className="py-3 px-4">Categoria / Fornitore</th>
                    <th className="py-3 px-4 text-right">Giacenza</th>
                    <th className="py-3 px-4 text-right">Scorta Min.</th>
                    <th className="py-3 px-4">Ubicazione Scaffale</th>
                    <th className="py-3 px-4 text-right">Prezzo Acquisto</th>
                    <th className="py-3 px-4 text-right">Prezzo Listino</th>
                    <th className="py-3 px-4 text-center">QR Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredArticoli.map((art) => {
                    const isLowStock = art.giacenza <= art.scortaMinima;
                    const isRema = art.fornitore === 'RemaTarlazzi';
                    return (
                      <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <ResourceThumbnail
                            imageUrl={art.fotoUrl}
                            category="materiale"
                            alt={art.nome}
                            code={art.codiceSku}
                            title={art.nome}
                            subtitle={`Giacenza: ${art.giacenza} ${art.unitaMisura} · Scaffale: ${art.ubicazioneScaffale}`}
                            size="md"
                            clickable={true}
                            details={[
                              { label: 'Giacenza', value: `${art.giacenza} ${art.unitaMisura}` },
                              { label: 'Scorta Min.', value: `${art.scortaMinima} ${art.unitaMisura}` },
                              { label: 'Ubicazione', value: art.ubicazioneScaffale },
                              { label: 'Prezzo Listino', value: `€ ${art.prezzoListinoVendita.toFixed(2)}` },
                              { label: 'Prezzo Acquisto', value: `€ ${art.prezzoUnitarioAcquisto.toFixed(2)}` },
                              { label: 'Fornitore', value: art.fornitore },
                              ...(art.barcodeEan ? [{ label: 'Barcode EAN', value: art.barcodeEan }] : []),
                            ]}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <div className="text-amber-600 dark:text-amber-400">{art.codiceSku}</div>
                          {art.siglaMarchio && (
                            <span className="inline-block mt-0.5 text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {art.siglaMarchio}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{art.nome}</div>
                          {art.barcodeEan && (
                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3.5 h-3.5 text-slate-400" />
                              <span>EAN: {art.barcodeEan}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-500 uppercase font-mono">
                            {art.categoria.replace('_', ' ')}
                          </div>
                          <div className="mt-0.5">
                            {isRema ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                <Zap className="w-3 h-3 text-amber-500" /> RemaTarlazzi
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">{art.fornitore}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isLowStock ? 'text-rose-500 font-black' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {art.giacenza}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">{art.unitaMisura}</span>
                          {isLowStock && (
                            <div className="text-[10px] text-rose-500 font-semibold">Sottoscorta!</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {art.scortaMinima} {art.unitaMisura}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] font-mono">
                          {art.ubicazioneScaffale}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          € {art.prezzoUnitarioAcquisto.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">
                          € {art.prezzoListinoVendita.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() =>
                              openQRModal({
                                title: art.nome,
                                code: art.qrCode,
                                subtitle: `SKU: ${art.codiceSku} · Ubicaz: ${art.ubicazioneScaffale}`,
                                type: 'materiale',
                              })
                            }
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                            title="Genera ed etichetta QR code"
                          >
                            <ScanLine className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smartphone Mobile Cards List View */}
          <div className="md:hidden space-y-3">
            {filteredArticoli.map((art) => {
              const isLowStock = art.giacenza <= art.scortaMinima;
              const isRema = art.fornitore === 'RemaTarlazzi';
              return (
                <div
                  key={art.id}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center gap-3.5"
                >
                  <ResourceThumbnail
                    imageUrl={art.fotoUrl}
                    category="materiale"
                    alt={art.nome}
                    code={art.codiceSku}
                    title={art.nome}
                    subtitle={`Giacenza: ${art.giacenza} ${art.unitaMisura}`}
                    size="mobile"
                    clickable={true}
                    details={[
                      { label: 'Giacenza', value: `${art.giacenza} ${art.unitaMisura}` },
                      { label: 'Ubicazione', value: art.ubicazioneScaffale },
                      { label: 'Listino', value: `€ ${art.prezzoListinoVendita.toFixed(2)}` },
                      { label: 'Acquisto', value: `€ ${art.prezzoUnitarioAcquisto.toFixed(2)}` },
                      { label: 'Fornitore', value: art.fornitore },
                      ...(art.barcodeEan ? [{ label: 'Barcode EAN', value: art.barcodeEan }] : []),
                    ]}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
                          {art.codiceSku}
                        </span>
                        {isRema && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                            Rema
                          </span>
                        )}
                      </div>
                      {isLowStock ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30 shrink-0">
                          Sottoscorta
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                          Disponibile
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {art.nome}
                    </h3>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span className="truncate">📍 {art.ubicazioneScaffale}</span>
                      <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {art.giacenza} {art.unitaMisura}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        € {art.prezzoListinoVendita.toFixed(2)} listino
                      </span>
                      <button
                        onClick={() =>
                          openQRModal({
                            title: art.nome,
                            code: art.qrCode,
                            subtitle: `SKU: ${art.codiceSku} · Ubicaz: ${art.ubicazioneScaffale}`,
                            type: 'materiale',
                          })
                        }
                        className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <ScanLine className="w-3 h-3" />
                        <span>Etichetta QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MOVEMENTS TABLE VIEW */}
      {activeTab === 'movimenti' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs dark:shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Data e Ora</th>
                <th className="py-3 px-4">Tipo Movimento</th>
                <th className="py-3 px-4">Materiale</th>
                <th className="py-3 px-4 text-right">Quantità</th>
                <th className="py-3 px-4">Destinazione / Cantiere</th>
                <th className="py-3 px-4">Operatore</th>
                <th className="py-3 px-4">Doc. Riferimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {movimenti.map((mov) => {
                const isCarico = mov.tipo === 'carico_fornitore' || mov.tipo === 'reso_cantiere';
                return (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-slate-400">{mov.data}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isCarico ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isCarico ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {mov.tipo.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{mov.articoloNome}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {isCarico ? `+${mov.quantita}` : `-${mov.quantita}`}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {mov.cantiereNome ? (
                        <span className="font-semibold text-slate-200">{mov.cantiereNome}</span>
                      ) : (
                        <span className="text-slate-500 italic">Carico magazzino centrale</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{mov.operatoreNome}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{mov.documentoRif}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ZONA VERDE & SEGNACOLLI A5 VIEW */}
      {activeTab === 'zona_verde' && (
        <ZonaVerdeSection />
      )}

      {/* CREATE NEW ARTICLE MODAL */}
      {isNewArticleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewArticleOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Nuovo Articolo a Magazzino</h3>
            <p className="text-xs text-slate-400 mb-4">
              Censimento materiale e generazione automatica QR code di tracciabilità
            </p>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Codice SKU Univoco:</label>
                  <input
                    type="text"
                    required
                    placeholder="es. CAV-FS17-3G2.5"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Categoria:</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  >
                    <option value="cavi_elettrici">Cavi Elettrici</option>
                    <option value="quadri_modulari">Quadri & Modulari</option>
                    <option value="apparecchi_comando">Serie Civile & Comando</option>
                    <option value="tubi_canaline">Canaline & Tubazioni</option>
                    <option value="illuminazione">Illuminazione LED</option>
                    <option value="fotovoltaico_accumulo">Fotovoltaico & Accumulo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nome / Descrizione Estesa:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Cavo FS17 450/750V 3G2.5 marrone/blu/giallo-verde"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Giacenza Iniziale:</label>
                  <input
                    type="number"
                    value={giacenza}
                    onChange={(e) => setGiacenza(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Scorta Minima:</label>
                  <input
                    type="number"
                    value={scortaMin}
                    onChange={(e) => setScortaMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Unità di Misura:</label>
                  <input
                    type="text"
                    value={unita}
                    onChange={(e) => setUnita(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-center text-slate-900 dark:text-slate-100 focus:border-amber-500"
                    placeholder="m / pz / barre"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Prezzo Acquisto (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prezzoAcq}
                    onChange={(e) => setPrezzoAcq(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Prezzo Listino Vendita (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prezzoVen}
                    onChange={(e) => setPrezzoVen(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-amber-600 dark:text-amber-400 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ubicazione Scaffale:</label>
                  <input
                    type="text"
                    value={scaffale}
                    onChange={(e) => setScaffale(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fornitore Principale:</label>
                  <input
                    type="text"
                    value={fornitore}
                    onChange={(e) => setFornitore(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  URL Immagine / Foto Prodotto:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://... (link diretto foto o lascia vuoto per icona)"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500 font-mono text-[11px]"
                  />
                  <ResourceThumbnail
                    imageUrl={fotoUrl || null}
                    category="materiale"
                    alt={nome || 'Nuovo articolo'}
                    size="sm"
                    clickable={false}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewArticleOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Salva Articolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT MODAL */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsMovementModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Carico / Scarico Cantiere</h3>
            <p className="text-xs text-slate-400 mb-4">
              Registra movimentazione materiale con aggiornamento istantaneo giacenza
            </p>

            <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tipo di Operazione:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovTipo('scarico_cantiere')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                      movTipo === 'scarico_cantiere'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Scarico su Cantiere
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovTipo('carico_fornitore')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                      movTipo === 'carico_fornitore'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Carico da Fornitore
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Materiale:</label>
                <select
                  value={movArticleId}
                  onChange={(e) => setMovArticleId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  {magazzino.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.codiceSku}] {m.nome} (Disponibili: {m.giacenza} {m.unitaMisura})
                    </option>
                  ))}
                </select>
              </div>

              {movTipo === 'scarico_cantiere' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Destinazione (Cantiere):</label>
                  <select
                    value={movCantiereId}
                    onChange={(e) => setMovCantiereId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.codice}] {c.titolo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Quantità da movimentare:</label>
                  <input
                    type="number"
                    value={movQuantita}
                    onChange={(e) => setMovQuantita(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Documento Rif (DDT):</label>
                  <input
                    type="text"
                    value={movDocRif}
                    onChange={(e) => setMovDocRif(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Conferma Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aggiornamento Listino Prezzi da Excel (RemaTarlazzi) */}
      {isAggiornaListinoOpen && (
        <AggiornaListinoExcelModal
          isOpen={isAggiornaListinoOpen}
          onClose={() => setIsAggiornaListinoOpen(false)}
        />
      )}
    </div>
  );
};
