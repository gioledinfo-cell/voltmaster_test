import React, { useState, useMemo } from 'react';
import {
  Building2,
  X,
  Printer,
  Share2,
  ScanLine,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Layers,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CantiereDashboardData,
  CantiereFotoAllegato,
  CantiereMaterialeStock,
} from '../../types/cantiereDashboard';
import { CantiereHeaderKPI } from './CantiereHeaderKPI';
import { CantiereMaterialiSection } from './CantiereMaterialiSection';
import { CantiereAttrezzatureSection } from './CantiereAttrezzatureSection';
import { CantiereDocumentiSection } from './CantiereDocumentiSection';
import { CantiereGallerySection } from './CantiereGallerySection';
import { CantiereSalSection } from './CantiereSalSection';
import { CantiereControlloGestioneWidget } from './CantiereControlloGestioneWidget';
import { CantiereGanttSection } from './CantiereGanttSection';
import {
  exportCantiereSchedaExcel,
  exportCantiereSchedaPdf,
} from '../../utils/cantiereSchedaExportService';

interface CantiereDashboardViewProps {
  cantiereId?: string;
  initialData?: CantiereDashboardData;
  onBack?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const CantiereDashboardView: React.FC<CantiereDashboardViewProps> = ({
  cantiereId,
  initialData,
  onBack,
  onClose,
  isModal = false,
}) => {
  const {
    cantieri,
    selectedCantiereId,
    magazzino,
    attrezzature,
    documenti,
    rols,
    dipendenti,
    sals,
    showToast,
    openQRModal,
  } = useApp();

  const targetId = cantiereId || selectedCantiereId || cantieri[0]?.id;
  const currentCantiere = cantieri.find((c) => c.id === targetId) || cantieri[0];

  // Simulated site photos with local addition state
  const [extraPhotos, setExtraPhotos] = useState<CantiereFotoAllegato[]>([
    {
      id: 'photo-1',
      titolo: 'Quadro Generale BT con cablaggio sbarre e pettini',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      data: '2026-09-30',
      faseLavoro: 'Montaggio & Cablaggio Quadri',
      caricatoDa: 'Matteo Bianchi (Capocantiere)',
      dimensioneKb: 2150,
      isOggi: true,
    },
    {
      id: 'photo-2',
      titolo: 'Dorsale montante cavi FG16 in passerella forata',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      data: '2026-09-29',
      faseLavoro: 'Infilaggio Cavi & Dorsali',
      caricatoDa: 'Davide Riva (Operaio Spec.)',
      dimensioneKb: 1840,
    },
    {
      id: 'photo-3',
      titolo: 'Inverter e batterie accumulo installate a parete',
      url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      data: '2026-09-28',
      faseLavoro: 'Installazione Fotovoltaico & Stringhe',
      caricatoDa: 'Roberto Fontana (PM)',
      dimensioneKb: 3120,
    },
    {
      id: 'photo-4',
      titolo: 'Tracciatura canali a soffitto e staffaggio antisismico',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      data: '2026-09-26',
      faseLavoro: 'Posa Canaline & Tubazioni',
      caricatoDa: 'Matteo Bianchi (Capocantiere)',
      dimensioneKb: 1650,
    },
  ]);

  // Aggregate or construct CantiereDashboardData
  const dashboardData: CantiereDashboardData = useMemo(() => {
    if (initialData) return initialData;

    // Filter site materials
    const siteMaterials: CantiereMaterialeStock[] = (currentCantiere.materialiAssegnati || []).map(
      (m, idx) => {
        const globalMat = magazzino.find((g) => g.id === m.materialeId);
        const stockStatus =
          m.quantita <= 15 ? 'critico' : m.quantita <= 40 ? 'in_esaurimento' : 'ottimale';
        return {
          id: `c-mat-${idx}`,
          nome: m.nome,
          categoria: globalMat ? globalMat.categoria : 'materiale_vario',
          quantitaAllocata: m.quantita + 35,
          quantitaUtilizzata: 35,
          giacenzaRimanente: m.quantita,
          unitaMisura: m.unitaMisura,
          statoStock: stockStatus,
          ultimoScaricoData: m.dataAssegnazione || '2026-09-25',
        };
      }
    );

    // If site has no explicit assigned materials in mock, provide default realistic items
    const effectiveMaterials: CantiereMaterialeStock[] =
      siteMaterials.length > 0
        ? siteMaterials
        : [
            {
              id: 'c-mat-1',
              nome: 'Cavo FG16OR12 5G16 mm² CPR',
              categoria: 'cavi_elettrici',
              quantitaAllocata: 300,
              quantitaUtilizzata: 240,
              giacenzaRimanente: 60,
              unitaMisura: 'm',
              statoStock: 'ottimale',
              ultimoScaricoData: '2026-09-26',
            },
            {
              id: 'c-mat-2',
              nome: 'Canalina Metallica Asolata 200x50 zincata',
              categoria: 'tubi_canaline',
              quantitaAllocata: 120,
              quantitaUtilizzata: 105,
              giacenzaRimanente: 15,
              unitaMisura: 'm',
              statoStock: 'in_esaurimento',
              ultimoScaricoData: '2026-09-28',
            },
            {
              id: 'c-mat-3',
              nome: 'Interruttore Magnetotermico Diff. 4P 32A 30mA',
              categoria: 'quadri_modulari',
              quantitaAllocata: 18,
              quantitaUtilizzata: 16,
              giacenzaRimanente: 2,
              unitaMisura: 'pz',
              statoStock: 'critico',
              ultimoScaricoData: '2026-09-29',
            },
            {
              id: 'c-mat-4',
              nome: 'Lampada Emergenza LED 24W Autonomia 3h',
              categoria: 'illuminazione',
              quantitaAllocata: 25,
              quantitaUtilizzata: 15,
              giacenzaRimanente: 10,
              unitaMisura: 'pz',
              statoStock: 'ottimale',
              ultimoScaricoData: '2026-09-27',
            },
          ];

    // Equipment on this site or in general
    const siteAttrezzature = attrezzature.map((a) => {
      const isDue = new Date(a.prossimaTaratura) <= new Date('2026-11-30');
      return {
        id: a.id,
        codiceUnivoco: a.codiceUnivoco,
        nome: a.nome,
        marcaModello: a.marcaModello,
        matricola: a.matricola,
        stato:
          a.stato === 'in_manutenzione'
            ? ('in_manutenzione' as const)
            : isDue
            ? ('da_verificare' as const)
            : ('operativo' as const),
        prossimaRevisioneTaratura: a.prossimaTaratura,
        assegnatoA: a.assegnataA ? a.assegnataA.nome : 'Squadra Operativa Cantiere',
        isScadenzaImminente: isDue,
      };
    });

    // Site documents categorized
    const siteDocuments = [
      {
        id: 'doc-pos',
        titolo: 'Piano Operativo di Sicurezza (POS) D.Lgs 81/08 approvato dal CSE',
        categoria: 'sicurezza_pos' as const,
        statoValidita: 'valido' as const,
        dataEmissione: '2026-08-15',
        dataScadenza: '2026-12-31',
        formato: 'pdf' as const,
        dimensioneKb: 3420,
        codiceProtocollo: 'POS-2026-CNT1-REV2',
      },
      {
        id: 'doc-scia',
        titolo: 'Pratica Edilizia & Deposito Impianti L. 10/91 e SCIA',
        categoria: 'permessi' as const,
        statoValidita: 'in_scadenza' as const,
        dataEmissione: '2026-04-10',
        dataScadenza: '2026-10-15',
        formato: 'pdf' as const,
        dimensioneKb: 1850,
        codiceProtocollo: 'SCIA-MI-89421',
      },
      {
        id: 'doc-dico',
        titolo: 'Relazione di Calcolo Selettivo e Bozza DiCo DM 37/08 con Allegati',
        categoria: 'certificazioni' as const,
        statoValidita: 'valido' as const,
        dataEmissione: '2026-09-20',
        formato: 'pdf' as const,
        dimensioneKb: 2450,
        codiceProtocollo: 'DICO-DRAFT-2026',
      },
      {
        id: 'doc-contratto',
        titolo: 'Contratto d’Appalto Esecutivo e Verbale Consegna Lavori SAL 1',
        categoria: 'contratti' as const,
        statoValidita: 'valido' as const,
        dataEmissione: '2026-07-01',
        formato: 'pdf' as const,
        dimensioneKb: 4120,
        codiceProtocollo: 'CTR-VOLT-2026-08',
      },
    ];

    // Rols calculation for hours
    const siteRols = rols.filter((r) => r.cantiereId === currentCantiere.id);
    const totalHours = siteRols.reduce((acc, r) => acc + r.oreTotali, 0);

    const lowStockCount = effectiveMaterials.filter((m) => m.statoStock !== 'ottimale').length;
    const expiringDocsCount = siteDocuments.filter((d) => d.statoValidita !== 'valido').length;
    const todayPhotosCount = extraPhotos.filter((p) => p.isOggi).length;
    const operativeAttCount = siteAttrezzature.filter((a) => a.stato === 'operativo').length;

    const pm = dipendenti.find((d) => d.reparto === 'ufficio_tecnico')?.nome || 'Ing. Roberto Fontana';
    const capo = dipendenti.find((d) => d.reparto === 'capocantiere')?.nome || 'Matteo Bianchi';

    return {
      cantiere: {
        id: currentCantiere.id,
        codice: currentCantiere.codice,
        titolo: currentCantiere.titolo,
        clienteNome: currentCantiere.clienteNome,
        indirizzo: currentCantiere.indirizzo,
        citta: currentCantiere.citta,
        stato: currentCantiere.stato,
        capocantiereNome: capo,
        responsabilePM: pm,
        dataInizio: currentCantiere.dataInizio,
        dataFinePrevista: currentCantiere.dataFinePrevista,
        descrizione: currentCantiere.descrizione,
        qrCode: currentCantiere.qrCode,
      },
      kpi: {
        materialiInEsaurimentoCount: lowStockCount,
        documentiInScadenzaCount: expiringDocsCount,
        fotoCaricateOggiCount: todayPhotosCount,
        attrezzatureOperativeCount: operativeAttCount,
        attrezzatureTotaliCount: siteAttrezzature.length,
        oreLavorateTotali: totalHours || 148,
        costoConsuntivato: currentCantiere.costiConsuntivati || 18450,
        budgetTotale: currentCantiere.budgetTotale || 45000,
        avanzamentoPercentuale: currentCantiere.avanzamentoPercentuale || 65,
      },
      materiali: effectiveMaterials,
      attrezzature: siteAttrezzature,
      documenti: siteDocuments,
      foto: extraPhotos,
    };
  }, [currentCantiere, magazzino, attrezzature, rols, dipendenti, extraPhotos, initialData]);

  const handleUploadPhoto = (newPhoto: Omit<CantiereFotoAllegato, 'id'>) => {
    const created: CantiereFotoAllegato = {
      ...newPhoto,
      id: `photo-${Date.now()}`,
    };
    setExtraPhotos((prev) => [created, ...prev]);
    showToast('Nuova foto di cantiere aggiunta alla galleria!', 'success');
  };

  const handleReintegro = (mat: CantiereMaterialeStock) => {
    showToast(`Richiesta di reintegro per "${mat.nome}" inviata al magazzino centrale!`, 'success');
  };

  const handleExportExcel = () => {
    const siteSals = sals.filter((s) => s.cantiereId === dashboardData.cantiere.id);
    exportCantiereSchedaExcel({
      cantiere: dashboardData.cantiere,
      kpi: dashboardData.kpi,
      salList: siteSals,
      materiali: dashboardData.materiali,
      attrezzature: dashboardData.attrezzature,
    });
    showToast(`Scheda commessa, Gantt e SAL esportati in Excel (.xlsx)!`, 'success');
  };

  const handleExportPdf = () => {
    const siteSals = sals.filter((s) => s.cantiereId === dashboardData.cantiere.id);
    exportCantiereSchedaPdf({
      cantiere: dashboardData.cantiere,
      kpi: dashboardData.kpi,
      salList: siteSals,
      materiali: dashboardData.materiali,
      attrezzature: dashboardData.attrezzature,
    });
    showToast(`Report PDF della commessa scaricato con successo!`, 'success');
  };

  const content = (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Torna indietro"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
            Vista Unificata Cantiere 360°
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Esporta Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Esporta Scheda Commessa con Gantt e SAL in formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Esporta</span>
            <span>Excel (.xlsx)</span>
          </button>

          {/* Esporta PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors shadow-xs cursor-pointer"
            title="Esporta Scheda Commessa con Gantt e SAL in formato PDF (.pdf)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esporta</span>
            <span>PDF (.pdf)</span>
          </button>

          <button
            onClick={() =>
              openQRModal({
                title: dashboardData.cantiere.titolo,
                code: dashboardData.cantiere.qrCode,
                subtitle: `${dashboardData.cantiere.codice} · Committente: ${dashboardData.cantiere.clienteNome}`,
                type: 'cantiere',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <ScanLine className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden md:inline">QR Cantiere</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Stampa</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chiudi vista"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Panoramica & KPI */}
      <CantiereHeaderKPI
        cantiere={dashboardData.cantiere}
        kpi={dashboardData.kpi}
      />

      {/* 2. Cruscotto Controllo di Gestione & Margine di Commessa Reale */}
      <CantiereControlloGestioneWidget
        cantiereId={dashboardData.cantiere.id}
      />

      {/* 3. Cronoprogramma Lavori & Gantt Interattivo */}
      <CantiereGanttSection
        cantiereId={dashboardData.cantiere.id}
        cantiereCodice={dashboardData.cantiere.codice}
        cantiereTitolo={dashboardData.cantiere.titolo}
        dataInizioCantiere={dashboardData.cantiere.dataInizio}
        dataFineCantiere={dashboardData.cantiere.dataFinePrevista}
      />

      {/* 4. Stato Avanzamento Lavori (SAL) & Contabilità */}
      <CantiereSalSection
        cantiereId={dashboardData.cantiere.id}
      />

      {/* 3. Sezione Materiali in Cantiere */}
      <CantiereMaterialiSection
        materiali={dashboardData.materiali}
        onRichiediReintegro={handleReintegro}
      />

      {/* 3. Sezione Attrezzature & Macchinari */}
      <CantiereAttrezzatureSection
        attrezzature={dashboardData.attrezzature}
      />

      {/* 4. Sezione Documenti Inerenti & Validità */}
      <CantiereDocumentiSection
        documenti={dashboardData.documenti}
        onVisualizzaDocumento={(doc) =>
          showToast(`Apertura documento "${doc.titolo}" (Prot: ${doc.codiceProtocollo || 'N/A'})`, 'info')
        }
      />

      {/* 5. Sezione Foto & Galleria di Cantiere */}
      <CantiereGallerySection
        foto={dashboardData.foto}
        onUploadFoto={handleUploadPhoto}
      />
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
        <div className="relative w-full max-w-6xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl my-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
