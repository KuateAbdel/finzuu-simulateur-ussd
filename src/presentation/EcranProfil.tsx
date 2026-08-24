/**
 * presentation/EcranProfil.tsx
 * ============================
 * Écran 2 — profil (EF-01, EF-02, EF-03) : trois LISTES FERMÉES, aucune
 * saisie libre (CR-04), aucun champ de numéro (CR-08, INV-SIM-04).
 *
 * Les listes viennent du serveur (contrat §1) — l'app ne fige RIEN. Les
 * libellés existent en deux langues dans la réponse ; l'app CHOISIT, elle ne
 * traduit pas (INV-SIM-07).
 *
 * La disponibilité GRISE, elle ne masque pas (contrat §8, tranché 24/08) :
 * une combinaison à `libres: 0` reste visible et inerte — l'usager comprend
 * que le profil existe mais est épuisé, au lieu de chercher une option
 * disparue.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Critere, ReponseCriteres } from '../acces/contratAttribution';
import type { Langue } from '../persistance/depot';
import { t } from '../i18n/textes';
import { Bouton, Consigne, TitreEcran } from './composants';
import { COULEURS, ESPACE, TYPO } from './theme';

function libelle(critere: Critere, langue: Langue): string {
  return langue === 'en' ? critere.libelle_en : critere.libelle_fr;
}

function Rangee(props: {
  titre: string;
  criteres: Critere[];
  langue: Langue;
  choix: string | null;
  surChoix: (code: string) => void;
  /** `null` = pas encore restreint par les choix amont ; sinon l'ensemble
   *  des codes encore pourvus (`libres > 0`). */
  pourvus: Set<string> | null;
}) {
  return (
    <View style={styles.rangee}>
      <Text style={[TYPO.detail, styles.etiquette]}>{props.titre}</Text>
      <View style={styles.options}>
        {props.criteres.map((critere) => {
          const epuise = props.pourvus !== null && !props.pourvus.has(critere.code);
          const actif = props.choix === critere.code;
          return (
            <Pressable
              key={critere.code}
              onPress={() => props.surChoix(critere.code)}
              disabled={epuise}
              accessibilityRole="button"
              accessibilityState={{ selected: actif, disabled: epuise }}
              style={[styles.option, actif && styles.optionActive, epuise && styles.optionEpuisee]}
            >
              <Text
                style={[
                  TYPO.corps,
                  actif ? styles.texteActif : epuise ? styles.texteEpuise : styles.texteOption,
                ]}
              >
                {libelle(critere, props.langue)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EcranProfil(props: {
  langue: Langue;
  criteres: ReponseCriteres;
  surValider: (choix: { pays: string; genre: string; categorie: string }) => void;
}) {
  const [pays, setPays] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [categorie, setCategorie] = useState<string | null>(null);

  // La disponibilité restreint en CASCADE : les pays pourvus tout court,
  // puis les genres pourvus POUR ce pays, puis les catégories pour le
  // couple. Un choix amont modifié invalide l'aval s'il n'est plus pourvu.
  const dispo = props.criteres.disponibilite;
  const paysPourvus = useMemo(
    () => new Set(dispo.filter((d) => d.libres > 0).map((d) => d.pays)),
    [dispo],
  );
  const genresPourvus = useMemo(
    () =>
      pays === null
        ? null
        : new Set(dispo.filter((d) => d.pays === pays && d.libres > 0).map((d) => d.genre)),
    [dispo, pays],
  );
  const categoriesPourvues = useMemo(
    () =>
      pays === null || genre === null
        ? null
        : new Set(
            dispo
              .filter((d) => d.pays === pays && d.genre === genre && d.libres > 0)
              .map((d) => d.categorie),
          ),
    [dispo, pays, genre],
  );

  const complet =
    pays !== null &&
    genre !== null &&
    categorie !== null &&
    (categoriesPourvues?.has(categorie) ?? false);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <TitreEcran texte={t(props.langue, 'profil_titre')} />
      <Consigne texte={t(props.langue, 'profil_consigne')} />

      <Rangee
        titre={t(props.langue, 'profil_pays')}
        criteres={props.criteres.pays}
        langue={props.langue}
        choix={pays}
        pourvus={paysPourvus}
        surChoix={(code) => {
          setPays(code);
          // Un choix amont change : l'aval repart à zéro — pas de sélection
          // fantôme sur une combinaison qui n'existe plus.
          setGenre(null);
          setCategorie(null);
        }}
      />
      <Rangee
        titre={t(props.langue, 'profil_genre')}
        criteres={props.criteres.genres}
        langue={props.langue}
        choix={genre}
        pourvus={genresPourvus}
        surChoix={(code) => {
          setGenre(code);
          setCategorie(null);
        }}
      />
      <Rangee
        titre={t(props.langue, 'profil_categorie')}
        criteres={props.criteres.categories}
        langue={props.langue}
        choix={categorie}
        pourvus={categoriesPourvues}
        surChoix={setCategorie}
      />

      <Bouton
        libelle={t(props.langue, 'profil_valider')}
        desactive={!complet}
        surAppui={() => {
          if (pays && genre && categorie) {
            props.surValider({ pays, genre, categorie });
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: ESPACE.bord },
  rangee: { marginBottom: ESPACE.bloc },
  etiquette: {
    color: COULEURS.texteSecondaire,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ESPACE.serre,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACE.serre },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COULEURS.fondConsigne,
  },
  optionActive: { backgroundColor: COULEURS.primaire },
  optionEpuisee: { opacity: 0.35 },
  texteOption: { color: COULEURS.texte },
  texteActif: { color: '#FFFFFF' },
  texteEpuise: { color: COULEURS.texteSecondaire },
});
