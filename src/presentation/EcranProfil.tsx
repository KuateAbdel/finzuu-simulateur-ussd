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
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  invite: string;
  criteres: Critere[];
  langue: Langue;
  choix: string | null;
  surChoix: (code: string) => void;
  /** `null` = pas encore restreint par les choix amont ; sinon l'ensemble
   *  des codes encore pourvus (`libres > 0`). */
  pourvus: Set<string> | null;
}) {
  // MENU DÉROULANT (exigence QA 25/08) : un champ fermé qui OUVRE une liste,
  // pas des pastilles étalées. La liste reste FERMÉE et servie par le
  // serveur (CR-04) ; l'épuisé reste VISIBLE et grisé, jamais masqué
  // (contrat §8, tranché 24/08).
  const [ouverte, setOuverte] = useState(false);
  const choisi = props.criteres.find((c) => c.code === props.choix) ?? null;
  return (
    <View style={styles.rangee}>
      <Text style={[TYPO.detail, styles.etiquette]}>{props.titre}</Text>
      <Pressable
        onPress={() => setOuverte(true)}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouverte }}
        style={styles.champ}
      >
        <Text style={[TYPO.corps, choisi ? styles.texteChamp : styles.texteInvite]}>
          {choisi ? libelle(choisi, props.langue) : props.invite}
        </Text>
        <Text style={styles.chevron}>{'\u25BE'}</Text>
      </Pressable>
      <Modal
        visible={ouverte}
        transparent
        animationType="fade"
        onRequestClose={() => setOuverte(false)}
      >
        <Pressable style={styles.voile} onPress={() => setOuverte(false)}>
          <View style={styles.carte}>
            <Text style={[TYPO.detail, styles.etiquette]}>{props.titre}</Text>
            {props.criteres.map((critere) => {
              const epuise = props.pourvus !== null && !props.pourvus.has(critere.code);
              const actif = props.choix === critere.code;
              return (
                <Pressable
                  key={critere.code}
                  onPress={() => {
                    props.surChoix(critere.code);
                    setOuverte(false);
                  }}
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
        </Pressable>
      </Modal>
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
        invite={t(props.langue, 'profil_choisir')}
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
        invite={t(props.langue, 'profil_choisir')}
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
        invite={t(props.langue, 'profil_choisir')}
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
  champ: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COULEURS.fondConsigne,
  },
  texteChamp: { color: COULEURS.texte },
  texteInvite: { color: COULEURS.texteSecondaire },
  chevron: { color: COULEURS.texteSecondaire, fontSize: 16 },
  voile: {
    flex: 1,
    backgroundColor: COULEURS.voile,
    justifyContent: 'center',
    padding: ESPACE.bord,
  },
  carte: {
    backgroundColor: COULEURS.fond,
    borderRadius: 12,
    padding: ESPACE.bloc,
    gap: ESPACE.serre,
  },
  option: {
    paddingVertical: 12,
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
