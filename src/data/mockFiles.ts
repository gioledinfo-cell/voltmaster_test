import { PreviewableFile } from '../types/preview';

export const INITIAL_PREVIEW_FILES: PreviewableFile[] = [
  // 1. FOTO CANTIERE (JPG/PNG)
  {
    id: 'file-img-1',
    nome: 'foto_quadro_generale_bt_01.jpg',
    tipo: 'jpg',
    dimensioneKb: 2450,
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
    dataCaricamento: '2026-09-28',
    autore: 'Matteo Bianchi (Capocantiere)',
    categoria: 'foto',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    isSensibile: false,
  },
  {
    id: 'file-img-2',
    nome: 'posa_cavi_fg16_passerelle.jpg',
    tipo: 'jpg',
    dimensioneKb: 1890,
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=400&q=80',
    dataCaricamento: '2026-09-27',
    autore: 'Davide Riva (Op. Specializzato)',
    categoria: 'foto',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    isSensibile: false,
  },
  {
    id: 'file-img-3',
    nome: 'installazione_moduli_fotovoltaici_tetto.jpg',
    tipo: 'jpg',
    dimensioneKb: 3120,
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    dataCaricamento: '2026-09-26',
    autore: 'Matteo Bianchi (Capocantiere)',
    categoria: 'foto',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    isSensibile: false,
  },
  {
    id: 'file-img-4',
    nome: 'centrale_termica_pompa_calore.jpg',
    tipo: 'jpg',
    dimensioneKb: 2100,
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    dataCaricamento: '2026-09-24',
    autore: 'Ing. Roberto Fontana',
    categoria: 'foto',
    cantiereId: 'cnt-2',
    cantiereNome: 'Riqualificazione Villa Bellavista',
  },

  // 2. DOCUMENTI PDF INTERATTIVI (POS, DURC, Schemi)
  {
    id: 'file-pdf-1',
    nome: 'POS_Piano_Operativo_Sicurezza_GreenTech_2026.pdf',
    tipo: 'pdf',
    dimensioneKb: 3840,
    url: '/docs/POS_GreenTech_2026.pdf',
    dataCaricamento: '2026-09-15',
    autore: 'Ing. Roberto Fontana (RSPP)',
    categoria: 'sicurezza',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    isSensibile: true,
    watermarkText: 'VOLTMASTER S.R.L. - DOCUMENTO RISERVATO CANTIERE',
    contentData: {
      pdfPages: [
        {
          pageNumber: 1,
          title: 'PIANO OPERATIVO DI SICUREZZA (POS) - D.LGS 81/2008 E S.M.I.',
          content: [
            'COMMITTENTE: GreenTech Logistics S.p.A. - Via Mecenate 84, Milano',
            'IMPRESA ESECUTRICE: VoltMaster Impianti S.r.l. - P.IVA IT 08234590154',
            'OGGETTO: Realizzazione impianto elettrico di potenza, quadro generale BT e fotovoltaico 120 kWp',
            'DATORE DI LAVORO: Marco Rossi · DIRETTORE TECNICO / RSPP: Ing. Roberto Fontana',
            'MEDICO COMPETENTE: Dott.ssa Elena Moretti · RLS: Matteo Bianchi',
            'DATA DI REDAZIONE: 15 Settembre 2026 · REVISIONE: 02 (Esecutiva)',
          ],
        },
        {
          pageNumber: 2,
          title: 'ORGANIZZAZIONE DEL CANTIERE E FASI OPERATIVE A RISCHIO',
          content: [
            'FASE 1: Allestimento cantiere, delimitazione aree di carico e deposito temporaneo materiali.',
            'FASE 2: Posa passerelle portacavi e tubazioni metalliche mediante uso di trabattello e PLE cestello 20m.',
            'FASE 3: Infilaggio cavi tipo FG16OR12 CPR Cca con argano elettrico trazionatore.',
            'FASE 4: Montaggio carpenteria Power Center 800A e serraggio connessioni a coppia dinamometrica.',
            'MISURE DI PREVENZIONE: Obbligo DPI 3° cat. per lavori in quota, guanti dielettrici 1000V, calzature S3.',
          ],
        },
        {
          pageNumber: 3,
          title: 'GESTIONE DELLE EMERGENZE E COORDINAMENTO PRIMO SOCCORSO',
          content: [
            'ADDETTI PRIMO SOCCORSO NOMINATI: Matteo Bianchi (Patentino B/C), Davide Riva.',
            'ADDETTI ANTINCENDIO RISCHIO MEDIO: Gabriele Colombo, Manuel Barone.',
            'PRESIDI SANITARI: Cassetta pronto soccorso allegato 1 presente su Daily aziendale targa GA 442 PL.',
            'OSPEDALE DI RIFERIMENTO: Ospedale Maggiore Policlinico Milano - Tel. 112 / Pronto Soccorso.',
            'PUNTO DI RITROVO IN CASO DI EVACUAZIONE: Piazzale Nord stalli di sosta 1-10.',
          ],
        },
        {
          pageNumber: 4,
          title: 'ATTESTATI DI FORMAZIONE, VISITE MEDICHE E FIRME DI CONFORMITÀ',
          content: [
            'Lavoratori abilitati PES/PAV CEI 11-27: n. 6 tecnici con idoneità sanitaria in corso di validità.',
            'Abilitazione uso Piattaforme Aeree PLE (con e senza stabilizzatori): Matteo Bianchi, Davide Riva.',
            'Conformità macchinari e verifiche periodiche: conformi all’Allegato VI D.Lgs 81/08.',
            'TIMBRO E FIRMA DIGITALE RSPP: Ing. Roberto Fontana [Certificato InfoCert n. 8839210-IT]',
          ],
        },
      ],
    },
  },
  {
    id: 'file-pdf-2',
    nome: 'DURC_Online_Regolarita_Contributiva_Valido.pdf',
    tipo: 'pdf',
    dimensioneKb: 420,
    url: '/docs/DURC_VoltMaster_2026.pdf',
    dataCaricamento: '2026-09-01',
    autore: 'Amministrazione VoltMaster',
    categoria: 'certificazioni',
    contentData: {
      pdfPages: [
        {
          pageNumber: 1,
          title: 'DOCUMENTO UNICO DI REGOLARITÀ CONTRIBUTIVA (DURC ONLINE)',
          content: [
            'Numero Protocollo INPS_41892019 · Scadenza Validità: 28 Dicembre 2026',
            'Denominazione: VOLTMASTER IMPIANTI S.R.L. · C.F. / P.IVA: IT 08234590154',
            'Sede legale: Via dell’Elettricità 15 - 20128 Milano (MI)',
            'Posizione INPS matricola: 4920194821 - Regolare ai fini contributivi',
            'Posizione INAIL codice ditta: 18920194 - Assicurazione contro infortuni regolare',
            'Cassa Edile Milano: Iscrizione n. 091823 - Regolarità accertata senza pendenze',
            'Esito: REGOLARE - Documento emesso ai sensi dell’art. 4 D.M. 30/01/2015',
          ],
        },
      ],
    },
  },
  {
    id: 'file-pdf-3',
    nome: 'Schema_Unifilare_Quadro_Generale_QG_BT.pdf',
    tipo: 'pdf',
    dimensioneKb: 5200,
    url: '/docs/schema_unifilare_qg.pdf',
    dataCaricamento: '2026-09-22',
    autore: 'Ing. Roberto Fontana',
    categoria: 'permessi',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    contentData: {
      pdfPages: [
        {
          pageNumber: 1,
          title: 'SCHEMA ELETTRICO UNIFILARE GENERALE - CABINA BT 400V 800A',
          content: [
            'Linea Arrivo MT/BT: Trasformatore in resina 15kV / 400V 630kVA',
            'Interruttore Generale: Sezionatore sotto carico con relè differenziale toroidale classe B 300mA',
            'Partenza Q-LAV (Reparto Lavorazione): Cavo FG16 3x(1x185) + 1x95 mm²',
            'Partenza Q-FV (Inverter Fotovoltaico): Interruttore scatolato 4x250A curva C',
            'Partenza Q-EV (Colonnine Ricarica): Interruttore 4x160A con sgancio di emergenza',
          ],
        },
        {
          pageNumber: 2,
          title: 'TABELLA DEI CONDUTTORI E COORDINAMENTO PROTEZIONI I²t',
          content: [
            'Verifica della caduta di tensione massima a pieno carico: 1.84% (limite normativo CEI 64-8: 4%)',
            'Corrente di corto circuito presunta Icu a fondo quadro: 36 kA',
            'Verifica sovratemperatura quadro secondo norma CEI EN 61439-1/2: ΔTmax = 28°C con ventilazione forzata',
          ],
        },
      ],
    },
  },

  // 3. FOGLI DI CALCOLO EXCEL (XLSX / CSV)
  {
    id: 'file-xlsx-1',
    nome: 'Computo_Metrico_Contabilita_Lavori_GreenTech.xlsx',
    tipo: 'xlsx',
    dimensioneKb: 1540,
    url: '/docs/computo_greentech.xlsx',
    dataCaricamento: '2026-09-25',
    autore: 'Ufficio Tecnico',
    categoria: 'contratti',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    contentData: {
      sheetData: [
        {
          sheetName: 'SAL N. 2 - Settembre',
          headers: ['Articolo', 'Descrizione Lavorazione', 'U.M.', 'Q.tà Prevista', 'Q.tà Eseguita', 'Prezzo Unit.', 'Totale Netto'],
          rows: [
            ['1.01', 'Canalina metallica zincata 200x60mm compresa posa e staffaggi', 'm', 350, 320, 28.50, 9120.00],
            ['1.02', 'Cavo FG16OR12 5G16 mm² CPR posato in opera compreso collegamenti', 'm', 500, 480, 16.20, 7776.00],
            ['1.03', 'Carpenteria Power Center 800A Schneider con montaggio barre', 'cad', 1, 1, 4800.00, 4800.00],
            ['1.04', 'Inverter trifase 50kW Huawei SUN2000 con configurazione 4G', 'cad', 2, 2, 3850.00, 7700.00],
            ['1.05', 'Moduli fotovoltaici bifacciali 550W installati su struttura tetto', 'cad', 160, 140, 185.00, 25900.00],
            ['1.06', 'Stazioni Wallbox 22kW con display e autorizzazione RFID', 'cad', 4, 3, 2650.00, 7950.00],
            ['1.07', 'Collaudo strumentale con report CEI 64-8 e misura terra', 'a corpo', 1, 0.5, 1800.00, 900.00],
          ],
        },
        {
          sheetName: 'Riepilogo Costi & Margini',
          headers: ['Categoria Costo', 'Budget Iniziale', 'Consuntivo Attuale', 'Scostamento (€)', 'Margine %'],
          rows: [
            ['Materiali Principali', 68000, 62450, -5550, '+8.1%'],
            ['Attrezzature e Noli Mezzi', 8500, 7100, -1400, '+16.4%'],
            ['Manodopera Specializzata (Ore)', 34000, 31200, -2800, '+8.2%'],
            ['Spese Generali & Sicurezza', 7500, 6900, -600, '+8.0%'],
            ['TOTALE COMMESSA', 118000, 107650, -10350, '+8.7%'],
          ],
        },
      ],
    },
  },

  // 4. DOCUMENTI WORD (DOCX)
  {
    id: 'file-docx-1',
    nome: 'Verbale_Consegna_Aree_Inizio_Lavori.docx',
    tipo: 'docx',
    dimensioneKb: 890,
    url: '/docs/verbale_consegna.docx',
    dataCaricamento: '2026-08-10',
    autore: 'Geom. Ferri (Direttore Lavori)',
    categoria: 'contratti',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    contentData: {
      docxData: {
        title: 'VERBALE DI CONSEGNA DELLE AREE E AVVIO DEI LAVORI DI CANTIERE',
        sections: [
          {
            heading: '1. Premessa e Identificazione delle Parti',
            paragraphs: [
              'L’anno 2026, il giorno 10 del mese di Agosto, presso la sede di GreenTech Logistics sita in Via Mecenate 84 a Milano.',
              'Sono presenti il Direttore dei Lavori Geom. Antonio Ferri, il Committente Dott.ssa Laura Valenti e per l’Appaltatore VoltMaster Impianti il Direttore Tecnico Ing. Roberto Fontana.',
            ],
          },
          {
            heading: '2. Stato dei Luoghi e Accesso dei Mezzi',
            paragraphs: [
              'Il Direttore dei Lavori dichiara le aree di cantiere libere da persone estranee e pronte all’allestimento.',
              'Viene autorizzato l’accesso quotidiano dei furgoni operativi VoltMaster tramite cancello carraio Est previo badge elettronico.',
              'L’appaltatore prende in carico le chiavi di accesso al locale quadri e al tetto piano per la posa dei moduli FV.',
            ],
          },
          {
            heading: '3. Prescrizioni di Sicurezza e Orari',
            paragraphs: [
              'Le lavorazioni con generazione di rumore superiore a 80 dB(A) sono consentite esclusivamente nelle fasce 08:30-12:30 e 14:00-18:00.',
              'L’appaltatore garantisce la presenza costante in cantiere del Capocantiere Matteo Bianchi con funzione di Preposto D.Lgs 81/08.',
            ],
          },
        ],
      },
    },
  },

  // 5. PRESENTAZIONI OFFICE (PPTX)
  {
    id: 'file-pptx-1',
    nome: 'Corso_Formazione_Rischio_Elettrico_PES_PAV.pptx',
    tipo: 'pptx',
    dimensioneKb: 4800,
    url: '/docs/corso_pes_pav.pptx',
    dataCaricamento: '2026-09-02',
    autore: 'Formatore Certificato CEI',
    categoria: 'sicurezza',
    contentData: {
      docxData: {
        title: 'FORMAZIONE ALLA SICUREZZA NEI LAVORI ELETTRICI (NORMA CEI 11-27)',
        sections: [
          {
            heading: 'Slide 1: Definizioni e Ruoli Chiave',
            paragraphs: [
              'URI (Unità Responsabile dell’Impianto) e URL (Unità Responsabile del Lavoro).',
              'Differenza operativa tra Persona Esperta (PES), Persona Avvertita (PAV) e Persona Comune (PEC).',
            ],
          },
          {
            heading: 'Slide 2: Le 5 Regole d’Oro per i Lavori Fuori Tensione',
            paragraphs: [
              '1. Sezionare e isolare completamente la parte di impianto interessata.',
              '2. Assicurare contro le richiusure intempestive (Lockout/Tagout).',
              '3. Verificare l’assenza reale di tensione con rilevatore ottico-acustico conforme.',
              '4. Mettere a terra e in cortocircuito i conduttori.',
              '5. Provvedere alla protezione e delimitazione contro parti adiacenti in tensione.',
            ],
          },
        ],
      },
    },
  },

  // 6. FILE DI TESTO, LOG E CONFIGURAZIONI (TXT / LOG / JSON)
  {
    id: 'file-log-1',
    nome: 'report_collaudo_strumentale_rele_bt.log',
    tipo: 'log',
    dimensioneKb: 48,
    url: '/docs/report_rele.log',
    dataCaricamento: '2026-09-29',
    autore: 'Strumento Multifunzione Asita AS-9942',
    categoria: 'certificazioni',
    contentData: {
      textContent: `[2026-09-29 14:15:02] INFO: Inizio procedura automatica test sganciatori interruttore QG-01
[2026-09-29 14:15:10] TEST CONTINUITA CONDUTTORI DI PROTEZIONE (CEI 64-8/6):
  - Nodo Terra Principale -> Quadro Generale: R = 0.04 Ohm (PASS - limite < 0.1 Ohm)
  - Quadro Generale -> Struttura Carpenteria: R = 0.02 Ohm (PASS)
[2026-09-29 14:16:30] MISURA RESISTENZA DI ISOLAMENTO A 500V DC:
  - Fase R -> Terra: R_iso = >999 MOhm (PASS - limite > 1.0 MOhm)
  - Fase S -> Terra: R_iso = >999 MOhm (PASS - limite > 1.0 MOhm)
  - Fase T -> Terra: R_iso = >999 MOhm (PASS - limite > 1.0 MOhm)
  - Neutro N -> Terra: R_iso = 840 MOhm (PASS - limite > 1.0 MOhm)
[2026-09-29 14:18:44] PROVA DIFFERENZIALE TOROIDALE (Idn = 300mA - Tipo B):
  - Prova 1x Idn (300mA - 0°): Tempo sgancio = 28 ms (PASS - limite < 300 ms)
  - Prova 1x Idn (300mA - 180°): Tempo sgancio = 26 ms (PASS - limite < 300 ms)
  - Prova 5x Idn (1500mA): Tempo sgancio = 14 ms (PASS - limite < 40 ms)
  - Tensione di contatto presunta Ut: 4.8 Volt (PASS - limite < 50V)
[2026-09-29 14:20:15] ESITO COLLAUDO GENERALE: IDONEO AL SERVIZIO SECONDO CEI 64-8`,
    },
  },
  {
    id: 'file-json-1',
    nome: 'configurazione_indirizzi_knx_villa_bellavista.json',
    tipo: 'json',
    dimensioneKb: 34,
    url: '/docs/knx_config.json',
    dataCaricamento: '2026-09-18',
    autore: 'Davide Riva',
    categoria: 'altro',
    cantiereId: 'cnt-2',
    cantiereNome: 'Riqualificazione Villa Bellavista',
    contentData: {
      textContent: JSON.stringify(
        {
          progetto: 'Villa Bellavista - Domotica KNX ETS6',
          dataConfigurazione: '2026-09-18',
          lineaBus: '1.1 (Dorsale Interna TP)',
          dispositivi: [
            {
              indirizzoFisico: '1.1.1',
              nome: 'Alimentatore Bus 640mA con bobina integrata',
              modello: 'Hager TXA112',
            },
            {
              indirizzoFisico: '1.1.2',
              nome: 'Attuatore Dimmer LED 8 canali 300W',
              modello: 'ABB UD/S 8.300.2',
              canali: [
                { id: 'CH1', nome: 'Luce Soggiorno Dimmerabile', gruppo: '0/1/1' },
                { id: 'CH2', nome: 'Luce Cucina Penisola', gruppo: '0/1/2' },
                { id: 'CH3', nome: 'Spot Giardino LED RGB', gruppo: '0/2/1' },
              ],
            },
            {
              indirizzoFisico: '1.1.3',
              nome: 'Tastierino Touch Vetro 4 canali Master',
              modello: 'Ekinex FF Series',
              termostatoIntegrato: true,
              temperaturaTarget: 21.5,
            },
          ],
        },
        null,
        2
      ),
    },
  },

  // 7. VIDEO CANTIERE (MP4 / WEBM)
  {
    id: 'file-video-1',
    nome: 'ispezione_drone_tetto_e_strutture_fv.mp4',
    tipo: 'mp4',
    dimensioneKb: 18400,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    dataCaricamento: '2026-09-27',
    autore: 'Ing. Roberto Fontana (Pilota Drone ENAC)',
    categoria: 'foto',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    contentData: {
      durationSeconds: 15,
    },
  },

  // 8. AUDIO NOTA VOCALE (MP3)
  {
    id: 'file-audio-1',
    nome: 'nota_vocale_capocantiere_aggiornamento_sal.mp3',
    tipo: 'mp3',
    dimensioneKb: 1200,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    dataCaricamento: '2026-09-29',
    autore: 'Matteo Bianchi (Capocantiere)',
    categoria: 'altro',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
    contentData: {
      durationSeconds: 30,
    },
  },

  // 9. FORMATO NON SUPPORTATO PER TESTARE IL FALLBACK (DWG AUTOCAD)
  {
    id: 'file-dwg-1',
    nome: 'planimetria_esecutiva_cad_passaggi_cavi.dwg',
    tipo: 'dwg',
    dimensioneKb: 14200,
    url: '/docs/planimetria.dwg',
    dataCaricamento: '2026-09-10',
    autore: 'Studio Progettazione Elettrica',
    categoria: 'permessi',
    cantiereId: 'cnt-1',
    cantiereNome: 'Nuovo Impianto Industriale GreenTech',
  },
];
