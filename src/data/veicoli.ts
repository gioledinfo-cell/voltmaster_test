import { Veicolo } from '../types';
import { RIFORNIMENTI } from './rifornimenti';

/**
 * 2. PARCO VEICOLI - Archivio Reale (Elenco_veicoli.csv)
 * Mappa: ID, Targa, Veicolo, Modello/Tipologia, Euro, Data_acquisto, Stato, Assegnato, Km_veicolo_Ultimo_Rifornimento, Data_Ultimo_Rifornimento, Note
 * Include collegamento automatico alla cronologia rifornimenti per Targa / ID_Veicolo.
 */
export const VEICOLI: Veicolo[] = [
  {
    id: 'VEI-01',
    targa: 'FJ482KN',
    veicolo: 'Iveco Daily 35C15 Cassonato con sponda',
    modello: 'Iveco Daily 35C15 Cassonato con sponda',
    modelloTipologia: 'Furgone Allestito con Scaffalatura e Generatore',
    euro: 'Euro 6D-Temp',
    dataAcquisto: '2021-04-10',
    stato: 'in_servizio',
    statoPowerApps: 'Attivo',
    assegnato: 'Marco Rossi',
    autistaAssegnatoNome: 'Marco Rossi',
    kmAttuali: 142500,
    kmUltimoRifornimento: 142500,
    dataUltimoRifornimento: '2026-03-28 17:30',
    scadenzaRevisione: '2026-11-30',
    scadenzaAssicurazione: '2027-02-28',
    scadenzaBollo: '2026-12-31',
    scadenzaTagliandoKm: 150000,
    qrCode: 'QR-VEC-FJ482KN',
    fotoUrl: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=600&q=80',
    note: 'Serbatoio 70L, revisione regolare a novembre. Dotato di generatore integrato.',
    storicoInterventi: [
      {
        data: '2026-01-20',
        tipo: 'tagliando',
        km: 135000,
        costo: 580,
        officina: 'Iveco Truck Service Milano',
      },
    ],
  },
  {
    id: 'VEI-02',
    targa: 'GG912TR',
    veicolo: 'Fiat Doblò Cargo Maxi 1.6 Multijet',
    modello: 'Fiat Doblò Cargo Maxi 1.6 Multijet',
    modelloTipologia: 'Officina Mobile Leggera & Interventi Rapidi',
    euro: 'Euro 6D-Final',
    dataAcquisto: '2022-07-15',
    stato: 'in_servizio',
    statoPowerApps: 'Attivo',
    assegnato: 'Andrea Bianchi',
    autistaAssegnatoNome: 'Andrea Bianchi',
    kmAttuali: 89300,
    kmUltimoRifornimento: 89300,
    dataUltimoRifornimento: '2026-03-29 08:15',
    scadenzaRevisione: '2027-05-31',
    scadenzaAssicurazione: '2026-10-15',
    scadenzaBollo: '2026-11-30',
    scadenzaTagliandoKm: 95000,
    qrCode: 'QR-VEC-GG912TR',
    fotoUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
    note: 'Portapacchi porta-scale omologato con blocco antifurto e kit cassettiere Würth.',
    storicoInterventi: [
      {
        data: '2025-10-12',
        tipo: 'gomme',
        km: 75000,
        costo: 420,
        officina: 'Pneus Expert Monza',
      },
    ],
  },
  {
    id: 'VEI-03',
    targa: 'FL334MM',
    veicolo: 'Ford Transit Custom 2.0 EcoBlue',
    modello: 'Ford Transit Custom 2.0 EcoBlue',
    modelloTipologia: 'Furgone Squadra Cablaggi & Rete Dati',
    euro: 'Euro 6',
    dataAcquisto: '2020-11-20',
    stato: 'in_servizio',
    statoPowerApps: 'Attivo',
    assegnato: 'Luca Ferrari',
    autistaAssegnatoNome: 'Luca Ferrari',
    kmAttuali: 119150,
    kmUltimoRifornimento: 119150,
    dataUltimoRifornimento: '2026-03-30 18:00',
    scadenzaRevisione: '2026-10-31',
    scadenzaAssicurazione: '2027-04-30',
    scadenzaBollo: '2026-12-31',
    scadenzaTagliandoKm: 130000,
    qrCode: 'QR-VEC-FL334MM',
    fotoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
    note: 'Inverter 230V 2000W di bordo per caricamento strumenti e fusione fibra.',
    storicoInterventi: [
      {
        data: '2026-02-18',
        tipo: 'tagliando',
        km: 110000,
        costo: 620,
        officina: 'Ford Commercial Center',
      },
    ],
  },
  {
    id: 'VEI-04',
    targa: 'GF105PT',
    veicolo: 'Renault Master 3.5t Pianale Ribassato',
    modello: 'Renault Master 3.5t Pianale Ribassato',
    modelloTipologia: 'Trasporto Bobine Cavi & Quadri Elettrici',
    euro: 'Euro 6D',
    dataAcquisto: '2023-03-05',
    stato: 'in_officina',
    statoPowerApps: 'In Manutenzione',
    assegnato: 'Roberto Esposito',
    autistaAssegnatoNome: 'Roberto Esposito',
    kmAttuali: 64150,
    kmUltimoRifornimento: 64150,
    dataUltimoRifornimento: '2026-03-24 16:45',
    scadenzaRevisione: '2027-03-31',
    scadenzaAssicurazione: '2027-01-31',
    scadenzaBollo: '2026-12-31',
    scadenzaTagliandoKm: 65000,
    qrCode: 'QR-VEC-GF105PT',
    fotoUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
    note: 'Tagliando e sostituzione pastiglie freni in corso presso Officina Autorizzata.',
    storicoInterventi: [
      {
        data: '2026-03-25',
        tipo: 'riparazione',
        km: 64150,
        costo: 780,
        officina: 'Officina Autorizzata Renault Trucks',
      },
    ],
  },
  {
    id: 'VEI-05',
    targa: 'EW876ZX',
    veicolo: 'Fiat Ducato Furgone 3.0 JTD',
    modello: 'Fiat Ducato Furgone 3.0 JTD',
    modelloTipologia: 'Furgone Scorta Muletto Cantiere',
    euro: 'Euro 5B',
    dataAcquisto: '2016-09-18',
    stato: 'fermo',
    statoPowerApps: 'Fermo',
    assegnato: 'Gianluca Gallo',
    autistaAssegnatoNome: 'Gianluca Gallo',
    kmAttuali: 215400,
    kmUltimoRifornimento: 215400,
    dataUltimoRifornimento: '2026-03-10 11:20',
    scadenzaRevisione: '2026-09-30',
    scadenzaAssicurazione: '2026-12-31',
    scadenzaBollo: '2026-10-31',
    scadenzaTagliandoKm: 220000,
    qrCode: 'QR-VEC-EW876ZX',
    fotoUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
    note: 'Fermo in piazzale per sostituzione kit frizione, in attesa fornitura ricambi.',
    storicoInterventi: [
      {
        data: '2025-11-04',
        tipo: 'tagliando',
        km: 205000,
        costo: 510,
        officina: 'Officina Meccanica F.lli Carli',
      },
    ],
  },
].map((v) => {
  // Collega i rifornimenti reali per Targa o ID_Veicolo
  const cronologia = RIFORNIMENTI.filter(
    (r) => r.idVeicolo === v.id || r.targa.replace(/\s+/g, '').toUpperCase() === v.targa.replace(/\s+/g, '').toUpperCase()
  ).sort((a, b) => new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime());

  const totaleLitri = cronologia.reduce((acc, r) => acc + r.quantitaLitri, 0);
  const tratteValide = cronologia.filter((r) => r.deltaKm !== undefined && r.deltaKm > 0);
  const totaleKm = tratteValide.reduce((acc, r) => acc + (r.deltaKm || 0), 0);

  const consumoMedioKmL =
    totaleKm > 0 && totaleLitri > 0
      ? parseFloat((totaleKm / totaleLitri).toFixed(2))
      : v.veicolo?.toLowerCase().includes('daily') ? 9.9 : 15.2;

  const consumoMedioL100Km = parseFloat((100 / consumoMedioKmL).toFixed(2));

  return {
    ...v,
    stato: v.stato as 'in_servizio' | 'in_officina' | 'fermo',
    storicoRifornimenti: cronologia,
    consumoMedioKmL,
    consumoMedioL100Km,
    totaleLitriErogati: parseFloat(totaleLitri.toFixed(1)),
  } as Veicolo;
});
