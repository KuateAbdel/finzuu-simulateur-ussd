/**
 * presentation/EcranInstrumentation.tsx
 * =====================================
 * Écran 8 — l'instrumentation qualité (EF-16, EF-17). Atteint UNIQUEMENT par
 * l'appui long de trois secondes sur le logo (EF-18) — aucun chemin visible.
 *
 * Le journal montre les échanges BRUTS, pas une version reformulée (deck,
 * diapo 9) : « c'est ce qui permet de dire si un défaut vient de
 * l'application ». Barres par direction — émission d'un côté, réception de
 * l'autre — pour une lecture immédiate du sens de l'échange.
 *
 * La rupture de liaison est en ROUGE, EN BAS, ISOLÉE : action destructive
 * éloignée du reste, et confirmée — elle rend le numéro au pool côté serveur
 * (EF-17, contrat §4) avant d'effacer l'état local.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Echange } from '../acces/clientAttribution';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { Bouton, TitreEcran } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

export function EcranInstrumentation(props: {
  langue: Langue;
  journal: readonly Echange[];
  surRompre: () => void;
  surRetour: () => void;
}) {
  const [confirmation, setConfirmation] = useState(false);

  return (
    <View style={styles.conteneur}>
      <TitreEcran texte={t(props.langue, 'journal_titre')} />

      <ScrollView style={styles.journal}>
        {props.journal.length === 0 ? (
          <Text style={[TYPO.detail, { color: COULEURS.texteSecondaire }]}>—</Text>
        ) : (
          props.journal.map((echange, index) => (
            <View
              key={index}
              style={[
                styles.ligne,
                {
                  borderLeftColor:
                    echange.direction === 'emission'
                      ? COULEURS.confirmation
                      : COULEURS.texteSecondaire,
                },
              ]}
            >
              <Text style={[TYPO.detail, { color: COULEURS.texteSecondaire }]}>
                {echange.horodatage.slice(11, 19)} · {echange.direction}
              </Text>
              <Text style={[TYPO.detail, styles.contenu]}>{echange.contenu}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.pied}>
        {confirmation ? (
          <>
            <Text style={[TYPO.detail, styles.avertissement]}>
              {t(props.langue, 'journal_rompre_confirmation')}
            </Text>
            <Bouton
              libelle={t(props.langue, 'journal_rompre')}
              variante="destructif"
              surAppui={props.surRompre}
            />
            <Bouton
              libelle={t(props.langue, 'session_annuler')}
              variante="discret"
              surAppui={() => setConfirmation(false)}
            />
          </>
        ) : (
          <>
            <Bouton
              libelle={t(props.langue, 'journal_rompre')}
              variante="destructif"
              surAppui={() => setConfirmation(true)}
            />
            <Bouton
              libelle={t(props.langue, 'session_fermer')}
              variante="discret"
              surAppui={props.surRetour}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, padding: ESPACE.bord, backgroundColor: COULEURS.fond },
  journal: { flex: 1, marginTop: ESPACE.bloc },
  ligne: {
    borderLeftWidth: 3,
    paddingLeft: ESPACE.serre,
    marginBottom: ESPACE.serre,
  },
  contenu: { color: COULEURS.texte, fontFamily: 'monospace' },
  pied: { marginTop: ESPACE.bloc, gap: ESPACE.serre },
  avertissement: { color: COULEURS.destructif, textAlign: 'center' },
});
