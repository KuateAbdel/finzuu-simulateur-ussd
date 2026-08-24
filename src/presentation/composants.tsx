/**
 * presentation/composants.tsx
 * ===========================
 * Les briques partagées de la présentation. SANS MÉMOIRE et sans réseau
 * (Stack §4.1/4.2) : tout vient des props, tout remonte par des rappels.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COULEURS, ESPACE, TYPO } from './theme';

export function Bouton(props: {
  libelle: string;
  surAppui: () => void;
  variante?: 'primaire' | 'confirmation' | 'destructif' | 'discret';
  desactive?: boolean;
}) {
  const fond =
    props.variante === 'confirmation'
      ? COULEURS.confirmation
      : props.variante === 'destructif'
        ? COULEURS.destructif
        : props.variante === 'discret'
          ? 'transparent'
          : COULEURS.primaire;
  return (
    <Pressable
      onPress={props.surAppui}
      disabled={props.desactive}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, opacity: props.desactive ? 0.4 : pressed ? 0.75 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={props.libelle}
    >
      <Text
        style={[
          TYPO.corps,
          styles.boutonTexte,
          props.variante === 'discret' && { color: COULEURS.texteSecondaire },
        ]}
      >
        {props.libelle}
      </Text>
    </Pressable>
  );
}

export function TitreEcran(props: { texte: string }) {
  return <Text style={[TYPO.titre, styles.titre]}>{props.texte}</Text>;
}

export function Consigne(props: { texte: string }) {
  return (
    <View style={styles.consigne}>
      <Text style={[TYPO.corps, { color: COULEURS.texte }]}>{props.texte}</Text>
    </View>
  );
}

export function Attente(props: { titre: string; message: string }) {
  return (
    <View style={styles.centre}>
      <ActivityIndicator size="large" color={COULEURS.primaire} />
      <TitreEcran texte={props.titre} />
      <Text style={[TYPO.corps, styles.secondaire]}>{props.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bouton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: ESPACE.bloc,
    alignItems: 'center',
    marginTop: ESPACE.serre,
  },
  boutonTexte: { color: '#FFFFFF', fontWeight: '600' },
  titre: { color: COULEURS.texte, marginTop: ESPACE.bloc, textAlign: 'center' },
  consigne: {
    backgroundColor: COULEURS.fondConsigne,
    borderRadius: 8,
    padding: ESPACE.bloc,
    marginVertical: ESPACE.bloc,
  },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACE.bord },
  secondaire: { color: COULEURS.texteSecondaire, marginTop: ESPACE.serre, textAlign: 'center' },
});
