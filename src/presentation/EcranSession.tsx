/**
 * presentation/EcranSession.tsx
 * =============================
 * Écrans 6 et 7 — les DEUX états du dialogue de session, un seul composant :
 *
 *   poursuite (CON) → texte + champ de saisie + Envoyer/Annuler   (EF-11)
 *   fin (END)       → texte seul + Fermer                          (EF-12)
 *
 * PRÉSENTATION NEUTRE (Stack §2.4, ENF-04 révisé) : carte claire sur fond
 * assombri, typographie sobre — que le partenaire perçoive un dialogue
 * système, sans imiter ni Android ni iOS.
 *
 * Le texte est affiché TEL QUEL (EF-10, INV-SIM-05, CR-09) : la seule
 * transformation — le retrait du préfixe CON/END — a eu lieu dans la couche
 * d'accès. Ici : pas de parsing, pas de mise en forme, pas de traduction
 * (INV-SIM-07). Une `TextInput` à clavier téléphonique pour la sélection
 * d'option, rien de plus.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { Bouton } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

export function EcranSession(props: {
  langue: Langue;
  texte: string;
  poursuite: boolean;
  surSaisie: (saisie: string) => void;
  surFermer: () => void;
}) {
  const [saisie, setSaisie] = useState('');

  return (
    <View style={styles.voile}>
      <View style={styles.carte}>
        <Text style={[TYPO.corps, styles.texte]}>{props.texte}</Text>

        {props.poursuite ? (
          <>
            <TextInput
              value={saisie}
              onChangeText={setSaisie}
              keyboardType="phone-pad"
              autoFocus
              style={styles.champ}
              accessibilityLabel="saisie"
            />
            <View style={styles.actions}>
              <Bouton
                libelle={t(props.langue, 'session_annuler')}
                variante="discret"
                surAppui={props.surFermer}
              />
              <Bouton
                libelle={t(props.langue, 'session_envoyer')}
                desactive={saisie.length === 0}
                surAppui={() => {
                  props.surSaisie(saisie);
                  setSaisie('');
                }}
              />
            </View>
          </>
        ) : (
          <View style={styles.actions}>
            <Bouton libelle={t(props.langue, 'session_fermer')} surAppui={props.surFermer} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: COULEURS.voile,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACE.bord,
  },
  carte: {
    alignSelf: 'stretch',
    backgroundColor: COULEURS.fond,
    borderRadius: 12,
    padding: ESPACE.bord,
  },
  texte: { color: COULEURS.texte, lineHeight: 22 },
  champ: {
    borderBottomWidth: 1,
    borderBottomColor: COULEURS.primaire,
    marginTop: ESPACE.bloc,
    paddingVertical: 6,
    fontSize: 16,
    color: COULEURS.texte,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ESPACE.serre,
    marginTop: ESPACE.bloc,
  },
});
