/**
 * App.tsx
 * =======
 * La racine — assemble les quatre couches, et RIEN d'autre : le routage des
 * destinations vers les écrans. Toute décision (où aller, quand, pourquoi)
 * vit dans la coordination ; ici on affiche ce qu'elle ordonne.
 *
 * ENF-02 (premier écran < 1000 ms) : le rendu n'attend AUCUN réseau. Le
 * démarrage lit la persistance (locale, quelques ms), affiche, puis la
 * vérification du bail (contrat §3) se fait en arrière-plan et redirige si
 * besoin. Un écran blanc qui attend un serveur aurait cassé le seuil.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { CODE_USSD, CONFIGURATION } from './src/configuration';
import { Coordination, type Destination } from './src/coordination/machine';
import type { ReponseCriteres } from './src/acces/contratAttribution';
import { ecrireLangue, lireLangue, type Langue } from './src/persistance/depot';
import { t } from './src/i18n/textes';
import { Attente } from './src/presentation/composants';
import { COULEURS } from './src/presentation/theme';
import { EcranAccueil } from './src/presentation/EcranAccueil';
import { EcranDemarrage } from './src/presentation/EcranDemarrage';
import { EcranProfil } from './src/presentation/EcranProfil';
import { EcranNumero } from './src/presentation/EcranNumero';
import { EcranComposition } from './src/presentation/EcranComposition';
import { EcranSession } from './src/presentation/EcranSession';
import { EcranInstrumentation } from './src/presentation/EcranInstrumentation';
import { EcranEchec, type VarianteEchec } from './src/presentation/EcranEchec';

/** L'écran d'où vient un échec — pour que « Réessayer » retourne au bon
 *  endroit. Détenu ici parce que c'est du routage, pas de la décision. */
type Provenance = 'demarrage' | 'criteres' | 'attribution' | 'session' | 'rupture';

export default function App(): React.JSX.Element {
  const coordination = useMemo(() => new Coordination(CONFIGURATION), []);

  const [langue, setLangue] = useState<Langue>('fr');
  const [destination, setDestination] = useState<Destination>('demarrage');
  const [criteres, setCriteres] = useState<ReponseCriteres | null>(null);
  const [session, setSession] = useState<{ poursuite: boolean; texte: string } | null>(null);
  const [chargement, setChargement] = useState(false);
  const provenance = useRef<Provenance>('demarrage');
  const dernierProfil = useRef<{ pays: string; genre: string; categorie: string } | null>(null);

  // ── Démarrage : LIRE, DÉCIDER, AFFICHER — puis vérifier (diagnostic
  //    FZ-DIAG-BAIL-2026-001). La décision est LOCALE (quelques ms) : le
  //    splash ne vit que ce temps-là. La vérification serveur part APRÈS
  //    l'affichage et ne fait que corriger (écran 13 si le bail est perdu).
  useEffect(() => {
    let vivant = true;
    (async () => {
      const langueStockee = await lireLangue();
      if (vivant) setLangue(langueStockee);
      const arrivee = await coordination.demarrerLocal(); // AUCUN réseau
      if (vivant) setDestination(arrivee);
      // Arrière-plan — jamais attendu par le routage. Seulement quand la
      // décision locale sert la carte SIM : un bail échu à NOTRE horloge
      // (EF-15) ne se re-vérifie pas, il se ré-attribue — doctrine de
      // l'ancienne demarrer(), inchangée.
      if (arrivee === 'composition') {
        coordination
          .verifierBailEnFond()
          .then((bascule) => {
            if (vivant && bascule) setDestination(bascule);
          })
          .catch(() => undefined);
      }
    })();
    return () => {
      vivant = false;
    };
  }, [coordination]);

  const choisirLangue = useCallback((choix: Langue) => {
    setLangue(choix);
    ecrireLangue(choix).catch(() => undefined); // EF-21 — survit au bail
  }, []);

  // ── Enchaînements ordonnés par la coordination ─────────────────────────

  const versProfil = useCallback(async () => {
    provenance.current = 'criteres';
    setChargement(true);
    const resultat = await coordination.chargerCriteres();
    setChargement(false);
    if (resultat.destination === 'profil' && 'criteres' in resultat) {
      setCriteres(resultat.criteres);
    }
    setDestination(resultat.destination);
  }, [coordination]);

  const attribuer = useCallback(
    async (profil: { pays: string; genre: string; categorie: string }) => {
      provenance.current = 'attribution';
      dernierProfil.current = profil;
      setDestination('attente');
      setDestination(await coordination.attribuer(profil));
    },
    [coordination],
  );

  const composer = useCallback(
    async (code: string) => {
      provenance.current = 'session';
      setChargement(true);
      const resultat = await coordination.composer(code);
      setChargement(false);
      if (resultat.destination === 'session' && 'texte' in resultat) {
        setSession({ poursuite: resultat.poursuite, texte: resultat.texte });
      }
      setDestination(resultat.destination);
    },
    [coordination],
  );

  const poursuivre = useCallback(
    async (saisie: string) => {
      setChargement(true);
      const resultat = await coordination.poursuivre(saisie);
      setChargement(false);
      if (resultat.destination === 'session' && 'texte' in resultat) {
        setSession({ poursuite: resultat.poursuite, texte: resultat.texte });
      }
      setDestination(resultat.destination);
    },
    [coordination],
  );

  const rompre = useCallback(async () => {
    provenance.current = 'rupture';
    // Point 3 (25/08) — AUCUN écran interactif pendant une opération : la
    // rupture est un appel réseau, l'écran d'instrumentation restait
    // cliquable pendant qu'elle partait. Même motif que le démarrage.
    setChargement(true);
    const arrivee = await coordination.rompreLiaison();
    setChargement(false);
    setDestination(arrivee);
  }, [coordination]);

  /** L'action unique d'un écran d'échec — son sens dépend de la variante et
   *  de la provenance (deck : Réessayer / Modifier / Fermer / Continuer). */
  const surActionEchec = useCallback(async () => {
    switch (destination) {
      case 'echec_stock': // « Modifier » — retour au profil, NOUVELLE clé
        await coordination.changerDeProfil();
        await versProfil();
        return;
      case 'echec_bail': // « Continuer » — EF-15 : retour phase 1
        setDestination(await coordination.acquitterBailEchu());
        return;
      case 'echec_session': // « Fermer » — retour à la composition
        setDestination('composition');
        return;
      default: // écrans 9 et 10 — « Réessayer » : rejouer la MÊME action
        switch (provenance.current) {
          case 'criteres':
            await versProfil();
            return;
          case 'attribution':
            // La clé d'idempotence est CONSERVÉE : ce rejeu est celui qui
            // récupère une attribution dont la réponse s'est perdue.
            if (dernierProfil.current) await attribuer(dernierProfil.current);
            else await versProfil();
            return;
          case 'rupture':
            await rompre();
            return;
          case 'session':
          case 'demarrage':
          default:
            setDestination(coordination.msisdn() ? 'composition' : 'accueil');
        }
    }
  }, [destination, coordination, versProfil, attribuer, rompre]);

  // ── Routage pur ────────────────────────────────────────────────────────

  const ecran = (() => {
    if (chargement && destination !== 'attente') {
      // Le voile d'occupation GÉNÉRIQUE (point 3, 25/08) : critères,
      // composition, poursuite, rupture. Le texte d'attribution ne vaut
      // que pour l'écran 3 — ici l'opération peut être toute autre.
      return (
        <Attente titre={t(langue, 'operation_titre')} message={t(langue, 'operation_attente')} />
      );
    }
    switch (destination) {
      case 'demarrage':
        return <EcranDemarrage />;
      case 'accueil':
        return (
          <EcranAccueil
            langue={langue}
            surLangue={choisirLangue}
            surCommencer={versProfil}
            surInstrumentation={() => setDestination('instrumentation')}
          />
        );
      case 'profil':
        return criteres ? (
          <EcranProfil langue={langue} criteres={criteres} surValider={attribuer} />
        ) : (
          <Attente
            titre={t(langue, 'attribution_titre')}
            message={t(langue, 'attribution_attente')}
          />
        );
      case 'attente':
        return (
          <Attente
            titre={t(langue, 'attribution_titre')}
            message={t(langue, 'attribution_attente')}
          />
        );
      case 'numero':
        return (
          <EcranNumero
            langue={langue}
            msisdn={coordination.msisdn() ?? ''}
            surContinuer={() => setDestination('composition')}
          />
        );
      case 'composition':
        return (
          <EcranComposition
            langue={langue}
            msisdn={coordination.msisdn() ?? ''}
            surAppel={composer}
            codeUssd={CODE_USSD}
          />
        );
      case 'session':
        return session ? (
          <EcranSession
            langue={langue}
            texte={session.texte}
            poursuite={session.poursuite}
            surSaisie={poursuivre}
            surFermer={() => {
              setSession(null);
              setDestination('composition');
            }}
          />
        ) : (
          <EcranComposition
            langue={langue}
            msisdn={coordination.msisdn() ?? ''}
            surAppel={composer}
            codeUssd={CODE_USSD}
          />
        );
      case 'instrumentation':
        return (
          <EcranInstrumentation
            langue={langue}
            journal={coordination.lireJournal()}
            surRompre={rompre}
            surRetour={() => setDestination(coordination.msisdn() ? 'composition' : 'accueil')}
          />
        );
      case 'echec_reseau':
      case 'echec_serveur':
      case 'echec_stock':
      case 'echec_session':
      case 'echec_bail': {
        const variante: VarianteEchec = destination.replace('echec_', '') as VarianteEchec;
        return <EcranEchec variante={variante} langue={langue} surAction={surActionEchec} />;
      }
    }
  })();

  return (
    <SafeAreaView style={styles.racine}>
      <StatusBar barStyle="dark-content" />
      {ecran}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: COULEURS.fond },
});
