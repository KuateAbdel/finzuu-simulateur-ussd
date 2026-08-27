/**
 * src/env.d.ts
 * ============
 * Le typage du module '@env' — produit par react-native-dotenv depuis le
 * fichier .env (jamais versionne ; le gabarit est .env.example).
 *
 * C'est ici, et seulement ici, que les NOMS de variables sont fixes cote
 * code. Une variable ajoutee au .env sans sa declaration n'existe pas pour
 * TypeScript ; une variable declaree mais absente du .env fait echouer la
 * compilation (`allowUndefined: false`).
 */

declare module '@env' {
  /** Service d'attribution — contrat docs/CONTRAT_ATTRIBUTION.md (v0.3.1). */
  export const ATTRIBUTION_BASE_URL: string;
  /** Service USSD — recoit les saisies, rend les ecrans de menu. */
  export const USSD_BASE_URL: string;
  /** Delai d'attente reseau, en millisecondes. */
  export const REQUEST_TIMEOUT_MS: string;
  /** Le code a composer (« *321# ») — AFFICHE a l'usager, jamais en dur. */
  export const CODE_USSD: string;
}
