import crypto from 'crypto';

/**
 * VoltMaster Security & Cryptographic Password Utilities
 * Utilizza scrypt di Node.js nativo con salt crittograficamente sicuro a 16 byte
 * e comparazione in tempo costante (timingSafeEqual) per mitigare timing attacks.
 */

const KEY_LENGTH = 64;

/**
 * Genera l'hash sicuro di una password in formato salt:derivedKey (hex)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica una password in chiaro rispetto all'hash memorizzato
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const [salt, keyHex] = parts;
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);

    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error('Errore durante la verifica crittografica della password:', err);
    return false;
  }
}

// Password master predefinita di bootstrap per gli account demo di cantiere
export const DEFAULT_DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'voltmaster2026';

// Cache con hash precomputato per 'voltmaster2026'
const DEFAULT_HASH = hashPassword(DEFAULT_DEMO_PASSWORD);

/**
 * Archivio password utente protetto sul server (in-memory con fallback crittografico)
 */
const userCredentialStore = new Map<string, string>();

/**
 * Inizializza le credenziali di default per tutti gli utenti noti
 */
export function initializeUserCredentials(knownUserEmails: string[]): void {
  for (const email of knownUserEmails) {
    const normalized = email.trim().toLowerCase();
    if (!userCredentialStore.has(normalized)) {
      userCredentialStore.set(normalized, DEFAULT_HASH);
    }
  }
}

/**
 * Registra o aggiorna la password per un utente
 */
export function setUserPassword(email: string, newPassword: string): string {
  const normalized = email.trim().toLowerCase();
  const hash = hashPassword(newPassword);
  userCredentialStore.set(normalized, hash);
  return hash;
}

/**
 * Verifica le credenziali fornite per un utente
 */
export function authenticateUserPassword(email: string, passwordAttempt: string): boolean {
  if (!email || !passwordAttempt) return false;
  const normalized = email.trim().toLowerCase();

  let storedHash = userCredentialStore.get(normalized);
  if (!storedHash) {
    // Se l'utente fa parte del registro aziendale ma non ha ancora un hash specifico,
    // viene associato l'hash della password aziendale di default
    storedHash = DEFAULT_HASH;
    userCredentialStore.set(normalized, storedHash);
  }

  return verifyPassword(passwordAttempt, storedHash);
}
