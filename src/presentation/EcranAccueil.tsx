/**
 * presentation/EcranAccueil.tsx
 * =============================
 * Écran 1 — accueil (EF-00) : identifie le produit avant toute saisie, et
 * porte le SÉLECTEUR DE LANGUE (EF-19) — avant tout le reste, pour que
 * l'usager lise le parcours entier dans la langue choisie.
 *
 * EF-18 vit ici aussi : l'accès à l'instrumentation (écran 8) est un APPUI
 * LONG DE TROIS SECONDES SUR LE LOGO — délibéré, non documenté à l'usager de
 * démonstration, sans aucun chemin visible (arbitrage QA Lead, 24/08 :
 * « cacher plutôt que protéger par mot de passe — un mot de passe attire
 * l'attention et invite à demander ce qu'il y a derrière »).
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { Bouton } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

const APPUI_LONG_INSTRUMENTATION_MS = 3000;

export function EcranAccueil(props: {
  langue: Langue;
  surLangue: (langue: Langue) => void;
  surCommencer: () => void;
  surInstrumentation: () => void;
}) {
  return (
    <View style={styles.conteneur}>
      {/* Sélecteur de langue — EF-19, avant toute autre saisie. */}
      <View style={styles.langues}>
        {(['fr', 'en'] as const).map((langue) => (
          <Pressable
            key={langue}
            onPress={() => props.surLangue(langue)}
            accessibilityRole="button"
            style={[styles.langue, props.langue === langue && styles.langueActive]}
          >
            <Text
              style={[TYPO.detail, props.langue === langue ? styles.langueTexteActif : styles.langueTexte]}
            >
              {langue.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.centre}>
        {/* Le logo — et la porte de l'écran 8 (EF-18). `delayLongPress` porte
            les trois secondes : un effleurement ne déclenche rien. */}
        <Pressable
          onLongPress={props.surInstrumentation}
          delayLongPress={APPUI_LONG_INSTRUMENTATION_MS}
          accessibilityLabel="ReadyCash"
        >
          <Image
            source={require('./actifs/logo-finzuu.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={[TYPO.titre, styles.nom]}>ReadyCash</Text>
        <Text style={[TYPO.corps, styles.slogan]}>{t(props.langue, 'accueil_slogan')}</Text>
      </View>

      <Bouton libelle={t(props.langue, 'accueil_commencer')} surAppui={props.surCommencer} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, padding: ESPACE.bord, backgroundColor: COULEURS.fond },
  langues: { flexDirection: 'row', justifyContent: 'flex-end', gap: ESPACE.serre },
  langue: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COULEURS.fondConsigne,
  },
  langueActive: { backgroundColor: COULEURS.primaire },
  langueTexte: { color: COULEURS.texteSecondaire },
  langueTexteActif: { color: '#FFFFFF' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Le VRAI logo FinZuu (celui du Loader) — grand sur l'accueil, comme
  // demandé le 25/08. Plus de lettre « F » de substitution.
  logo: { width: 132, height: 132 },
  nom: { color: COULEURS.texte, marginTop: ESPACE.bloc },
  slogan: {
    color: COULEURS.texteSecondaire,
    textAlign: 'center',
    marginTop: ESPACE.serre,
    maxWidth: 280,
  },
});
