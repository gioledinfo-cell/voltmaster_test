import fs from 'fs';
import path from 'path';
import {
  Cantiere,
  ROL,
  Dipendente,
  Veicolo,
  Attrezzatura,
  PresenzaCantiere,
  Lavorazione,
  OrdineInterno,
  DocumentoSicurezzaCantiere,
} from '../types';
import { StatoAvanzamentoLavori } from '../types/sal';
import { DocumentoDiTrasporto } from '../types/ddt';
import { ScadenzaItem } from '../types/scadenze';
import { CANTIERI } from '../data/cantieri';
import { INITIAL_ROLS } from '../data/mockData';
import { INITIAL_SALS } from '../data/mockSal';
import { INITIAL_DDTS } from '../data/mockDdt';
import { INITIAL_ORDINI_INTERNI } from '../data/mockOrdini';
import { INITIAL_SCADENZE } from '../data/mockScadenze';
import { DIPENDENTI } from '../data/dipendenti';
import { VEICOLI } from '../data/veicoli';
import { ATTREZZATURE } from '../data/attrezzatura';
import { INITIAL_PRESENZE } from '../data/mockPresenze';
import { INITIAL_DOCUMENTI_SICUREZZA } from '../data/mockSicurezza';

import { AuditLogEntry } from '../services/auditService';

export interface DatabaseSchema {
  cantieri: Cantiere[];
  rols: ROL[];
  sals: StatoAvanzamentoLavori[];
  ddts: DocumentoDiTrasporto[];
  ordiniInterni: OrdineInterno[];
  scadenze: ScadenzaItem[];
  dipendenti: Dipendente[];
  veicoli: Veicolo[];
  attrezzature: Attrezzatura[];
  presenze: PresenzaCantiere[];
  documentiSicurezza: DocumentoSicurezzaCantiere[];
  auditLogs: AuditLogEntry[];
  lastUpdated: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'cantiere_database.json');
const DB_TMP_FILE = path.join(DB_DIR, 'cantiere_database.tmp.json');

function getDefaultDatabase(): DatabaseSchema {
  return {
    cantieri: CANTIERI,
    rols: INITIAL_ROLS,
    sals: INITIAL_SALS,
    ddts: INITIAL_DDTS,
    ordiniInterni: INITIAL_ORDINI_INTERNI,
    scadenze: INITIAL_SCADENZE,
    dipendenti: DIPENDENTI,
    veicoli: VEICOLI,
    attrezzature: ATTREZZATURE,
    presenze: INITIAL_PRESENZE,
    documentiSicurezza: INITIAL_DOCUMENTI_SICUREZZA,
    auditLogs: [],
    lastUpdated: new Date().toISOString(),
  };
}

export class PersistentDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent) as DatabaseSchema;
        console.log('✅ Persistent Database loaded successfully from disk.');
        return {
          ...getDefaultDatabase(),
          ...parsed,
          documentiSicurezza: parsed.documentiSicurezza || INITIAL_DOCUMENTI_SICUREZZA,
        };
      }
    } catch (err) {
      console.error('⚠️ Error loading database file from disk, initializing default schema:', err);
    }

    const defaultData = getDefaultDatabase();
    this.saveToDisk(defaultData);
    return defaultData;
  }

  /**
   * Scrittura atomica sicura con file temporaneo e rename
   * Elimina il rischio di corruzione del JSON in presenza di scritture concorrenti.
   */
  private saveToDisk(dataToSave: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      dataToSave.lastUpdated = new Date().toISOString();
      const payload = JSON.stringify(dataToSave, null, 2);

      fs.writeFileSync(DB_TMP_FILE, payload, 'utf-8');
      fs.renameSync(DB_TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('❌ Failed to persist database atomically to disk:', err);
    }
  }

  public getState(): DatabaseSchema {
    return this.data;
  }

  public updateState(partialState: Partial<DatabaseSchema>): DatabaseSchema {
    this.data = {
      ...this.data,
      ...partialState,
      lastUpdated: new Date().toISOString(),
    };
    this.saveToDisk(this.data);
    return this.data;
  }

  // --- DIPENDENTI ---
  public getDipendenti(): Dipendente[] {
    return this.data.dipendenti || [];
  }

  // --- CANTIERI ---
  public getCantieri(): Cantiere[] {
    return this.data.cantieri;
  }

  public getCantiereById(id: string): Cantiere | undefined {
    return this.data.cantieri.find((c) => c.id === id);
  }

  public saveCantiere(cantiere: Cantiere): Cantiere {
    const index = this.data.cantieri.findIndex((c) => c.id === cantiere.id);
    if (index >= 0) {
      this.data.cantieri[index] = cantiere;
    } else {
      this.data.cantieri.unshift(cantiere);
    }
    this.saveToDisk(this.data);
    return cantiere;
  }

  public updateCantiere(id: string, patch: Partial<Cantiere>): Cantiere | null {
    const index = this.data.cantieri.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.cantieri[index] = {
      ...this.data.cantieri[index],
      ...patch,
    };
    this.saveToDisk(this.data);
    return this.data.cantieri[index];
  }

  public deleteCantiere(id: string): boolean {
    const initialLen = this.data.cantieri.length;
    this.data.cantieri = this.data.cantieri.filter((c) => c.id !== id);
    if (this.data.cantieri.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  // --- ROL (RAPPORTINI OPERATIVI) ---
  public getRols(): ROL[] {
    return this.data.rols;
  }

  public getRolById(id: string): ROL | undefined {
    return this.data.rols.find((r) => r.id === id);
  }

  public saveRol(rol: ROL): ROL {
    const index = this.data.rols.findIndex((r) => r.id === rol.id);
    if (index >= 0) {
      this.data.rols[index] = rol;
    } else {
      this.data.rols.unshift(rol);
    }
    this.saveToDisk(this.data);
    return rol;
  }

  public updateRol(id: string, patch: Partial<ROL>): ROL | null {
    const index = this.data.rols.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.data.rols[index] = {
      ...this.data.rols[index],
      ...patch,
    };
    this.saveToDisk(this.data);
    return this.data.rols[index];
  }

  public deleteRol(id: string): boolean {
    const initialLen = this.data.rols.length;
    this.data.rols = this.data.rols.filter((r) => r.id !== id);
    if (this.data.rols.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  // --- PRESENZE CANTIERE ---
  public getPresenze(): PresenzaCantiere[] {
    return this.data.presenze || [];
  }

  public savePresenza(presenza: PresenzaCantiere): PresenzaCantiere {
    if (!this.data.presenze) this.data.presenze = [];
    const index = this.data.presenze.findIndex((p) => p.id === presenza.id);
    if (index >= 0) {
      this.data.presenze[index] = presenza;
    } else {
      this.data.presenze.unshift(presenza);
    }
    this.saveToDisk(this.data);
    return presenza;
  }

  public deletePresenza(id: string): boolean {
    if (!this.data.presenze) return false;
    const initialLen = this.data.presenze.length;
    this.data.presenze = this.data.presenze.filter((p) => p.id !== id);
    if (this.data.presenze.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  // --- SICUREZZA CANTIERE & D.LGS 81/08 ---
  public getDocumentiSicurezza(): DocumentoSicurezzaCantiere[] {
    return this.data.documentiSicurezza || INITIAL_DOCUMENTI_SICUREZZA;
  }

  public getDocumentiSicurezzaByCantiere(cantiereId: string): DocumentoSicurezzaCantiere[] {
    const list = this.data.documentiSicurezza || INITIAL_DOCUMENTI_SICUREZZA;
    return list.filter((d) => d.cantiereId === cantiereId);
  }

  public saveDocumentoSicurezza(doc: DocumentoSicurezzaCantiere): DocumentoSicurezzaCantiere {
    if (!this.data.documentiSicurezza) this.data.documentiSicurezza = [];
    const index = this.data.documentiSicurezza.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      this.data.documentiSicurezza[index] = doc;
    } else {
      this.data.documentiSicurezza.unshift(doc);
    }
    this.saveToDisk(this.data);
    return doc;
  }

  public deleteDocumentoSicurezza(id: string): boolean {
    if (!this.data.documentiSicurezza) return false;
    const initialLen = this.data.documentiSicurezza.length;
    this.data.documentiSicurezza = this.data.documentiSicurezza.filter((d) => d.id !== id);
    if (this.data.documentiSicurezza.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  // --- SAL ---
  public getSals(): StatoAvanzamentoLavori[] {
    return this.data.sals;
  }

  public saveSal(sal: StatoAvanzamentoLavori): StatoAvanzamentoLavori {
    const index = this.data.sals.findIndex((s) => s.id === sal.id);
    if (index >= 0) {
      this.data.sals[index] = sal;
    } else {
      this.data.sals.unshift(sal);
    }
    this.saveToDisk(this.data);
    return sal;
  }

  // --- DDT ---
  public getDdts(): DocumentoDiTrasporto[] {
    return this.data.ddts;
  }

  public saveDdt(ddt: DocumentoDiTrasporto): DocumentoDiTrasporto {
    const index = this.data.ddts.findIndex((d) => d.id === ddt.id);
    if (index >= 0) {
      this.data.ddts[index] = ddt;
    } else {
      this.data.ddts.unshift(ddt);
    }
    this.saveToDisk(this.data);
    return ddt;
  }

  // --- ORDINI ---
  public getOrdini(): OrdineInterno[] {
    return this.data.ordiniInterni;
  }

  public saveOrdine(ordine: OrdineInterno): OrdineInterno {
    const index = this.data.ordiniInterni.findIndex((o) => o.id === ordine.id);
    if (index >= 0) {
      this.data.ordiniInterni[index] = ordine;
    } else {
      this.data.ordiniInterni.unshift(ordine);
    }
    this.saveToDisk(this.data);
    return ordine;
  }

  public deleteOrdine(id: string): boolean {
    const initialLen = this.data.ordiniInterni.length;
    this.data.ordiniInterni = this.data.ordiniInterni.filter((o) => o.id !== id);
    if (this.data.ordiniInterni.length !== initialLen) {
      this.saveToDisk(this.data);
      return true;
    }
    return false;
  }

  // --- AUDIT LOG ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs || [];
  }

  public saveAuditLog(entry: AuditLogEntry): AuditLogEntry {
    if (!this.data.auditLogs) this.data.auditLogs = [];
    const index = this.data.auditLogs.findIndex((a) => a.id === entry.id);
    if (index >= 0) {
      this.data.auditLogs[index] = entry;
    } else {
      this.data.auditLogs.unshift(entry);
    }
    this.saveToDisk(this.data);
    return entry;
  }
}

export const db = new PersistentDatabase();
