import {
  DipendentePA,
  VeicoloPA,
  AttrezzaturaPA,
  DepositoPA,
  CantierePA,
  RifornimentoPA,
  CaricoCarburantePA,
  CsvDatasetType,
  RifornimentoCalcolato,
  VeicoloEnriched,
  AttrezzaturaEnriched,
  CantierePAEnriched,
  PowerAppsKpis,
} from '../types/powerApps';
import {
  INITIAL_DIPENDENTI_PA,
  INITIAL_VEICOLI_PA,
  INITIAL_ATTREZZATURA_PA,
  INITIAL_DEPOSITI_PA,
  INITIAL_CANTIERI_PA,
  INITIAL_RIFORNIMENTI_PA,
  INITIAL_CARICHI_CARBURANTE_PA,
} from '../data/mockPowerAppsData';

const STORAGE_PREFIX = 'powerapps_csv_v1_';

export interface PowerAppsStoreData {
  dipendenti: DipendentePA[];
  veicoli: VeicoloPA[];
  attrezzature: AttrezzaturaPA[];
  depositi: DepositoPA[];
  cantieri: CantierePA[];
  rifornimenti: RifornimentoPA[];
  carichi_carburante: CaricoCarburantePA[];
  lastUpdated: string;
}

/**
 * Loads dataset from localStorage with fallback to initial mock data
 */
export function loadPowerAppsData(): PowerAppsStoreData {
  try {
    const rawDip = localStorage.getItem(STORAGE_PREFIX + 'dipendenti');
    const rawVei = localStorage.getItem(STORAGE_PREFIX + 'veicoli');
    const rawAtt = localStorage.getItem(STORAGE_PREFIX + 'attrezzature');
    const rawDep = localStorage.getItem(STORAGE_PREFIX + 'depositi');
    const rawCnt = localStorage.getItem(STORAGE_PREFIX + 'cantieri');
    const rawRif = localStorage.getItem(STORAGE_PREFIX + 'rifornimenti');
    const rawCar = localStorage.getItem(STORAGE_PREFIX + 'carichi_carburante');
    const lastUp = localStorage.getItem(STORAGE_PREFIX + 'lastUpdated') || new Date().toISOString();

    return {
      dipendenti: rawDip ? JSON.parse(rawDip) : INITIAL_DIPENDENTI_PA,
      veicoli: rawVei ? JSON.parse(rawVei) : INITIAL_VEICOLI_PA,
      attrezzature: rawAtt ? JSON.parse(rawAtt) : INITIAL_ATTREZZATURA_PA,
      depositi: rawDep ? JSON.parse(rawDep) : INITIAL_DEPOSITI_PA,
      cantieri: rawCnt ? JSON.parse(rawCnt) : INITIAL_CANTIERI_PA,
      rifornimenti: rawRif ? JSON.parse(rawRif) : INITIAL_RIFORNIMENTI_PA,
      carichi_carburante: rawCar ? JSON.parse(rawCar) : INITIAL_CARICHI_CARBURANTE_PA,
      lastUpdated: lastUp,
    };
  } catch (err) {
    console.error('Error loading PowerApps data from localStorage:', err);
    return {
      dipendenti: INITIAL_DIPENDENTI_PA,
      veicoli: INITIAL_VEICOLI_PA,
      attrezzature: INITIAL_ATTREZZATURA_PA,
      depositi: INITIAL_DEPOSITI_PA,
      cantieri: INITIAL_CANTIERI_PA,
      rifornimenti: INITIAL_RIFORNIMENTI_PA,
      carichi_carburante: INITIAL_CARICHI_CARBURANTE_PA,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Persists all PowerApps datasets to storage
 */
export function savePowerAppsData(data: Partial<PowerAppsStoreData>): void {
  try {
    const keys: CsvDatasetType[] = [
      'dipendenti',
      'veicoli',
      'attrezzature',
      'depositi',
      'cantieri',
      'rifornimenti',
      'carichi_carburante',
    ];

    keys.forEach((key) => {
      if (data[key] !== undefined) {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data[key]));
      }
    });

    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_PREFIX + 'lastUpdated', now);
  } catch (err) {
    console.error('Failed to save PowerApps data to localStorage:', err);
  }
}

/**
 * Resets storage to initial demo state
 */
export function resetPowerAppsData(): PowerAppsStoreData {
  const initialData: PowerAppsStoreData = {
    dipendenti: INITIAL_DIPENDENTI_PA,
    veicoli: INITIAL_VEICOLI_PA,
    attrezzature: INITIAL_ATTREZZATURA_PA,
    depositi: INITIAL_DEPOSITI_PA,
    cantieri: INITIAL_CANTIERI_PA,
    rifornimenti: INITIAL_RIFORNIMENTI_PA,
    carichi_carburante: INITIAL_CARICHI_CARBURANTE_PA,
    lastUpdated: new Date().toISOString(),
  };

  savePowerAppsData(initialData);
  return initialData;
}

// ========================================================
// RELATIONAL LINKING & CONSUMPTION CALCULATION ENGINE
// ========================================================

/**
 * Finds employee by loose identifier matching (name, surname, full name, matricola, or email)
 */
export function findDipendente(
  identifier: string | undefined,
  dipendenti: DipendentePA[]
): DipendentePA | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  return dipendenti.find((d) => {
    const fullName = `${d.Title} ${d.Cognome}`.toLowerCase();
    const reverseFullName = `${d.Cognome} ${d.Title}`.toLowerCase();
    return (
      d.Matricola.toLowerCase() === clean ||
      fullName === clean ||
      reverseFullName === clean ||
      d.Title.toLowerCase() === clean ||
      d.Cognome.toLowerCase() === clean ||
      (d.Operatore_Microsoft && d.Operatore_Microsoft.toLowerCase() === clean)
    );
  });
}

/**
 * Enriches and calculates consumption metrics for fuelings & fleet
 */
export function computeRelationalData(data: PowerAppsStoreData) {
  const { dipendenti, veicoli, attrezzature, depositi, cantieri, rifornimenti, carichi_carburante } = data;

  // 1. Process and link Rifornimenti with consumption
  // Group fuelings by vehicle to compute sequential delta Km
  const rifornimentiByVehicle = new Map<string, RifornimentoPA[]>();
  rifornimenti.forEach((r) => {
    const key = r.ID_Veicolo || r.Targa;
    if (!rifornimentiByVehicle.has(key)) {
      rifornimentiByVehicle.set(key, []);
    }
    rifornimentiByVehicle.get(key)!.push(r);
  });

  const rifornimentiCalcolatiMap = new Map<string, RifornimentoCalcolato>();

  rifornimentiByVehicle.forEach((vRifs) => {
    // Sort chronologically ascending
    const sorted = [...vRifs].sort((a, b) => {
      const dateA = new Date(a['Data/ora creazione']).getTime();
      const dateB = new Date(b['Data/ora creazione']).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateA - dateB;
      }
      return a.Km_veicolo - b.Km_veicolo;
    });

    sorted.forEach((rif, idx) => {
      const prevRif = idx > 0 ? sorted[idx - 1] : undefined;
      let deltaKm: number | undefined = undefined;
      let consumoKmL: number | undefined = undefined;
      let consumoL100Km: number | undefined = undefined;

      if (prevRif && rif.Km_veicolo > prevRif.Km_veicolo) {
        deltaKm = rif.Km_veicolo - prevRif.Km_veicolo;
        if (rif.Quantità_litri > 0) {
          consumoKmL = parseFloat((deltaKm / rif.Quantità_litri).toFixed(2));
          consumoL100Km = parseFloat(((rif.Quantità_litri / deltaKm) * 100).toFixed(2));
        }
      }

      const opDip = findDipendente(rif.Operatore, dipendenti);
      const matchedVeicolo = veicoli.find((v) => v.ID === rif.ID_Veicolo || v.Targa === rif.Targa);

      rifornimentiCalcolatiMap.set(rif.ID, {
        ...rif,
        deltaKm,
        consumoKmL,
        consumoL100Km,
        operatoreDipendente: opDip,
        veicoloRif: matchedVeicolo,
      });
    });
  });

  // Preserve original ordering or sort descending by date for display
  const allRifornimentiCalcolati: RifornimentoCalcolato[] = rifornimenti
    .map((r) => rifornimentiCalcolatiMap.get(r.ID) || {
      ...r,
      operatoreDipendente: findDipendente(r.Operatore, dipendenti),
      veicoloRif: veicoli.find((v) => v.ID === r.ID_Veicolo || v.Targa === r.Targa),
    })
    .sort((a, b) => new Date(b['Data/ora creazione']).getTime() - new Date(a['Data/ora creazione']).getTime());

  // 2. Enrich Veicoli
  const veicoliEnriched: VeicoloEnriched[] = veicoli.map((v) => {
    const autista = findDipendente(v.Assegnato, dipendenti);
    const vehicleRifs = allRifornimentiCalcolati.filter(
      (r) => r.ID_Veicolo === v.ID || r.Targa.toLowerCase() === v.Targa.toLowerCase()
    );

    const totaleLitri = vehicleRifs.reduce((sum, r) => sum + (r.Quantità_litri || 0), 0);
    const validDeltas = vehicleRifs.filter((r) => r.deltaKm !== undefined && r.deltaKm > 0);
    const kmPercorsiTracciati = validDeltas.reduce((sum, r) => sum + (r.deltaKm || 0), 0);

    let consumoMedioKmL = 0;
    let consumoMedioL100Km = 0;

    if (kmPercorsiTracciati > 0 && totaleLitri > 0) {
      consumoMedioKmL = parseFloat((kmPercorsiTracciati / totaleLitri).toFixed(2));
      consumoMedioL100Km = parseFloat(((totaleLitri / kmPercorsiTracciati) * 100).toFixed(2));
    } else {
      // Estimated based on vehicle type
      consumoMedioKmL = v.Veicolo.toLowerCase().includes('daily') ? 9.8 : 15.2;
      consumoMedioL100Km = parseFloat((100 / consumoMedioKmL).toFixed(2));
    }

    return {
      ...v,
      autistaDipendente: autista,
      storicoRifornimenti: vehicleRifs,
      totaleLitriErogati: parseFloat(totaleLitri.toFixed(1)),
      kmPercorsiTotaliTracciati: kmPercorsiTracciati,
      consumoMedioKmL,
      consumoMedioL100Km,
      ultimoRifornimento: vehicleRifs[0], // Most recent
    };
  });

  // 3. Enrich Attrezzature with Posizione linking (Depositi & Cantieri) & Scadenze
  const now = new Date();
  const attrezzatureEnriched: AttrezzaturaEnriched[] = attrezzature.map((att) => {
    // Link Posizione to Deposito or Cantiere
    const pos = (att.Posizione || '').trim().toLowerCase();
    const deposito = depositi.find((d) => d.Titolo.toLowerCase() === pos || d.Tecno_Codice.toLowerCase() === pos);
    const cantiere = cantieri.find(
      (c) =>
        c.CANTIERE.toLowerCase() === pos ||
        c.COD_CANTIERE.toLowerCase() === pos ||
        c.CANTIERE.toLowerCase().includes(pos) ||
        pos.includes(c.COD_CANTIERE.toLowerCase())
    );

    const operatore = findDipendente(att['Oper. Responsabi'], dipendenti);

    // Days to maintenance
    let isManutenzioneScaduta = false;
    let isManutenzioneInScadenza = false;
    let giorniAllaManutenzione = 999;

    if (att.Data_Manutezione) {
      const dMan = new Date(att.Data_Manutezione);
      if (!isNaN(dMan.getTime())) {
        const diffTime = dMan.getTime() - now.getTime();
        giorniAllaManutenzione = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (giorniAllaManutenzione < 0) {
          isManutenzioneScaduta = true;
        } else if (giorniAllaManutenzione <= 30) {
          isManutenzioneInScadenza = true;
        }
      }
    }

    // Days to warranty
    let isGaranziaScaduta = false;
    let giorniAllaGaranzia = 999;
    if (att['Data Garanzia']) {
      const dGar = new Date(att['Data Garanzia']);
      if (!isNaN(dGar.getTime())) {
        const diffTime = dGar.getTime() - now.getTime();
        giorniAllaGaranzia = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (giorniAllaGaranzia < 0) {
          isGaranziaScaduta = true;
        }
      }
    }

    return {
      ...att,
      depositoCollegato: deposito,
      cantiereCollegato: cantiere,
      operatoreResponsabileObj: operatore,
      isManutenzioneScaduta,
      isManutenzioneInScadenza,
      giorniAllaManutenzione,
      isGaranziaScaduta,
      giorniAllaGaranzia,
    };
  });

  // 4. Enrich Cantieri
  const cantieriEnriched: CantierePAEnriched[] = cantieri.map((c) => {
    const isAperto = ['sì', 'si', 'true', '1', 'vero'].includes((c.Cantiere_Aperto || '').trim().toLowerCase());
    const resp = findDipendente(c.Assegnato, dipendenti);
    const attPresenti = attrezzature.filter((a) => {
      const pos = (a.Posizione || '').toLowerCase();
      return pos === c.CANTIERE.toLowerCase() || pos === c.COD_CANTIERE.toLowerCase() || pos.includes(c.COD_CANTIERE.toLowerCase());
    });

    return {
      ...c,
      isAperto,
      responsabileDipendente: resp,
      attrezzaturePresenti: attPresenti,
    };
  });

  // 5. Compute KPIs
  const cantieriApertiCount = cantieriEnriched.filter((c) => c.isAperto).length;
  const veicoliAttiviCount = veicoli.filter((v) => {
    const st = (v.Stato || '').toLowerCase();
    return st.includes('attivo') || st.includes('servizio');
  }).length;
  const litriTotali = rifornimenti.reduce((sum, r) => sum + (r.Quantità_litri || 0), 0);
  const attrezzatureInScadenzaCount = attrezzatureEnriched.filter(
    (a) => a.isManutenzioneScaduta || a.isManutenzioneInScadenza || a.isGaranziaScaduta
  ).length;

  const totalLoaded = carichi_carburante.reduce((sum, c) => sum + (c.Qta_Eff || c.Qta || 0), 0);
  const fuelTankRemaining = Math.max(0, totalLoaded - litriTotali);

  const kpis: PowerAppsKpis = {
    cantieriAperti: cantieriApertiCount,
    cantieriTotali: cantieri.length,
    veicoliAttivi: veicoliAttiviCount,
    veicoliTotali: veicoli.length,
    litriTotaliErogati: parseFloat(litriTotali.toFixed(1)),
    numeroRifornimentiTotali: rifornimenti.length,
    attrezzatureManutenzioneInScadenza: attrezzatureEnriched.filter((a) => a.isManutenzioneScaduta || a.isManutenzioneInScadenza).length,
    attrezzatureGaranziaInScadenza: attrezzatureEnriched.filter((a) => a.isGaranziaScaduta).length,
    attrezzatureTotali: attrezzature.length,
    dipendentiInCampo: dipendenti.filter((d) => (d.Operatore_In_Campo || '').toLowerCase().includes('s')).length,
    dipendentiTotali: dipendenti.length,
    carburanteCisternaStimatoLitri: parseFloat(fuelTankRemaining.toFixed(1)),
  };

  return {
    rifornimentiCalcolati: allRifornimentiCalcolati,
    veicoliEnriched,
    attrezzatureEnriched,
    cantieriEnriched,
    kpis,
  };
}
