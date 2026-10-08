import React, { useState } from 'react';
import {
  X,
  Users,
  Building2,
  HardHat,
  Calculator,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Phone,
  Mail,
  Award,
  Zap,
  ArrowRight,
  ArrowDown,
  Workflow,
  Boxes,
  Sliders,
  Check,
  FileText,
  Clock,
  Briefcase,
  AlertTriangle,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppInterfaceMode, CompanyDepartment, Dipendente } from '../types';

interface OrganigrammaModalProps {
  onClose: () => void;
  initialTab?: 'schemi_ruoli' | 'gerarchia' | 'workflow_rol' | 'raci' | 'organico';
}

export type ModalMainTab = 'schemi_ruoli' | 'gerarchia' | 'workflow_rol' | 'raci' | 'organico';

export const OrganigrammaModal: React.FC<OrganigrammaModalProps> = ({
  onClose,
  initialTab = 'schemi_ruoli',
}) => {
  const { dipendenti, clienti, interfaceMode, setInterfaceMode, showToast } = useApp();
  const [activeModalTab, setActiveModalTab] = useState<ModalMainTab>(initialTab);
  const [selectedReparto, setSelectedReparto] = useState<CompanyDepartment | 'tutti'>('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<string>('capocantiere');

  const contabilitaList = dipendenti.filter((d) => d.reparto === 'contabilita');
  const ufficioTecnicoList = dipendenti.filter((d) => d.reparto === 'ufficio_tecnico');
  const capiCantiereList = dipendenti.filter((d) => d.reparto === 'capocantiere');
  const operaiList = dipendenti.filter((d) => d.reparto === 'operaio');
  const apprendistiList = dipendenti.filter((d) => d.reparto === 'apprendista');

  const filteredDipendenti = dipendenti.filter((d) => {
    const matchesReparto = selectedReparto === 'tutti' || d.reparto === selectedReparto;
    const matchesQuery =
      d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.cognome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ruoloAziendale.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesReparto && matchesQuery;
  });

  // Definizione dei blocchi di ruolo (Input -> Processo/Competenze -> Output -> Interazioni)
  const roleBlocksDefinition: Record<
    string,
    {
      id: string;
      title: string;
      category: string;
      department: string;
      peopleCount: string;
      color: string;
      borderColor: string;
      badgeColor: string;
      icon: React.ReactNode;
      desc: string;
      inputs: { label: string; detail: string }[];
      process: { title: string; items: string[]; norme: string[] };
      outputs: { label: string; detail: string; format: string }[];
      squadra: { coordina: string; rispondeA: string; collaboraCon: string };
      permissions: string[];
    }
  > = {
    amministratore: {
      id: 'amministratore',
      title: 'Direzione & Amministratore Unico',
      category: 'Governance & Direzione Strategica',
      department: 'Management',
      peopleCount: '1 Titolare',
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      borderColor: 'border-rose-500',
      badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
      icon: <Briefcase className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      desc: 'Supervisione globale della redditività, conformità legale DM 37/08, investimenti attrezzature e contratti quadro con clienti.',
      inputs: [
        { label: 'Bilanci di Commessa & SAL', detail: 'Report margini generati dalla contabilità' },
        { label: 'Offerte e Gare Tecniche', detail: 'Preventivi complessi e contratti quadro d’appalto' },
        { label: 'Rapporti Ispettivi & Sicurezza', detail: 'Verifiche periodiche DVR, collaudi e conformità' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Approvazione finale preventivi strategici e contratti quadro',
          'Supervisione redditività cantieri e monte ore aziendale',
          'Nomina Preposti di cantiere e verifica requisiti DM 37/08',
          'Gestione politica retributiva e assunzioni organico',
        ],
        norme: ['D.Lgs 81/08 (Datore di Lavoro)', 'DM 37/08 art. 3 (Requisiti)', 'Codice Contratti Pubblici'],
      },
      outputs: [
        { label: 'Direttive Strategiche', detail: 'Linee guida operative e budget annuali', format: 'Delibere interne' },
        { label: 'Firma Contratti Committenti', detail: 'Accordi quadro e SAL finali', format: 'PDF con firma digitale' },
        { label: 'Approvazione Piani Ferie/HR', detail: 'Validazione disponibilità organico', format: 'Dashboard ERP' },
      ],
      squadra: {
        coordina: 'Ufficio Tecnico, Contabilità e Capi Cantiere',
        rispondeA: 'Assemblea Soci / Collegio Sindacale',
        collaboraCon: 'Commercialisti, Banche, Committenti Istituzionali',
      },
      permissions: ['Accesso completo a tutti i moduli', 'Visualizzazione margini e costi reali', 'Override approvazioni ROL e Preventivi'],
    },
    contabilita: {
      id: 'contabilita',
      title: 'Amministrazione & Contabilità',
      category: 'Finanza, Paghe & Controllo di Gestione',
      department: 'Amministrazione (3 Persone)',
      peopleCount: '3 Addetti',
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      borderColor: 'border-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
      icon: <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      desc: 'Validazione ROL inviati dal cantiere, controllo scostamenti orari rispetto al budget, fatturazione SAL e calcolo cedolini paghe.',
      inputs: [
        { label: 'ROL Inviati dal Cantiere', detail: 'Rapportini con ore ordinarie/straordinarie squadra e firma cliente' },
        { label: 'DDT & Fatture Fornitori', detail: 'Bolle d’acquisto materiale elettrico e noleggi' },
        { label: 'Preventivi Accettati', detail: 'Budget di spesa ore e materiali per commessa' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Verifica e approvazione ROL (blocco modifiche e quadratura)',
          'Accredito ore lavorate sui monti ore mensili di ogni dipendente (inclusi collaboratori di squadra)',
          'Calcolo scostamento costi consuntivati vs budget cantiere',
          'Emissione fatture elettroniche di acconto, SAL e saldo',
        ],
        norme: ['CCNL Metalmeccanico Impianti', 'Fatturazione Elettronica SDI', 'Norme Fiscali IVA Agevolata 10%'],
      },
      outputs: [
        { label: 'ROL Approvati per Paghe', detail: 'Dati pronti per elaborazione buste paga', format: 'ROL Stato Approvato' },
        { label: 'Fatture SAL & Ricevute', detail: 'Documenti fiscali trasmessi ai clienti', format: 'XML SDI / PDF' },
        { label: 'Report Margini Commessa', detail: 'Redditività reale per cantiere', format: 'Dashboard KPI Contabilità' },
      ],
      squadra: {
        coordina: 'Gestione documentale fornitori e banche',
        rispondeA: 'Amministratore Unico / Direzione',
        collaboraCon: 'Capi Cantiere (chiarimenti ROL) e Ufficio Tecnico (SAL)',
      },
      permissions: ['Approvazione/Rifiuto ROL', 'Gestione costi orari dipendenti', 'Fatturazione e consultazione margini commessa'],
    },
    ufficio_tecnico: {
      id: 'ufficio_tecnico',
      title: 'Ufficio Tecnico & Project Management',
      category: 'Progettazione, Acquisti & Pianificazione',
      department: 'Tecnico (4 Persone)',
      peopleCount: '4 Figure',
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      borderColor: 'border-amber-500',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      icon: <Laptop className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      desc: 'Progettazione unifilare, computi metrici, redazione Preventivi, emissione DiCo DM 37/08, approvvigionamento materiali e programmazione fasi.',
      inputs: [
        { label: 'Richiesta Committente / Capitolato', detail: 'Specifiche tecniche impianto o richiesta preventivo' },
        { label: 'Rilievi & Verifiche Cantiere', detail: 'Foto, misure e schemi as-built trasmessi dal campo' },
        { label: 'Giacenze Magazzino & Furgoni', detail: 'Livelli scorte minime cavi, quadri e apparecchi' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Redazione computi e preventivi dettagliati per categoria (materiali/manodopera)',
          'Pianificazione cantieri, assegnazione responsabili e cronoprogramma fasi',
          'Emissione Dichiarazione di Conformità (DiCo) ex DM 37/08 e allegati obbligatori',
          'Gestione ordini fornitori e scarico materiali su commessa',
        ],
        norme: ['Norma CEI 64-8 (Impianti BT)', 'DM 37/08 (Conformità)', 'Norma CEI 0-21 (Fotovoltaico)', 'CEI 11-27'],
      },
      outputs: [
        { label: 'Preventivi Elettrici Computati', detail: 'Offerte commerciali formalizzate', format: 'PDF Preventivo' },
        { label: 'Schemi Elettrici & DiCo', detail: 'Elaborati tecnici as-built e certificati', format: 'PDF / DWG' },
        { label: 'Ordini & Distinte Cantiere', detail: 'Materiali preassegnati a furgoni e squadre', format: 'Ordini Magazzino' },
      ],
      squadra: {
        coordina: 'Capi Cantiere e Fornitori Materiali',
        rispondeA: 'Amministratore / Direzione',
        collaboraCon: 'Contabilità (SAL commesse) e Committenti (approvazioni)',
      },
      permissions: ['Creazione/Modifica Cantieri e Preventivi', 'Emissione certificati tecnici', 'Gestione magazzino e ordini'],
    },
    capocantiere: {
      id: 'capocantiere',
      title: 'Capocantiere Elettrico (Preposto)',
      category: 'Coordinamento sul Campo & Sicurezza',
      department: 'Cantiere & Campo (4 Persone)',
      peopleCount: '4 Capi Cantiere',
      color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      borderColor: 'border-cyan-500',
      badgeColor: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
      icon: <HardHat className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      desc: 'Figura preposta sul posto di lavoro (PES/PAV/PEI): coordina operai e apprendisti, compila il ROL di squadra, effettua verifiche CEI e fa firmare il cliente.',
      inputs: [
        { label: 'Programma Lavorazioni Giornaliero', detail: 'Fasi assegnate dall’ufficio tecnico sul cantiere' },
        { label: 'Disponibilità Squadra', detail: 'Presenza operai specializzati e apprendisti assegnati' },
        { label: 'Materiali & Attrezzature Verificate', detail: 'Carico furgone e strumenti di misura tarati CEI 64-8' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Briefing sicurezza cantiere e verifica DPI prima dell’intervento',
          'Coordinamento esecutivo posa canaline, infilaggio dorsali e cablaggio quadri',
          'Compilazione ROL giornaliero con inclusione collaboratori squadra (ore ord./straord.)',
          'Esecuzione collaudi strumentali (isolamento, differenziali, terra)',
          'Raccolta firma touch del cliente sul posto e invio immediato in contabilità',
        ],
        norme: ['CEI 11-27 PES (Persona Esperta)', 'CEI 64-8/6 (Verifiche e Misure)', 'D.Lgs 81/08 (Ruolo di Preposto)'],
      },
      outputs: [
        { label: 'ROL Giornaliero Firmato con Squadra', detail: 'Rapportino completo di ore squadra, foto e materiali', format: 'ROL inviato (PDF certificato)' },
        { label: 'Scarico Materiali da Furgone', detail: 'Consuntivazione componenti utilizzati', format: 'Movimento Magazzino' },
        { label: 'Verbali di Collaudo Strumentale', detail: 'Misure scatto differenziali e continuità terra', format: 'Verbale CEI 64-8' },
      ],
      squadra: {
        coordina: 'Operai Specializzati e Apprendisti della squadra',
        rispondeA: 'Project Manager / Ufficio Tecnico',
        collaboraCon: 'Referente di Cantiere del Cliente e Contabilità',
      },
      permissions: ['Apertura e compilazione ROL con squadra', 'Raccolta firma touch cliente', 'Consultazione schemi tecnici cantiere'],
    },
    operaio: {
      id: 'operaio',
      title: 'Operaio Specializzato / Elettricista',
      category: 'Esecuzione Elettrica a Regola d’Arte',
      department: 'Cantiere & Campo (4 Persone)',
      peopleCount: '4 Operai Spec.',
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      borderColor: 'border-emerald-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      icon: <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Esecuzione tecnica specializzata di impianti civili e industriali, cablaggio quadri MT/BT, impianti fotovoltaici e manutenzioni.',
      inputs: [
        { label: 'Direttive del Capocantiere', detail: 'Fasi operative del piano lavorazioni' },
        { label: 'Schemi di Cablaggio Unifilari', detail: 'Disegni quadri e schemi morsettiere' },
        { label: 'Materiali Assegnati', detail: 'Cavi, interruttori modulari, canali e minuteria' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Infilaggio cavi, connessioni morsettiere e cablaggio quadri BT',
          'Installazione apparecchi di comando, illuminazione e inverter FV',
          'Attuazione misure di sicurezza elettrica CEI 11-27 (assenza tensione)',
          'Supporto alla rendicontazione delle ore (individuali o come collaboratore ROL)',
          'Segnalazione materiali mancanti o anomalie sul cantiere',
        ],
        norme: ['CEI 11-27 PAV/PES', 'Norma CEI 64-8', 'Patentino Lavori in Quota / PLE (Piattaforme)'],
      },
      outputs: [
        { label: 'Lavorazioni Elettriche Realizzate', detail: 'Stato fase passato a completato', format: 'Impianto Collaudabile' },
        { label: 'Ore Lavorate Registrate nel ROL', detail: 'Accreditate nel ROL del capocantiere o personale', format: 'Ore ROL Certificate' },
        { label: 'Segnalazione Riserve / Anomalie', detail: 'Note operative su ostacoli riscontrati', format: 'Note ROL' },
      ],
      squadra: {
        coordina: 'Guida e affianca gli Apprendisti',
        rispondeA: 'Capocantiere',
        collaboraCon: 'Altri Operai e Caposquadra',
      },
      permissions: ['Visualizzazione cantieri e schemi', 'Compilazione ROL rapido mobile', 'Consultazione attrezzature'],
    },
    apprendista: {
      id: 'apprendista',
      title: 'Apprendista Elettricista',
      category: 'Supporto Operativo & Formazione',
      department: 'Cantiere & Campo (5 Persone)',
      peopleCount: '5 Apprendisti',
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      borderColor: 'border-blue-500',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
      icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      desc: 'Affiancamento continuo ai tecnici esperti, apprendimento delle buone pratiche elettriche CEI, preparazione cantiere e supporto posa.',
      inputs: [
        { label: 'Istruzioni del Tutor / Capocantiere', detail: 'Compiti specifici assegnati per la giornata' },
        { label: 'Piano Formativo Aziendale', detail: 'Ore di formazione interna ed esterna obbligatoria' },
        { label: 'DPI e Dispositivi Assegnati', detail: 'Scarpe antinfortunistiche, guanti isolanti, elmetto' },
      ],
      process: {
        title: 'Attività & Competenze Chiave',
        items: [
          'Posa tubazioni corrugate, canalizzazioni e fissaggio passerelle',
          'Supporto all’infilaggio conduttori e montaggio frutti/prese',
          'Preparazione e riordino attrezzature furgone e postazione di lavoro',
          'Affiancamento nei collaudi con strumenti di misura',
          'Rispetto rigoroso delle disposizioni del preposto di sicurezza',
        ],
        norme: ['CEI 11-27 PEI (Persona Idonea)', 'Formazione Base Sicurezza D.Lgs 81/08', 'Piano di Apprendistato'],
      },
      outputs: [
        { label: 'Ore di Squadra Registrate nel ROL', detail: 'Incluso dal Capocantiere nella squadra con ore lavorate', format: 'Collaboratore ROL' },
        { label: 'Attrezzature & Mezzi in Ordine', detail: 'Verifica rientro utensili sul furgone', format: 'Checklist Furgone' },
        { label: 'Avanzamento Competenze', detail: 'Maturazione monte ore formativo', format: 'Libretto Formativo' },
      ],
      squadra: {
        coordina: 'Nessuna figura (in formazione)',
        rispondeA: 'Capocantiere e Operaio Tutor Assegnato',
        collaboraCon: 'Tutti i membri della squadra operativa',
      },
      permissions: ['Visualizzazione compiti del giorno da smartphone', 'Inclusione come collaboratore ROL'],
    },
    cliente: {
      id: 'cliente',
      title: 'Cliente Committente',
      category: 'Referente Esterno & Approvatore',
      department: 'Esterno (20+ Clienti)',
      peopleCount: '20+ Committenti',
      color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
      borderColor: 'border-teal-500',
      badgeColor: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30',
      icon: <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      desc: 'Committente pubblico o privato: approva preventivi, firma i ROL giornalieri sul posto, consulta avanzamento cantiere e scarica DiCo 37/08.',
      inputs: [
        { label: 'Preventivi Elettrici Inviati', detail: 'Offerte dettagliate con voci e costi' },
        { label: 'ROL Giornaliero Presentato dal Tecnico', detail: 'Riepilogo lavori del giorno e componenti squadra' },
        { label: 'Stato Avanzamento Lavori (SAL)', detail: 'Report fotografico e documentazione as-built' },
      ],
      process: {
        title: 'Attività & Azioni Possibili',
        items: [
          'Approvazione formale preventivo d’offerta con 1 click o firma',
          'Apposizione firma touch sul tablet/smartphone del capocantiere a fine giornata',
          'Accesso al Portale Clienti isolato per visionare foto cantiere e SAL',
          'Apertura ticket o segnalazioni di intervento in garanzia',
          'Download Dichiarazioni di Conformità (DiCo) e schemi elettrici',
        ],
        norme: ['DM 37/08 art. 7 (Ricezione DiCo)', 'Art. 1655 C.C. (Contratto d’Appalto)', 'DPR 462/01 (Omologazione Impianti Terra)'],
      },
      outputs: [
        { label: 'Firma Elettronica sul ROL', detail: 'Attesta la corretta esecuzione della giornata lavorativa', format: 'Firma Touch Biometrica' },
        { label: 'Accettazione Preventivo', detail: 'Autorizzazione inizio lavori commessa', format: 'Preventivo Accettato' },
        { label: 'Segnalazioni & Ticket', detail: 'Richieste di chiarimento o manutenzione', format: 'Ticket di Supporto' },
      ],
      squadra: {
        coordina: 'Proprio personale di fabbrica o referente condominiale',
        rispondeA: 'Committente finale / Proprietà immobile',
        collaboraCon: 'Capocantiere (sul posto) e Ufficio Tecnico / PM',
      },
      permissions: ['Accesso isolato ai soli propri cantieri e preventivi', 'Firma touch ROL', 'Download documentazione tecnica'],
    },
  };

  const selectedBlock = roleBlocksDefinition[selectedRoleDetail] || roleBlocksDefinition.capocantiere;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Schemi a Blocchi dei Ruoli & Workflow Aziendale
                </h2>
                <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Organico 20 Addetti · 4 Viste · 7 Profili
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Architettura a blocchi logici: Input ➔ Competenze/Processo ➔ Output ➔ Collaborazione Squadra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-slate-100/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto shrink-0 select-none">
          {[
            { id: 'schemi_ruoli', label: 'Schemi a Blocchi per Ruolo', icon: <Boxes className="w-3.5 h-3.5" /> },
            { id: 'gerarchia', label: 'Organigramma a Blocchi', icon: <GitBranch className="w-3.5 h-3.5" /> },
            { id: 'workflow_rol', label: 'Workflow ROL & Squadra', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'raci', label: 'Matrice Ruoli (RACI)', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'organico', label: 'Mappa 20 Dipendenti', icon: <Users className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModalTab(tab.id as ModalMainTab)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeModalTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: SCHEMI A BLOCCHI PER RUOLO (INTERATTIVO) */}
          {activeModalTab === 'schemi_ruoli' && (
            <div className="space-y-6">
              
              {/* Role Selector Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Seleziona Ruolo Aziendale da Esplorare:
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                    Schema a 4 blocchi funzionali
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {Object.values(roleBlocksDefinition).map((r) => {
                    const isSelected = selectedRoleDetail === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRoleDetail(r.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? `${r.color} ${r.borderColor} ring-2 ring-amber-500/20 shadow-lg scale-[1.02]`
                            : 'bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">{r.icon}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            {r.peopleCount.split(' ')[0]}
                          </span>
                        </div>
                        <div className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">{r.title.split(' ')[0]} {r.title.split(' ')[1] || ''}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{r.department.split(' ')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CURRENT ROLE BLOCK DIAGRAM HERO */}
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
                
                {/* Role Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      {selectedBlock.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {selectedBlock.title}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedBlock.badgeColor}`}>
                          {selectedBlock.peopleCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {selectedBlock.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
                      Ambito: <strong className="text-amber-600 dark:text-amber-400">{selectedBlock.category}</strong>
                    </span>
                  </div>
                </div>

                {/* THE 4 OPERATIONAL BLOCKS GRID WITH FLOW ARROWS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                  
                  {/* BLOCCO 1: INPUT */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-blue-500/50 transition-colors shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                          1. Blocco Input
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Dati in Ingresso</span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedBlock.inputs.map((inp, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{inp.label}</div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{inp.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Origine dati</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 hidden lg:block" />
                      <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 lg:hidden" />
                    </div>
                  </div>

                  {/* BLOCCO 2: PROCESSO & COMPETENZE */}
                  <div className="bg-white dark:bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between relative group hover:border-amber-500 transition-colors shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                          2. Core Processo
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Competenze CEI</span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          {selectedBlock.process.title}
                        </div>
                        <ul className="space-y-1.5">
                          {selectedBlock.process.items.map((it, idx) => (
                            <li key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Normative Applicate:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedBlock.process.norme.map((n, idx) => (
                              <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Elaborazione</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 hidden lg:block" />
                      <ArrowDown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 lg:hidden" />
                    </div>
                  </div>

                  {/* BLOCCO 3: OUTPUT */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-emerald-500/50 transition-colors shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                          3. Blocco Output
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Consegnabili</span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedBlock.outputs.map((out, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{out.label}</span>
                              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/20">
                                {out.format}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{out.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Risultati generati</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 hidden lg:block" />
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 lg:hidden" />
                    </div>
                  </div>

                  {/* BLOCCO 4: INTERAZIONI & SQUADRA */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-colors shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
                          4. Squadra & Relazioni
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Collaborazione</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Coordina / Guida:</span>
                          <span className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">{selectedBlock.squadra.coordina}</span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Risponde Gerarchicamente a:</span>
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">{selectedBlock.squadra.rispondeA}</span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Collabora sul Campo / ROL con:</span>
                          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">{selectedBlock.squadra.collaboraCon}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Rete di lavoro</span>
                      <Users className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                    </div>
                  </div>

                </div>

                {/* Permissions & System Scope Footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Permessi nel Software:</span>
                    {selectedBlock.permissions.map((perm, idx) => (
                      <span key={idx} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono shadow-sm">
                        ✓ {perm}
                      </span>
                    ))}
                  </div>
                  
                  {/* Test Interface Action */}
                  <button
                    onClick={() => {
                      if (selectedRoleDetail === 'contabilita') setInterfaceMode('contabilita');
                      else if (selectedRoleDetail === 'ufficio_tecnico') setInterfaceMode('ufficio_tecnico');
                      else if (selectedRoleDetail === 'cliente') setInterfaceMode('cliente_portal');
                      else setInterfaceMode('cantiere_mobile');
                      showToast(`Interfaccia impostata su: ${selectedBlock.title}`, 'info');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shrink-0 shadow-sm"
                  >
                    <span>Attiva Vista Ruolo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIGRAMMA GERARCHICO A BLOCCHI */}
          {activeModalTab === 'gerarchia' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Schema a Blocchi della Struttura Gerarchica Aziendale
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Linee di comando, coordinamento tecnico DM 37/08 e gerarchia operativa di cantiere
                </p>
              </div>

              {/* HIERARCHICAL TREE BLOCKS */}
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* LEVEL 1: DIREZIONE GENERALE */}
                <div className="flex flex-col items-center">
                  <div className="w-full sm:w-80 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-500/60 rounded-xl p-4 text-center shadow-md relative">
                    <div className="inline-flex p-2 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 mb-2">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">DIREZIONE & AMMINISTRATORE UNICO</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Supervisione Strategica · Approvazione SAL · Contratti</p>
                    <span className="inline-block mt-2 text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 rounded border border-rose-300 dark:border-rose-700">
                      1 Persona · Datore di Lavoro
                    </span>
                  </div>

                  {/* Vertical Connection Line */}
                  <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 my-1"></div>
                  
                  {/* Horizontal Branch Bar */}
                  <div className="w-full max-w-2xl h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                    <div className="absolute left-1/4 top-0 w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                    <div className="absolute right-1/4 top-0 w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                  </div>
                </div>

                {/* LEVEL 2: REPARTI CENTRALI (CONTABILITÀ + UFFICIO TECNICO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  
                  {/* Blocco Reparto Contabilità */}
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                        <Calculator className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800">
                        3 Dipendenti
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">AMMINISTRAZIONE & CONTABILITÀ</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Resp. Amministrativa, Contabile Fornitori, HR & Paghe.
                    </p>
                    <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-900/60 space-y-1 text-[11px] text-purple-700 dark:text-purple-300">
                      <div>➔ Validazione ROL e attribuzione ore</div>
                      <div>➔ Controllo scostamenti budget vs consuntivo</div>
                      <div>➔ Emissione fatturazione elettronica e SAL</div>
                    </div>
                  </div>

                  {/* Blocco Reparto Ufficio Tecnico */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        <Laptop className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                        4 Dipendenti
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">UFFICIO TECNICO & PROJECT MANAGEMENT</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Resp. Tecnico DM 37/08, PM Commesse, Preventivista, Disegnatore CAD.
                    </p>
                    <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-900/60 space-y-1 text-[11px] text-amber-700 dark:text-amber-300">
                      <div>➔ Progettazione schemi unifilari CEI 64-8</div>
                      <div>➔ Preventivazione computata e aperture commesse</div>
                      <div>➔ Emissione DiCo e coordinamento magazzino</div>
                    </div>
                  </div>

                </div>

                {/* Central Branch Down to Field */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                    Coordinamento Cantieri & Operatività di Campo (13 Tecnici)
                  </div>
                  <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                </div>

                {/* LEVEL 3: CANTIERE (CAPI CANTIERE -> OPERAI -> APPRENDISTI) */}
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  
                  {/* Capi Cantiere Preposti */}
                  <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/50 rounded-lg p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          4 CAPI CANTIERE (Preposti di Sicurezza · PES / PAV / PEI)
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                        Capisquadra
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Coordinamento esecutivo della squadra, verifica DPI, apertura cantiere con QR, compilazione ROL con squadra e firma touch cliente.
                    </p>
                  </div>

                  {/* Flow Arrow Down */}
                  <div className="flex justify-center">
                    <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                  </div>

                  {/* Operai Specializzati */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/50 rounded-lg p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          4 OPERAI SPECIALIZZATI (Elettricisti Installatori · PES / PAV)
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        Cablatori & Montatori
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Infilaggio conduttori, montaggio quadri BT, cablaggi fotovoltaici e manutenzioni complesse a regola d’arte CEI 64-8.
                    </p>
                  </div>

                  {/* Flow Arrow Down */}
                  <div className="flex justify-center">
                    <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                  </div>

                  {/* Apprendisti Elettricisti */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/50 rounded-lg p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          5 APPRENDISTI ELEATTRICISTI (In Formazione & Affiancamento)
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
                        Apprendistato
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Supporto posa canali e cavi, riordino furgone, apprendimento normativo e ore lavorate registrate in squadra nel ROL.
                    </p>
                  </div>

                </div>

                {/* LEVEL 4: COMMITTENTI ESTERNI */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        COMMITTENTI & CLIENTI (20+ Clienti Attivi)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Accesso al Portale Esterno Dedicato · Firma Touch ROL su Smartphone/Tablet · Approvazione SAL
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-800">
                    Interfaccia 4: Portale Clienti
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: WORKFLOW ROL & SQUADRA COLLABORATIVA */}
          {activeModalTab === 'workflow_rol' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Schema a Blocchi del Ciclo di Vita ROL & Gestione Squadra
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Flusso end-to-end: dalla registrazione della squadra sul cantiere fino all'accredito paghe e fatturazione SAL
                </p>
              </div>

              {/* 5 STEP SEQUENTIAL BLOCK DIAGRAM */}
              <div className="space-y-4 max-w-4xl mx-auto">
                
                {/* FASE 1: APERTURA & SQUADRA */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-mono">Fase 1 · Cantiere</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-mono">Stato: bozza</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Apertura Cantiere & Composizione Squadra Operativa
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Il Capocantiere scansiona il QR Code del cantiere, seleziona la fase di lavorazione e inserisce tutti i colleghi che hanno lavorato insieme (es. Matteo + Davide + Gabriele), specificando per ciascuno le ore ordinarie e straordinarie.
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right text-[11px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50/50 dark:bg-slate-900 p-2.5 rounded-lg border border-cyan-200 dark:border-slate-800 shrink-0">
                    <div className="font-bold">Attori: Capocantiere</div>
                    <div className="text-slate-500 dark:text-slate-400">+ Collaboratori Squadra</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                </div>

                {/* FASE 2: FIRMA TOUCH CLIENTE */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">Fase 2 · Campo Touch</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">Stato: inviato</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Firma Digitale Touch del Committente sul Posto
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Al termine dei lavori, il cliente verifica il riepilogo a schermo e firma con il dito sul display dello smartphone. Il ROL viene marchiato con timestamp e bloccato contro modifiche indebite (`bloccatoModifiche = true`).
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 shrink-0">
                    <div className="font-bold">Attori: Cliente</div>
                    <div className="text-slate-500 dark:text-slate-400">+ Capocantiere</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                </div>

                {/* FASE 3: VERIFICA UFFICIO TECNICO */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">Fase 3 · Ufficio Tecnico</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">Controllo Tecnico</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Controllo Congruenza Avanzamento Lavorazioni & Materiali
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Il Project Manager riceve la notifica, verifica la percentuale di avanzamento della commessa, convalida lo scarico automatico dei materiali utilizzati e controlla la rispondenza alle specifiche di progetto.
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-slate-800 shrink-0">
                    <div className="font-bold">Attori: PM & Resp. Tecnico</div>
                    <div className="text-slate-500 dark:text-slate-400">DM 37/08</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                </div>

                {/* FASE 4: APPROVAZIONE CONTABILITÀ */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-purple-300 dark:border-purple-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm shadow-purple-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      4
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 font-mono">Fase 4 · Contabilità</span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono font-bold">Stato: approvato</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Approvazione Paghe, Accredito Ore Squadra & Margini Commessa
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        L'amministrazione valida il ROL. Il sistema accredita automaticamente le ore sia all'operatore principale che a ciascun collaboratore della squadra nel mese corrente, calcolando i costi consuntivati e aggiornando la marginalità in tempo reale.
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right text-[11px] font-mono text-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-slate-900 p-2.5 rounded-lg border border-purple-200 dark:border-slate-800 shrink-0">
                    <div className="font-bold">Attori: Resp. Contabile</div>
                    <div className="text-slate-500 dark:text-slate-400">Aggiornamento ERP</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                </div>

                {/* FASE 5: FATTURAZIONE SAL & REPORT */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      5
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 font-mono">Fase 5 · Conclusione</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono font-bold">Fatturato & Archiviato</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Generazione PDF A4 con Squadra, Invio Email & Fatturazione SAL
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Viene generato il PDF professionale conforme con la tabella completa della squadra operativa. Il documento viene inviato via email al committente e reso scaricabile nel Portale Clienti, pronto per la fatturazione a SAL.
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right text-[11px] font-mono text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-slate-900 p-2.5 rounded-lg border border-blue-200 dark:border-slate-800 shrink-0">
                    <div className="font-bold">Attori: Contabilità</div>
                    <div className="text-slate-500 dark:text-slate-400">+ Committente</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: MATRICE RACI DEI RUOLI & RESPONSABILITÀ */}
          {activeModalTab === 'raci' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Matrice delle Responsabilità (RACI) per Ruolo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <strong className="text-rose-600 dark:text-rose-400">R</strong> = Responsible (Esegue), <strong className="text-emerald-600 dark:text-emerald-400">A</strong> = Accountable (Approva), <strong className="text-amber-600 dark:text-amber-400">C</strong> = Consulted (Fornisce input), <strong className="text-slate-600 dark:text-slate-400">I</strong> = Informed (Notificato)
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Processo Aziendale</th>
                      <th className="p-3 text-center">Direzione</th>
                      <th className="p-3 text-center">Contabilità</th>
                      <th className="p-3 text-center">Uff. Tecnico</th>
                      <th className="p-3 text-center">Capocantiere</th>
                      <th className="p-3 text-center">Operaio Spec.</th>
                      <th className="p-3 text-center">Apprendista</th>
                      <th className="p-3 text-center">Cliente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                    {[
                      {
                        task: 'Sopralluogo & Redazione Preventivo Elettrico',
                        dir: 'A',
                        cont: 'I',
                        tec: 'R',
                        capo: 'C',
                        op: 'I',
                        app: 'I',
                        cli: 'C',
                      },
                      {
                        task: 'Approvazione Offerta Commerciale & Contratto',
                        dir: 'A',
                        cont: 'C',
                        tec: 'C',
                        capo: 'I',
                        op: 'I',
                        app: 'I',
                        cli: 'R',
                      },
                      {
                        task: 'Pianificazione Cantieri & Assegnazione Squadre',
                        dir: 'I',
                        cont: 'I',
                        tec: 'A / R',
                        capo: 'C',
                        op: 'I',
                        app: 'I',
                        cli: 'I',
                      },
                      {
                        task: 'Esecuzione Lavori & Sicurezza sul Posto (DPI)',
                        dir: 'A',
                        cont: 'I',
                        tec: 'C',
                        capo: 'R (Preposto)',
                        op: 'R',
                        app: 'R',
                        cli: 'I',
                      },
                      {
                        task: 'Compilazione ROL Giornaliero con Squadra',
                        dir: 'I',
                        cont: 'I',
                        tec: 'C',
                        capo: 'R',
                        op: 'C',
                        app: 'C',
                        cli: 'I',
                      },
                      {
                        task: 'Firma Touch Committente sul Campo',
                        dir: 'I',
                        cont: 'I',
                        tec: 'I',
                        capo: 'C (Presenta)',
                        op: 'I',
                        app: 'I',
                        cli: 'R (Firma)',
                      },
                      {
                        task: 'Validazione Tecnica SAL & Collaudi CEI',
                        dir: 'I',
                        cont: 'I',
                        tec: 'A / R',
                        capo: 'C',
                        op: 'I',
                        app: 'I',
                        cli: 'I',
                      },
                      {
                        task: 'Approvazione ROL per Paghe & Calcolo Margini',
                        dir: 'A',
                        cont: 'R',
                        tec: 'C',
                        capo: 'I',
                        op: 'I',
                        app: 'I',
                        cli: 'I',
                      },
                      {
                        task: 'Emissione Dichiarazione Conformità (DiCo 37/08)',
                        dir: 'A',
                        cont: 'I',
                        tec: 'R (Firma DM)',
                        capo: 'C',
                        op: 'I',
                        app: 'I',
                        cli: 'I (Riceve)',
                      },
                      {
                        task: 'Fatturazione Elettronica SAL & Incasso',
                        dir: 'A',
                        cont: 'R',
                        tec: 'C',
                        capo: 'I',
                        op: 'I',
                        app: 'I',
                        cli: 'I',
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">{row.task}</td>
                        <td className="p-3 text-center"><BadgeRaci val={row.dir} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.cont} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.tec} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.capo} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.op} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.app} /></td>
                        <td className="p-3 text-center"><BadgeRaci val={row.cli} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MAPPA ORGANICO DEI 20 DIPENDENTI & VISTE */}
          {activeModalTab === 'organico' && (
            <div className="space-y-6">
              {/* The 4 Architectural Pillars Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Contabilità */}
                <div
                  onClick={() => {
                    setInterfaceMode('contabilita');
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    interfaceMode === 'contabilita'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-purple-500/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                      <Calculator className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      3 Addetti
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    1. Contabilità & HR
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                    Validazione ROL paghe, controllo margini commessa, fatturazione SAL e monitoraggio costi manodopera.
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Desktop</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Attiva Vista <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* 2. Ufficio Tecnico */}
                <div
                  onClick={() => {
                    setInterfaceMode('ufficio_tecnico');
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    interfaceMode === 'ufficio_tecnico'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                      <Laptop className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      4 Tecnici
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    2. Ufficio Tecnico & PM
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                    Preventivi computati, pianificazione squadre, schemi CEI 64-8 / DM 37/08, riordini magazzino.
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Workstation</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Attiva Vista <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* 3. Campo Mobile (13 addetti) */}
                <div
                  onClick={() => {
                    setInterfaceMode('cantiere_mobile');
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    interfaceMode === 'cantiere_mobile'
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                      13 Operativi
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    3. Campo & Mobile
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                    4 Capi + 4 Operai + 5 Apprendisti. Timbratura ROL con colleghi, scan QR e firma cliente sul posto.
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Smartphone</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Attiva Vista <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* 4. Portale Clienti */}
                <div
                  onClick={() => {
                    setInterfaceMode('cliente_portal');
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    interfaceMode === 'cliente_portal'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      20+ Clienti
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    4. Portale Clienti
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                    Accesso isolato per ciascun cliente: avanzamento SAL fotografico, PDF firmati e DiCo scaricabili.
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Web Privato</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Attiva Vista <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Organico 20 Dipendenti Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                      Elenco Completo delle 20 Figure Aziendali
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Filtra per reparto e verifica mansioni, patentini CEI e costo orario
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'tutti', label: 'Tutti (20)' },
                      { key: 'contabilita', label: `Contabilità (${contabilitaList.length})` },
                      { key: 'ufficio_tecnico', label: `Uff. Tecnico (${ufficioTecnicoList.length})` },
                      { key: 'capocantiere', label: `Capi Cantiere (${capiCantiereList.length})` },
                      { key: 'operaio', label: `Operai (${operaiList.length})` },
                      { key: 'apprendista', label: `Apprendisti (${apprendistiList.length})` },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setSelectedReparto(t.key as any)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                          selectedReparto === t.key
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredDipendenti.map((dip) => {
                    const getBadge = () => {
                      switch (dip.reparto) {
                        case 'contabilita':
                          return <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">Contabilità</span>;
                        case 'ufficio_tecnico':
                          return <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">Uff. Tecnico</span>;
                        case 'capocantiere':
                          return <span className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">Capocantiere</span>;
                        case 'operaio':
                          return <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">Operaio Spec.</span>;
                        case 'apprendista':
                          return <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">Apprendista</span>;
                      }
                    };

                    return (
                      <div
                        key={dip.id}
                        className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {dip.nome} {dip.cognome}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {dip.ruoloAziendale}
                            </div>
                          </div>
                          {getBadge()}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          <span>Costo: {dip.costoRiservato || dip.costoOrario === 0 ? '🔒 Riservato' : `€${dip.costoOrario}/h`}</span>
                          <span>Ore mese: {dip.oreLavorateMeseCorrente}h</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {dip.patentini.slice(0, 2).map((pat, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded truncate max-w-[200px]"
                              title={pat}
                            >
                              {pat}
                            </span>
                          ))}
                          {dip.patentini.length > 2 && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                              +{dip.patentini.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Tutti i ruoli sono interconnessi in tempo reale con il modulo ROL, Cantieri e Contabilità.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Chiudi Schemi
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for RACI badges
const BadgeRaci: React.FC<{ val: string }> = ({ val }) => {
  if (val.includes('A')) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30" title="Accountable (Approva)">{val}</span>;
  }
  if (val.includes('R')) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30" title="Responsible (Esegue)">{val}</span>;
  }
  if (val.includes('C')) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30" title="Consulted (Input)">{val}</span>;
  }
  if (val.includes('I')) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700" title="Informed (Notificato)">{val}</span>;
  }
  return <span className="text-slate-400 dark:text-slate-600">-</span>;
};
