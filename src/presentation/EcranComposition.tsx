/**
 * presentation/EcranComposition.tsx
 * =================================
 * Écran 5 — la composition (EF-08) : un clavier téléphonique reproduit,
 * astérisque et dièse compris. La contrainte technique du CDC §9 est la
 * raison d'être de cet écran : une app tierce ne peut pas intercepter une
 * composition faite sur le clavier système — on la reproduit donc DANS
 * l'application.
 *
 * Le numéro attribué est affiché en rappel discret — affiché, jamais
 * saisissable (INV-SIM-04, CR-08 : « aucun écran ne permet la saisie
 * manuelle du numéro »).
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { formaterPourLecture } from './EcranNumero';
import { COULEURS, ESPACE, TYPO } from './theme';

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

export function EcranComposition(props: {
  langue: Langue;
  msisdn: string;
  surAppel: (code: string) => void;
}) {
  const [code, setCode] = useState('');

  return (
    <View style={styles.conteneur}>
      {/* Rappel du numéro attribué — un TEXTE, pas un champ. */}
      <Text style={[TYPO.detail, styles.rappel]}>{formaterPourLecture(props.msisdn)}</Text>

      <Text style={[TYPO.numero, styles.saisie]} numberOfLines={1} adjustsFontSizeToFit>
        {code || ' '}
      </Text>

      <View style={styles.clavier}>
        {TOUCHES.map((touche) => (
          <Pressable
            key={touche}
            onPress={() => setCode((c) => c + touche)}
            accessibilityRole="button"
            accessibilityLabel={touche}
            style={({ pressed }) => [styles.touche, pressed && styles.touchePressee]}
          >
            <Text style={styles.toucheTexte}>{touche}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setCode((c) => c.slice(0, -1))}
          accessibilityRole="button"
          accessibilityLabel="effacer"
          style={styles.effacer}
        >
          <Text style={[TYPO.titre, { color: COULEURS.texteSecondaire }]}>⌫</Text>
        </Pressable>
        <Pressable
          onPress={() => code.length > 0 && props.surAppel(code)}
          disabled={code.length === 0}
          accessibilityRole="button"
          accessibilityLabel={t(props.langue, 'composition_appeler')}
          style={[styles.appel, code.length === 0 && styles.appelInactif]}
        >
          <Text style={styles.appelTexte}>{t(props.langue, 'composition_appeler')}</Text>
        </Pressable>
        {/* Équilibre visuel du rang — même emprise que la touche effacer. */}
        <View style={styles.effacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: ESPACE.bord,
    backgroundColor: COULEURS.fond,
    justifyContent: 'flex-end',
  },
  rappel: { color: COULEURS.texteSecondaire, textAlign: 'center' },
  saisie: {
    color: COULEURS.texte,
    textAlign: 'center',
    marginVertical: ESPACE.bloc,
    minHeight: 40,
  },
  clavier: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ESPACE.bloc,
  },
  touche: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COULEURS.fondConsigne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchePressee: { backgroundColor: COULEURS.primaire },
  toucheTexte: { fontSize: 26, color: COULEURS.texte },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACE.bloc,
    marginTop: ESPACE.bloc,
    marginBottom: ESPACE.bord,
  },
  effacer: { width: 72, alignItems: 'center' },
  appel: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COULEURS.confirmation,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appelInactif: { opacity: 0.4 },
  appelTexte: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
});
