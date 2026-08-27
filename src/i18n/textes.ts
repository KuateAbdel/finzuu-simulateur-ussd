/**
 * i18n/textes.ts
 * ==============
 * Les textes d'INTERFACE, embarqués en français et en anglais — CDC §5.4 :
 * « la langue de l'interface incombe à l'application, les textes sont
 * embarqués ». `EF-20` : la langue retenue s'applique à l'intégralité des
 * écrans propres à l'application, aucun texte ne demeure dans une autre
 * langue — `CR-14` le vérifie par un parcours complet dans chaque langue.
 *
 * CE QUI N'EST PAS ICI, et n'y sera jamais : le moindre libellé de MENU.
 * Les menus appartiennent au service (INV-SIM-03) ; leur langue se règle
 * dans le parcours (« Changer Langue »), l'application ne traduit rien
 * (INV-SIM-07).
 *
 * Les messages des écrans 9 à 13 sont le mot à mot du deck (diapo 10) — le
 * partenaire ne voit jamais un code HTTP ni une trace technique.
 */

import type { Langue } from '../persistance/depot';

const FR = {
  // Écran 1 — accueil (EF-00, EF-19)
  accueil_slogan: 'Accédez à vos services financiers depuis n’importe quel téléphone',
  accueil_commencer: 'Commencer',

  // Écran 2 — profil (EF-01..03)
  profil_titre: 'Votre profil',
  profil_consigne: 'Ces informations servent à vous attribuer un compte de démonstration',
  profil_pays: 'Pays',
  profil_genre: 'Genre',
  profil_categorie: 'Catégorie',
  profil_valider: 'Obtenir un numéro',
  profil_choisir: 'Choisir',
  profil_indisponible: 'Aucun compte disponible pour cette combinaison',

  // Écran 3 — attribution (EF-04)
  attribution_titre: 'Attribution en cours',
  attribution_attente: 'Recherche d’un compte correspondant à votre profil',
  operation_titre: 'Un instant',
  operation_attente: 'Opération en cours',

  // Écran 4 — numéro attribué (EF-05, EF-06)
  numero_titre: 'Votre numéro',
  numero_consigne: 'Notez ce numéro : il est votre identité pour les sept prochains jours.',
  numero_copier: 'Copier',
  numero_continuer: 'Continuer',

  // Écran 5 — composition (EF-08)
  composition_consigne: 'Composez {code} puis appeler',
  composition_appeler: 'Appeler',

  // Écrans 6 et 7 — session (EF-10..12)
  session_envoyer: 'Envoyer',
  session_fermer: 'Fermer',
  session_annuler: 'Annuler',

  // Écran 8 — instrumentation (EF-16, EF-17)
  journal_titre: 'Journal technique',
  journal_rompre: 'Rompre la liaison',
  journal_rompre_confirmation: 'Le numéro retournera au pool et une nouvelle attribution sera nécessaire.',

  // Écrans 9 à 13 — états d'échec (ENF-05, EF-15) — mot à mot du deck
  echec_reseau_titre: 'Pas de connexion',
  echec_reseau_message: 'Vérifiez votre connexion et réessayez.',
  echec_reseau_action: 'Réessayer',
  echec_serveur_titre: 'Service indisponible',
  echec_serveur_message: 'Le service ne répond pas correctement.',
  echec_serveur_action: 'Réessayer',
  echec_stock_titre: 'Aucun compte disponible',
  echec_stock_message: 'Aucun compte ne correspond à ce profil.',
  echec_stock_action: 'Modifier',
  echec_session_titre: 'Session expirée',
  echec_session_message: 'Votre session a pris fin. Composez à nouveau.',
  echec_session_action: 'Fermer',
  echec_bail_titre: 'Numéro expiré',
  echec_bail_message: 'Vos sept jours sont écoulés. Un nouveau numéro va vous être attribué.',
  echec_bail_action: 'Continuer',
} as const;

export type CleTexte = keyof typeof FR;

const EN: Record<CleTexte, string> = {
  accueil_slogan: 'Access your financial services from any phone',
  accueil_commencer: 'Get started',

  profil_titre: 'Your profile',
  profil_consigne: 'This information is used to assign you a demonstration account',
  profil_pays: 'Country',
  profil_genre: 'Gender',
  profil_categorie: 'Category',
  profil_valider: 'Get a number',
  profil_choisir: 'Select',
  profil_indisponible: 'No account available for this combination',

  attribution_titre: 'Assignment in progress',
  attribution_attente: 'Looking for an account matching your profile',
  operation_titre: 'One moment',
  operation_attente: 'Operation in progress',

  numero_titre: 'Your number',
  numero_consigne: 'Write this number down: it is your identity for the next seven days.',
  numero_copier: 'Copy',
  numero_continuer: 'Continue',

  composition_consigne: 'Dial {code} then Call',
  composition_appeler: 'Call',

  session_envoyer: 'Send',
  session_fermer: 'Close',
  session_annuler: 'Cancel',

  journal_titre: 'Technical log',
  journal_rompre: 'Break the link',
  journal_rompre_confirmation: 'The number will return to the pool and a new assignment will be required.',

  echec_reseau_titre: 'No connection',
  echec_reseau_message: 'Check your connection and try again.',
  echec_reseau_action: 'Retry',
  echec_serveur_titre: 'Service unavailable',
  echec_serveur_message: 'The service is not responding correctly.',
  echec_serveur_action: 'Retry',
  echec_stock_titre: 'No account available',
  echec_stock_message: 'No account matches this profile.',
  echec_stock_action: 'Change',
  echec_session_titre: 'Session expired',
  echec_session_message: 'Your session has ended. Dial again.',
  echec_session_action: 'Close',
  echec_bail_titre: 'Number expired',
  echec_bail_message: 'Your seven days are up. A new number will be assigned to you.',
  echec_bail_action: 'Continue',
};

const TEXTES: Record<Langue, Record<CleTexte, string>> = { fr: FR, en: EN };

/** L'unique porte d'accès aux textes : un composant qui écrirait une chaîne
 *  en dur contournerait EF-20 — la revue de code le cherche ici. */
export function t(langue: Langue, cle: CleTexte): string {
  return TEXTES[langue][cle];
}
