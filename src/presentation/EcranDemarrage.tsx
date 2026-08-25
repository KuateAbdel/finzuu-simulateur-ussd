/**
 * presentation/EcranDemarrage.tsx
 * ===============================
 * Écran 0 — le démarrage (FZ-DIAG-BAIL-2026-001, correction du 25/08).
 *
 * NON INTERACTIF, par construction : aucun Pressable, aucun bouton. Il ne
 * vit que le temps de la LECTURE LOCALE du bail (quelques millisecondes) —
 * jamais le temps d'un appel réseau. Si cet écran dure une seconde, c'est
 * un bug de séquence, pas un écran d'attente : la vérification serveur
 * part APRÈS lui, en arrière-plan (machine.verifierBailEnFond).
 *
 * Le logo est le vrai logo FinZuu — celui du Loader — pas une lettre.
 */

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COULEURS } from './theme';

export function EcranDemarrage() {
  return (
    <View style={styles.conteneur}>
      <Image
        source={require('./actifs/logo-finzuu.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="FinZuu"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COULEURS.fond,
  },
  logo: { width: 160, height: 160 },
});
