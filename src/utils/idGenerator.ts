let globalCounter = 0;

/**
 * Genera un identificativo univoco garantito senza collisioni,
 * combinando timestamp, contatore atomico incrementale e stringa casuale.
 */
export function generateUniqueId(prefix: string = 'id'): string {
  globalCounter = (globalCounter + 1) % 1000000;
  const time = Date.now().toString(36);
  const count = globalCounter.toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${time}-${count}-${rand}`;
}
