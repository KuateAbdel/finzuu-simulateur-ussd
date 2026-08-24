/**
 * acces/clientUssd.ts
 * ===================
 * Client du callback USSD — `SessionSchema`, MESURÉ sur le service réel le
 * 24/08, pas recopié d'une doc :
 *
 *   POST /api/v1/ussd/callback
 *   { session_id*, msisdn*, input, new_session }
 *
 *   MESURE 1 — `new_session` est une CHAÎNE. Un booléen rend
 *   `422 Input should be a valid string`. "1" à l'ouverture, "0" ensuite.
 *   MESURE 2 — le service tolère les champs supplémentaires (un champ
 *   `language` inconnu passe sans 422) : la tolérance existe, mais on
 *   n'envoie RIEN hors contrat — la langue des menus se règle DANS le
 *   parcours (option « Changer Langue »), jamais par l'application.
 *
 * LA SEULE INTERPRÉTATION AUTORISÉE : le préfixe `CON ` / `END `. C'est du
 * PROTOCOLE, pas du métier — il décide si le champ de saisie apparaît
 * (EF-11/EF-12) et il est retiré de l'affichage (INV-SIM-05 : « à
 * l'exclusion du préfixe de continuation »). Tout le reste du texte est
 * OPAQUE : aucune lecture, aucune transformation, aucune traduction
 * (INV-SIM-03, INV-SIM-07).
 */

import { echec, ok, type Resultat } from './resultat';
import type { Echange, OptionsAppel } from './clientAttribution';

/** Ce que le protocole dit d'une réponse — rien de plus. */
export interface ReponseSession {
  /** `true` = la session continue (préfixe CON) : l'écran 6 présente un
   *  champ de saisie. `false` = fin (END ou absence de préfixe) : l'écran 7
   *  ne présente que la fermeture. */
  poursuite: boolean;
  /** Le texte du service, préfixe retiré, SANS AUCUNE AUTRE TRANSFORMATION
   *  (INV-SIM-05 — CR-09 compare ce texte au journal). */
  texte: string;
}

export interface RequeteSession {
  session_id: string;
  /** Repris de l'état local — JAMAIS saisi par l'usager (INV-SIM-04). */
  msisdn: string;
  input: string;
  /** "1" à l'ouverture, "0" en continuation — chaîne, jamais booléen. */
  new_session: '1' | '0';
}

/** Sépare le préfixe de protocole du texte. Une réponse sans préfixe est
 *  traitée comme une FIN : ne pas offrir de saisie sur une session dont on
 *  ignore l'état est le seul choix qui ne peut pas piéger l'usager. */
function decoder(brut: string): ReponseSession {
  if (brut.startsWith('CON ')) return { poursuite: true, texte: brut.slice(4) };
  if (brut.startsWith('CON')) return { poursuite: true, texte: brut.slice(3) };
  if (brut.startsWith('END ')) return { poursuite: false, texte: brut.slice(4) };
  if (brut.startsWith('END')) return { poursuite: false, texte: brut.slice(3) };
  return { poursuite: false, texte: brut };
}

/** `POST /callback` — une étape de session. Ouverture comme continuation :
 *  la différence tient toute entière dans `new_session`, décidée par la
 *  coordination (EF-09, EF-13). */
export async function etapeSession(
  options: OptionsAppel,
  requete: RequeteSession,
): Promise<Resultat<ReponseSession>> {
  const url = `${options.base}/api/v1/ussd/callback`;
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), options.delaiMs ?? 15_000);
  const trace = (direction: Echange['direction'], contenu: string) =>
    options.surEchange?.({
      horodatage: new Date().toISOString(),
      direction,
      contenu,
    });

  trace('emission', `POST /api/v1/ussd/callback ${JSON.stringify(requete)}`);
  try {
    const reponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requete),
      signal: controleur.signal,
    });
    const texte = await reponse.text();
    trace('reception', `${reponse.status} ${texte.slice(0, 500)}`);
    if (reponse.status === 200) return ok(decoder(texte));
    // Le serveur a répondu, mais pas une session : c'est `serveur`, écran 10
    // côté coordination — jamais confondu avec `reseau` (ENF-05, CR-11).
    return echec('serveur', `HTTP ${reponse.status} ${texte.slice(0, 200)}`);
  } catch (erreur) {
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    trace('reception', `AUCUNE REPONSE — ${detail}`);
    return echec('reseau', detail);
  } finally {
    clearTimeout(minuteur);
  }
}
