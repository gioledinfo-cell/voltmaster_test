import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  WhereFilterOp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Cantiere,
  ROL,
  Dipendente,
  Veicolo,
  Attrezzatura,
  PresenzaCantiere,
  OrdineInterno,
} from '../types';
import { StatoAvanzamentoLavori } from '../types/sal';
import { DocumentoDiTrasporto } from '../types/ddt';
import { ScadenzaItem } from '../types/scadenze';

/**
 * Funzione generica per recuperare tutti i documenti da una collezione Firestore.
 */
export async function getDocsCollection<T = DocumentData>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
  } catch (error) {
    console.error(`[Firestore Error] Impossibile recuperare la collezione '${collectionName}':`, error);
    return [];
  }
}

/**
 * Funzione generica per recuperare un singolo documento per ID.
 */
export async function getDocById<T = DocumentData>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as unknown as T;
    }
    return null;
  } catch (error) {
    console.error(`[Firestore Error] Errore recupero doc '${id}' in '${collectionName}':`, error);
    return null;
  }
}

/**
 * Funzione generica per creare o sovrascrivere un documento con ID specificato.
 */
export async function setDocData<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T,
  merge: boolean = true
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    // Eliminiamo eventuali campi undefined per evitare errori Firestore
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge });
    return true;
  } catch (error) {
    console.error(`[Firestore Error] Errore salvataggio doc '${id}' in '${collectionName}':`, error);
    return false;
  }
}

/**
 * Funzione generica per aggiungere un nuovo documento generando un ID automatico.
 */
export async function addDocData<T extends Record<string, any>>(
  collectionName: string,
  data: T
): Promise<string | null> {
  try {
    const colRef = collection(db, collectionName);
    const cleanData = JSON.parse(JSON.stringify(data));
    const res = await addDoc(colRef, cleanData);
    return res.id;
  } catch (error) {
    console.error(`[Firestore Error] Errore aggiunta doc in '${collectionName}':`, error);
    return null;
  }
}

/**
 * Funzione generica per aggiornare parzialmente un documento esistente.
 */
export async function updateDocData<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    const cleanData = JSON.parse(JSON.stringify(data));
    await updateDoc(docRef, cleanData);
    return true;
  } catch (error) {
    console.error(`[Firestore Error] Errore aggiornamento doc '${id}' in '${collectionName}':`, error);
    return false;
  }
}

/**
 * Funzione generica per eliminare un documento.
 */
export async function deleteDocData(collectionName: string, id: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`[Firestore Error] Errore eliminazione doc '${id}' in '${collectionName}':`, error);
    return false;
  }
}

/**
 * Funzione generica per interrogare una collezione filtrata per campo.
 */
export async function queryCollection<T = DocumentData>(
  collectionName: string,
  field: string,
  op: WhereFilterOp,
  value: any
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where(field, op, value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
  } catch (error) {
    console.error(`[Firestore Error] Errore query su '${collectionName}' (${field} ${op} ${value}):`, error);
    return [];
  }
}

/**
 * Sottoscrizione in tempo reale (Realtime listener) ad una collezione Firestore.
 */
export function subscribeToCollection<T = DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void
): () => void {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
      callback(items);
    },
    (error) => {
      console.error(`[Firestore Error] Errore realtime listener '${collectionName}':`, error);
    }
  );
}

// ==========================================
// SERVIZI SPECIFICI PER ENTITÀ DI CANTIERE
// ==========================================

export const cantieriDb = {
  getAll: () => getDocsCollection<Cantiere>('cantieri'),
  getById: (id: string) => getDocById<Cantiere>('cantieri', id),
  save: (cantiere: Cantiere) => setDocData<Cantiere>('cantieri', cantiere.id, cantiere),
  update: (id: string, data: Partial<Cantiere>) => updateDocData<Cantiere>('cantieri', id, data),
  delete: (id: string) => deleteDocData('cantieri', id),
  subscribe: (callback: (data: Cantiere[]) => void) => subscribeToCollection<Cantiere>('cantieri', callback),
};

export const rolsDb = {
  getAll: () => getDocsCollection<ROL>('rols'),
  getByCantiere: (cantiereId: string) => queryCollection<ROL>('rols', 'cantiereId', '==', cantiereId),
  getById: (id: string) => getDocById<ROL>('rols', id),
  save: (rol: ROL) => setDocData<ROL>('rols', rol.id, rol),
  update: (id: string, data: Partial<ROL>) => updateDocData<ROL>('rols', id, data),
  delete: (id: string) => deleteDocData('rols', id),
  subscribe: (callback: (data: ROL[]) => void) => subscribeToCollection<ROL>('rols', callback),
};

export const salsDb = {
  getAll: () => getDocsCollection<StatoAvanzamentoLavori>('sals'),
  getByCantiere: (cantiereId: string) => queryCollection<StatoAvanzamentoLavori>('sals', 'cantiereId', '==', cantiereId),
  getById: (id: string) => getDocById<StatoAvanzamentoLavori>('sals', id),
  save: (sal: StatoAvanzamentoLavori) => setDocData<StatoAvanzamentoLavori>('sals', sal.id, sal),
  delete: (id: string) => deleteDocData('sals', id),
};

export const ddtsDb = {
  getAll: () => getDocsCollection<DocumentoDiTrasporto>('ddts'),
  save: (ddt: DocumentoDiTrasporto) => setDocData<DocumentoDiTrasporto>('ddts', ddt.id, ddt),
  delete: (id: string) => deleteDocData('ddts', id),
};

export const ordiniDb = {
  getAll: () => getDocsCollection<OrdineInterno>('ordini'),
  save: (ordine: OrdineInterno) => setDocData<OrdineInterno>('ordini', ordine.id, ordine),
  delete: (id: string) => deleteDocData('ordini', id),
};

export const veicoliDb = {
  getAll: () => getDocsCollection<Veicolo>('veicoli'),
  save: (veicolo: Veicolo) => setDocData<Veicolo>('veicoli', veicolo.id, veicolo),
  delete: (id: string) => deleteDocData('veicoli', id),
};

export const attrezzatureDb = {
  getAll: () => getDocsCollection<Attrezzatura>('attrezzature'),
  save: (attrezzatura: Attrezzatura) => setDocData<Attrezzatura>('attrezzature', attrezzatura.id, attrezzatura),
  delete: (id: string) => deleteDocData('attrezzature', id),
};

export const dipendentiDb = {
  getAll: () => getDocsCollection<Dipendente>('dipendenti'),
  save: (dipendente: Dipendente) => setDocData<Dipendente>('dipendenti', dipendente.id, dipendente),
  delete: (id: string) => deleteDocData('dipendenti', id),
};

export const presenzeDb = {
  getAll: () => getDocsCollection<PresenzaCantiere>('presenze'),
  save: (presenza: PresenzaCantiere) => setDocData<PresenzaCantiere>('presenze', presenza.id, presenza),
  delete: (id: string) => deleteDocData('presenze', id),
};

export const scadenzeDb = {
  getAll: () => getDocsCollection<ScadenzaItem>('scadenze'),
  save: (scadenza: ScadenzaItem) => setDocData<ScadenzaItem>('scadenze', scadenza.id, scadenza),
  delete: (id: string) => deleteDocData('scadenze', id),
};
