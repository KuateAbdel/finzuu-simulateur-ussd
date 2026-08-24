/**
 * coordination/machine.ts
 * =======================
 * LA COUCHE DE COORDINATION — « le seul point où l'application détient un
 * état » (Stack §4.1). Identifiant de session, cycle du bail, enchaînement
 * des écrans. Aucun appel réseau direct : elle ORCHESTRE les clients de la
 * couche d'accès, elle ne parle jamais à un serveur elle-même.
 *
 * C'est ici — et seulement ici — que les issues de la couche d'accès
 * deviennent des ÉCRANS :
 *
 *   reseau  → écran 9      serveur → écran 10     stock  → écran 11
 *   fin de session (END « expired ») → l'écran 7 l'affiche tel quel
 *   absent (bail perdu côté serveur) → écran 13 → phase 1
 *
 * Le cycle de vie complet (CDC §5, deck diapo 4) :
 *
 *   accueil → profil → attente → numéro    (phase 1 — une fois par bail)
 *   composition → session (6/7) …          (phase 2 — répétable sans limite)
 *   bail échu ou perdu → écran 13 → phase 1
 */

import {
  demanderAttribution,
  libererBail,
  lireCriteres,
  verifierBail,
  type Echange,
  type OptionsAppel,
} from '../acces/clientAttribution';
import { etapeSession, type RequeteSession } from '../acces/clientUssd';
import type { DemandeAttribution, ReponseCriteres } from '../acces/contratAttribution';
import {
  ecrireBail,
  ecrireTentative,
  effacerBail,
  effacerTentative,
  lireBail,
  lireTentative,
  type BailLocal,
} from '../persistance/depot';

/** Les destinations que la coordination peut ordonner. Les écrans 1 à 13 du
 *  deck, nommés — jamais un numéro magique dans le code. */
export type Destination =
  | 'accueil' // 1
  | 'profil' // 2
  | 'attente' // 3
  | 'numero' // 4
  | 'composition' // 5
  | 'session' // 6 et 7 — un seul écran, deux états (poursuite ou fin)
  | 'instrumentation' // 8
  | 'echec_reseau' // 9
  | 'echec_serveur' // 10
  | 'echec_stock' // 11
  | 'echec_session' // 12
  | 'echec_bail'; // 13

export interface Configuration {
  /** Base du service d'attribution — le Loader, ou le banc de recette. La
   *  bascule est UNE ADRESSE, jamais une branche de code (contrat §0). */
  baseAttribution: string;
  /** Base du service USSD. */
  baseUssd: string;
  /** Délai d'attente réseau (ms) — REQUEST_TIMEOUT_MS du .env. */
  delaiRequeteMs: number;
}

/** Génère l'identifiant de session — EF-09/EF-14 : produit par
 *  l'application, RENOUVELÉ à chaque composition, jamais persisté.
 *  `crypto.randomUUID` est natif (Hermes / React Native ≥ 0.74). */
function nouvelIdentifiantSession(): string {
  return `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Génère une clé d'idempotence — contrat §2 : UNE par TENTATIVE
 *  d'attribution, conservée pendant les reprises, renouvelée quand l'usager
 *  relance depuis le profil. */
function nouvelleCleIdempotence(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export class Coordination {
  private readonly configuration: Configuration;

  /** Le bail en mémoire — reflet de la persistance, jamais une 2e vérité :
   *  toute écriture passe par le dépôt d'abord. */
  private bail: BailLocal | null = null;

  /** L'identifiant de session courant — « le temps d'une session, jamais
   *  persisté » (Stack §4.3). */
  private sessionId: string | null = null;


  /** Le journal de l'écran 8 (EF-16) — les échanges BRUTS, en mémoire
   *  seulement : il meurt avec l'application, rien de personnel ne persiste
   *  hors des quatre valeurs du dépôt (INV-SIM-06). */
  private readonly journal: Echange[] = [];

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  // ── Accès pour la présentation (lecture seule) ─────────────────────────

  lireJournal(): readonly Echange[] {
    return this.journal;
  }

  msisdn(): string | null {
    return this.bail?.msisdn ?? null;
  }

  private optionsAttribution(): OptionsAppel {
    return {
      base: this.configuration.baseAttribution,
      delaiMs: this.configuration.delaiRequeteMs,
      surEchange: (echange) => this.journal.push(echange),
    };
  }

  private optionsUssd(): OptionsAppel {
    return {
      base: this.configuration.baseUssd,
      delaiMs: this.configuration.delaiRequeteMs,
      surEchange: (echange) => this.journal.push(echange),
    };
  }

  // ── Lancement — décide de la phase (EF-07, EF-15, contrat §3) ──────────

  /** Au lancement : où aller ?
   *
   *  1. Pas de bail local              → phase 1 (accueil).
   *  2. Bail local échu à NOTRE horloge → écran 13 (EF-15). La vérification
   *     serveur n'est pas tentée : même si le serveur vivait encore, un bail
   *     que l'app croit mort doit être re-vérifié par une nouvelle
   *     attribution — et le serveur, lui, le considère déjà libre (§5 de la
   *     conception, expiration passive).
   *  3. Bail local valide → vérification serveur (contrat §3, v0.3) :
   *       200    → l'échéance SERVEUR remplace la locale, phase 2 ;
   *       absent → le serveur a perdu le bail (expiration, libération,
   *                réinitialisation) → écran 13 ;
   *       reseau/serveur → on POURSUIT sur la foi du bail stocké — on ne
   *                jette jamais un bail sur un échec de vérification, le
   *                callback tranchera (contrat §3). */
  async demarrer(): Promise<Destination> {
    this.bail = await lireBail();
    if (this.bail === null) return 'accueil';

    if (new Date(this.bail.expire_le).getTime() <= Date.now()) {
      return 'echec_bail';
    }

    const verdict = await verifierBail(this.optionsAttribution(), this.bail.attribution_id);
    if (verdict.issue === 'ok') {
      this.bail = {
        msisdn: verdict.valeur.msisdn,
        expire_le: verdict.valeur.expire_le,
        attribution_id: verdict.valeur.attribution_id,
      };
      await ecrireBail(this.bail);
      return 'composition';
    }
    if (verdict.issue === 'absent') return 'echec_bail';
    return 'composition'; // reseau ou serveur : la foi du stocké
  }

  /** L'écran 13 a été montré : on efface et on reconduit en phase 1
   *  (EF-07 — « le numéro retourne à la population disponible »). */
  async acquitterBailEchu(): Promise<Destination> {
    this.bail = null;
    await effacerBail();
    return 'accueil';
  }

  // ── Phase 1 — attribution ──────────────────────────────────────────────

  async chargerCriteres(): Promise<
    { destination: 'profil'; criteres: ReponseCriteres } | { destination: Destination }
  > {
    const resultat = await lireCriteres(this.optionsAttribution());
    if (resultat.issue === 'ok') {
      return { destination: 'profil', criteres: resultat.valeur };
    }
    return { destination: resultat.issue === 'reseau' ? 'echec_reseau' : 'echec_serveur' };
  }

  /** Le tirage (EF-04) — révision 0.3.1 : la clé est PERSISTÉE dès son
   *  émission, effacée au `201`. Elle survit donc aux « Réessayer » ET à une
   *  mort de l'application : au redémarrage, le même profil redemandé
   *  retrouve la même clé, le serveur rejoue le même bail — jamais un second
   *  client. Une clé retrouvée sur un AUTRE profil est abandonnée : la
   *  rejouer servirait l'ancien tirage. */
  async attribuer(demande: DemandeAttribution): Promise<Destination> {
    const memeProfil = (t: { profil: DemandeAttribution }) =>
      t.profil.pays === demande.pays &&
      t.profil.genre === demande.genre &&
      t.profil.categorie === demande.categorie;

    const retrouvee = await lireTentative();
    let cle: string;
    if (retrouvee !== null && memeProfil(retrouvee)) {
      cle = retrouvee.cle;
    } else {
      cle = nouvelleCleIdempotence();
      // PERSISTÉE AVANT L'ÉMISSION — l'ordre est la correction : une clé
      // écrite après l'envoi peut mourir avec le processus, exactement la
      // fenêtre qu'on ferme.
      await ecrireTentative({ cle, profil: demande });
    }

    const resultat = await demanderAttribution(this.optionsAttribution(), demande, cle);
    if (resultat.issue === 'ok') {
      await effacerTentative(); // le 201 est reçu : régime établi, 4 valeurs
      this.bail = {
        msisdn: resultat.valeur.msisdn,
        expire_le: resultat.valeur.expire_le,
        attribution_id: resultat.valeur.attribution_id,
      };
      await ecrireBail(this.bail);
      return 'numero';
    }
    if (resultat.issue === 'stock') return 'echec_stock';
    if (resultat.issue === 'reseau') return 'echec_reseau';
    return 'echec_serveur';
  }

  /** L'usager repart de l'écran 2 avec un AUTRE profil : la tentative en
   *  cours est abandonnée — `attribuer()` n'y verra pas le même profil et
   *  émettra une clé neuve. L'effacement rend l'abandon EXPLICITE. */
  async changerDeProfil(): Promise<void> {
    await effacerTentative();
  }

  // ── Phase 2 — session (EF-08 à EF-14) ──────────────────────────────────

  /** Une composition (`*321#`) : NOUVEL identifiant (EF-14), indication
   *  d'ouverture "1" (EF-09). Le bail échu pendant l'usage est rattrapé ici
   *  aussi : EF-15 ne dépend pas que du lancement. */
  async composer(saisie: string): Promise<
    { destination: 'session'; poursuite: boolean; texte: string } | { destination: Destination }
  > {
    if (this.bail === null) return { destination: 'accueil' };
    if (new Date(this.bail.expire_le).getTime() <= Date.now()) {
      return { destination: 'echec_bail' };
    }
    this.sessionId = nouvelIdentifiantSession();
    return this.envoyer({ input: saisie, new_session: '1' });
  }

  /** Une saisie DANS la session : même identifiant, continuation "0"
   *  (EF-13). */
  async poursuivre(saisie: string): Promise<
    { destination: 'session'; poursuite: boolean; texte: string } | { destination: Destination }
  > {
    if (this.bail === null) return { destination: 'accueil' };
    if (this.sessionId === null) return { destination: 'composition' };
    return this.envoyer({ input: saisie, new_session: '0' });
  }

  private async envoyer(
    etape: Pick<RequeteSession, 'input' | 'new_session'>,
  ): Promise<
    { destination: 'session'; poursuite: boolean; texte: string } | { destination: Destination }
  > {
    const resultat = await etapeSession(this.optionsUssd(), {
      session_id: this.sessionId as string,
      msisdn: (this.bail as BailLocal).msisdn, // INV-SIM-04 : toujours le stocké
      ...etape,
    });
    if (resultat.issue === 'ok') {
      if (!resultat.valeur.poursuite) this.sessionId = null; // session close
      return {
        destination: 'session',
        poursuite: resultat.valeur.poursuite,
        texte: resultat.valeur.texte,
      };
    }
    this.sessionId = null;
    return { destination: resultat.issue === 'reseau' ? 'echec_reseau' : 'echec_serveur' };
  }

  // ── Instrumentation (EF-17) ────────────────────────────────────────────

  /** La rupture de liaison — serveur D'ABORD, local ENSUITE. Un échec
   *  serveur (5xx/réseau) CONSERVE l'état local : effacer sans libérer
   *  fuirait un numéro du pool pour sept jours (contrat §4). `absent`/404
   *  est un succès fonctionnel : le bail n'existe déjà plus. */
  async rompreLiaison(): Promise<Destination> {
    if (this.bail === null) return 'accueil';
    const resultat = await libererBail(this.optionsAttribution(), this.bail.attribution_id);
    if (resultat.issue === 'ok') {
      this.bail = null;
      this.sessionId = null;
      await effacerBail();
      return 'accueil';
    }
    return resultat.issue === 'reseau' ? 'echec_reseau' : 'echec_serveur';
  }
}
