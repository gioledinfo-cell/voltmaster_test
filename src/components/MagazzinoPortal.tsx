import React, { useState } from 'react';
import {
  Warehouse,
  Package,
  Wrench,
  Truck,
  ScanLine,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Building2,
  ShieldCheck,
  Fuel,
  CheckSquare,
  FileText,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  ChevronRight,
  Layers,
  X,
  ShoppingCart,
  PackagePlus,
  Barcode,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ArticoloMagazzino, Attrezzatura, Veicolo, MovimentoMagazzino } from '../types';
import { OrdiniModule } from './ordini/OrdiniModule';
import { ResourceThumbnail } from './preview/ResourceThumbnail';
import { RichiesteMaterialiModule } from './richieste/RichiesteMaterialiModule';
import { ZonaVerdeSection } from './magazzino/ZonaVerdeSection';
import { generateUniqueId } from '../utils/idGenerator';

export const MagazzinoPortal: React.FC = () => {
  const {
    magazzino,
    movimenti,
    attrezzature,
    veicoli,
    cantieri,
    dipendenti,
    currentUser,
    ordiniInterni,
    richiesteMateriali,
    pacchiZonaVerde,
    setIsNuovoPaccoModalOpen,
    addArticoloMagazzino,
    updateArticoloMagazzino,
    addMovimento,
    addAttrezzatura,
    updateAttrezzatura,
    addVeicolo,
    updateVeicolo,
    openQRModal,
    openScanner,
    showToast,
  } = useApp();

  const [activePortalTab, setActivePortalTab] = useState<
    'materiali' | 'attrezzature' | 'veicoli' | 'movimenti' | 'ordini' | 'richieste_cantiere' | 'zona_verde'
  >('materiali');
  const [search, setSearch] = useState('');

  // Modals state
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<'carico_fornitore' | 'scarico_cantiere'>('scarico_cantiere');
  const [movArtId, setMovArtId] = useState(magazzino[0]?.id || '');
  const [movQty, setMovQty] = useState(10);
  const [movCantiereId, setMovCantiereId] = useState(cantieri[0]?.id || '');
  const [movDocRif, setMovDocRif] = useState('');

  // New Article Modal
  const [isNewArtModalOpen, setIsNewArtModalOpen] = useState(false);
  const [artSku, setArtSku] = useState('');
  const [artNome, setArtNome] = useState('');
  const [artCategoria, setArtCategoria] = useState<ArticoloMagazzino['categoria']>('cavi_elettrici');
  const [artGiacenza, setArtGiacenza] = useState(50);
  const [artScortaMin, setArtScortaMin] = useState(20);
  const [artUnita, setArtUnita] = useState('m');
  const [artPrezzoAcq, setArtPrezzoAcq] = useState(4.5);
  const [artPrezzoVen, setArtPrezzoVen] = useState(7.9);
  const [artScaffale, setArtScaffale] = useState('Corsia 1 - Ripiano A');
  const [artFornitore, setArtFornitore] = useState('Elettroforniture Spa');

  // Attrezzatura Assignment / Return Modal
  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [selectedAtt, setSelectedAtt] = useState<Attrezzatura | null>(null);
  const [attAssignType, setAttAssignType] = useState<'dipendente' | 'cantiere'>('dipendente');
  const [attAssignTargetId, setAttAssignTargetId] = useState(dipendenti[0]?.id || '');

  // Vehicle Checklist Modal
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedVec, setSelectedVec] = useState<Veicolo | null>(null);
  const [vecKmControllo, setVecKmControllo] = useState(0);
  const [checklistItems, setChecklistItems] = useState({
    estintore: true,
    prontoSoccorso: true,
    librettoAssicurazione: true,
    scaleDPI: true,
    carburanteAdeguato: true,
    puliziaVanoCarico: true,
  });

  // Vehicle Maintenance Modal
  const [isVecMaintModalOpen, setIsVecMaintModalOpen] = useState(false);
  const [maintTipo, setMaintTipo] = useState<'tagliando' | 'gomme' | 'riparazione' | 'revisione'>('tagliando');
  const [maintKm, setMaintKm] = useState(0);
  const [maintCosto, setMaintCosto] = useState(350);
  const [maintOfficina, setMaintOfficina] = useState('Autofficina Convenzionata Milano');

  // New Equipment Modal
  const [isNewAttOpen, setIsNewAttOpen] = useState(false);
  const [newAttCodice, setNewAttCodice] = useState('');
  const [newAttNome, setNewAttNome] = useState('');
  const [newAttModello, setNewAttModello] = useState('');
  const [newAttMatricola, setNewAttMatricola] = useState('');
  const [newAttTaratura, setNewAttTaratura] = useState('2027-06-30');

  // Calculations for KPIs
  const lowStockArticles = magazzino.filter((m) => m.giacenza <= m.scortaMinima);
  const totalStockValue = magazzino.reduce((sum, item) => sum + item.giacenza * item.prezzoUnitarioAcquisto, 0);
  const totalListValue = magazzino.reduce((sum, item) => sum + item.giacenza * item.prezzoListinoVendita, 0);

  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const expiringAttrezzature = attrezzature.filter((a) => {
    const tarDate = new Date(a.prossimaTaratura);
    return tarDate <= thirtyDaysAhead;
  });

  const expiringVeicoli = veicoli.filter((v) => {
    const revDate = new Date(v.scadenzaRevisione);
    const assDate = new Date(v.scadenzaAssicurazione);
    const tagliandoKmLeft = v.scadenzaTagliandoKm - v.kmAttuali;
    return revDate <= thirtyDaysAhead || assDate <= thirtyDaysAhead || tagliandoKmLeft <= 1500;
  });

  const ordiniApertiCount = ordiniInterni.filter((o) => o.stato !== 'chiuso' && o.stato !== 'annullato').length;
  const todayStr = now.toISOString().split('T')[0];
  const ordiniInRitardoCount = ordiniInterni.filter(
    (o) => o.stato !== 'consegnato' && o.stato !== 'chiuso' && o.stato !== 'annullato' && o.dataConsegnaPrevista < todayStr
  ).length;

  // Handlers
  const handleQuickMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const art = magazzino.find((m) => m.id === movArtId);
    if (!art) return;

    const cant = cantieri.find((c) => c.id === movCantiereId);

    addMovimento({
      data: new Date().toISOString().replace('T', ' ').slice(0, 16),
      tipo: movTipo,
      articoloId: art.id,
      articoloNome: art.nome,
      quantita: movQty,
      cantiereId: movTipo === 'scarico_cantiere' ? movCantiereId : undefined,
      cantiereNome: movTipo === 'scarico_cantiere' ? (cant ? cant.titolo : undefined) : undefined,
      operatoreNome: currentUser.name,
      documentoRif: movDocRif.trim() || (movTipo === 'carico_fornitore' ? 'DDT-FORNITORE' : 'RAPP-USCITA-MAG'),
    });

    setIsMovModalOpen(false);
    showToast(`Movimento registrato: ${movTipo === 'scarico_cantiere' ? 'Scarico' : 'Carico'} ${movQty} ${art.unitaMisura}`, 'success');
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const sku = artSku.trim().toUpperCase() || generateUniqueId('SKU').toUpperCase();
    addArticoloMagazzino({
      codiceSku: sku,
      nome: artNome,
      categoria: artCategoria,
      giacenza: artGiacenza,
      scortaMinima: artScortaMin,
      unitaMisura: artUnita,
      prezzoUnitarioAcquisto: artPrezzoAcq,
      prezzoListinoVendita: artPrezzoVen,
      ubicazioneScaffale: artScaffale,
      fornitore: artFornitore,
      qrCode: `QR-MAT-${sku.replace(/\s+/g, '')}`,
    });
    setIsNewArtModalOpen(false);
  };

  const handleAssignAttrezzatura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtt) return;

    let targetNome = '';
    if (attAssignType === 'dipendente') {
      const d = dipendenti.find((x) => x.id === attAssignTargetId);
      targetNome = d ? `${d.nome} ${d.cognome} (${d.ruoloAziendale})` : 'Tecnico Assegnato';
    } else {
      const c = cantieri.find((x) => x.id === attAssignTargetId);
      targetNome = c ? c.titolo : 'Cantiere Assegnato';
    }

    updateAttrezzatura(selectedAtt.id, {
      stato: 'assegnata',
      assegnataA: {
        tipo: attAssignType,
        id: attAssignTargetId,
        nome: targetNome,
      },
    });

    setIsAttModalOpen(false);
    showToast(`Strumento ${selectedAtt.codiceUnivoco} assegnato a ${targetNome}`, 'success');
  };

  const handleReturnAttrezzatura = (att: Attrezzatura) => {
    updateAttrezzatura(att.id, {
      stato: 'disponibile',
      assegnataA: undefined,
    });
    showToast(`Strumento ${att.codiceUnivoco} rientrato in magazzino pronto all'uso!`, 'success');
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVec) return;

    if (vecKmControllo > selectedVec.kmAttuali) {
      updateVeicolo(selectedVec.id, {
        kmAttuali: vecKmControllo,
      });
    }

    setIsChecklistModalOpen(false);
    showToast(`Check-list uscita confermata per veicolo ${selectedVec.targa}. Mezzo idoneo al servizio.`, 'success');
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVec) return;

    const kmRecorded = maintKm || selectedVec.kmAttuali;
    const nuovoStorico = [
      {
        data: new Date().toISOString().split('T')[0],
        tipo: maintTipo,
        km: kmRecorded,
        costo: maintCosto,
        officina: maintOfficina,
      },
      ...selectedVec.storicoInterventi,
    ];

    updateVeicolo(selectedVec.id, {
      kmAttuali: kmRecorded > selectedVec.kmAttuali ? kmRecorded : selectedVec.kmAttuali,
      scadenzaTagliandoKm: maintTipo === 'tagliando' ? kmRecorded + 20000 : selectedVec.scadenzaTagliandoKm,
      storicoInterventi: nuovoStorico,
      stato: 'in_servizio',
    });

    setIsVecMaintModalOpen(false);
    showToast(`Intervento di ${maintTipo} registrato per ${selectedVec.targa}!`, 'success');
  };

  const handleCreateAttrezzatura = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCodice = newAttCodice.trim().toUpperCase() || generateUniqueId('ATT').toUpperCase();
    addAttrezzatura({
      codiceUnivoco: cleanCodice,
      nome: newAttNome,
      marcaModello: newAttModello,
      matricola: newAttMatricola || `SN-${Math.floor(Math.random() * 89999 + 10000)}`,
      stato: 'disponibile',
      dataAcquisto: new Date().toISOString().split('T')[0],
      prossimaTaratura: newAttTaratura,
      storicoManutenzioni: [],
      qrCode: `QR-ATT-${cleanCodice}`,
    });
    setIsNewAttOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Warehouse className="w-3.5 h-3.5" />
              <span>Hub Centrale di Magazzino, Attrezzature & Flotta</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Portale Logistica & Gestione Mezzi
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Controllo completo e centralizzato di materiali, scorte minime, strumenti di misura a norma CEI 64-8 e parco veicoli aziendale con scadenziario revisioni e manutenzioni.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setMovTipo('scarico_cantiere');
                setIsMovModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-900/30"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Scarico Rapido Cantiere</span>
            </button>
            <button
              onClick={() => {
                setMovTipo('carico_fornitore');
                setIsMovModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Carico Fornitore DDT</span>
            </button>
            <button
              onClick={() => setIsNuovoPaccoModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-900/30"
            >
              <Boxes className="w-4 h-4" />
              <span>Prepara Segnacollo A5</span>
            </button>
            <button
              onClick={openScanner}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-amber-300 dark:border-amber-500/30 font-semibold rounded-xl text-xs transition-colors"
              title="Scansiona QR o Barcode"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scansiona QR</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards for the 4 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          {/* Pillar 1: Materiali */}
          <div
            onClick={() => setActivePortalTab('materiali')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activePortalTab === 'materiali'
                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Materiali & Giacenze
              </span>
              {lowStockArticles.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                  {lowStockArticles.length} SOTTOSCORTA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                  REGOLARE
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {magazzino.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">articoli</span>
              </div>
              <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                Valore: € {totalStockValue.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Listino Vendita: € {totalListValue.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Pillar 2: Attrezzature */}
          <div
            onClick={() => setActivePortalTab('attrezzature')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activePortalTab === 'attrezzature'
                ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> Attrezzature CEI 64-8
              </span>
              {expiringAttrezzature.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  {expiringAttrezzature.length} TARATURA IN SCAD.
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                  COLLAUDATI
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {attrezzature.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">strumenti</span>
              </div>
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-300">
                {attrezzature.filter((a) => a.stato === 'assegnata').length} in cantiere / uso
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {attrezzature.filter((a) => a.stato === 'disponibile').length} disponibili in sede per nuovi incarichi
            </div>
          </div>

          {/* Pillar 3: Veicoli */}
          <div
            onClick={() => setActivePortalTab('veicoli')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activePortalTab === 'veicoli'
                ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Flotta Mezzi & Furgoni
              </span>
              {expiringVeicoli.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  {expiringVeicoli.length} AVVISI SCADENZA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                  IN REGOLA
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {veicoli.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">veicoli</span>
              </div>
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                {veicoli.filter((v) => v.stato === 'in_servizio').length} in servizio
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Furgoni allestiti e piattaforme aeree con dotazioni di sicurezza
            </div>
          </div>

          {/* Pillar 4: Ordini Interni */}
          <div
            onClick={() => setActivePortalTab('ordini')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activePortalTab === 'ordini'
                ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Ordini Interni
              </span>
              {ordiniInRitardoCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                  {ordiniInRitardoCount} IN RITARDO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  ATTIVI
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-xl font-black text-slate-100">
                {ordiniApertiCount} <span className="text-xs font-normal text-slate-400">ordini aperti</span>
              </div>
              <div className="text-xs font-mono text-indigo-400">
                {ordiniInterni.length} totali
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Approvvigionamento fornitori & fornitura clienti
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'materiali', label: '1. Materiali & Giacenze', icon: <Package className="w-4 h-4" />, count: magazzino.length },
            { id: 'attrezzature', label: '2. Attrezzature & Tarature', icon: <Wrench className="w-4 h-4" />, count: attrezzature.length },
            { id: 'veicoli', label: '3. Parco Veicoli & Mezzi', icon: <Truck className="w-4 h-4" />, count: veicoli.length },
            { id: 'movimenti', label: '4. Registro Transiti & Carichi', icon: <Layers className="w-4 h-4" />, count: movimenti.length },
            { id: 'ordini', label: '5. Ordini Interni (Fornitori & Clienti)', icon: <ShoppingCart className="w-4 h-4" />, count: ordiniInterni.length },
            {
              id: 'richieste_cantiere',
              label: '6. Richieste dal Campo',
              icon: <PackagePlus className="w-4 h-4" />,
              count: richiesteMateriali.filter((r) => r.stato !== 'ddt_emesso').length,
            },
            {
              id: 'zona_verde',
              label: '7. Zona Verde & Segnacolli A5',
              icon: <Boxes className="w-4 h-4 text-emerald-400" />,
              count: pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePortalTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePortalTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activePortalTab === tab.id ? 'bg-black/20 text-slate-950 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Global Search within Portal */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per codice, nome, targa o matricola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATERIALI & GIACENZE */}
      {/* ========================================================================= */}
      {activePortalTab === 'materiali' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Catalogo Materiali & Livelli di Scorta
              </h2>
              <p className="text-xs text-slate-400">
                Gestione scorte vive per cavi elettrici, canaline, quadri BT, interruttori e minuteria per cantieri.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsNewArtModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuovo Articolo</span>
              </button>
            </div>
          </div>

          {/* Table of Articles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] text-slate-700 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center font-semibold">Foto</th>
                    <th className="py-3 px-4 font-semibold">Codice SKU</th>
                    <th className="py-3 px-4 font-semibold">Descrizione & Categoria</th>
                    <th className="py-3 px-4 font-semibold">Ubicazione Scaffale</th>
                    <th className="py-3 px-4 font-semibold text-right">Giacenza</th>
                    <th className="py-3 px-4 font-semibold text-right">Scorta Min.</th>
                    <th className="py-3 px-4 font-semibold text-right">Prezzo Acq.</th>
                    <th className="py-3 px-4 font-semibold text-right">Prezzo Listino</th>
                    <th className="py-3 px-4 font-center text-center">Stato Scorta</th>
                    <th className="py-3 px-4 font-semibold text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {magazzino
                    .filter(
                      (m) =>
                        m.nome.toLowerCase().includes(search.toLowerCase()) ||
                        m.codiceSku.toLowerCase().includes(search.toLowerCase()) ||
                        m.ubicazioneScaffale.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((item) => {
                      const isLow = item.giacenza <= item.scortaMinima;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center">
                            <ResourceThumbnail
                              imageUrl={item.fotoUrl}
                              category="materiale"
                              alt={item.nome}
                              code={item.codiceSku}
                              title={item.nome}
                              subtitle={`Giacenza: ${item.giacenza} ${item.unitaMisura} · Scaffale: ${item.ubicazioneScaffale}`}
                              size="md"
                              clickable={true}
                              details={[
                                { label: 'Giacenza', value: `${item.giacenza} ${item.unitaMisura}` },
                                { label: 'Scorta Min.', value: `${item.scortaMinima} ${item.unitaMisura}` },
                                { label: 'Ubicazione', value: item.ubicazioneScaffale },
                                { label: 'Prezzo Listino', value: `€ ${item.prezzoListinoVendita.toFixed(2)}` },
                                { label: 'Fornitore', value: item.fornitore },
                              ]}
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {item.codiceSku}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.nome}</div>
                            <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                              <span>{item.categoria.replace('_', ' ')}</span>
                              <span>·</span>
                              {item.fornitore === 'RemaTarlazzi' ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400">⚡ RemaTarlazzi</span>
                              ) : (
                                <span>{item.fornitore}</span>
                              )}
                              {item.barcodeEan && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">EAN: {item.barcodeEan}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                              {item.ubicazioneScaffale}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.giacenza} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{item.unitaMisura}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            {item.scortaMinima} {item.unitaMisura}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            € {item.prezzoUnitarioAcquisto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                            € {item.prezzoListinoVendita.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" /> SOTTOSCORTA
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Disponibile
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setMovArtId(item.id);
                                  setMovTipo('scarico_cantiere');
                                  setIsMovModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                                title="Scarica a cantiere"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                              <button
                                onClick={() =>
                                  openQRModal({
                                    title: item.nome,
                                    code: item.qrCode,
                                    subtitle: `SKU: ${item.codiceSku} · Scaffale: ${item.ubicazioneScaffale}`,
                                    type: 'materiale',
                                  })
                                }
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                                title="Visualizza QR Code"
                              >
                                <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTREZZATURE & STRUMENTI CEI 64-8 */}
      {/* ========================================================================= */}
      {activePortalTab === 'attrezzature' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" /> Parco Strumenti di Misura & Attrezzature da Cantiere
              </h2>
              <p className="text-xs text-slate-400">
                Verificatori di sicurezza CEI 64-8, termocamere per quadri elettrici, pinze amperometriche e scanalatrici.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewAttOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Attrezzatura</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attrezzature
              .filter(
                (a) =>
                  a.nome.toLowerCase().includes(search.toLowerCase()) ||
                  a.codiceUnivoco.toLowerCase().includes(search.toLowerCase()) ||
                  a.matricola.toLowerCase().includes(search.toLowerCase())
              )
              .map((att) => {
                const tarDate = new Date(att.prossimaTaratura);
                const isTarExpiring = tarDate <= thirtyDaysAhead;

                return (
                  <div
                    key={att.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs dark:shadow-md"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <ResourceThumbnail
                          imageUrl={att.fotoUrl}
                          category="attrezzatura"
                          alt={att.nome}
                          code={att.codiceUnivoco}
                          title={att.nome}
                          subtitle={`Matricola: ${att.matricola}`}
                          size="md"
                          clickable={true}
                          details={[
                            { label: 'Matricola', value: att.matricola },
                            { label: 'Stato', value: att.stato },
                            { label: 'Prossima Taratura', value: att.prossimaTaratura },
                          ]}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">
                              {att.codiceUnivoco}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                att.stato === 'disponibile'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : att.stato === 'assegnata'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {att.stato}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5 leading-snug truncate">{att.nome}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{att.marcaModello}</p>
                          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">Matricola: {att.matricola}</div>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Assegnazione Attuale:</span>
                          <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                            {att.assegnataA ? att.assegnataA.nome : 'In Magazzino Sede'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Scadenza Taratura:</span>
                          <span
                            className={`font-mono font-semibold ${
                              isTarExpiring ? 'text-rose-400 font-bold' : 'text-slate-300'
                            }`}
                          >
                            {att.prossimaTaratura}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          openQRModal({
                            title: att.nome,
                            code: att.qrCode,
                            subtitle: `Codice: ${att.codiceUnivoco} · Matricola: ${att.matricola}`,
                            type: 'attrezzatura',
                          })
                        }
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Vedi QR Code"
                      >
                        <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                        <span>QR</span>
                      </button>

                      {att.stato === 'assegnata' ? (
                        <button
                          onClick={() => handleReturnAttrezzatura(att)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rientro Magazzino</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAtt(att);
                            setIsAttModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Assegna a Tecnico / Cantiere</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FLOTTA VEICOLI & MEZZI */}
      {/* ========================================================================= */}
      {activePortalTab === 'veicoli' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" /> Parco Veicoli Aziendali & Furgoni Allestiti
              </h2>
              <p className="text-xs text-slate-400">
                Monitoraggio chilometrico, scadenze revisione MCTC, RCA, tagliandi e check-list di carico giornaliero.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedVec(veicoli[0]);
                  setVecKmControllo(veicoli[0]?.kmAttuali || 0);
                  setIsChecklistModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Check-list Uscita Mezzo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {veicoli
              .filter(
                (v) =>
                  v.modello.toLowerCase().includes(search.toLowerCase()) ||
                  v.targa.toLowerCase().includes(search.toLowerCase()) ||
                  (v.autistaAssegnatoNome || '').toLowerCase().includes(search.toLowerCase())
              )
              .map((vec) => {
                const isRevExp = new Date(vec.scadenzaRevisione) <= thirtyDaysAhead;
                const isAssExp = new Date(vec.scadenzaAssicurazione) <= thirtyDaysAhead;
                const kmLeft = vec.scadenzaTagliandoKm - vec.kmAttuali;

                return (
                  <div
                    key={vec.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs dark:shadow-md"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <ResourceThumbnail
                          imageUrl={vec.fotoUrl}
                          category="mezzo"
                          alt={vec.veicolo || vec.modello}
                          code={vec.targa}
                          title={vec.veicolo || vec.modello}
                          subtitle={`Autista: ${vec.autistaAssegnatoNome || 'Non Assegnato'}`}
                          size="md"
                          clickable={true}
                          details={[
                            { label: 'Targa', value: vec.targa },
                            { label: 'Stato', value: vec.stato },
                            { label: 'Km Attuali', value: `${vec.kmAttuali.toLocaleString('it-IT')} km` },
                          ]}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-black text-amber-500 dark:text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 tracking-wider">
                              {vec.targa}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 capitalize">
                              {vec.stato.replace('_', ' ')}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5 truncate">{vec.modello}</h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Autista: <strong className="text-slate-800 dark:text-slate-200">{vec.autistaAssegnatoNome || 'In Pool'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Km Attuali:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">{vec.kmAttuali.toLocaleString('it-IT')} km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Prossimo Tagliando:</span>
                          <span className={`font-mono ${kmLeft <= 1500 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            tra {kmLeft.toLocaleString('it-IT')} km
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Scadenza Revisione:</span>
                          <span className={`font-mono ${isRevExp ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {vec.scadenzaRevisione}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Scadenza Assicurazione:</span>
                          <span className={`font-mono ${isAssExp ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {vec.scadenzaAssicurazione}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          openQRModal({
                            title: `${vec.targa} - ${vec.modello}`,
                            code: vec.qrCode,
                            subtitle: `Referente: ${vec.autistaAssegnatoNome || 'N/A'} · Km: ${vec.kmAttuali}`,
                            type: 'veicolo',
                          })
                        }
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                        title="Vedi QR"
                      >
                        <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                        <span>QR</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVec(vec);
                          setVecKmControllo(vec.kmAttuali);
                          setIsChecklistModalOpen(true);
                        }}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Check Uscita</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVec(vec);
                          setMaintKm(vec.kmAttuali);
                          setIsVecMaintModalOpen(true);
                        }}
                        className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Tagliando</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REGISTRO TRANSITI & MOVIMENTAZIONI */}
      {/* ========================================================================= */}
      {activePortalTab === 'movimenti' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" /> Registro Storico Transiti Magazzino
              </h2>
              <p className="text-xs text-slate-400">
                Tracciamento cronologico e immutabile di carichi da fornitore con DDT e scarichi cantiere.
              </p>
            </div>
            <button
              onClick={() => {
                setMovTipo('carico_fornitore');
                setIsMovModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
            >
              + Registra Transito
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] text-slate-700 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Data & Ora</th>
                    <th className="py-3 px-4">Tipo Movimento</th>
                    <th className="py-3 px-4">Articolo</th>
                    <th className="py-3 px-4 text-right">Quantità</th>
                    <th className="py-3 px-4">Cantiere Destinazione</th>
                    <th className="py-3 px-4">Operatore / Magazziniere</th>
                    <th className="py-3 px-4">Doc. Riferimento / DDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {movimenti
                    .filter(
                      (m) =>
                        m.articoloNome.toLowerCase().includes(search.toLowerCase()) ||
                        m.operatoreNome.toLowerCase().includes(search.toLowerCase()) ||
                        (m.documentoRif || '').toLowerCase().includes(search.toLowerCase())
                    )
                    .map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-400">{mov.data}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              mov.tipo === 'carico_fornitore' || mov.tipo === 'reso_cantiere'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {mov.tipo === 'carico_fornitore' && <ArrowUpRight className="w-3 h-3" />}
                            {mov.tipo === 'scarico_cantiere' && <ArrowDownLeft className="w-3 h-3" />}
                            {mov.tipo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{mov.articoloNome}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {mov.quantita}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{mov.cantiereNome || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">{mov.operatoreNome}</td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{mov.documentoRif || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ORDINI INTERNI (FORNITORI & CLIENTI) */}
      {/* ========================================================================= */}
      {activePortalTab === 'ordini' && (
        <OrdiniModule embeddedInMagazzino />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RICHIESTE MATERIALI DAL CAMPO (CON NOTIFICHE & EMISSIONE DDT) */}
      {/* ========================================================================= */}
      {activePortalTab === 'richieste_cantiere' && (
        <div className="pt-2">
          <RichiesteMaterialiModule />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ZONA VERDE & SEGNACOLLI A5 (PRESA IN CARICO OPERATORE) */}
      {/* ========================================================================= */}
      {activePortalTab === 'zona_verde' && (
        <div className="pt-2">
          <ZonaVerdeSection />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MOVIMENTO MAGAZZINO RAPIDO */}
      {/* ========================================================================= */}
      {isMovModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsMovModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-amber-400" />
              <span>Registra Transito di Magazzino</span>
            </h3>

            <form onSubmit={handleQuickMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Tipo Transito</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovTipo('scarico_cantiere')}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      movTipo === 'scarico_cantiere'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Scarico su Cantiere
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovTipo('carico_fornitore')}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      movTipo === 'carico_fornitore'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Carico Fornitore DDT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Seleziona Articolo</label>
                <select
                  value={movArtId}
                  onChange={(e) => setMovArtId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                >
                  {magazzino.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codiceSku} - {m.nome} (Giacenza: {m.giacenza} {m.unitaMisura})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Quantità</label>
                  <input
                    type="number"
                    min="1"
                    value={movQty}
                    onChange={(e) => setMovQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Doc. Riferimento / DDT</label>
                  <input
                    type="text"
                    placeholder="es. DDT-2026/982"
                    value={movDocRif}
                    onChange={(e) => setMovDocRif(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>

              {movTipo === 'scarico_cantiere' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Cantiere Destinatario</label>
                  <select
                    value={movCantiereId}
                    onChange={(e) => setMovCantiereId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codice} - {c.titolo} ({c.clienteNome})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg"
                >
                  Conferma Transito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSEGNAZIONE ATTREZZATURA */}
      {/* ========================================================================= */}
      {isAttModalOpen && selectedAtt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsAttModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>Assegna Strumento CEI 64-8</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedAtt.codiceUnivoco} - {selectedAtt.nome}
              </p>
            </div>

            <form onSubmit={handleAssignAttrezzatura} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Destinazione Uscita</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttAssignType('dipendente');
                      setAttAssignTargetId(dipendenti[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      attAssignType === 'dipendente'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Operatore Elettrico
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttAssignType('cantiere');
                      setAttAssignTargetId(cantieri[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
                      attAssignType === 'cantiere'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Cantiere Attivo
                  </button>
                </div>
              </div>

              {attAssignType === 'dipendente' ? (
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Seleziona Dipendente</label>
                  <select
                    value={attAssignTargetId}
                    onChange={(e) => setAttAssignTargetId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    {dipendenti.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.cognome} ({d.ruoloAziendale})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Seleziona Cantiere</label>
                  <select
                    value={attAssignTargetId}
                    onChange={(e) => setAttAssignTargetId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  >
                    {cantieri.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codice} - {c.titolo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg"
                >
                  Conferma Presa in Carico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHECK-LIST USCITA VEICOLO */}
      {/* ========================================================================= */}
      {isChecklistModalOpen && selectedVec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsChecklistModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <span>Check-list Uscita & Carico Mezzo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targa <strong className="text-amber-400">{selectedVec.targa}</strong> - {selectedVec.modello}
              </p>
            </div>

            <form onSubmit={handleSaveChecklist} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Verifica Chilometri Iniziali</label>
                <input
                  type="number"
                  value={vecKmControllo}
                  onChange={(e) => setVecKmControllo(parseInt(e.target.value) || selectedVec.kmAttuali)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono font-bold"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-slate-300">Dotazioni di Bordo Obbligatorie:</span>

                {[
                  { id: 'estintore', label: 'Estintore a polvere 6kg con revisione valida' },
                  { id: 'prontoSoccorso', label: 'Cassetta Pronto Soccorso D.Lgs 81/08 presente e sigillata' },
                  { id: 'librettoAssicurazione', label: 'Libretto di circolazione & Tagliando Assicurazione a bordo' },
                  { id: 'scaleDPI', label: 'Scale a norma EN 131 e DPI anticaduta riposti nel furgone' },
                  { id: 'carburanteAdeguato', label: 'Livello carburante adeguato (almeno 1/2 serbatoio)' },
                  { id: 'puliziaVanoCarico', label: 'Vano di carico fissato con cinghie e ordine attrezzi' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={(checklistItems as any)[item.id]}
                      onChange={(e) =>
                        setChecklistItems((prev) => ({ ...prev, [item.id]: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-emerald-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg"
                >
                  Valida Uscita Mezzo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAGLIANDO & MANUTENZIONE VEICOLO */}
      {/* ========================================================================= */}
      {isVecMaintModalOpen && selectedVec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsVecMaintModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <span>Registra Manutenzione Flotta</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targa {selectedVec.targa} ({selectedVec.modello})
              </p>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Tipo Intervento</label>
                <select
                  value={maintTipo}
                  onChange={(e) => setMaintTipo(e.target.value as any)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 capitalize"
                >
                  <option value="tagliando">Tagliando Completo (Olio, Filtri, Pastiglie)</option>
                  <option value="gomme">Cambio Gomme / Convergenza</option>
                  <option value="revisione">Revisione Ministeriale MCTC</option>
                  <option value="riparazione">Riparazione Straordinaria Meccanica/Elettrica</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Km Attuali Mezzo</label>
                  <input
                    type="number"
                    value={maintKm}
                    onChange={(e) => setMaintKm(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Costo Sostenuto (€)</label>
                  <input
                    type="number"
                    value={maintCosto}
                    onChange={(e) => setMaintCosto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Officina / Centro Assistenza</label>
                <input
                  type="text"
                  value={maintOfficina}
                  onChange={(e) => setMaintOfficina(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVecMaintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg"
                >
                  Salva Intervento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUOVO ARTICOLO MAGAZZINO */}
      {/* ========================================================================= */}
      {isNewArtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 my-6">
            <button
              onClick={() => setIsNewArtModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Nuovo Articolo a Catalogo Magazzino</span>
              </h3>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Codice SKU</label>
                  <input
                    type="text"
                    placeholder="es. CAV-3G25"
                    value={artSku}
                    onChange={(e) => setArtSku(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Categoria</label>
                  <select
                    value={artCategoria}
                    onChange={(e) => setArtCategoria(e.target.value as any)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 capitalize"
                  >
                    <option value="cavi_elettrici">Cavi Elettrici</option>
                    <option value="quadri_modulari">Quadri & Modulari</option>
                    <option value="apparecchi_comando">Apparecchi di Comando</option>
                    <option value="tubi_canaline">Tubi & Canaline</option>
                    <option value="illuminazione">Illuminazione</option>
                    <option value="fotovoltaico_accumulo">Fotovoltaico & Accumulo</option>
                    <option value="materiale_vario">Materiale Vario</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Descrizione Completa</label>
                <input
                  type="text"
                  placeholder="es. Cavo FG16OR12 3G2.5 mm² CPR Cca-s1b,d1,a1"
                  value={artNome}
                  onChange={(e) => setArtNome(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Giacenza Iniziale</label>
                  <input
                    type="number"
                    value={artGiacenza}
                    onChange={(e) => setArtGiacenza(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Scorta Minima</label>
                  <input
                    type="number"
                    value={artScortaMin}
                    onChange={(e) => setArtScortaMin(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Unità di Misura</label>
                  <input
                    type="text"
                    value={artUnita}
                    onChange={(e) => setArtUnita(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Prezzo Acquisto (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={artPrezzoAcq}
                    onChange={(e) => setArtPrezzoAcq(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Prezzo Listino Vendita (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={artPrezzoVen}
                    onChange={(e) => setArtPrezzoVen(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Ubicazione Scaffale</label>
                  <input
                    type="text"
                    value={artScaffale}
                    onChange={(e) => setArtScaffale(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Fornitore Principale</label>
                  <input
                    type="text"
                    value={artFornitore}
                    onChange={(e) => setArtFornitore(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewArtModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Salva Articolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUOVA ATTREZZATURA */}
      {/* ========================================================================= */}
      {isNewAttOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsNewAttOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>Inserisci Nuova Attrezzatura / Strumento CEI 64-8</span>
              </h3>
            </div>

            <form onSubmit={handleCreateAttrezzatura} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Codice Univoco Identificativo</label>
                <input
                  type="text"
                  placeholder="es. STR-VER-02"
                  value={newAttCodice}
                  onChange={(e) => setNewAttCodice(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Nome Strumento</label>
                <input
                  type="text"
                  placeholder="es. Analizzatore di Rete CEI 64-8"
                  value={newAttNome}
                  onChange={(e) => setNewAttNome(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Marca e Modello</label>
                <input
                  type="text"
                  placeholder="es. HT Instruments MacroTest G3"
                  value={newAttModello}
                  onChange={(e) => setNewAttModello(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Numero Matricola</label>
                  <input
                    type="text"
                    placeholder="es. SN-981240"
                    value={newAttMatricola}
                    onChange={(e) => setNewAttMatricola(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">Prossima Taratura</label>
                  <input
                    type="date"
                    value={newAttTaratura}
                    onChange={(e) => setNewAttTaratura(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAttOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg"
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
