/**
 * presentation/tonalites.ts
 * =========================
 * La façade JS des tonalités DTMF (demande Direction, 27/08).
 *
 * Le module natif n'existe que sur Android. Sur iOS — et dans les tests, où
 * aucun natif n'est chargé — l'appel ne fait RIEN : un clavier muet reste un
 * clavier utilisable, alors qu'une exception à chaque touche rendrait l'écran
 * inutilisable. Le son est un agrément, jamais une dépendance.
 */

import { NativeModules, Platform } from 'react-native';

interface ModuleTonalites {
  jouer(touche: string): void;
}

const natif: ModuleTonalites | undefined =
  Platform.OS === 'android' ? NativeModules.Tonalites : undefined;

/** Joue la tonalité DTMF de cette touche. Silencieuse si le natif est absent. */
export function jouerTonalite(touche: string): void {
  try {
    natif?.jouer(touche);
  } catch {
    // Voir l'en-tête : jamais une touche perdue pour un son manqué.
  }
}
