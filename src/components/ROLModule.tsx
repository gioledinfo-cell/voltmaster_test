import React, { useState, useRef } from 'react';
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileSignature,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  User,
  Filter,
  X,
  Mail,
  Download,
  FileText,
  Send,
  Users,
  UserPlus,
  Trash2,
  HardHat,
  UserCheck,
  Check,
  Share2,
  Truck,
  Wrench,
  Zap,
  Navigation,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Layers,
  MapPin,
  Cpu,
  Package,
  FileSpreadsheet,
  Lock,
  Fingerprint,
  ShieldAlert,
  KeyRound,
  FileCode,
  Copy,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Thermometer,
  Activity,
  TrendingUp,
  AlertOctagon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ROL,
  ROLStato,
  ROLCollaboratore,
  ROLWorkType,
  TravelDetails,
  CondizioneMeteo,
  ROLMeteo,
  ROLAttrezzatura,
  ROLImprevisto,
  ROLTurnoOrario,
} from '../types';
import { SignatureModal } from './SignatureModal';
import { ROLPrintModal } from './ROLPrintModal';
import { ROLEmailReportModal } from './ROLEmailReportModal';
import { ROLSummaryReportModal } from './ROLSummaryReportModal';
import { RolBrogliaccioExportModal } from './RolBrogliaccioExportModal';
import { FatturaElettronicaModal } from './fatturazione/FatturaElettronicaModal';
import { PhotoLightboxModal, PhotoLightboxData } from './preview/PhotoLightboxModal';
import { downloadRolPdf, shareRolPdf } from '../services/rolPdfService';
import { compressImageFile } from '../utils/imageCompressor';
import {
  uploadFileToStorage,
  resolveStorageUrlSync,
} from '../services/cloudStorageService';
import {
  generateRolDigitalSeal,
  verifyRolIntegrity,
  VerificationResult,
} from '../services/digitalSealService';

export const WORK_TYPE_DEFINITIONS: {
  type: ROLWorkType;
  title: string;
  badgeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  subActivities: { id: string; label: string; description: string }[];
}[] = [
  {
    type: 'cantiere',
    title: '1. Attività di Cantiere (Installazione e Posa)',
    badgeLabel: 'Cantiere / Posa',
    icon: Building2,
    colorClass: 'text-amber-500 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10 dark:bg-amber-950/30',
    subActivities: [
      {
        id: 'posa_cavi_canali',
        label: 'Posa cavi, canali e tubazioni',
        description: 'Posa canaline metalliche, tubazioni corrugate, passerelle e tiraggio conduttori.',
      },
      {
        id: 'impianti_fm_luce',
        label: 'Impianti forza motrice e illuminazione',
        description: 'Installazione blindo sbarre, corpi illuminanti LED industriali, prese interbloccate CEE.',
      },
      {
        id: 'allacciamenti_generali',
        label: 'Allacciamenti generali e quadri di campo',
        description: 'Allacciamento quadri di distribuzione, macchinari di linea e cabina MT/BT.',
      },
      {
        id: 'infilaggio_collegamenti',
        label: 'Infilaggio cavi dorsale BT e collegamenti',
        description: 'Infilaggio dorsali FG16, attestazioni morsettiere e sigillature passaggi REI.',
      },
      {
        id: 'altro_cantiere',
        label: 'Altra lavorazione di cantiere',
        description: 'Altre attività generiche di posa e installazione sul sito operativo.',
      },
    ],
  },
  {
    type: 'officina',
    title: '2. Attività di Officina / Cablaggio Quadri',
    badgeLabel: 'Officina / Quadri',
    icon: Zap,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/30',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-950/30',
    subActivities: [
      {
        id: 'cablaggio_qeg_prese',
        label: 'Realizzazione e cablaggio quadri elettrici di cantiere (QEG, quadri prese, quadri distribuzione)',
        description: 'Montaggio componenti modulari, carpenteria, pettini e morsettiere con siglatura laser.',
      },
      {
        id: 'collaudo_banco_certificazione',
        label: 'Collaudo a banco, verifiche strumentali e certificazione quadro',
        description: 'Prove di isolamento 500V, continuità conduttori di protezione PE, serraggio dinamometrico e marcatura CE.',
      },
      {
        id: 'modifiche_adeguamenti_quadri',
        label: 'Modifiche e adeguamenti quadri esistenti',
        description: 'Ampliamento partenze, sostituzione interruttori magnetotermici differenziali e revamping.',
      },
      {
        id: 'altro_officina',
        label: 'Altra attività di officina',
        description: 'Lavorazioni meccaniche, carpenteria elettrica o assemblaggio a banco.',
      },
    ],
  },
  {
    type: 'manutenzione_riparazione',
    title: '3. Manutenzione e Riparazione Dispositivi',
    badgeLabel: 'Manutenzione / Riparazione',
    icon: Wrench,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/30',
    subActivities: [
      {
        id: 'controllo_ripristino_impianti',
        label: 'Interventi di controllo, ripristino o riparazione su apparecchiature, dispositivi e impianti',
        description: 'Interventi su inverter solari, gruppi di continuità UPS, motori, pompe e quadri guasti.',
      },
      {
        id: 'sostituzione_componenti',
        label: 'Sostituzione componenti usurati o difettosi',
        description: 'Sostituzione scaricatori SPD, fusibili gPV, teleruttori, relè di sicurezza, schede elettroniche.',
      },
      {
        id: 'diagnosi_anomalie_verifiche',
        label: 'Diagnosi anomalie e verifiche funzionali post-riparazione',
        description: 'Ricerca dispersioni a terra, analisi termografica a infrarossi, test di scatto differenziali.',
      },
      {
        id: 'altro_manutenzione',
        label: 'Altro intervento di riparazione/manutenzione',
        description: 'Manutenzioni preventive programmate o interventi urgenti a guasto.',
      },
    ],
  },
];

export const ROLModule: React.FC = () => {
  const {
    rols,
    cantieri,
    clienti,
    lavorazioni,
    magazzino,
    veicoli,
    attrezzature,
    currentUser,
    dipendenti,
    addROL,
    updateROL,
    approveROL,
    rejectROL,
    showToast,
  } = useApp();

  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [filterWorkType, setFilterWorkType] = useState<string>('tutti');
  const [search, setSearch] = useState('');
  const [selectedRol, setSelectedRol] = useState<ROL | null>(rols[0] || null);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [signatureModalRol, setSignatureModalRol] = useState<ROL | null>(null);
  const [printModalRol, setPrintModalRol] = useState<ROL | null>(null);
  const [emailReportRol, setEmailReportRol] = useState<ROL | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isBrogliaccioModalOpen, setIsBrogliaccioModalOpen] = useState(false);
  const [isFatturaModalOpen, setIsFatturaModalOpen] = useState(false);
  const [selectedFatturaRol, setSelectedFatturaRol] = useState<ROL | null>(null);
  const [lightboxData, setLightboxData] = useState<PhotoLightboxData | null>(null);

  // Digital Seal Verification State (Passo 3)
  const [sealVerificationResult, setSealVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifyingSeal, setIsVerifyingSeal] = useState(false);

  // Collaborators Modal on Selected ROL
  const [isManagingCollabs, setIsManagingCollabs] = useState(false);
  const [editCollabsList, setEditCollabsList] = useState<ROLCollaboratore[]>([]);
  const [manageAddDipId, setManageAddDipId] = useState<string>('');
  const [manageAddOreOrd, setManageAddOreOrd] = useState<number>(8);
  const [manageAddOreStr, setManageAddOreStr] = useState<number>(0);
  const [manageAddNote, setManageAddNote] = useState<string>('');

  // Hidden file input for camera/photos
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New ROL Form state
  const [formWorkType, setFormWorkType] = useState<ROLWorkType>('cantiere');
  const [formSubActivity, setFormSubActivity] = useState<string>('posa_cavi_canali');
  const [formActivityDescription, setFormActivityDescription] = useState<string>('');
  const [formPartsReplaced, setFormPartsReplaced] = useState<string>('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);

  // GIORNALE LAVORI & PARAMETRI DI CANTIERE (Passo 1 Audit)
  const [formTurnoInizio, setFormTurnoInizio] = useState<string>('07:30');
  const [formTurnoFine, setFormTurnoFine] = useState<string>('16:30');
  const [formTurnoPausa, setFormTurnoPausa] = useState<number>(60);
  
  const [formMeteoCondizione, setFormMeteoCondizione] = useState<CondizioneMeteo>('sereno');
  const [formMeteoTempMin, setFormMeteoTempMin] = useState<number>(14);
  const [formMeteoTempMax, setFormMeteoTempMax] = useState<number>(24);
  const [formMeteoNote, setFormMeteoNote] = useState<string>('');
  const [formMeteoImpraticabile, setFormMeteoImpraticabile] = useState<boolean>(false);

  const [formAvanzamentoPercentuale, setFormAvanzamentoPercentuale] = useState<number>(50);
  const [formQuantitaPosata, setFormQuantitaPosata] = useState<string>('');
  
  // Attrezzature utilizzate durante la giornata
  const [attrezzatureAggiunte, setAttrezzatureAggiunte] = useState<ROLAttrezzatura[]>([]);
  const [newAttrSelectedId, setNewAttrSelectedId] = useState<string>('');
  const [newAttrNomeManual, setNewAttrNomeManual] = useState<string>('');
  const [newAttrMatricola, setNewAttrMatricola] = useState<string>('');
  const [newAttrOre, setNewAttrOre] = useState<number>(4);
  const [newAttrOperatore, setNewAttrOperatore] = useState<string>(currentUser.name);

  // Imprevisti e Fermi Cantiere
  const [imprevistiAggiunti, setImprevistiAggiunti] = useState<ROLImprevisto[]>([]);
  const [newImpDescrizione, setNewImpDescrizione] = useState<string>('');
  const [newImpOreFermo, setNewImpOreFermo] = useState<number>(1.0);
  const [newImpCausa, setNewImpCausa] = useState<'committenza' | 'meteo' | 'fornitore' | 'sicurezza' | 'tecnica'>('committenza');

  // Sicurezza e DPI di Cantiere
  const [formNoteSicurezza, setFormNoteSicurezza] = useState<string>(
    'Verifica DPI anticaduta e verifica assenza di tensione prima delle lavorazioni.'
  );

  // Subappalto per la squadra
  const [newCollabIsSubappalto, setNewCollabIsSubappalto] = useState<boolean>(false);
  const [newCollabSubDitta, setNewCollabSubDitta] = useState<string>('EuroMontaggi Impianti S.r.l.');
  const [newCollabSubNome, setNewCollabSubNome] = useState<string>('');
  
  // Travel state (Toggle OFF by default)
  const [formHasTravel, setFormHasTravel] = useState<boolean>(false);
  const [formHoursTravel, setFormHoursTravel] = useState<number>(1.0);
  const [formTravelRoute, setFormTravelRoute] = useState<string>('Sede VoltMaster -> Cantiere');
  const [formTravelVehicleId, setFormTravelVehicleId] = useState<string>(veicoli[0]?.id || '');
  const [formTravelCustomVehicle, setFormTravelCustomVehicle] = useState<string>('');
  const [formTravelKm, setFormTravelKm] = useState<number>(25);

  const [formData, setFormData] = useState({
    cantiereId: cantieri[0]?.id || '',
    lavorazioneId: '',
    attivitaLibera: '',
    oreOrdinarie: 8,
    oreStraordinarie: 0,
    descrizioneLavori: 'Posa canalizzazioni e cablaggio dorsale principale.',
    noteOperatore: 'Nessuna anomalia riscontrata.',
    materialeNome: '',
    materialeQta: 1,
  });

  const [materialiAggiunti, setMaterialiAggiunti] = useState<{ nome: string; quantita: number; unita: string }[]>([]);

  // Collaborators added during ROL creation
  const [collaboratoriAggiunti, setCollaboratoriAggiunti] = useState<ROLCollaboratore[]>([]);
  const [newCollabDipId, setNewCollabDipId] = useState<string>('');
  const [newCollabOreOrd, setNewCollabOreOrd] = useState<number>(8);
  const [newCollabOreStr, setNewCollabOreStr] = useState<number>(0);
  const [newCollabNote, setNewCollabNote] = useState<string>('');
  const [abilitaFirmaEInvioCliente, setAbilitaFirmaEInvioCliente] = useState<boolean>(false);

  const currentWorkDef = WORK_TYPE_DEFINITIONS.find((w) => w.type === formWorkType) || WORK_TYPE_DEFINITIONS[0];

  // Dynamic hours calculation
  const calculatedHoursWork = (formData.oreOrdinarie || 0) + (formData.oreStraordinarie || 0);
  const calculatedHoursTravel = formHasTravel ? (formHoursTravel || 0) : 0;
  const calculatedTotalHours = calculatedHoursWork + calculatedHoursTravel;

  const filteredRols = rols.filter((r) => {
    const matchesSearch =
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      r.cantiereTitolo.toLowerCase().includes(search.toLowerCase()) ||
      r.operatoreNome.toLowerCase().includes(search.toLowerCase()) ||
      (r.collaboratori && r.collaboratori.some((c) => c.nome.toLowerCase().includes(search.toLowerCase()))) ||
      (r.activityDescription && r.activityDescription.toLowerCase().includes(search.toLowerCase())) ||
      (r.partsReplaced && r.partsReplaced.toLowerCase().includes(search.toLowerCase())) ||
      r.clienteNome.toLowerCase().includes(search.toLowerCase());

    const matchesStato = filterStato === 'tutti' || r.stato === filterStato;
    const matchesWorkType = filterWorkType === 'tutti' || r.workType === filterWorkType;
    return matchesSearch && matchesStato && matchesWorkType;
  });

  const activeCantiereForForm = cantieri.find((c) => c.id === formData.cantiereId) || cantieri[0];
  const cantiereLavorazioni = lavorazioni.filter((l) => l.cantiereId === formData.cantiereId);

  // Quick Copy from Previous / Yesterday ROL (Passo 1 UX Cantiere)
  const populateFormFromRol = (sourceRol: ROL) => {
    const cantiere = cantieri.find((c) => c.id === sourceRol.cantiereId);
    setFormData({
      cantiereId: sourceRol.cantiereId,
      lavorazioneId: sourceRol.lavorazioneId || '',
      attivitaLibera: sourceRol.attivitaLibera || '',
      oreOrdinarie: sourceRol.oreOrdinarie || 8,
      oreStraordinarie: 0, // Azzera straordinari per la nuova giornata
      descrizioneLavori: sourceRol.descrizioneLavori || '',
      noteOperatore: sourceRol.noteOperatore || '',
      materialeNome: '',
      materialeQta: 1,
    });

    setFormWorkType(sourceRol.workType || 'cantiere');
    setFormSubActivity(
      sourceRol.subActivity ||
        (sourceRol.workType === 'officina' ? 'cablaggio_qeg_prese' : 'posa_cavi_canali')
    );
    setFormActivityDescription(sourceRol.activityDescription || '');
    setFormPartsReplaced(sourceRol.partsReplaced || '');
    setFormPhotos([]); // Foto fresche per oggi

    // Clona squadra collaboratori mantenendo ore standard
    if (sourceRol.collaboratori && sourceRol.collaboratori.length > 0) {
      setCollaboratoriAggiunti(
        sourceRol.collaboratori.map((c) => ({
          ...c,
          oreStraordinarie: 0,
        }))
      );
    } else {
      setCollaboratoriAggiunti([]);
    }

    // Clona dettagli trasferta e veicolo se configurati
    if (sourceRol.travelDetails?.hasTravel) {
      setFormHasTravel(true);
      setFormHoursTravel(sourceRol.travelDetails.travelHours || 1);
      setFormTravelRoute(sourceRol.travelDetails.route || 'Sede VoltMaster -> Cantiere');
      setFormTravelVehicleId(sourceRol.travelDetails.vehicleId || veicoli[0]?.id || '');
      setFormTravelCustomVehicle(sourceRol.travelDetails.customVehicleName || '');
      setFormTravelKm(sourceRol.travelDetails.km || 25);
    } else {
      setFormHasTravel(false);
    }

    // Clona turno, meteo e sicurezza se presenti
    if (sourceRol.turnoOrario) {
      setFormTurnoInizio(sourceRol.turnoOrario.oraInizio || '07:30');
      setFormTurnoFine(sourceRol.turnoOrario.oraFine || '16:30');
      setFormTurnoPausa(sourceRol.turnoOrario.pausaMinuti ?? 60);
    }
    if (sourceRol.meteo) {
      setFormMeteoCondizione(sourceRol.meteo.condizione || 'sereno');
      setFormMeteoTempMin(sourceRol.meteo.temperaturaMin ?? 14);
      setFormMeteoTempMax(sourceRol.meteo.temperaturaMax ?? 24);
      setFormMeteoNote(sourceRol.meteo.noteMeteo || '');
      setFormMeteoImpraticabile(sourceRol.meteo.impraticabilitaCantiere || false);
    }
    if (sourceRol.noteSicurezza) {
      setFormNoteSicurezza(sourceRol.noteSicurezza);
    }
    if (sourceRol.attrezzature && sourceRol.attrezzature.length > 0) {
      setAttrezzatureAggiunte(sourceRol.attrezzature.map((a) => ({ ...a, id: `attr-${Date.now()}-${Math.random()}` })));
    } else {
      setAttrezzatureAggiunte([]);
    }

    // Clona materiali ricorrenti
    const sourceMats = sourceRol.materiali || sourceRol.materialiUtilizzati || [];
    if (sourceMats.length > 0) {
      setMaterialiAggiunti(
        sourceMats.map((m: { nome: string; quantita: number; unita?: string }) => ({
          nome: m.nome,
          quantita: m.quantita,
          unita: m.unita || 'pz',
        }))
      );
    } else {
      setMaterialiAggiunti([]);
    }

    setIsNewModalOpen(true);
    const countDip = (sourceRol.collaboratori?.length || 0) + 1;
    showToast(
      `Dati clonati dal ROL del ${sourceRol.data} (${cantiere?.titolo || 'Cantiere'}: ${countDip} operai, veicolo ${sourceRol.travelDetails?.vehicleId ? 'impostato' : 'nessuno'})!`,
      'success'
    );
  };

  const handleQuickCopyYesterdayRol = () => {
    if (rols.length === 0) {
      showToast('Nessun ROL precedente disponibile da copiare.', 'warning');
      return;
    }

    const preferredCantiereId = formData.cantiereId || selectedRol?.cantiereId || cantieri[0]?.id;
    const sameCantiereRols = rols.filter((r) => r.cantiereId === preferredCantiereId);
    const sortedList = [...(sameCantiereRols.length > 0 ? sameCantiereRols : rols)].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    const source = sortedList[0];
    if (source) {
      populateFormFromRol(source);
    }
  };

  const handleAddMaterialeRow = () => {
    if (!formData.materialeNome) return;
    setMaterialiAggiunti((prev) => [
      ...prev,
      { nome: formData.materialeNome, quantita: formData.materialeQta, unita: 'pz' },
    ]);
    setFormData((prev) => ({ ...prev, materialeNome: '', materialeQta: 1 }));
  };

  const handleAddNewCollaboratore = () => {
    if (!newCollabDipId) return;
    const dip = dipendenti.find((d) => d.id === newCollabDipId);
    if (!dip) return;

    if (collaboratoriAggiunti.some((c) => c.id === dip.id)) {
      showToast('Operatore già presente nella squadra', 'warning');
      return;
    }

    setCollaboratoriAggiunti((prev) => [
      ...prev,
      {
        id: dip.id,
        nome: `${dip.nome} ${dip.cognome}`,
        ruolo: dip.ruoloAziendale,
        oreOrdinarie: newCollabOreOrd,
        oreStraordinarie: newCollabOreStr,
        note: newCollabNote || undefined,
      },
    ]);
    setNewCollabDipId('');
    setNewCollabNote('');
  };

  const handleRemoveNewCollaboratore = (id: string) => {
    setCollaboratoriAggiunti((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenManageCollabs = () => {
    if (!selectedRol) return;
    setEditCollabsList(selectedRol.collaboratori ? [...selectedRol.collaboratori] : []);
    setManageAddDipId('');
    setManageAddOreOrd(selectedRol.oreOrdinarie);
    setManageAddOreStr(selectedRol.oreStraordinarie);
    setManageAddNote('');
    setIsManagingCollabs(true);
  };

  const handleAddCollaboratoreToEdit = () => {
    if (!manageAddDipId) return;
    const dip = dipendenti.find((d) => d.id === manageAddDipId);
    if (!dip) return;

    if (editCollabsList.some((c) => c.id === dip.id) || selectedRol?.operatoreNome.includes(dip.cognome)) {
      showToast('Questo operatore fa già parte della squadra', 'warning');
      return;
    }

    setEditCollabsList((prev) => [
      ...prev,
      {
        id: dip.id,
        nome: `${dip.nome} ${dip.cognome}`,
        ruolo: dip.ruoloAziendale,
        oreOrdinarie: manageAddOreOrd,
        oreStraordinarie: manageAddOreStr,
        note: manageAddNote || undefined,
      },
    ]);
    setManageAddDipId('');
    setManageAddNote('');
  };

  const handleRemoveCollaboratoreFromEdit = (id: string) => {
    setEditCollabsList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveCollabs = () => {
    if (!selectedRol) return;
    updateROL(selectedRol.id, { collaboratori: editCollabsList });
    setSelectedRol({ ...selectedRol, collaboratori: editCollabsList });
    setIsManagingCollabs(false);
    showToast(`Squadra del rapporto ${selectedRol.numero} aggiornata!`, 'success');
  };

  // Photo upload handling with automatic Canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    for (const file of files) {
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 1600,
          quality: 0.78,
          format: 'image/jpeg',
        });
        // Archivia nel Blob Store / Cloud Storage anziché in Base64
        const stored = await uploadFileToStorage(compressed.blob, {
          folder: 'rol_foto',
          fileName: file.name,
          mimeType: compressed.mimeType,
        });
        setFormPhotos((prev) => [...prev, stored.storageUri || stored.url]);
        showToast(
          `Foto archiviata su Cloud Storage (-${compressed.reductionPercentage}%)!`,
          'success'
        );
      } catch (err) {
        console.error('Errore compressione foto:', err);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleAddSamplePhoto = (type: string) => {
    const samples: Record<string, string> = {
      quadro: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      cablaggio: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      riparazione: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    };
    const sampleUrl = samples[type] || samples.quadro;
    setFormPhotos((prev) => [...prev, sampleUrl]);
    showToast('Foto dimostrativa aggiunta al rapporto!', 'info');
  };

  const handleRemovePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateROL = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCantiereForForm) return;

    const lav = lavorazioni.find((l) => l.id === formData.lavorazioneId);

    // Selected vehicle details for travel
    let travelDetails: TravelDetails | null = null;
    if (formHasTravel) {
      const selectedVeh = veicoli.find((v) => v.id === formTravelVehicleId);
      travelDetails = {
        vehicleId: selectedVeh ? selectedVeh.id : (formTravelVehicleId || 'VEI-CUSTOM'),
        vehiclePlate: selectedVeh ? selectedVeh.targa : 'TARGA-AZ',
        vehicleName: selectedVeh ? `${selectedVeh.modello} (${selectedVeh.targa})` : (formTravelCustomVehicle || 'Mezzo Aziendale'),
        route: formTravelRoute || `Sede VoltMaster -> ${activeCantiereForForm.titolo}`,
        km: formTravelKm || 0,
      };
    }

    const newRol = addROL({
      data: new Date().toISOString().split('T')[0],
      operatoreId: currentUser.id,
      operatoreNome: currentUser.name,
      collaboratori: collaboratoriAggiunti,
      cantiereId: activeCantiereForForm.id,
      cantiereTitolo: activeCantiereForForm.titolo,
      clienteNome: activeCantiereForForm.clienteNome,
      
      // Macro and sub-activity
      workType: formWorkType,
      subActivity: formSubActivity,
      activityDescription: formActivityDescription || undefined,

      lavorazioneId: lav?.id,
      lavorazioneTitolo: lav?.titolo,
      attivitaLibera: formData.attivitaLibera || undefined,

      // Hours & Travel
      oreOrdinarie: formData.oreOrdinarie,
      oreStraordinarie: formData.oreStraordinarie,
      hoursWork: calculatedHoursWork,
      hasTravel: formHasTravel,
      hoursTravel: formHasTravel ? formHoursTravel : 0,
      travelDetails,
      oreTotali: calculatedTotalHours,
      totalHours: calculatedTotalHours,

      // Repair details & Photos
      partsReplaced: formPartsReplaced || undefined,
      photos: formPhotos,

      descrizioneLavori: formData.descrizioneLavori,
      materialiUtilizzati: materialiAggiunti,
      noteOperatore: formData.noteOperatore,
      abilitaFirmaEInvioCliente,
      stato: abilitaFirmaEInvioCliente ? 'inviato' : 'bozza',
      firmaClientePresente: false,
      bloccatoModifiche: false,
    });

    setIsNewModalOpen(false);
    setSelectedRol(newRol);
    setMaterialiAggiunti([]);
    setCollaboratoriAggiunti([]);
    setFormPhotos([]);
    setFormPartsReplaced('');
    setFormActivityDescription('');
    setFormHasTravel(false);
    setAbilitaFirmaEInvioCliente(false);
    showToast(`Rapporto ${newRol.numero} registrato con successo!`, 'success');
  };

  const getStatusBadge = (stato: ROLStato) => {
    switch (stato) {
      case 'approvato':
        return <span className="text-emerald-500 dark:text-emerald-400 font-bold font-mono text-[11px]">Approvato</span>;
      case 'inviato':
        return <span className="text-amber-500 dark:text-amber-400 font-bold font-mono text-[11px]">Inviato (Da Approvare)</span>;
      case 'bozza':
        return <span className="text-slate-500 dark:text-slate-400 font-bold font-mono text-[11px]">Bozza</span>;
      case 'respinto':
        return <span className="text-rose-500 dark:text-rose-400 font-bold font-mono text-[11px]">Respinto</span>;
      default:
        return <span className="text-slate-400 font-mono text-[11px]">{stato}</span>;
    }
  };

  const getWorkTypeBadge = (type?: ROLWorkType) => {
    const def = WORK_TYPE_DEFINITIONS.find((w) => w.type === type) || WORK_TYPE_DEFINITIONS[0];
    const Icon = def.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${def.bgClass} ${def.colorClass} ${def.borderClass}`}>
        <Icon className="w-3 h-3" />
        <span>{def.badgeLabel}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hidden file input for photos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span>ROL · Rapporto Ore Lavorate Giornaliere</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Registrazione ore cantiere/officina/manutenzione, gestione trasferte e viaggi, ricambi, foto e contabilità
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsBrogliaccioModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Esporta il brogliaccio mensile completo con ore, straordinari, costi manodopera e firme in Excel e PDF"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Brogliaccio Mensile (Excel / PDF)</span>
          </button>

          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-cyan-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold rounded-lg transition-colors shadow-xs"
            title="Genera un report PDF riepilogativo di più ROL raggruppati per committente o mese"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            Report PDF Riepilogativo
          </button>

          <button
            onClick={() => {
              setSelectedFatturaRol(null);
              setIsFatturaModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700/80 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Converti i rapportini ROL approvati e DDT di commessa direttamente in tracciato XML Fattura Elettronica (SDI FPR12 v1.8)"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Fattura Elettronica XML</span>
          </button>

          <button
            type="button"
            onClick={handleQuickCopyYesterdayRol}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Copia l'ultimo ROL del cantiere o di ieri: precompila operai, ore, mezzi e lavorazioni con 1 solo tocco"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Copia da ROL di Ieri</span>
          </button>

          <button
            onClick={() => {
              setFormWorkType('cantiere');
              setFormSubActivity('posa_cavi_canali');
              setFormHasTravel(false);
              setFormPhotos([]);
              setFormPartsReplaced('');
              setFormActivityDescription('');
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuovo ROL Giornaliero
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cerca per n. ROL, cantiere, tecnico, ricambio, dispositivo o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* WorkType filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs">
          {[
            { id: 'tutti', label: 'Tutte le attività' },
            { id: 'cantiere', label: '🏗️ Cantiere' },
            { id: 'officina', label: '⚡ Officina' },
            { id: 'manutenzione_riparazione', label: '🔧 Manutenzione' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterWorkType(item.id)}
              className={`px-2.5 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                filterWorkType === item.id
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs">
          {['tutti', 'inviato', 'approvato', 'bozza'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStato(st)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                filterStato === st
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st === 'inviato' ? 'In attesa' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List of ROLs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Rapporti registrati ({filteredRols.length})</span>
            <span className="text-[11px] font-mono">
              Totale ore: {filteredRols.reduce((sum, r) => sum + r.oreTotali, 0)} h
            </span>
          </div>

          <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
            {filteredRols.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Nessun rapporto trovato con i filtri correnti.
              </div>
            ) : (
              filteredRols.map((rol) => {
                const isSelected = selectedRol?.id === rol.id;
                return (
                  <div
                    key={rol.id}
                    onClick={() => setSelectedRol(rol)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-500 dark:bg-slate-900 dark:border-amber-500 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {rol.numero}
                          </span>
                          <span className="text-slate-400">·</span>
                          {getWorkTypeBadge(rol.workType)}
                          <span className="text-slate-400">·</span>
                          {getStatusBadge(rol.stato)}
                        </div>

                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {rol.cantiereTitolo}
                        </h3>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tecnico: <strong className="text-slate-800 dark:text-slate-200">{rol.operatoreNome}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                          {rol.oreTotali} h
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{rol.data}</div>
                      </div>
                    </div>

                    {/* Quick activity & travel chips */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {rol.activityDescription || rol.lavorazioneTitolo || rol.attivitaLibera || 'Intervento generale'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {rol.hasTravel && (
                          <span
                            className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                            title={`Ore Viaggio: ${rol.hoursTravel || 0}h (${rol.travelDetails?.vehiclePlate || 'Mezzo'})`}
                          >
                            <Truck className="w-3 h-3 text-indigo-500" />
                            <span>+{rol.hoursTravel || 0}h viag.</span>
                          </span>
                        )}

                        {rol.photos && rol.photos.length > 0 && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                            <Camera className="w-3 h-3" />
                            <span>{rol.photos.length}</span>
                          </span>
                        )}

                        {rol.collaboratori && rol.collaboratori.length > 0 && (
                          <span
                            className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/60 dark:border-cyan-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5"
                            title={`Squadra: +${rol.collaboratori.length} colleghi`}
                          >
                            <Users className="w-3 h-3 text-cyan-500" />
                            <span>+{rol.collaboratori.length}</span>
                          </span>
                        )}

                        {rol.sigilloDigitale && (
                          <span
                            className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 shadow-xs"
                            title={`Sigillo SHA-256 Apposto: ${rol.sigilloDigitale.codiceVerificaUnivoco}`}
                          >
                            <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span>SHA-256</span>
                          </span>
                        )}

                        <span className={rol.firmaClientePresente || rol.firmaClienteDataUrl ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 italic'}>
                          {rol.firmaClientePresente || rol.firmaClienteDataUrl ? 'Firma ✓' : 'Senza firma'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected ROL Detailed Review & Actions (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRol ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 shadow-xs dark:shadow-xl space-y-6">
              {/* Top Banner and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      {selectedRol.numero}
                    </span>
                    <span className="text-slate-400">·</span>
                    {getWorkTypeBadge(selectedRol.workType)}
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Data {selectedRol.data}</span>
                    <span className="text-slate-400">·</span>
                    {getStatusBadge(selectedRol.stato)}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {selectedRol.cantiereTitolo}
                  </h2>

                  <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center flex-wrap gap-2">
                    <span>
                      Cliente: <strong>{selectedRol.clienteNome}</strong> · Tecnico Resp.: <strong>{selectedRol.operatoreNome}</strong>
                    </span>
                    {selectedRol.collaboratori && selectedRol.collaboratori.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-[10px] font-semibold">
                        <Users className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                        Squadra: +{selectedRol.collaboratori.length} {selectedRol.collaboratori.length === 1 ? 'collega' : 'colleghi'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => setEmailReportRol(selectedRol)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                    title="Invia report PDF firmato via email al committente"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Invia Report
                  </button>

                  <button
                    onClick={() => {
                      const cantiere = cantieri.find((c) => c.id === selectedRol.cantiereId);
                      const cliente = clienti.find((cli) => cli.ragioneSociale === selectedRol.clienteNome || cli.id === cantiere?.clienteId);
                      downloadRolPdf(selectedRol, cliente, cantiere);
                      showToast(`PDF del rapporto ${selectedRol.numero} scaricato!`, 'success');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    Scarica PDF
                  </button>

                  <button
                    onClick={() => setPrintModalRol(selectedRol)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-500" />
                    Anteprima A4
                  </button>

                  <button
                    onClick={() => populateFormFromRol(selectedRol)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700 text-xs font-bold rounded-lg transition-colors shadow-xs"
                    title="Clona questo rapporto in un nuovo ROL per la giornata odierna (stessa squadra, mezzi e cantiere)"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Duplica per Oggi</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFatturaRol(selectedRol);
                      setIsFatturaModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/80 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    title="Genera Fattura Elettronica XML (SDI) per questo ROL e i DDT del cantiere"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Fattura XML
                  </button>

                  <button
                    onClick={async () => {
                      const cantiere = cantieri.find((c) => c.id === selectedRol.cantiereId);
                      const cliente = clienti.find((cli) => cli.ragioneSociale === selectedRol.clienteNome || cli.id === cantiere?.clienteId);
                      const shared = await shareRolPdf(selectedRol, cliente, cantiere);
                      if (shared) showToast('Rapporto ROL condiviso con successo!', 'success');
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg dark:border-slate-700 transition-colors"
                    title="Condividi Rapporto ROL"
                  >
                    <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>

                  {selectedRol.sigilloDigitale && (
                    <button
                      onClick={async () => {
                        setIsVerifyingSeal(true);
                        try {
                          const res = await verifyRolIntegrity(selectedRol);
                          setSealVerificationResult(res);
                        } finally {
                          setIsVerifyingSeal(false);
                        }
                      }}
                      disabled={isVerifyingSeal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      title="Verifica crittografica dell'integrità del rapporto di lavoro"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>{isVerifyingSeal ? 'Verifica...' : 'Verifica Sigillo SHA-256'}</span>
                    </button>
                  )}

                  {!selectedRol.bloccatoModifiche && (
                    <button
                      onClick={() => setSignatureModalRol(selectedRol)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      Firma Touch
                    </button>
                  )}
                </div>
              </div>

              {/* Hours & Travel Dynamic Breakdown Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <span>Riepilogo Ore Lavorative & Trasferta</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                    Totale Operatore: {selectedRol.oreTotali} h
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ore Ordinarie</span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {selectedRol.oreOrdinarie} h
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Straordinari</span>
                    <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {selectedRol.oreStraordinarie} h
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border text-center ${
                    selectedRol.hasTravel
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase font-semibold block flex items-center justify-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>Ore Viaggio</span>
                    </span>
                    <span className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-300 tabular-nums">
                      {selectedRol.hasTravel ? `${selectedRol.hoursTravel || 0} h` : '0 h (No viaggio)'}
                    </span>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">
                      Totale Complessivo
                    </span>
                    <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {selectedRol.oreTotali} h
                    </span>
                  </div>
                </div>

                {/* Travel Details Card if travel enabled */}
                {selectedRol.hasTravel && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>Dettagli Viaggio & Mezzo</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 font-bold">
                            {selectedRol.hoursTravel || 0} Ore Trasferta
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          Tratta: <strong>{selectedRol.travelDetails?.route || 'Sede -> Cantiere'}</strong>
                          {selectedRol.travelDetails?.km ? ` · ${selectedRol.travelDetails.km} km percorsi` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                      Mezzo: <strong>{selectedRol.travelDetails?.vehicleName || selectedRol.travelDetails?.vehiclePlate || 'Furgone Aziendale'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Work Category and Specific Details Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getWorkTypeBadge(selectedRol.workType)}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedRol.subActivity
                        ? WORK_TYPE_DEFINITIONS.flatMap((w) => w.subActivities).find((s) => s.id === selectedRol.subActivity)?.label || selectedRol.subActivity
                        : 'Lavorazione generale'}
                    </span>
                  </div>
                </div>

                {/* Device / Activity Specific Description */}
                {selectedRol.activityDescription && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Dispositivo Oggetto dell'Intervento / Note Specifiche:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {selectedRol.activityDescription}
                    </p>
                  </div>
                )}

                {/* Replaced Parts (Ricambi Sostituiti) */}
                {selectedRol.partsReplaced && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Ricambi e Componenti Sostituiti:</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 pl-5 leading-relaxed">
                      {selectedRol.partsReplaced}
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Documentation Section */}
              {selectedRol.photos && selectedRol.photos.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>Documentazione Fotografica Intervento ({selectedRol.photos.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">Clicca sull'immagine per ingrandire</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedRol.photos.map((photoUrl, idx) => {
                      const resolvedUrl = resolveStorageUrlSync(photoUrl);
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setLightboxData({
                              imageUrl: resolvedUrl,
                              title: `Foto ${idx + 1} · ${selectedRol.numero}`,
                              category: selectedRol.workType || 'intervento',
                              subtitle: selectedRol.activityDescription || selectedRol.cantiereTitolo,
                              details: [
                                { label: 'Cantiere', value: selectedRol.cantiereTitolo },
                                { label: 'Tecnico', value: selectedRol.operatoreNome },
                                { label: 'Data', value: selectedRol.data },
                              ],
                            })
                          }
                          className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-pointer shadow-xs hover:border-amber-500 transition-all"
                        >
                          <img
                            src={resolvedUrl}
                            alt={`Foto intervento ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SQUADRA OPERATIVA */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Squadra di Lavoro & Personale Operativo</span>
                        {selectedRol.collaboratori && selectedRol.collaboratori.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold">
                            {1 + selectedRol.collaboratori.length} Tecnici
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedRol.collaboratori && selectedRol.collaboratori.length > 0
                          ? `Intervento eseguito congiuntamente da una squadra di ${1 + selectedRol.collaboratori.length} operatori`
                          : 'Rapporto compilato per singolo operatore. Aggiungi i colleghi che hanno lavorato insieme:'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenManageCollabs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-cyan-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-300 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Gestisci Squadra</span>
                  </button>
                </div>

                {/* Team member cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Caposquadra */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-500/30 flex items-start justify-between text-xs shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{selectedRol.operatoreNome}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded font-bold uppercase">
                            Caposquadra
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Responsabile Tecnico Compilatore
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{selectedRol.oreTotali} h</div>
                      <div className="text-[10px] text-slate-500">
                        {selectedRol.oreOrdinarie}h + {selectedRol.oreStraordinarie}h str
                      </div>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {selectedRol.collaboratori &&
                    selectedRol.collaboratori.map((collab, idx) => {
                      const cOrd = collab.oreOrdinarie ?? selectedRol.oreOrdinarie;
                      const cStr = collab.oreStraordinarie ?? selectedRol.oreStraordinarie;
                      const cTot = cOrd + cStr;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start justify-between text-xs shadow-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {collab.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{collab.nome}</span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 rounded font-medium">
                                  {collab.ruolo || 'Collaboratore'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {collab.note || 'Lavorazioni condivise'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <div className="font-bold text-cyan-700 dark:text-cyan-300">{cTot} h</div>
                            <div className="text-[10px] text-slate-500">
                              {cOrd}h ord · {cStr}h str
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Description & Work Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Descrizione Lavori Eseguiti
                </h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {selectedRol.descrizioneLavori}
                </div>
                {selectedRol.noteOperatore && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic px-1">
                    Note tecnico: {selectedRol.noteOperatore}
                  </div>
                )}
              </div>

              {/* Materials Consumed in this intervention */}
              {selectedRol.materialiUtilizzati && selectedRol.materialiUtilizzati.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>Materiali & Componenti Registrati</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Descrizione</th>
                          <th className="py-2 px-3 text-right">Quantità</th>
                          <th className="py-2 px-3 text-center">U.M.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {selectedRol.materialiUtilizzati.map((mat, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{mat.nome}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">{mat.quantita}</td>
                            <td className="py-2 px-3 text-center text-slate-500">{mat.unita}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Signature Verification Block */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                {selectedRol.abilitaFirmaEInvioCliente ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {selectedRol.firmaClientePresente ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>Firma Grafometrica Committente Acquisita</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>In attesa di firma cliente sul touchscreen</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedRol.firmaClienteNome ? `Firmatario: ${selectedRol.firmaClienteNome}` : 'Nessuna firma apposta'}
                        {selectedRol.firmaClienteTimestamp && ` · ${selectedRol.firmaClienteTimestamp}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!selectedRol.firmaClientePresente && (
                        <button
                          onClick={() => setSignatureModalRol(selectedRol)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Acquisisci Firma
                        </button>
                      )}
                      {selectedRol.firmaClienteDataUrl && (
                        <div className="h-12 w-28 bg-white rounded p-1 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                          <img
                            src={selectedRol.firmaClienteDataUrl}
                            alt="Firma"
                            className="max-h-full max-w-full mix-blend-multiply"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sigillo Digitale Crittografico SHA-256 (Passo 3) */}
                  {selectedRol.sigilloDigitale && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                              <span>Sigillo Digitale Crittografico SHA-256</span>
                              <span className="font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded text-[10px]">
                                {selectedRol.sigilloDigitale.codiceVerificaUnivoco}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                              Hash: {selectedRol.sigilloDigitale.sha256Hash}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsVerifyingSeal(true);
                            try {
                              const res = await verifyRolIntegrity(selectedRol);
                              setSealVerificationResult(res);
                            } finally {
                              setIsVerifyingSeal(false);
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>Verifica Integrità</span>
                        </button>
                      </div>

                      {selectedRol.bloccatoModifiche && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            <strong>Rapporto Bloccato & Immutabile:</strong> ai sensi del Codice dell'Amministrazione Digitale (CAD artt. 20-21) e art. 2702 c.c., il contenuto non è alterabile.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <FileSignature className="w-4 h-4 text-slate-400" />
                        <span>Firma e Invio al Cliente: Disattivata di Default</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Questo rapporto è registrato per esclusivo uso interno (cantiere e contabilità).
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        updateROL(selectedRol.id, { abilitaFirmaEInvioCliente: true });
                        setSelectedRol({ ...selectedRol, abilitaFirmaEInvioCliente: true });
                        showToast('Firma e invio al cliente abilitati per questo ROL!', 'info');
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-amber-300 border border-amber-300 dark:border-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    >
                      Attiva per questo ROL
                    </button>
                  </div>
                )}
              </div>

              {/* Administrative Actions */}
              {currentUser.role !== 'operatore' && selectedRol.stato === 'inviato' && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Verifica ore e contenuti per l'integrazione contabile:
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const note = prompt('Inserisci il motivo della richiesta di modifica per l’operatore:');
                        if (note) rejectROL(selectedRol.id, note);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:border-rose-800 dark:text-rose-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Richiedi Modifica
                    </button>

                    <button
                      onClick={() => approveROL(selectedRol.id)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approva ROL
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              Nessun ROL selezionato.
            </div>
          )}
        </div>
      </div>

      {/* CREATE ROL MODAL WITH TRAVEL & ACTIVITY CATEGORIES */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Compilazione Rapporto Ore (ROL)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registra attività di cantiere, officina o manutenzione, ore di viaggio opzionali e ricambi
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateROL} className="space-y-4 text-xs mt-4">
              {/* BANNER CLONAZIONE RAPIDA DA ROL DI IERI / PRECEDENTE */}
              {rols.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-amber-950 dark:text-amber-200">
                        ⚡ Precompila da ROL Precedente:
                      </span>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        Clona squadra operai, ore standard, veicolo e attività con 1 solo click.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      onChange={(e) => {
                        const found = rols.find((r) => r.id === e.target.value);
                        if (found) populateFormFromRol(found);
                      }}
                      defaultValue=""
                      className="text-[11px] px-2 py-1.5 bg-white dark:bg-slate-900 border border-amber-400/60 dark:border-amber-700/80 rounded-lg text-slate-800 dark:text-slate-200 font-medium w-full sm:w-auto"
                    >
                      <option value="" disabled>
                        -- Scegli ROL da clonare --
                      </option>
                      {rols.slice(0, 10).map((r) => {
                        const cant = cantieri.find((c) => c.id === r.cantiereId);
                        const techCount = (r.collaboratori?.length || 0) + 1;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.data} - [{r.numero}] {cant?.titolo ? cant.titolo.slice(0, 18) : 'Cantiere'} ({techCount} op.)
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={handleQuickCopyYesterdayRol}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-xs"
                      title="Clona l'ultimo ROL di questo cantiere o di ieri"
                    >
                      Clona Ieri
                    </button>
                  </div>
                </div>
              )}

              {/* Cantiere / Commessa */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Cantiere / Commessa di Riferimento:
                </label>
                <select
                  value={formData.cantiereId}
                  onChange={(e) => setFormData({ ...formData, cantiereId: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500 font-medium"
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.codice}] {c.titolo} - {c.clienteNome}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELEZIONE MACRO-CATEGORIA ATTIVITÀ */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                <label className="block text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Seleziona Tipologia di Lavorazione (Macro-Categoria):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WORK_TYPE_DEFINITIONS.map((w) => {
                    const isSelected = formWorkType === w.type;
                    const Icon = w.icon;
                    return (
                      <button
                        key={w.type}
                        type="button"
                        onClick={() => {
                          setFormWorkType(w.type);
                          setFormSubActivity(w.subActivities[0]?.id || '');
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">{w.badgeLabel}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {w.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sotto-attività specifica */}
                <div className="pt-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                    Sotto-Attività Specifica ({currentWorkDef.badgeLabel}):
                  </label>
                  <select
                    value={formSubActivity}
                    onChange={(e) => setFormSubActivity(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {currentWorkDef.subActivities.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo Dispositivo / Dettagli intervento */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                    {formWorkType === 'manutenzione_riparazione'
                      ? 'Dispositivo / Apparecchiatura Oggetto della Riparazione:'
                      : formWorkType === 'officina'
                      ? 'Quadro / Impianto Oggetto del Cablaggio:'
                      : 'Tratto di Cantiere / Dettaglio Impianto:'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formWorkType === 'manutenzione_riparazione'
                        ? 'es. Inverter Fotovoltaico Sungrow SH10RT - Ricerca guasto isolamento DC'
                        : formWorkType === 'officina'
                        ? 'es. Quadro QEG-02 secondario prese reparto logistica'
                        : 'es. Passerella dorsale BT Cabina -> Quadro Q1'
                    }
                    value={formActivityDescription}
                    onChange={(e) => setFormActivityDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Lavorazione pianificata (opzionale) */}
              {cantiereLavorazioni.length > 0 && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Collega a Lavorazione Pianificata (opzionale):
                  </label>
                  <select
                    value={formData.lavorazioneId}
                    onChange={(e) => setFormData({ ...formData, lavorazioneId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Nessuna lavorazione specifica collegata</option>
                    {cantiereLavorazioni.map((l) => (
                      <option key={l.id} value={l.id}>
                        [{l.fase}] {l.titolo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ORE DI LAVORO (EFFETTIVE) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Ore Lavoro Ordinarie:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.oreOrdinarie}
                    onChange={(e) => setFormData({ ...formData, oreOrdinarie: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Ore Straordinarie:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.oreStraordinarie}
                    onChange={(e) => setFormData({ ...formData, oreStraordinarie: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-mono font-bold text-amber-600 dark:text-amber-400 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SEZIONE 1: GESTIONE ORE DI VIAGGIO (TOGGLE DISATTIVATO DI DEFAULT) */}
              <div className={`p-4 rounded-xl border transition-all space-y-3 ${
                formHasTravel
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80'
                  : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
              }`}>
                {/* Header with Switch */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${
                      formHasTravel
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Includi ore di viaggio / trasferta
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          formHasTravel
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {formHasTravel ? 'ATTIVATO' : 'OFF (Disattivato di default)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formHasTravel
                          ? 'Le ore di viaggio verranno conteggiate e sommate al totale ore del rapporto.'
                          : 'Predefinito: Nessun tempo di viaggio conteggiato. Totale Ore = Ore Lavoro.'}
                      </p>
                    </div>
                  </div>

                  {/* Switch button */}
                  <button
                    type="button"
                    onClick={() => setFormHasTravel(!formHasTravel)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formHasTravel ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                    role="switch"
                    aria-checked={formHasTravel}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formHasTravel ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Animated Travel Input Fields (Visible when ON) */}
                {formHasTravel && (
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-indigo-950 dark:text-indigo-200 font-bold mb-1 text-[11px]">
                          Ore Viaggio (step 0.5h):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={formHoursTravel}
                          onChange={(e) => setFormHoursTravel(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg font-mono font-bold text-indigo-900 dark:text-indigo-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-indigo-950 dark:text-indigo-200 font-bold mb-1 text-[11px]">
                          Mezzo Aziendale Utilizzato:
                        </label>
                        <select
                          value={formTravelVehicleId}
                          onChange={(e) => setFormTravelVehicleId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs font-medium"
                        >
                          {veicoli.map((v) => (
                            <option key={v.id} value={v.id}>
                              [{v.targa}] {v.modello}
                            </option>
                          ))}
                          <option value="custom">Altro mezzo (specifica)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-indigo-950 dark:text-indigo-200 font-bold mb-1 text-[11px]">
                          Km Percorsi (opzionale):
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="es. 30"
                          value={formTravelKm || ''}
                          onChange={(e) => setFormTravelKm(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-indigo-950 dark:text-indigo-200 font-bold mb-1 text-[11px]">
                        Tratta / Destinazione:
                      </label>
                      <input
                        type="text"
                        placeholder="es. Sede VoltMaster (Milano) -> Cantiere GreenTech (Vimodrone)"
                        value={formTravelRoute}
                        onChange={(e) => setFormTravelRoute(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Real-time Dynamic Total Hours Summary */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Formula Totale Ore:
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-700 dark:text-slate-300">
                      {calculatedHoursWork}h lavoro {formHasTravel && `+ ${calculatedHoursTravel}h viaggio`} =
                    </span>
                    <span className="text-sm font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono shadow-xs">
                      {calculatedTotalHours} Ore Totali
                    </span>
                  </div>
                </div>
              </div>

              {/* SEZIONE 2: RICAMBI E PARTI SOSTITUITE */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ricambi e Componenti Sostituiti (Opzionale):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Per manutenzioni / officina</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="es. Sostituito scaricatore Dehn DG M TT 275 + fusibile 10x38 15A 1000V DC; morsetti a molla 6mm²"
                  value={formPartsReplaced}
                  onChange={(e) => setFormPartsReplaced(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400"
                />
              </div>

              {/* SEZIONE 3: FOTO INTERVENTO E COMPONENTI */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Foto dell'Intervento o Ricambio Sostituito ({formPhotos.length}):</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddSamplePhoto('quadro')}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                      title="Aggiungi foto dimostrativa"
                    >
                      + Demo Quadro
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scatta / Allega Foto</span>
                    </button>
                  </div>
                </div>

                {/* Thumbnails of attached photos */}
                {formPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {formPhotos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={resolveStorageUrlSync(photo)} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded transition-colors"
                          title="Rimuovi foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Nessuna foto allegata. Puoi scattarne una dal cellulare o caricarla dai file.
                  </p>
                )}
              </div>

              {/* Descrizione Lavori Eseguiti */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Descrizione Lavori Eseguiti:
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.descrizioneLavori}
                  onChange={(e) => setFormData({ ...formData, descrizioneLavori: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              {/* Squadra di Lavoro / Altri Operatori */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1.5 text-xs">
                    <Users className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Squadra di Lavoro (Hanno lavorato altri colleghi insieme?):</span>
                  </label>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                    {collaboratoriAggiunti.length > 0 ? `+${collaboratoriAggiunti.length} colleghi` : 'Solo tu'}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      value={newCollabDipId}
                      onChange={(e) => setNewCollabDipId(e.target.value)}
                      className="sm:col-span-6 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                    >
                      <option value="">-- Seleziona collega operatore --</option>
                      {dipendenti
                        .filter(
                          (d) =>
                            d.id !== currentUser.id &&
                            !collaboratoriAggiunti.some((c) => c.id === d.id) &&
                            d.reparto !== 'contabilita'
                        )
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nome} {d.cognome} ({d.ruoloAziendale})
                          </option>
                        ))}
                    </select>

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        title="Ore ordinarie collega"
                        placeholder="Ord."
                        value={newCollabOreOrd}
                        onChange={(e) => setNewCollabOreOrd(parseFloat(e.target.value) || 0)}
                        className="w-1/2 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center font-mono text-slate-900 dark:text-slate-100 text-xs"
                      />
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        title="Ore straordinarie collega"
                        placeholder="Str."
                        value={newCollabOreStr}
                        onChange={(e) => setNewCollabOreStr(parseFloat(e.target.value) || 0)}
                        className="w-1/2 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center font-mono text-amber-600 dark:text-amber-400 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewCollaboratore}
                      disabled={!newCollabDipId}
                      className="sm:col-span-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Aggiungi</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Note opzionali per questo collega (es. Posa tubazioni, supporto cablaggio)"
                    value={newCollabNote}
                    onChange={(e) => setNewCollabNote(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded text-[11px] text-slate-800 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                {collaboratoriAggiunti.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                      Colleghi in squadra per questo ROL:
                    </span>
                    {collaboratoriAggiunti.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                            {c.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{c.nome}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {c.ruolo || 'Operatore'} {c.note && `· ${c.note}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                            {(c.oreOrdinarie || 0) + (c.oreStraordinarie || 0)} h
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewCollaboratore(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Rimuovi dalla squadra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add materials used */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-medium">Materiali utilizzati:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome materiale (es. 20m cavo FG16)"
                    value={formData.materialeNome}
                    onChange={(e) => setFormData({ ...formData, materialeNome: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded"
                  />
                  <input
                    type="number"
                    value={formData.materialeQta}
                    onChange={(e) => setFormData({ ...formData, materialeQta: parseFloat(e.target.value) || 1 })}
                    className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddMaterialeRow}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded font-semibold"
                  >
                    Aggiungi
                  </button>
                </div>

                {materialiAggiunti.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {materialiAggiunti.map((m, i) => (
                      <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300 text-[11px] bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                        <span>{m.nome}</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">{m.quantita} {m.unita}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option: Firma e Invio al Cliente */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg border ${
                        abilitaFirmaEInvioCliente
                          ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
                          : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Firma e Invio al Cliente
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            abilitaFirmaEInvioCliente
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                              : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
                          }`}
                        >
                          {abilitaFirmaEInvioCliente ? 'ATTIVATA' : 'DISATTIVATA (Predefinita)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {abilitaFirmaEInvioCliente
                          ? 'Richiede la firma touch del committente e invia il documento al cliente.'
                          : 'Opzione disattivata di default: il rapporto ore resta a esclusivo uso interno di cantiere e contabilità.'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAbilitaFirmaEInvioCliente(!abilitaFirmaEInvioCliente)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      abilitaFirmaEInvioCliente ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                    role="switch"
                    aria-checked={abilitaFirmaEInvioCliente}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        abilitaFirmaEInvioCliente ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva ROL ({calculatedTotalHours}h)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQUAD MANAGEMENT MODAL ON SELECTED ROL */}
      {isManagingCollabs && selectedRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl my-6 space-y-4">
            <button
              onClick={() => setIsManagingCollabs(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Gestione Squadra di Lavoro · {selectedRol.numero}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aggiungi o rimuovi gli altri tecnici e colleghi che hanno lavorato insieme
                </p>
              </div>
            </div>

            {/* Caposquadra Card */}
            <div className="p-3 bg-amber-50/50 dark:bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{selectedRol.operatoreNome}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded font-bold uppercase">
                      Caposquadra
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Tecnico firmatario principale</div>
                </div>
              </div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedRol.oreTotali} h
              </div>
            </div>

            {/* List of current collaborators in edit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Altri Operatori in Squadra ({editCollabsList.length}):</span>
              </div>

              {editCollabsList.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
                  Nessun altro collega aggiunto.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editCollabsList.map((collab) => (
                    <div
                      key={collab.id}
                      className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {collab.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{collab.nome}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {collab.ruolo || 'Collaboratore'} {collab.note && `· ${collab.note}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-cyan-700 dark:text-cyan-300 text-xs font-mono">
                          {(collab.oreOrdinarie || 0) + (collab.oreStraordinarie || 0)} h
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaboratoreFromEdit(collab.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Rimuovi dalla squadra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new colleague form */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Aggiungi un altro collega alla squadra:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={manageAddDipId}
                  onChange={(e) => setManageAddDipId(e.target.value)}
                  className="sm:col-span-6 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                >
                  <option value="">-- Seleziona dipendente --</option>
                  {dipendenti
                    .filter((d) => d.reparto !== 'contabilita' && !editCollabsList.some((c) => c.id === d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.cognome} ({d.ruoloAziendale})
                      </option>
                    ))}
                </select>

                <div className="sm:col-span-3 flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ord"
                    value={manageAddOreOrd}
                    onChange={(e) => setManageAddOreOrd(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded text-center font-mono text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Str"
                    value={manageAddOreStr}
                    onChange={(e) => setManageAddOreStr(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded text-center font-mono text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCollaboratoreToEdit}
                  disabled={!manageAddDipId}
                  className="sm:col-span-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Aggiungi</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Note specifiche per questo collega (opzionale)"
                value={manageAddNote}
                onChange={(e) => setManageAddNote(e.target.value)}
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded text-[11px] text-slate-800 dark:text-slate-300 placeholder:text-slate-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsManagingCollabs(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveCollabs}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salva Squadra Aggiornata</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signatureModalRol && (
        <SignatureModal
          cantiereTitolo={signatureModalRol.cantiereTitolo}
          clienteNome={signatureModalRol.clienteNome}
          rolNumero={signatureModalRol.numero}
          onClose={() => setSignatureModalRol(null)}
          onSaveSignature={async (dataUrl: string, signerName: string, timestamp: string) => {
            const sigillo = await generateRolDigitalSeal(
              signatureModalRol,
              signerName,
              timestamp,
              dataUrl
            );
            const patch = {
              firmaClientePresente: true,
              firmaClienteNome: signerName,
              firmaClienteDataUrl: dataUrl,
              firmaClienteTimestamp: timestamp,
              stato: 'approvato' as const,
              bloccatoModifiche: true,
              sigilloDigitale: sigillo,
            };
            updateROL(signatureModalRol.id, patch);
            setSelectedRol({
              ...signatureModalRol,
              ...patch,
            });
            setSignatureModalRol(null);
            showToast(
              `Firma cliente acquisita e Sigillo Crittografico SHA-256 apposto (${sigillo.codiceVerificaUnivoco})! Modifiche bloccate ex art. 2702 c.c.`,
              'success'
            );
          }}
        />
      )}

      {/* Digital Seal Integrity Verification Modal (Passo 3) */}
      {sealVerificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSealVerificationResult(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  sealVerificationResult.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {sealVerificationResult.isValid ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Verifica Integrità Sigillo SHA-256
                </h3>
                <p className="text-xs text-slate-400">
                  Controllo crittografico deterministico ex artt. 20-21 CAD & art. 2702 c.c.
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                sealVerificationResult.isValid
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {sealVerificationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>DOCUMENTO INTEGRO: NESSUNA MANOMISSIONE RILEVATA</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>ALLERTA: IMPRONTA CRITTOGRAFICA NON CORRISPONDENTE</span>
                  </>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{sealVerificationResult.message}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                  Hash SHA-256 Memorizzato al Momento della Firma:
                </div>
                <div className="text-slate-800 dark:text-slate-200 break-all text-[11px] select-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 mt-0.5">
                  {sealVerificationResult.originalHash || 'N/D'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">
                  Hash SHA-256 Ricalcolato sui Dati Attuali:
                </div>
                <div className="text-slate-800 dark:text-slate-200 break-all text-[11px] select-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 mt-0.5">
                  {sealVerificationResult.computedHash}
                </div>
              </div>

              {sealVerificationResult.firmatario && (
                <div className="pt-1.5 text-[11px] font-sans flex justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Firmatario:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sealVerificationResult.firmatario}</span>
                </div>
              )}
              {sealVerificationResult.timestampOriginale && (
                <div className="text-[11px] font-sans flex justify-between">
                  <span className="text-slate-500">Data/Ora Certificata:</span>
                  <span className="text-slate-700 dark:text-slate-300">{sealVerificationResult.timestampOriginale}</span>
                </div>
              )}
              <div className="text-[11px] font-sans flex justify-between">
                <span className="text-slate-500">Verificato alle:</span>
                <span className="text-slate-700 dark:text-slate-300">{sealVerificationResult.verifiedAt}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSealVerificationResult(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printModalRol && (
        <ROLPrintModal rol={printModalRol} onClose={() => setPrintModalRol(null)} />
      )}

      {/* Email Report Modal */}
      {emailReportRol && (
        <ROLEmailReportModal
          rol={emailReportRol}
          isOpen={!!emailReportRol}
          onClose={() => setEmailReportRol(null)}
          onEmailSentSuccess={(updatedRol) => {
            setSelectedRol(updatedRol);
          }}
        />
      )}

      {/* Summary Multi-ROL Report Modal */}
      {isSummaryModalOpen && (
        <ROLSummaryReportModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      )}

      {/* Brogliaccio Mensile Export Modal (Excel & PDF) */}
      {isBrogliaccioModalOpen && (
        <RolBrogliaccioExportModal
          isOpen={isBrogliaccioModalOpen}
          onClose={() => setIsBrogliaccioModalOpen(false)}
        />
      )}

      {/* Fatturazione Elettronica XML (SDI Agenzia delle Entrate) */}
      {isFatturaModalOpen && (
        <FatturaElettronicaModal
          cantiereId={selectedFatturaRol ? selectedFatturaRol.cantiereId : undefined}
          preselectedRolIds={selectedFatturaRol ? [selectedFatturaRol.id] : undefined}
          isOpen={isFatturaModalOpen}
          onClose={() => {
            setIsFatturaModalOpen(false);
            setSelectedFatturaRol(null);
          }}
        />
      )}

      {/* Photo Lightbox Modal */}
      {lightboxData && (
        <PhotoLightboxModal data={lightboxData} onClose={() => setLightboxData(null)} />
      )}
    </div>
  );
};
