export type PrioritaRichiesta = 'normale' | 'urgente' | 'bloccante_fermo_cantiere';

export type StatoRichiestaMateriali =
  | 'inviata'
  | 'in_preparazione'
  | 'pronta'
  | 'ddt_emesso'
  | 'rifiutata';

export type TipoElementoRichiesto = 'materiale' | 'attrezzatura';

export interface RigaRichiestaMateriali {
  id: string;
  tipo: TipoElementoRichiesto;
  articoloId?: string; // SKU o ID Magazzino / Attrezzatura
  codice: string;
  descrizione: string;
  quantitaRichiesta: number;
  unitaMisura: string;
  quantitaDisponibileMagazzino?: number;
  quantitaApprontata?: number;
  note?: string;
}

export interface NotificaInvioRichiesta {
  canale: 'push_e_email';
  destinatarioMagazzino: string;
  emailDestinatario: string;
  inviatoIl: string;
  pushInviata: boolean;
  emailInviata: boolean;
}

export interface RichiestaMateriali {
  id: string;
  numero: string; // es. RMC-2026-001
  dataRichiesta: string; // ISO string o YYYY-MM-DD HH:mm
  cantiereId: string;
  cantiereTitolo: string;
  clienteNome: string;
  indirizzoConsegna: string;
  
  richiedenteId: string;
  richiedenteNome: string;
  richiedenteRuolo: string;
  richiedenteTelefono: string;

  priorita: PrioritaRichiesta;
  dataPrevistaConsegna: string; // data desiderata sul campo
  orarioPreferito?: string;     // es. "Entro le 08:30"
  
  stato: StatoRichiestaMateriali;
  noteCantiere?: string;
  
  righe: RigaRichiestaMateriali[];
  
  notifica: NotificaInvioRichiesta;
  
  ddtCollegatoId?: string;
  ddtCollegatoNumero?: string;
  
  preparataDa?: string;
  dataPreparazione?: string;
}
