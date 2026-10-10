import { describe, it, expect } from 'vitest';
import { isItemVisible, AccessControlRule } from '../utils/accessControl';
import { getInitialOpenFolders } from '../components/Sidebar';
import { User } from '../types';

describe('Access Control - isItemVisible RBAC Suite', () => {
  // Mock utenti di test
  const adminUser: User = {
    id: 'usr-admin',
    name: 'Admin Test',
    email: 'admin@voltmaster.it',
    role: 'amministratore',
    reparto: 'contabilita',
  };

  const respContabilita: User = {
    id: 'usr-resp-cont',
    name: 'Responsabile Contabilità',
    email: 'resp.cont@voltmaster.it',
    role: 'responsabile',
    reparto: 'contabilita',
  };

  const respHR: User = {
    id: 'usr-resp-hr',
    name: 'Responsabile HR',
    email: 'resp.hr@voltmaster.it',
    role: 'responsabile',
    reparto: 'hr',
  };

  const operatoreContabilita: User = {
    id: 'usr-op-cont',
    name: 'Operatore Contabilità',
    email: 'op.cont@voltmaster.it',
    role: 'operatore',
    reparto: 'contabilita',
  };

  const clienteUser: User = {
    id: 'usr-cli',
    name: 'Cliente Committente',
    email: 'cliente@committente.it',
    role: 'cliente',
  };

  // Regola Direzione: solo responsabili di contabilità o ufficio tecnico
  const regolaDirezione: AccessControlRule = {
    allowedRoles: ['responsabile'],
    allowedReparti: ['contabilita', 'ufficio_tecnico'],
    modes: ['contabilita', 'ufficio_tecnico'],
  };

  // Regola generica libera
  const regolaLibera: AccessControlRule = {};

  // Regola interna aziendale (non visibile ai clienti)
  const regolaSoloInterni: AccessControlRule = {
    modes: ['contabilita', 'ufficio_tecnico', 'cantiere_mobile', 'magazzino_portale'],
  };

  // Test 1: Admin vede tutto (bypassa ogni vincolo di ruolo, reparto e modalità)
  it('1. Admin vede tutto', () => {
    expect(isItemVisible(regolaDirezione, adminUser, 'cliente_portal')).toBe(true);
    expect(isItemVisible(regolaSoloInterni, adminUser, 'contabilita')).toBe(true);
    expect(isItemVisible(regolaLibera, adminUser)).toBe(true);
  });

  // Test 2: Responsabile contabilità vede Direzione
  it('2. Responsabile contabilità vede Direzione', () => {
    expect(isItemVisible(regolaDirezione, respContabilita, 'contabilita')).toBe(true);
  });

  // Test 3: Responsabile HR NON vede Direzione
  it('3. Responsabile HR NON vede Direzione', () => {
    expect(isItemVisible(regolaDirezione, respHR, 'contabilita')).toBe(false);
  });

  // Test 4: Operatore contabilità NON vede Direzione
  it('4. Operatore contabilità NON vede Direzione', () => {
    expect(isItemVisible(regolaDirezione, operatoreContabilita, 'contabilita')).toBe(false);
  });

  // Test 5: Voce senza restrizioni visibile a tutti
  it('5. Voce senza restrizioni visibile a tutti', () => {
    expect(isItemVisible(regolaLibera, respHR, 'ufficio_tecnico')).toBe(true);
    expect(isItemVisible(regolaLibera, operatoreContabilita, 'cantiere_mobile')).toBe(true);
    expect(isItemVisible(regolaLibera, clienteUser, 'cliente_portal')).toBe(true);
  });

  // Test 6: Cliente in modalità cliente_portal non vede voci interne
  it('6. Cliente in modalità cliente_portal non vede voci interne', () => {
    expect(isItemVisible(regolaSoloInterni, clienteUser, 'cliente_portal')).toBe(false);
  });

  // Test suite getInitialOpenFolders (anti-information overload)
  describe('getInitialOpenFolders - Apertura profilata cartelle', () => {
    it('Admin ha tutte le 6 cartelle aperte di default', () => {
      const folders = getInitialOpenFolders(adminUser);
      expect(folders.direzione_strategia).toBe(true);
      expect(folders.cantiere_operazioni).toBe(true);
      expect(folders.logistica_flotta).toBe(true);
      expect(folders.amministrazione_commerciale).toBe(true);
      expect(folders.anagrafiche_master).toBe(true);
      expect(folders.sicurezza_hr_compliance).toBe(true);
    });

    it('Operatore contabilità ha aperta solo amministrazione_commerciale', () => {
      const folders = getInitialOpenFolders(operatoreContabilita);
      expect(folders.amministrazione_commerciale).toBe(true);
      expect(folders.direzione_strategia).toBe(false);
      expect(folders.cantiere_operazioni).toBe(false);
      expect(folders.logistica_flotta).toBe(false);
      expect(folders.anagrafiche_master).toBe(false);
      expect(folders.sicurezza_hr_compliance).toBe(false);
    });

    it('Capocantiere ha aperta solo cantiere_operazioni', () => {
      const capoUser: User = {
        id: 'usr-capo',
        name: 'Capo Cantiere',
        email: 'capo@voltmaster.it',
        role: 'operatore',
        reparto: 'capocantiere',
      };
      const folders = getInitialOpenFolders(capoUser);
      expect(folders.cantiere_operazioni).toBe(true);
      expect(folders.direzione_strategia).toBe(false);
      expect(folders.amministrazione_commerciale).toBe(false);
    });

    it('Responsabile HR ha aperta sicurezza_hr_compliance e direzione_strategia', () => {
      const folders = getInitialOpenFolders(respHR);
      expect(folders.sicurezza_hr_compliance).toBe(true);
      expect(folders.direzione_strategia).toBe(true);
      expect(folders.amministrazione_commerciale).toBe(false);
      expect(folders.cantiere_operazioni).toBe(false);
    });
  });
});
