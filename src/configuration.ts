/**
 * configuration.ts
 * ================
 * LE point de bascule entre les environnements — contrat §0 : « le serveur
 * local de développement et le Loader en production doivent être
 * interchangeables par un SIMPLE CHANGEMENT D'ADRESSE ». La bascule est une
 * adresse, jamais une branche de code.
 *
 * AUCUNE adresse n'est écrite ici, ni nulle part dans les sources : elles
 * vivent dans le fichier .env — jamais versionné, gabarit dans .env.example.
 * Ce module ne fait que RELIRE l'environnement et le typer. Changer
 * d'environnement = changer le .env et recompiler ; le code ne bouge pas.
 */

import {
  ATTRIBUTION_BASE_URL,
  CODE_USSD as CODE_USSD_ENV,
  REQUEST_TIMEOUT_MS,
  USSD_BASE_URL,
} from '@env';
import type { Configuration } from './coordination/machine';

/** Le délai vient du .env en chaîne ; un contenu illisible retombe sur
 *  15 000 ms plutôt que de produire un NaN silencieux qui désactiverait
 *  tout délai d'attente. */
function delaiMs(brut: string): number {
  const valeur = Number.parseInt(brut, 10);
  return Number.isFinite(valeur) && valeur > 0 ? valeur : 15000;
}

export const CONFIGURATION: Configuration = {
  baseAttribution: ATTRIBUTION_BASE_URL,
  baseUssd: USSD_BASE_URL,
  delaiRequeteMs: delaiMs(REQUEST_TIMEOUT_MS),
};

/**
 * Le CODE À COMPOSER, affiché à l'usager avant sa saisie (demande Direction
 * du 27/08 : sur l'écran de composition, rien ne lui disait quoi taper).
 *
 * Il vit dans le `.env` au même titre que les adresses, et pour la même
 * raison : un code écrit en dur dans un écran devient un mensonge le jour où
 * l'opérateur en change, et personne ne pense à relire un écran pour ça.
 *
 * Vide ou absent, la consigne ne s'affiche PAS — l'écran reste utilisable.
 * Afficher « Composez  » sans code serait pire que ne rien afficher.
 */
export const CODE_USSD: string = (CODE_USSD_ENV ?? '').trim();
