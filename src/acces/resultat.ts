/**
 * acces/resultat.ts
 * =================
 * La TRADUCTION DES ÉCHECS EN ÉTATS — la responsabilité que le Stack §4.2
 * assigne à la couche d'accès, et rien d'autre : « appels aux services,
 * traduction des échecs en états. Ne contient jamais : aucune décision de
 * navigation. »
 *
 * Chaque appel réseau rend un `Resultat<T>` : jamais une exception qui
 * remonte jusqu'à un écran, jamais un code HTTP qui fuit vers le partenaire
 * (deck, diapo 10 : « le partenaire ne doit jamais voir un code HTTP ni une
 * trace technique »).
 *
 * Les cinq issues correspondent aux écrans 9 à 13 — mais la CORRESPONDANCE
 * est décidée par la coordination, pas ici. Cette couche dit CE QUI s'est
 * passé ; elle ne dit jamais OÙ aller.
 */

/** Ce qui s'est passé, sans interprétation de navigation.
 *
 *  `reseau`  — aucune réponse HTTP n'est arrivée (écran 9 côté coordination).
 *  `serveur` — le serveur a répondu, mais en erreur (écran 10).
 *  `stock`   — 409 STOCK_EPUISE : résultat calculé côté serveur, jamais une
 *              exception attrapée (propriété structurelle du contrat §5).
 *  `absent`  — 404 : la ressource n'existe plus. Pour un bail, c'est
 *              l'expiration ou la libération côté serveur (écran 13).
 */
export type Issue = 'ok' | 'reseau' | 'serveur' | 'stock' | 'absent';

export interface Succes<T> {
  issue: 'ok';
  valeur: T;
}

export interface Echec {
  issue: Exclude<Issue, 'ok'>;
  /** Diagnostic BRUT pour le journal de l'écran 8 (EF-16) — jamais affiché
   *  à l'usager de démonstration. */
  detail: string;
}

export type Resultat<T> = Succes<T> | Echec;

export const ok = <T>(valeur: T): Succes<T> => ({ issue: 'ok', valeur });

export const echec = (issue: Exclude<Issue, 'ok'>, detail: string): Echec => ({
  issue,
  detail,
});
