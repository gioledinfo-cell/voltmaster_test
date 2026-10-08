import {
  Cantiere,
  ROL,
  Dipendente,
  Veicolo,
  Attrezzatura,
  PresenzaCantiere,
  OrdineInterno,
  DocumentoSicurezzaCantiere,
  CruscottoSicurezzaCantiere,
  IdoneitaSanitariaLavoratore,
} from '../types';
import { StatoAvanzamentoLavori } from '../types/sal';
import { DocumentoDiTrasporto } from '../types/ddt';
import { ScadenzaItem } from '../types/scadenze';

export interface FullApplicationState {
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
  lastUpdated?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = this.getToken();
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('voltmaster_auth_token', token);
    localStorage.setItem('cantiere_jwt_token', token);
  }

  public getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('voltmaster_auth_token') ||
      localStorage.getItem('cantiere_jwt_token') ||
      sessionStorage.getItem('voltmaster_auth_token')
    );
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const t = this.getToken();
    if (t) {
      headers['Authorization'] = `Bearer ${t}`;
    }
    return headers;
  }

  public async login(email?: string, password?: string) {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (err) {
      console.warn('⚠️ Server non raggiungibile per il login, prosiguo offline:', err);
      return null;
    }
  }

  public async fetchFullState(): Promise<FullApplicationState | null> {
    try {
      const res = await fetch('/api/v1/state', {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success && result.data) {
        return result.data as FullApplicationState;
      }
    } catch (err) {
      console.warn('⚠️ Server API offline, ripiegamento su LocalStorage:', err);
    }
    return null;
  }

  public async syncFullState(state: FullApplicationState): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(state),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Errore durante la sincronizzazione backend:', err);
      return false;
    }
  }

  public async saveCantiere(cantiere: Cantiere): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/cantieri', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cantiere),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare il cantiere su server:', err);
      return false;
    }
  }

  public async saveRol(rol: ROL): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/rols', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(rol),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare il ROL su server:', err);
      return false;
    }
  }

  public async saveSal(sal: StatoAvanzamentoLavori): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/sals', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(sal),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare il SAL su server:', err);
      return false;
    }
  }

  public async saveDdt(ddt: DocumentoDiTrasporto): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/ddts', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(ddt),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare il DDT su server:', err);
      return false;
    }
  }

  public async saveOrdine(ordine: OrdineInterno): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/ordini', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(ordine),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare l\'ordine su server:', err);
      return false;
    }
  }

  // --- ATOMIC PATCH & TRANSAZIONALITÀ ---
  public async patchRol(id: string, patch: Partial<ROL>): Promise<{ success: boolean; data?: ROL; error?: string }> {
    try {
      const res = await fetch(`/api/v1/rols/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(patch),
      });
      const result = await res.json();
      return result;
    } catch (err) {
      console.warn('⚠️ Errore durante l\'aggiornamento atomico del ROL:', err);
      return { success: false, error: 'Connessione fallita' };
    }
  }

  public async patchCantiere(id: string, patch: Partial<Cantiere>): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/cantieri/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(patch),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Errore durante l\'aggiornamento atomico del cantiere:', err);
      return false;
    }
  }

  public async savePresenza(presenza: PresenzaCantiere): Promise<{ success: boolean; data?: PresenzaCantiere; error?: string; bloccoSicurezza?: boolean }> {
    try {
      const res = await fetch('/api/v1/presenze', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(presenza),
      });
      const result = await res.json();
      return result;
    } catch (err) {
      console.warn('⚠️ Impossibile registrare la presenza su server:', err);
      return { success: false, error: 'Server non raggiungibile' };
    }
  }

  // --- SICUREZZA CANTIERE & D.LGS 81/08 ---
  public async fetchCruscottoSicurezza(cantiereId: string): Promise<CruscottoSicurezzaCantiere | null> {
    try {
      const res = await fetch(`/api/v1/sicurezza/cruscotto/${cantiereId}`, {
        headers: this.getHeaders(),
      });
      const result = await res.json();
      return result.success ? (result.data as CruscottoSicurezzaCantiere) : null;
    } catch (err) {
      console.warn('⚠️ Impossibile recuperare cruscotto sicurezza da server:', err);
      return null;
    }
  }

  public async fetchDocumentiSicurezza(cantiereId?: string): Promise<DocumentoSicurezzaCantiere[]> {
    try {
      const url = cantiereId ? `/api/v1/sicurezza/documenti/${cantiereId}` : '/api/v1/sicurezza/documenti';
      const res = await fetch(url, { headers: this.getHeaders() });
      const result = await res.json();
      return result.success ? (result.data as DocumentoSicurezzaCantiere[]) : [];
    } catch (err) {
      console.warn('⚠️ Impossibile recuperare documenti sicurezza:', err);
      return [];
    }
  }

  public async saveDocumentoSicurezza(doc: DocumentoSicurezzaCantiere): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/sicurezza/documenti', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(doc),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('⚠️ Impossibile salvare documento sicurezza su server:', err);
      return false;
    }
  }

  public async fetchIdoneitaLavoratori(): Promise<IdoneitaSanitariaLavoratore[]> {
    try {
      const res = await fetch('/api/v1/sicurezza/idoneita-lavoratori', {
        headers: this.getHeaders(),
      });
      const result = await res.json();
      return result.success ? (result.data as IdoneitaSanitariaLavoratore[]) : [];
    } catch (err) {
      console.warn('⚠️ Impossibile recuperare idoneità sanitaria lavoratori:', err);
      return [];
    }
  }
}

export const apiService = new ApiService();
