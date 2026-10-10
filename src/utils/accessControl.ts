import { User, CompanyDepartment, AppInterfaceMode } from '../types';

export interface AccessControlRule {
  allowedRoles?: string[];
  allowedReparti?: CompanyDepartment[];
  modes?: AppInterfaceMode[] | string[];
}

/**
 * Determina se una cartella o voce di navigazione è visibile per l'utente e il contesto attuale.
 * 
 * Regole di valutazione:
 * 1. Admin bypass: Se l'utente è 'amministratore', ha visibilità globale su qualsiasi voce/cartella.
 * 2. Se specificato `modes`:
 *    - Se l'interfaceMode attivo NON è presente nella lista dei modes ammessi, l'elemento è nascosto.
 *    - Questo garantisce che per esempio un committente in 'cliente_portal' non veda mai sezioni interne.
 * 3. Se specificato `allowedRoles`:
 *    - Se il ruolo dell'utente non è nell'elenco `allowedRoles`, l'elemento è nascosto.
 * 4. Se specificato `allowedReparti`:
 *    - Se l'utente non ha un reparto assegnato o il suo reparto non è nell'elenco `allowedReparti`, l'elemento è nascosto.
 * 5. Se nessun vincolo (o solo vincoli soddisfatti), l'elemento è visibile.
 */
export function isItemVisible(
  item: AccessControlRule,
  currentUser: User | null | undefined,
  currentMode?: AppInterfaceMode | string
): boolean {
  if (!currentUser) {
    return false;
  }

  // Regola 1: L'amministratore vede tutto
  if (currentUser.role === 'amministratore') {
    return true;
  }

  // Regola 2: Filtro per modalità d'interfaccia (es. cliente_portal vs cantiere_mobile vs ufficio_tecnico)
  if (currentMode && item.modes && item.modes.length > 0) {
    if (!item.modes.includes(currentMode as AppInterfaceMode)) {
      return false;
    }
  }

  // Regola 3: Filtro per Ruolo (AND logico se sono presenti sia role che reparto)
  if (item.allowedRoles && item.allowedRoles.length > 0) {
    if (!item.allowedRoles.includes(currentUser.role)) {
      return false;
    }
  }

  // Regola 4: Filtro per Reparto
  if (item.allowedReparti && item.allowedReparti.length > 0) {
    if (!currentUser.reparto || !item.allowedReparti.includes(currentUser.reparto)) {
      return false;
    }
  }

  return true;
}
