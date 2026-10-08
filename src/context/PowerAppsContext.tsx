import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  loadPowerAppsData,
  savePowerAppsData,
  resetPowerAppsData,
  computeRelationalData,
  PowerAppsStoreData,
} from '../services/powerAppsStorageService';
import {
  parseCsvFile,
  exportToCsv,
  CSV_TABLE_CONFIGS,
} from '../services/csvIngestionService';

interface QuickRifornimentoInput {
  veicoloId: string;
  operatore: string;
  litri: number;
  km: number;
  totalizzatore?: number;
  note?: string;
  dataOra?: string;
}

interface PowerAppsContextType {
  // Raw Datasets
  dipendenti: DipendentePA[];
  veicoli: VeicoloPA[];
  attrezzature: AttrezzaturaPA[];
  depositi: DepositoPA[];
  cantieri: CantierePA[];
  rifornimenti: RifornimentoPA[];
  carichi_carburante: CaricoCarburantePA[];
  lastUpdated: string;

  // Enriched / Relational Data
  veicoliEnriched: VeicoloEnriched[];
  attrezzatureEnriched: AttrezzaturaEnriched[];
  cantieriEnriched: CantierePAEnriched[];
  rifornimentiCalcolati: RifornimentoCalcolato[];
  kpis: PowerAppsKpis;

  // Ingestion & Export Actions
  importCsvFiles: (files: File[]) => Promise<{ success: number; failed: number; reports: string[] }>;
  importSingleDataset: (type: CsvDatasetType, rows: any[], mode?: 'replace' | 'append') => void;
  exportDataset: (type: CsvDatasetType) => void;
  exportAllDatasets: () => void;
  resetAllToDemo: () => void;

  // CRUD Operations
  addRecord: (type: CsvDatasetType, record: any) => void;
  updateRecord: (type: CsvDatasetType, pkValue: string, updates: any) => void;
  deleteRecord: (type: CsvDatasetType, pkValue: string) => void;
  addRifornimentoRapido: (data: QuickRifornimentoInput) => { success: boolean; message: string };

  // UI state & helpers
  selectedVeicoloId: string | null;
  setSelectedVeicoloId: (id: string | null) => void;
  isQuickRifornimentoOpen: boolean;
  setIsQuickRifornimentoOpen: (open: boolean) => void;
}

const PowerAppsContext = createContext<PowerAppsContextType | undefined>(undefined);

export const PowerAppsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<PowerAppsStoreData>(() => loadPowerAppsData());
  const [selectedVeicoloId, setSelectedVeicoloId] = useState<string | null>(null);
  const [isQuickRifornimentoOpen, setIsQuickRifornimentoOpen] = useState<boolean>(false);

  // Sync with storage whenever store changes
  useEffect(() => {
    savePowerAppsData(store);
  }, [store]);

  // Compute relations and KPIs in real time
  const computed = useMemo(() => computeRelationalData(store), [store]);

  // Ingestion: Bulk import CSV files
  const importCsvFiles = async (
    files: File[]
  ): Promise<{ success: number; failed: number; reports: string[] }> => {
    let success = 0;
    let failed = 0;
    const reports: string[] = [];
    const updatedStore = { ...store };

    for (const file of files) {
      try {
        const result = await parseCsvFile(file);
        updatedStore[result.schemaType] = result.rows;
        reports.push(`✓ "${file.name}" importato come ${CSV_TABLE_CONFIGS[result.schemaType].title} (${result.totalParsed} righe)`);
        success++;
      } catch (err: any) {
        failed++;
        reports.push(`✗ "${file.name}": ${err.message || 'Errore di parsing'}`);
      }
    }

    if (success > 0) {
      updatedStore.lastUpdated = new Date().toISOString();
      setStore(updatedStore);
    }

    return { success, failed, reports };
  };

  // Import single dataset
  const importSingleDataset = (type: CsvDatasetType, rows: any[], mode: 'replace' | 'append' = 'replace') => {
    setStore((prev) => {
      const currentRows = prev[type] as any[];
      const pkField = CSV_TABLE_CONFIGS[type].primaryKey;

      let newRows: any[];
      if (mode === 'append') {
        const existingPkSet = new Set(currentRows.map((r) => String(r[pkField])));
        const nonDuplicates = rows.filter((r) => !existingPkSet.has(String(r[pkField])));
        newRows = [...currentRows, ...nonDuplicates];
      } else {
        newRows = rows;
      }

      return {
        ...prev,
        [type]: newRows,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  // Export single table to CSV
  const exportDataset = (type: CsvDatasetType) => {
    const rows = store[type];
    exportToCsv(type, rows);
  };

  // Export all 7 tables in sequence
  const exportAllDatasets = () => {
    const types: CsvDatasetType[] = [
      'dipendenti',
      'veicoli',
      'attrezzature',
      'depositi',
      'cantieri',
      'rifornimenti',
      'carichi_carburante',
    ];
    types.forEach((type, idx) => {
      setTimeout(() => {
        exportToCsv(type, store[type]);
      }, idx * 250);
    });
  };

  // Reset to initial demo mock data
  const resetAllToDemo = () => {
    const freshData = resetPowerAppsData();
    setStore(freshData);
  };

  // Generic Add Record
  const addRecord = (type: CsvDatasetType, record: any) => {
    setStore((prev) => {
      const currentList = prev[type] as any[];
      return {
        ...prev,
        [type]: [record, ...currentList],
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  // Generic Update Record
  const updateRecord = (type: CsvDatasetType, pkValue: string, updates: any) => {
    const pkField = CSV_TABLE_CONFIGS[type].primaryKey;
    setStore((prev) => {
      const currentList = prev[type] as any[];
      const updatedList = currentList.map((item) => {
        if (String(item[pkField]) === String(pkValue)) {
          return { ...item, ...updates };
        }
        return item;
      });
      return {
        ...prev,
        [type]: updatedList,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  // Generic Delete Record
  const deleteRecord = (type: CsvDatasetType, pkValue: string) => {
    const pkField = CSV_TABLE_CONFIGS[type].primaryKey;
    setStore((prev) => {
      const currentList = prev[type] as any[];
      const filtered = currentList.filter((item) => String(item[pkField]) !== String(pkValue));
      return {
        ...prev,
        [type]: filtered,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  // Rapid Fueling Logging Form Handler
  const addRifornimentoRapido = (input: QuickRifornimentoInput): { success: boolean; message: string } => {
    const targetVeicolo = store.veicoli.find(
      (v) => v.ID === input.veicoloId || v.Targa.toLowerCase() === input.veicoloId.toLowerCase()
    );

    if (!targetVeicolo) {
      return { success: false, message: 'Veicolo selezionato non trovato nella flotta registrata.' };
    }

    if (input.litri <= 0) {
      return { success: false, message: 'La quantità di carburante inserita deve essere maggiore di zero.' };
    }

    const previousKm = targetVeicolo.Km_veicolo_Ultimo_Rifornimento || 0;
    if (input.km < previousKm) {
      return {
        success: false,
        message: `I chilometri attuali (${input.km} km) non possono essere inferiori a quelli dell'ultimo rifornimento (${previousKm} km).`,
      };
    }

    const timestamp = input.dataOra || new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newId = `RIF-${String(store.rifornimenti.length + 1).padStart(3, '0')}`;

    // Compute new totalizer if not provided
    const lastRif = store.rifornimenti[0];
    const prevTotalizer = lastRif ? lastRif.N_totalizzatore : 18000;
    const computedTotalizer = input.totalizzatore && input.totalizzatore > 0
      ? input.totalizzatore
      : Math.round(prevTotalizer + input.litri);

    const newRif: RifornimentoPA = {
      ID: newId,
      'Data/ora creazione': timestamp,
      ID_Veicolo: targetVeicolo.ID,
      Targa: targetVeicolo.Targa,
      Modello_Veicolo: targetVeicolo.Veicolo,
      Operatore: input.operatore,
      Quantità_litri: input.litri,
      Km_veicolo: input.km,
      N_totalizzatore: computedTotalizer,
      Note: input.note || '',
    };

    // Update vehicle record with latest fueling info
    const updatedVeicoli = store.veicoli.map((v) => {
      if (v.ID === targetVeicolo.ID) {
        return {
          ...v,
          Km_veicolo_Ultimo_Rifornimento: input.km,
          N_tot_Ultimo_Rifornimento: computedTotalizer,
          Data_Ultimo_Rifornimento: timestamp,
          Operatore_Ultimo_Rifornimento: input.operatore,
          Qta_Ultimo_Rifornimento: input.litri,
        };
      }
      return v;
    });

    setStore((prev) => ({
      ...prev,
      veicoli: updatedVeicoli,
      rifornimenti: [newRif, ...prev.rifornimenti],
      lastUpdated: new Date().toISOString(),
    }));

    return {
      success: true,
      message: `Rifornimento ${newId} registrato con successo su ${targetVeicolo.Targa} (${input.litri} L)!`,
    };
  };

  const value: PowerAppsContextType = {
    dipendenti: store.dipendenti,
    veicoli: store.veicoli,
    attrezzature: store.attrezzature,
    depositi: store.depositi,
    cantieri: store.cantieri,
    rifornimenti: store.rifornimenti,
    carichi_carburante: store.carichi_carburante,
    lastUpdated: store.lastUpdated,

    veicoliEnriched: computed.veicoliEnriched,
    attrezzatureEnriched: computed.attrezzatureEnriched,
    cantieriEnriched: computed.cantieriEnriched,
    rifornimentiCalcolati: computed.rifornimentiCalcolati,
    kpis: computed.kpis,

    importCsvFiles,
    importSingleDataset,
    exportDataset,
    exportAllDatasets,
    resetAllToDemo,

    addRecord,
    updateRecord,
    deleteRecord,
    addRifornimentoRapido,

    selectedVeicoloId,
    setSelectedVeicoloId,
    isQuickRifornimentoOpen,
    setIsQuickRifornimentoOpen,
  };

  return <PowerAppsContext.Provider value={value}>{children}</PowerAppsContext.Provider>;
};

export const usePowerApps = (): PowerAppsContextType => {
  const context = useContext(PowerAppsContext);
  if (!context) {
    throw new Error('usePowerApps must be used within a PowerAppsProvider');
  }
  return context;
};
