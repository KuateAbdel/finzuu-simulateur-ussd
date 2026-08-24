/**
 * acces/clientAttribution.ts
 * ==========================
 * Client HTTP du service d'attribution — contrat v0.3, les quatre routes.
 *
 * SANS MÉMOIRE, comme le Stack §4.1 l'exige de cette couche : aucun état ici,
 * pas même l'adresse — elle est injectée à chaque appel par la coordination,
 * qui la tient de la configuration. C'est ce qui rend le serveur local et le
 * Loader interchangeables par un simple changement d'adresse (contrat §0).
 *
 * Le JOURNAL (EF-16) : chaque échange est rapporté à l'appelant via
 * `surEchange`, jamais stocké ici — cette couche n'a pas de mémoire, l'écran
 * 8 lira ce que la coordination aura retenu.
 */

import type {
  Bail,
  CorpsErreur,
  DemandeAttribution,
  ReponseCriteres,
} from './contratAttribution';
import { echec, ok, type Resultat } from './resultat';

/** Trace d'un échange, pour le journal de l'écran 8 — le BRUT, pas une
 *  version reformulée (deck, diapo 9). */
export interface Echange {
  horodatage: string;
  direction: 'emission' | 'reception';
  contenu: string;
}

export interface OptionsAppel {
  /** Base du service — ATTRIBUTION_BASE_URL du .env, injectée par la
   *  coordination. Jamais une constante de cette couche, jamais une adresse
   *  écrite dans une source. */
  base: string;
  /** Rapporte chaque échange brut au journal tenu par la coordination. */
  surEchange?: (echange: Echange) => void;
  /** Délai maximal en millisecondes avant de conclure `reseau`. */
  delaiMs?: number;
}

const DELAI_DEFAUT_MS = 15_000;

/** Un fetch borné dans le temps. `AbortController` est natif React Native. */
async function requete(
  options: OptionsAppel,
  methode: 'GET' | 'POST' | 'DELETE',
  chemin: string,
  corps?: unknown,
  entetes?: Record<string, string>,
): Promise<Resultat<{ statut: number; texte: string }>> {
  const url = `${options.base}${chemin}`;
  const controleur = new AbortController();
  const minuteur = setTimeout(
    () => controleur.abort(),
    options.delaiMs ?? DELAI_DEFAUT_MS,
  );
  options.surEchange?.({
    horodatage: new Date().toISOString(),
    direction: 'emission',
    contenu: `${methode} ${chemin}${corps ? ' ' + JSON.stringify(corps) : ''}`,
  });
  try {
    const reponse = await fetch(url, {
      method: methode,
      headers: {
        ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...entetes,
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal: controleur.signal,
    });
    const texte = await reponse.text();
    options.surEchange?.({
      horodatage: new Date().toISOString(),
      direction: 'reception',
      contenu: `${reponse.status} ${texte.slice(0, 500)}`,
    });
    return ok({ statut: reponse.status, texte });
  } catch (erreur) {
    // Aucune réponse HTTP — coupure, DNS, délai. C'est `reseau`, PAS
    // `serveur` : la distinction fonde ENF-05 et l'écart écran 9 / écran 10.
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    options.surEchange?.({
      horodatage: new Date().toISOString(),
      direction: 'reception',
      contenu: `AUCUNE REPONSE — ${detail}`,
    });
    return echec('reseau', detail);
  } finally {
    clearTimeout(minuteur);
  }
}

/** Lit un corps d'erreur du contrat §5. Un corps illisible reste un échec
 *  serveur — on ne devine jamais un code qui n'est pas là. */
function codeDe(texte: string): CorpsErreur | null {
  try {
    const corps = JSON.parse(texte) as CorpsErreur;
    return typeof corps.code === 'string' ? corps : null;
  } catch {
    return null;
  }
}

/** `GET /criteres` — les listes fermées et la disponibilité (contrat §1). */
export async function lireCriteres(
  options: OptionsAppel,
): Promise<Resultat<ReponseCriteres>> {
  const brut = await requete(options, 'GET', '/api/v1/attribution/criteres');
  if (brut.issue !== 'ok') return brut;
  if (brut.valeur.statut === 200) {
    return ok(JSON.parse(brut.valeur.texte) as ReponseCriteres);
  }
  return echec('serveur', `HTTP ${brut.valeur.statut} sur /criteres`);
}

/** `POST /attributions` — le tirage (contrat §2).
 *
 *  La clé d'idempotence est FOURNIE par la coordination : c'est elle qui la
 *  conserve entre deux tentatives (le trou de la réponse perdue), et cette
 *  couche n'a pas de mémoire pour la retenir. */
export async function demanderAttribution(
  options: OptionsAppel,
  demande: DemandeAttribution,
  cleIdempotence: string,
): Promise<Resultat<Bail>> {
  const brut = await requete(
    options,
    'POST',
    '/api/v1/attribution/attributions',
    demande,
    { 'Idempotency-Key': cleIdempotence },
  );
  if (brut.issue !== 'ok') return brut;

  const { statut, texte } = brut.valeur;
  if (statut === 201) return ok(JSON.parse(texte) as Bail);

  const corps = codeDe(texte);
  // 409 STOCK_EPUISE : un résultat, pas une panne — écran 11 côté
  // coordination. Tout le reste répondu-mais-en-échec est `serveur`.
  if (statut === 409 && corps?.code === 'STOCK_EPUISE') {
    return echec('stock', corps.message);
  }
  return echec('serveur', `HTTP ${statut} ${corps?.code ?? ''} ${texte.slice(0, 200)}`);
}

/** `GET /attributions/{id}` — la vérification du bail (contrat §3, v0.3).
 *
 *  `absent` couvre inconnu ET échu : d'où que vienne la perte du bail, la
 *  conduite est identique — écran 13, phase 1. La décision appartient à la
 *  coordination ; ici on ne fait que nommer l'issue. */
export async function verifierBail(
  options: OptionsAppel,
  attributionId: string,
): Promise<Resultat<Bail>> {
  const brut = await requete(
    options,
    'GET',
    `/api/v1/attribution/attributions/${attributionId}`,
  );
  if (brut.issue !== 'ok') return brut;
  const { statut, texte } = brut.valeur;
  if (statut === 200) return ok(JSON.parse(texte) as Bail);
  if (statut === 404) return echec('absent', 'bail inconnu ou echu');
  return echec('serveur', `HTTP ${statut} sur la verification du bail`);
}

/** `DELETE /attributions/{id}` — la libération (contrat §4, EF-17).
 *
 *  `204` ET `404` rendent `ok` : le contrat est formel, le 404 est un succès
 *  fonctionnel — le bail n'existe plus, le but est atteint. Seul un échec
 *  serveur doit empêcher la coordination d'effacer l'état local. */
export async function libererBail(
  options: OptionsAppel,
  attributionId: string,
): Promise<Resultat<void>> {
  const brut = await requete(
    options,
    'DELETE',
    `/api/v1/attribution/attributions/${attributionId}`,
  );
  if (brut.issue !== 'ok') return brut;
  const { statut } = brut.valeur;
  if (statut === 204 || statut === 404) return ok(undefined);
  return echec('serveur', `HTTP ${statut} sur la liberation`);
}
