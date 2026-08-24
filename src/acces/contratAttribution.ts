/**
 * acces/contratAttribution.ts
 * ===========================
 * Les TYPES du contrat d'attribution — FZ-CONTRAT-ATTRIB-2026-001 v0.3,
 * VALIDÉ le 24/08 et figé.
 *
 * Ce fichier est une TRANSCRIPTION du contrat, pas une interprétation :
 * chaque type correspond à un corps de requête ou de réponse du document.
 * Si le contrat évolue (révision numérotée), ce fichier évolue avec lui —
 * jamais l'inverse.
 *
 * Aucune logique ici : des formes, rien d'autre.
 */

/** Un critère de profil — code du référentiel + libellés d'affichage.
 *  `INV-SIM-07` : l'application CHOISIT le libellé (fr/en), elle n'en
 *  produit aucun. */
export interface Critere {
  code: string;
  libelle_fr: string;
  libelle_en: string;
}

/** Une combinaison de la disponibilité. Contrat §1 : exhaustive — une
 *  combinaison à zéro APPARAÎT avec `libres: 0`, jamais masquée. L'écran 2
 *  la grise, il ne la cache pas. */
export interface Disponibilite {
  pays: string;
  genre: string;
  categorie: string;
  libres: number;
}

/** Réponse de `GET /api/v1/attribution/criteres`. */
export interface ReponseCriteres {
  pays: Critere[];
  genres: Critere[];
  categories: Critere[];
  disponibilite: Disponibilite[];
  releve_le: string;
}

/** Corps de `POST /api/v1/attribution/attributions`. */
export interface DemandeAttribution {
  pays: string;
  genre: string;
  categorie: string;
}

/** Réponse `201` de l'attribution — et corps `200` de la vérification
 *  (`GET /attributions/{id}`, contrat §3) : le même bail. */
export interface Bail {
  /** Poignée opaque — seule clé de la vérification et de la libération. */
  attribution_id: string;
  /** Format BRUT, indicatif compris. Le formatage `699 000 006` est une
   *  affaire de présentation, jamais de transport. */
  msisdn: string;
  /** Fixé par le SERVEUR. Fait foi contre l'horloge de l'appareil. */
  expire_le: string;
  attribue_le: string;
}

/** Les codes d'échec du contrat §5 — la SEULE valeur sur laquelle
 *  l'application branche. `message` et `details` vont au journal de
 *  l'écran 8, jamais devant le partenaire. */
export type CodeEchec =
  | 'STOCK_EPUISE'
  | 'CRITERE_INVALIDE'
  | 'CLE_IDEMPOTENCE_REQUISE'
  | 'ERREUR_SERVEUR';

/** Corps d'erreur uniforme du contrat §5. */
export interface CorpsErreur {
  code: CodeEchec;
  message: string;
  details?: Record<string, unknown>;
}
