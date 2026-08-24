/**
 * presentation/EcranEchec.tsx
 * ===========================
 * Les écrans 9 à 13 — UN composant, CINQ variantes (deck, diapo 10).
 *
 * « Chaque échec doit être distinguable des autres. Un message générique
 * empêche de savoir s'il faut appeler le réseau, TNS, ou personne. »
 * Et : « le partenaire ne doit jamais voir un code HTTP ni une trace
 * technique » — le détail brut existe, dans le journal, écran 8.
 *
 * Les cinq textes sont le MOT À MOT du deck, embarqués FR/EN (i18n/textes).
 * Ce composant ne sait pas ce qui a échoué ni où aller ensuite : il affiche
 * la variante qu'on lui donne et remonte l'appui — la navigation appartient
 * à la coordination (Stack §4.2).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Langue } from '../persistance/depot';
import { t, type CleTexte } from '../i18n/textes';
import { Bouton, TitreEcran } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

export type VarianteEchec = 'reseau' | 'serveur' | 'stock' | 'session' | 'bail';

const CLES: Record<VarianteEchec, { titre: CleTexte; message: CleTexte; action: CleTexte }> = {
  reseau: { titre: 'echec_reseau_titre', message: 'echec_reseau_message', action: 'echec_reseau_action' },
  serveur: { titre: 'echec_serveur_titre', message: 'echec_serveur_message', action: 'echec_serveur_action' },
  stock: { titre: 'echec_stock_titre', message: 'echec_stock_message', action: 'echec_stock_action' },
  session: { titre: 'echec_session_titre', message: 'echec_session_message', action: 'echec_session_action' },
  bail: { titre: 'echec_bail_titre', message: 'echec_bail_message', action: 'echec_bail_action' },
};

export function EcranEchec(props: {
  variante: VarianteEchec;
  langue: Langue;
  /** L'unique action de l'écran — Réessayer, Modifier, Fermer ou Continuer
   *  selon la variante. Le SENS de l'action est décidé par l'appelant. */
  surAction: () => void;
}) {
  const cles = CLES[props.variante];
  return (
    <View style={styles.conteneur}>
      <View style={styles.pastille}>
        <Text style={styles.point}>!</Text>
      </View>
      <TitreEcran texte={t(props.langue, cles.titre)} />
      <Text style={[TYPO.corps, styles.message]}>{t(props.langue, cles.message)}</Text>
      <View style={styles.action}>
        <Bouton libelle={t(props.langue, cles.action)} surAppui={props.surAction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACE.bord,
    backgroundColor: COULEURS.fond,
  },
  pastille: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COULEURS.fondConsigne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  point: { fontSize: 28, fontWeight: '700', color: COULEURS.destructif },
  message: {
    color: COULEURS.texteSecondaire,
    textAlign: 'center',
    marginTop: ESPACE.serre,
    maxWidth: 280,
  },
  action: { alignSelf: 'stretch', marginTop: ESPACE.bloc },
});
