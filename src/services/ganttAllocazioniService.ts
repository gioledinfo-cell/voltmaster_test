import {
  AllocazioneRisorsa,
  ConflittoRisorsa,
  FaseGanttCantiere,
  MilestoneGantt,
} from '../types/ganttAllocazioni';
import { CANTIERI } from '../data/cantieri';
import { DIPENDENTI } from '../data/dipendenti';
import { VEICOLI } from '../data/veicoli';
import { ATTREZZATURE } from '../data/attrezzatura';

/**
 * Attrezzature speciali e Piattaforme Aeree PLE disponibili per allocazione
 */
export const ASSET_GANTT_DISPONIBILI = [
  // Piattaforme Aeree PLE & Strumenti Speciali
  {
    id: 'PLE-01',
    tipo: 'attrezzatura' as const,
    nome: 'Piattaforma Aerea Semovente Articolata Haulotte 16m (PLE-01)',
    dettaglio: 'Matricola PLE-16M-HAU · Patentino PLE obbligatorio',
    categoria: 'Piattaforma Aerea PLE',
  },
  {
    id: 'PLE-02',
    tipo: 'attrezzatura' as const,
    nome: 'Piattaforma Pantografo Elettrica 10m Gommata Antitraccia (PLE-02)',
    dettaglio: 'Matricola PLE-10P-GEN · Per pavimentazioni interne industriali',
    categoria: 'Piattaforma Aerea PLE',
  },
  {
    id: 'ATT-001',
    tipo: 'attrezzatura' as const,
    nome: 'Strumento Multifunzione Prove CEI 64-8 Asita Megger (ATT-001)',
    dettaglio: 'Matricola MAT-CEI-9921 · Taratura Accredia valida',
    categoria: 'Strumento di Verifica',
  },
  {
    id: 'ATT-002',
    tipo: 'attrezzatura' as const,
    nome: 'Termocamera Infrarossi Quadri Elettrici FLIR E6-XT (ATT-002)',
    dettaglio: 'Matricola FLIR-884210 · Ispezione termografica cabine',
    categoria: 'Strumento di Verifica',
  },
  {
    id: 'ATT-004',
    tipo: 'attrezzatura' as const,
    nome: 'Giuntatrice Fusione Fibra Ottica Fujikura 90S+ (ATT-004)',
    dettaglio: 'Matricola FJK-9941 · Cablaggio e collaudo dorsali fibra',
    categoria: 'Strumento Specialistico',
  },

  // Flotta Furgoni e Mezzi di Cantiere
  ...VEICOLI.map((v) => ({
    id: v.id,
    tipo: 'veicolo' as const,
    nome: `${v.modello} (${v.targa})`,
    dettaglio: `${v.tipo || v.modelloTipologia || 'Furgone Allestito'} · Portata ${v.portataKg || 1200}kg`,
    categoria: 'Mezzo di Cantiere',
  })),

  // Maestranze e Tecnici
  ...DIPENDENTI.map((d) => ({
    id: d.id,
    tipo: 'dipendente' as const,
    nome: `${d.nome} ${d.cognome}`,
    dettaglio: `${d.ruoloAziendale} (${d.reparto})`,
    categoria: d.ruoloAziendale,
  })),
];

/**
 * Fasi Cronoprogramma Iniziali per i cantieri
 */
export const INITIAL_FASI_GANTT: FaseGanttCantiere[] = [
  // Cantiere CNT-01: Ospedale San Luca
  {
    id: 'FASE-01',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Ristrutturazione Padiglione A',
    titoloFase: '1. Opere Murarie & Tracce: Verifiche Strumentali Cabina MT',
    categoriaFase: 'opere_murarie_tracce',
    salRiferimento: 'SAL #1 — Acconto 30% (€ 45.000)',
    salId: 'sal-001',
    importoFaseEuro: 45000,
    dataInizio: '2026-10-01',
    dataFine: '2026-10-08',
    percentualeAvanzamento: 100,
    coloreBarra: '#10b981', // emerald
    dipendentiAssegnati: ['DIP-01', 'DIP-02'],
    attrezzatureAssegnate: ['ATT-001'],
    veicoliAssegnati: ['VEI-01'],
    stato: 'completata',
  },
  {
    id: 'FASE-02',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Ristrutturazione Padiglione A',
    titoloFase: '2. Posa Cavi & Tubazioni: Blindosbarre 1600A e Canaline Portacavi a Soffitto con PLE',
    categoriaFase: 'posa_cavi_tubazioni',
    salRiferimento: 'SAL #1 — Acconto 30% (€ 45.000)',
    salId: 'sal-001',
    importoFaseEuro: 65000,
    dataInizio: '2026-10-07',
    dataFine: '2026-10-16',
    percentualeAvanzamento: 65,
    coloreBarra: '#f59e0b', // amber
    dipendentiAssegnati: ['DIP-01', 'DIP-03'],
    attrezzatureAssegnate: ['PLE-01'],
    veicoliAssegnati: ['VEI-01'],
    stato: 'in_corso',
  },
  {
    id: 'FASE-03',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Ristrutturazione Padiglione A',
    titoloFase: '3. Infilaggio & Attestazione: Dorsali FG16 e Collegamento Quadri',
    categoriaFase: 'infilaggio_attestazione',
    salRiferimento: 'SAL #2 — Stato Avanzamento 60% (€ 90.000)',
    salId: 'sal-002',
    importoFaseEuro: 50000,
    dataInizio: '2026-10-17',
    dataFine: '2026-10-28',
    percentualeAvanzamento: 0,
    coloreBarra: '#3b82f6', // blue
    dipendentiAssegnati: ['DIP-01', 'DIP-04'],
    attrezzatureAssegnate: ['ATT-001'],
    veicoliAssegnati: ['VEI-01'],
    stato: 'non_iniziata',
  },

  // Cantiere CNT-02: Polo Logistico Amazon
  {
    id: 'FASE-04',
    cantiereId: 'CNT-02',
    cantiereTitolo: 'Polo Logistico Amazon Hub - Impianto Fotovoltaico 500kW',
    titoloFase: '4. Montaggio Apparecchiature: Carpenteria Tetto & Inverter con PLE',
    categoriaFase: 'montaggio_apparecchiature',
    salRiferimento: 'SAL #1 — Intermedio Fotovoltaico 40% (€ 120.000)',
    salId: 'sal-003',
    importoFaseEuro: 120000,
    dataInizio: '2026-10-09',
    dataFine: '2026-10-18',
    percentualeAvanzamento: 25,
    coloreBarra: '#ef4444', // red per conflitto
    dipendentiAssegnati: ['DIP-02', 'DIP-04'],
    attrezzatureAssegnate: ['PLE-01'],
    veicoliAssegnati: ['VEI-02'],
    stato: 'in_corso',
  },
  {
    id: 'FASE-05',
    cantiereId: 'CNT-02',
    cantiereTitolo: 'Polo Logistico Amazon Hub - Impianto Fotovoltaico 500kW',
    titoloFase: '5. Collaudo & Certificazione: Allacciamento Quadri Stringa & CEI 64-8',
    categoriaFase: 'collaudo_certificazione',
    salRiferimento: 'SAL Finale — Saldo & Certificati (€ 80.000)',
    salId: 'sal-004',
    importoFaseEuro: 80000,
    dataInizio: '2026-10-19',
    dataFine: '2026-10-31',
    percentualeAvanzamento: 0,
    coloreBarra: '#8b5cf6', // purple
    dipendentiAssegnati: ['DIP-02'],
    attrezzatureAssegnate: ['ATT-004'],
    veicoliAssegnati: ['VEI-02'],
    stato: 'non_iniziata',
  },

  // Cantiere CNT-03: Centro Direzionale San Donato
  {
    id: 'FASE-06',
    cantiereId: 'CNT-03',
    cantiereTitolo: 'Centro Direzionale San Donato - Uffici Torri',
    titoloFase: '1. Impianti Speciali Rivelazione Fumi & Domotica KNX',
    dataInizio: '2026-10-05',
    dataFine: '2026-10-22',
    percentualeAvanzamento: 60,
    coloreBarra: '#06b6d4', // cyan
    dipendentiAssegnati: ['DIP-03'],
    attrezzatureAssegnate: ['PLE-02'],
    veicoliAssegnati: ['VEI-03'],
    stato: 'in_corso',
  },
];

/**
 * Allocazioni Iniziali di Risorse (con caso reale di overbooking per collaudo)
 */
export const INITIAL_ALLOCAZIONI: AllocazioneRisorsa[] = [
  // Allocazione 1: PLE-01 su Ospedale San Luca (7-16 Ottobre)
  {
    id: 'ALL-001',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Padiglione A',
    faseDescrizione: 'Posa canali e dorsali ad alta quota con PLE',
    tipoRisorsa: 'attrezzatura',
    risorsaId: 'PLE-01',
    risorsaNome: 'Piattaforma Aerea Haulotte 16m (PLE-01)',
    risorsaDettaglio: 'Matricola PLE-16M-HAU',
    dataInizio: '2026-10-07',
    dataFine: '2026-10-15',
    statoAllocazione: 'in_corso',
    priorita: 'alta',
  },
  // Allocazione 2: CONFLITTO! Stessa PLE-01 richiesta su Amazon Hub (9-14 Ottobre)
  {
    id: 'ALL-002',
    cantiereId: 'CNT-02',
    cantiereTitolo: 'Polo Logistico Amazon Hub - Fotovoltaico',
    faseDescrizione: 'Staffaggio inverter e salita in copertura tetto',
    tipoRisorsa: 'attrezzatura',
    risorsaId: 'PLE-01',
    risorsaNome: 'Piattaforma Aerea Haulotte 16m (PLE-01)',
    risorsaDettaglio: 'Matricola PLE-16M-HAU',
    dataInizio: '2026-10-09',
    dataFine: '2026-10-14',
    statoAllocazione: 'pianificata',
    priorita: 'bloccante',
    note: 'Richiesta per montaggio staffe fotovoltaico',
  },
  // Allocazione 3: Capocantiere Marco Rossi su San Luca
  {
    id: 'ALL-003',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Padiglione A',
    faseDescrizione: 'Coordinamento squadra cablaggio e verifiche',
    tipoRisorsa: 'dipendente',
    risorsaId: 'DIP-01',
    risorsaNome: 'Marco Rossi',
    risorsaDettaglio: 'Capocantiere Elettrico (PES)',
    dataInizio: '2026-10-01',
    dataFine: '2026-10-20',
    statoAllocazione: 'in_corso',
    priorita: 'alta',
  },
  // Allocazione 4: CONFLITTO! Marco Rossi inserito anche su San Donato lo stesso giorno
  {
    id: 'ALL-004',
    cantiereId: 'CNT-03',
    cantiereTitolo: 'Centro Direzionale San Donato',
    faseDescrizione: 'Collaudo interruttori scatolati quadri piani',
    tipoRisorsa: 'dipendente',
    risorsaId: 'DIP-01',
    risorsaNome: 'Marco Rossi',
    risorsaDettaglio: 'Capocantiere Elettrico (PES)',
    dataInizio: '2026-10-10',
    dataFine: '2026-10-12',
    statoAllocazione: 'pianificata',
    priorita: 'alta',
    note: 'Richiesto per supervisione collaudo',
  },
  // Allocazione 5: Furgone VEI-01 su San Luca
  {
    id: 'ALL-005',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Padiglione A',
    faseDescrizione: 'Logistica materiali cantiere e officina mobile',
    tipoRisorsa: 'veicolo',
    risorsaId: 'VEI-01',
    risorsaNome: 'Iveco Daily 35S14 Allestito (FJ482KN)',
    risorsaDettaglio: 'Furgone con banco morsa e scaffalatura',
    dataInizio: '2026-10-01',
    dataFine: '2026-10-25',
    statoAllocazione: 'in_corso',
    priorita: 'normale',
  },
  // Allocazione 6: PLE-02 su San Donato
  {
    id: 'ALL-006',
    cantiereId: 'CNT-03',
    cantiereTitolo: 'Centro Direzionale San Donato',
    faseDescrizione: 'Posa rilevatori ottici fumo a soffitto uffici',
    tipoRisorsa: 'attrezzatura',
    risorsaId: 'PLE-02',
    risorsaNome: 'Piattaforma Pantografo Elettrica 10m (PLE-02)',
    risorsaDettaglio: 'Ruote antitraccia per moquette/resina',
    dataInizio: '2026-10-05',
    dataFine: '2026-10-22',
    statoAllocazione: 'in_corso',
    priorita: 'normale',
  },
];

/**
 * Milestones di commessa
 */
export const INITIAL_MILESTONES: MilestoneGantt[] = [
  {
    id: 'MS-01',
    cantiereId: 'CNT-01',
    titolo: 'Collaudo Cabina MT/BT con Enel Distribuzione',
    dataPrevista: '2026-10-15',
    completata: false,
    tipo: 'allaccio_enel',
  },
  {
    id: 'MS-02',
    cantiereId: 'CNT-01',
    titolo: 'Emissione SAL Intermedio n. 2 (€ 120.000)',
    dataPrevista: '2026-10-22',
    completata: false,
    tipo: 'sal_intermedio',
  },
  {
    id: 'MS-03',
    cantiereId: 'CNT-02',
    titolo: 'Termine Posa Moduli e Allaccio Cavo MT',
    dataPrevista: '2026-10-28',
    completata: false,
    tipo: 'collaudo',
  },
  {
    id: 'MS-04',
    cantiereId: 'CNT-03',
    titolo: 'Rilascio Dichiarazione di Conformità DM 37/08',
    dataPrevista: '2026-10-30',
    completata: false,
    tipo: 'consegna_dico',
  },
];

/**
 * ALGORITMO DI RILEVAMENTO CONFLITTI E OVERBOOKING
 * Identifica se una stessa persona, mezzo o piattaforma aerea PLE
 * è stata assegnata a due cantieri diversi in date sovrapposte.
 */
export function detectResourceConflicts(allocazioni: AllocazioneRisorsa[]): ConflittoRisorsa[] {
  const conflitti: ConflittoRisorsa[] = [];

  for (let i = 0; i < allocazioni.length; i++) {
    for (let j = i + 1; j < allocazioni.length; j++) {
      const a = allocazioni[i];
      const b = allocazioni[j];

      // Verifichiamo se si tratta della stessa risorsa fisica ma cantieri diversi
      if (a.risorsaId === b.risorsaId && a.cantiereId !== b.cantiereId) {
        // Controllo sovrapposizione date (intervalli [startA, endA] e [startB, endB])
        const startA = new Date(a.dataInizio).getTime();
        const endA = new Date(a.dataFine).getTime();
        const startB = new Date(b.dataInizio).getTime();
        const endB = new Date(b.dataFine).getTime();

        const isOverlapping = startA <= endB && startB <= endA;

        if (isOverlapping) {
          const overlapStart = new Date(Math.max(startA, startB)).toISOString().split('T')[0];
          const overlapEnd = new Date(Math.min(endA, endB)).toISOString().split('T')[0];

          let tipoLabel = 'La risorsa';
          if (a.tipoRisorsa === 'attrezzatura') tipoLabel = 'La piattaforma / attrezzatura';
          else if (a.tipoRisorsa === 'veicolo') tipoLabel = 'Il veicolo / mezzo aziendale';
          else if (a.tipoRisorsa === 'dipendente') tipoLabel = "L'operatore";

          conflitti.push({
            id: `CONF-${a.id}-${b.id}`,
            risorsaId: a.risorsaId,
            risorsaNome: a.risorsaNome,
            tipoRisorsa: a.tipoRisorsa,
            dataConflitto: `${overlapStart} ➔ ${overlapEnd}`,
            allocazioneA: {
              id: a.id,
              cantiereId: a.cantiereId,
              cantiereTitolo: a.cantiereTitolo,
              fase: a.faseDescrizione,
              orario: a.oraInizio ? `${a.oraInizio} - ${a.oraFine}` : undefined,
            },
            allocazioneB: {
              id: b.id,
              cantiereId: b.cantiereId,
              cantiereTitolo: b.cantiereTitolo,
              fase: b.faseDescrizione,
              orario: b.oraInizio ? `${b.oraInizio} - ${b.oraFine}` : undefined,
            },
            gravita: 'critico_overbooking',
            messaggio: `🚨 SOVRAPPOSIZIONE OVERBOOKING: ${tipoLabel} "${a.risorsaNome}" è richiesta in contemporanea sul cantiere "${a.cantiereTitolo}" e sul cantiere "${b.cantiereTitolo}" tra il ${overlapStart} e il ${overlapEnd}!`,
          });
        }
      }
    }
  }

  return conflitti;
}
