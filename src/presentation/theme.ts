/**
 * presentation/theme.ts
 * =====================
 * Le système de design — deck, diapo 11, transcrit tel quel. Aucune couleur
 * ni taille en dur dans un écran : tout passe par ici, sinon la revue ne
 * peut pas prouver la conformité au deck.
 */

export const COULEURS = {
  /** Primaire — actions, sélection. */
  primaire: '#534AB7',
  /** Confirmation — appel, succès. */
  confirmation: '#1D9E75',
  /** Destructif — rupture de liaison (écran 8, isolée en bas). */
  destructif: '#A32D2D',
  /** Fond de consigne. */
  fondConsigne: '#F1EFE8',
  /** Texte principal. */
  texte: '#2C2C2A',
  /** Texte secondaire. */
  texteSecondaire: '#888780',
  /** Fond d'écran. */
  fond: '#FFFFFF',
  /** Fond assombri derrière le dialogue de session (Stack §2.4 : carte
   *  claire sur fond assombri — la présentation NEUTRE, ni Android ni iOS). */
  voile: 'rgba(0, 0, 0, 0.55)',
} as const;

export const TYPO = {
  /** Numéro attribué — 27 pt, chasse fixe. `monospace` existe sur Android,
   *  `Menlo` sur iOS : le Stack §3 demande une police embarquée à terme ;
   *  d'ici là, la chasse fixe est garantie par plateforme. */
  numero: { fontSize: 27, fontFamily: 'monospace' as string, letterSpacing: 2 },
  /** Titre d'écran — 18 pt demi-gras. */
  titre: { fontSize: 18, fontWeight: '600' as const },
  /** Corps — 14 pt. */
  corps: { fontSize: 14 },
  /** Détail (journal, légendes). */
  detail: { fontSize: 12 },
} as const;

export const ESPACE = {
  bord: 20,
  bloc: 16,
  serre: 8,
} as const;
