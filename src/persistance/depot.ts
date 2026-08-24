/**
 * persistance/depot.ts
 * ====================
 * La couche de persistance — Stack §4.2 : « numéro attribué et date
 * d'échéance. Ne contient jamais : aucune donnée personnelle autre que le
 * numéro. »
 *
 * QUATRE valeurs, pas une de plus (INV-SIM-06, révisé 23/08 pour la langue) :
 *
 *   msisdn           la carte SIM virtuelle (EF-06)
 *   expire_le        l'échéance FIXÉE PAR LE SERVEUR (jamais calculée ici)
 *   attribution_id   la poignée du bail — vérification et libération
 *   langue           le choix d'interface (EF-21)
 *
 * L'identifiant de session n'apparaît PAS ici : « le temps d'une session,
 * jamais persisté » (Stack §4.3) — il vit dans la coordination.
 *
 * Le stockage est `AsyncStorage` : survit à la fermeture et au redémarrage
 * (EF-06, CR-07), local à l'application, non chiffré — assumé : un msisdn de
 * démonstration n'est pas un secret, et INV-SIM-06 borne ce qui s'y trouve.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Le bail tel que l'appareil le connaît. */
export interface BailLocal {
  msisdn: string;
  /** ISO 8601 UTC, copié de la réponse serveur — l'app la COMPARE à son
   *  horloge (EF-15) mais ne la produit jamais. En cas de divergence, la
   *  route de vérification (contrat §3) tranche au lancement. */
  expire_le: string;
  attribution_id: string;
}

export type Langue = 'fr' | 'en';

const CLE_BAIL = 'simulateur.bail';
const CLE_LANGUE = 'simulateur.langue';

export async function lireBail(): Promise<BailLocal | null> {
  const brut = await AsyncStorage.getItem(CLE_BAIL);
  if (brut === null) return null;
  try {
    const bail = JSON.parse(brut) as BailLocal;
    // Un enregistrement mutilé vaut « pas de bail » : la phase 1 reprend,
    // l'attribution serveur reste intacte et re-vérifiable — jamais un écran
    // qui plante sur un JSON corrompu.
    if (!bail.msisdn || !bail.expire_le || !bail.attribution_id) return null;
    return bail;
  } catch {
    return null;
  }
}

export async function ecrireBail(bail: BailLocal): Promise<void> {
  await AsyncStorage.setItem(CLE_BAIL, JSON.stringify(bail));
}

/** Efface le bail local. N'EFFACE RIEN côté serveur — la libération (EF-17)
 *  passe par la route DELETE, et c'est la coordination qui ordonne les deux
 *  gestes : serveur d'abord, local ensuite. */
export async function effacerBail(): Promise<void> {
  await AsyncStorage.removeItem(CLE_BAIL);
}

/** La TENTATIVE d'attribution en cours — révision 0.3.1 du contrat.
 *
 *  La clé d'idempotence est PERSISTÉE dès son émission et effacée à
 *  réception du 201. Sans cela, une application tuée entre l'émission et la
 *  réponse — système, batterie, fermeture — perdait la clé : l'usager
 *  recommençait avec une nouvelle, le serveur tirait un SECOND client, et le
 *  premier restait marqué sept jours. Le trou que la clé fermait, rouvert au
 *  redémarrage.
 *
 *  Le profil voyage avec la clé : au redémarrage, la clé n'est réutilisée
 *  que si l'usager redemande le MÊME profil — une clé rejouée sur un autre
 *  profil servirait l'ancien tirage (contrat §2).
 *
 *  Cinq valeurs transitoirement, quatre en régime établi (INV-SIM-06 : une
 *  clé n'est pas une donnée personnelle, c'est un numéro de tentative). */
export interface TentativeAttribution {
  cle: string;
  profil: { pays: string; genre: string; categorie: string };
}

const CLE_TENTATIVE = 'simulateur.tentative';

export async function lireTentative(): Promise<TentativeAttribution | null> {
  const brut = await AsyncStorage.getItem(CLE_TENTATIVE);
  if (brut === null) return null;
  try {
    const tentative = JSON.parse(brut) as TentativeAttribution;
    if (!tentative.cle || !tentative.profil) return null;
    return tentative;
  } catch {
    return null;
  }
}

export async function ecrireTentative(tentative: TentativeAttribution): Promise<void> {
  await AsyncStorage.setItem(CLE_TENTATIVE, JSON.stringify(tentative));
}

export async function effacerTentative(): Promise<void> {
  await AsyncStorage.removeItem(CLE_TENTATIVE);
}

/** La langue survit au bail : l'usager qui rompt sa liaison ne rebascule pas
 *  en anglais. Défaut : français — le premier écran d'accueil la propose de
 *  toute façon (EF-19). */
export async function lireLangue(): Promise<Langue> {
  const brut = await AsyncStorage.getItem(CLE_LANGUE);
  return brut === 'en' ? 'en' : 'fr';
}

export async function ecrireLangue(langue: Langue): Promise<void> {
  await AsyncStorage.setItem(CLE_LANGUE, langue);
}
