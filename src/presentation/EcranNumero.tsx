/**
 * presentation/EcranNumero.tsx
 * ============================
 * Écran 4 — remise du numéro (EF-05, EF-06) : l'affiche LISIBLEMENT, invite
 * à le noter, propose la copie. C'est la seule fois où l'usager VOIT son
 * numéro — ensuite la carte SIM virtuelle le porte pour lui (principe 3.1).
 *
 * Le FORMATAGE est ici, et seulement ici : le transport ne connaît que le
 * msisdn brut (contrat §2 — « un seul format circule »). `699 000 006` est
 * une affaire d'yeux, pas de réseau.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { Bouton, Consigne, TitreEcran } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

/** Groupe le numéro par trois pour la lecture — AUCUNE autre transformation,
 *  et jamais réinjecté vers le réseau. */
export function formaterPourLecture(msisdn: string): string {
  return msisdn.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function EcranNumero(props: {
  langue: Langue;
  msisdn: string;
  surContinuer: () => void;
}) {
  return (
    <View style={styles.conteneur}>
      <View style={styles.centre}>
        <View style={styles.coche}>
          <Text style={styles.cocheTexte}>✓</Text>
        </View>
        <TitreEcran texte={t(props.langue, 'numero_titre')} />
        <Text style={[TYPO.numero, styles.numero]}>{formaterPourLecture(props.msisdn)}</Text>
        <Bouton
          libelle={`⧉  ${t(props.langue, 'numero_copier')}`}
          variante="discret"
          surAppui={() => Clipboard.setString(props.msisdn)}
        />
        <Consigne texte={t(props.langue, 'numero_consigne')} />
      </View>
      <Bouton libelle={t(props.langue, 'numero_continuer')} surAppui={props.surContinuer} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, padding: ESPACE.bord, backgroundColor: COULEURS.fond },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coche: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COULEURS.confirmation,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocheTexte: { fontSize: 28, color: '#FFFFFF', fontWeight: '700' },
  numero: { color: COULEURS.texte, marginVertical: ESPACE.bloc },
});
