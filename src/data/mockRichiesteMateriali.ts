import { RichiestaMateriali } from '../types/richiestaMateriali';

export const INITIAL_RICHIESTE_MATERIALI: RichiestaMateriali[] = [
  {
    id: 'RMC-001',
    numero: 'RMC-2026-001',
    dataRichiesta: '2026-10-05 08:15',
    cantiereId: 'CNT-01',
    cantiereTitolo: 'Ospedale San Luca - Adeguamento Quadro MT/BT',
    clienteNome: 'Azienda Sanitaria Locale ASL 2',
    indirizzoConsegna: 'Via Ospedale 45, Milano (MI) - Accesso Cabina MT Blocco C',
    richiedenteId: 'DIP-04',
    richiedenteNome: 'Roberto Ferri',
    richiedenteRuolo: 'Capocantiere Elettrico (PES/PAV)',
    richiedenteTelefono: '+39 348 7654321',
    priorita: 'bloccante_fermo_cantiere',
    dataPrevistaConsegna: '2026-10-05',
    orarioPreferito: 'Urgente - Entro le 11:30',
    stato: 'in_preparazione',
    noteCantiere: 'Intervento cabina previsto per le 12:00 durante fermo programmato reparto. Necessario cavo FG16OR16 e pressacavi a tenuta.',
    righe: [
      {
        id: 'RIGA-001-1',
        tipo: 'materiale',
        articoloId: 'MAT-001',
        codice: 'CV-FG16-4G16',
        descrizione: 'Cavo Bassa Tensione FG16OR16 4G16 mm² antifiamma CPR Cca',
        quantitaRichiesta: 75,
        unitaMisura: 'metri',
        quantitaDisponibileMagazzino: 320,
        quantitaApprontata: 75,
        note: 'Bobina integra o spezzone unico per passerella'
      },
      {
        id: 'RIGA-001-2',
        tipo: 'materiale',
        articoloId: 'MAT-008',
        codice: 'PRESS-M32',
        descrizione: 'Pressacavi in ottone nichelato IP68 filetto metrico M32 con controdado',
        quantitaRichiesta: 8,
        unitaMisura: 'pezzi',
        quantitaDisponibileMagazzino: 45,
        quantitaApprontata: 8
      },
      {
        id: 'RIGA-001-3',
        tipo: 'attrezzatura',
        articoloId: 'ATT-02',
        codice: 'EQ-CRIMP-HYDR',
        descrizione: 'Pinza Crimpatrice Idraulica a Batteria per capicorda 10-240 mm² con matrici',
        quantitaRichiesta: 1,
        unitaMisura: 'kit',
        quantitaDisponibileMagazzino: 1,
        quantitaApprontata: 1,
        note: 'Verificare carica batterie al litio'
      }
    ],
    notifica: {
      canale: 'push_e_email',
      destinatarioMagazzino: 'Marco Villa (Resp. Magazzino & Logistica)',
      emailDestinatario: 'magazzino@voltmaster.it',
      inviatoIl: '2026-10-05 08:15:32',
      pushInviata: true,
      emailInviata: true
    },
    preparataDa: 'Marco Villa',
    dataPreparazione: '2026-10-05 08:40'
  },
  {
    id: 'RMC-002',
    numero: 'RMC-2026-002',
    dataRichiesta: '2026-10-05 09:30',
    cantiereId: 'CNT-02',
    cantiereTitolo: 'Stabilimento F.lli Bianchi - Impianto FV 150 kWp',
    clienteNome: 'F.lli Bianchi Manifatture S.p.A.',
    indirizzoConsegna: 'Via Industria 12, Monza (MB) - Ingresso Cancello 3 Magazzino Merci',
    richiedenteId: 'DIP-05',
    richiedenteNome: 'Davide Moretti',
    richiedenteRuolo: 'Elettricista Specializzato Impianti FV',
    richiedenteTelefono: '+39 347 1122334',
    priorita: 'urgente',
    dataPrevistaConsegna: '2026-10-06',
    orarioPreferito: 'Mattina ore 08:00',
    stato: 'inviata',
    noteCantiere: 'Inizio posa stringhe falda sud. Servono i connettori solari e le canaline asolate zincate.',
    righe: [
      {
        id: 'RIGA-002-1',
        tipo: 'materiale',
        articoloId: 'MAT-003',
        codice: 'SOL-CONN-MC4',
        descrizione: 'Coppia Connettori Rapidi Fotovoltaico MC4 Maschio/Femmina 1500V IP68',
        quantitaRichiesta: 60,
        unitaMisura: 'coppie',
        quantitaDisponibileMagazzino: 140,
        quantitaApprontata: 0
      },
      {
        id: 'RIGA-002-2',
        tipo: 'materiale',
        articoloId: 'MAT-004',
        codice: 'CAN-ZN-100',
        descrizione: 'Canalina metallica forata zincata a caldo 100x50 mm L=3m con coperchio',
        quantitaRichiesta: 15,
        unitaMisura: 'barre da 3m',
        quantitaDisponibileMagazzino: 28,
        quantitaApprontata: 0
      },
      {
        id: 'RIGA-002-3',
        tipo: 'attrezzatura',
        articoloId: 'ATT-05',
        codice: 'EQ-LINEA-VITA',
        descrizione: 'Kit Dispositivi Anticaduta e Imbracature EN 361 con arrotolatore 10m',
        quantitaRichiesta: 2,
        unitaMisura: 'kit',
        quantitaDisponibileMagazzino: 4,
        quantitaApprontata: 0,
        note: 'Obbligatorio per lavoro su copertura'
      }
    ],
    notifica: {
      canale: 'push_e_email',
      destinatarioMagazzino: 'Marco Villa (Resp. Magazzino & Logistica)',
      emailDestinatario: 'magazzino@voltmaster.it',
      inviatoIl: '2026-10-05 09:30:14',
      pushInviata: true,
      emailInviata: true
    }
  },
  {
    id: 'RMC-003',
    numero: 'RMC-2026-003',
    dataRichiesta: '2026-10-04 14:20',
    cantiereId: 'CNT-03',
    cantiereTitolo: 'Residenza Le Palme - Impianto Domotico & Smart Meter',
    clienteNome: 'Immobiliare Riviera S.r.l.',
    indirizzoConsegna: 'Corso Sempione 88, Milano (MI)',
    richiedenteId: 'DIP-06',
    richiedenteNome: 'Simone Galli',
    richiedenteRuolo: 'Tecnico Domotica & Cablaggio Strutturato',
    richiedenteTelefono: '+39 339 5566778',
    priorita: 'normale',
    dataPrevistaConsegna: '2026-10-05',
    orarioPreferito: 'Pomeriggio',
    stato: 'ddt_emesso',
    noteCantiere: 'Materiale spedito regolarmente questa mattina con furgone Fiat Doblò aziendale.',
    righe: [
      {
        id: 'RIGA-003-1',
        tipo: 'materiale',
        articoloId: 'MAT-002',
        codice: 'MOD-DIFF-MAGNETO',
        descrizione: 'Interruttore Magnetotermico Differenziale 1P+N 16A 30mA Tipo A 4.5kA',
        quantitaRichiesta: 12,
        unitaMisura: 'pezzi',
        quantitaDisponibileMagazzino: 85,
        quantitaApprontata: 12
      },
      {
        id: 'RIGA-003-2',
        tipo: 'materiale',
        articoloId: 'MAT-005',
        codice: 'REL-KNX-8CH',
        descrizione: 'Modulo Attuatore Relè KNX 8 Canali 16A con comando manuale locale',
        quantitaRichiesta: 3,
        unitaMisura: 'pezzi',
        quantitaDisponibileMagazzino: 6,
        quantitaApprontata: 3
      }
    ],
    notifica: {
      canale: 'push_e_email',
      destinatarioMagazzino: 'Marco Villa (Resp. Magazzino & Logistica)',
      emailDestinatario: 'magazzino@voltmaster.it',
      inviatoIl: '2026-10-04 14:20:00',
      pushInviata: true,
      emailInviata: true
    },
    ddtCollegatoId: 'DDT-001',
    ddtCollegatoNumero: 'DDT-2026-001',
    preparataDa: 'Marco Villa',
    dataPreparazione: '2026-10-04 16:30'
  }
];
