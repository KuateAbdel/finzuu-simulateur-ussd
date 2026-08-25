/**
 * __tests__/demarrage.test.ts
 * ===========================
 * LE TEST QUI PROUVE la correction FZ-DIAG-BAIL-2026-001 (25/08) :
 * « la décision de démarrage ne doit pas attendre le réseau. Pas du tout. »
 *
 * Le bouchon réseau est un RÉSEAU INFINIMENT LENT : `verifierBail` rend une
 * promesse qui ne se résout JAMAIS. Si le routage initial attend la
 * vérification — le défaut d'origine — `demarrerLocal()` ne résout jamais
 * et le test ÉCHOUE par timeout de la course. Il ne peut passer que si la
 * décision est purement locale.
 */

import { Coordination, type Configuration } from '../src/coordination/machine';
import { ecrireBail, effacerBail, type BailLocal } from '../src/persistance/depot';

// Le bouchon de la couche d’accès — contrôlable par test, préfixé « mock »
// (exigence jest pour être capturé par la fabrique de jest.mock). Par défaut :
// réseau infiniment lent (promesse jamais résolue).
const mockVerifierBail = jest.fn<Promise<unknown>, unknown[]>(
  () => new Promise(() => undefined),
);
jest.mock('../src/acces/clientAttribution', () => ({
  lireCriteres: jest.fn(),
  demanderAttribution: jest.fn(),
  libererBail: jest.fn(),
  verifierBail: (...args: unknown[]) => mockVerifierBail(...args),
}));

const CONFIGURATION: Configuration = {
  baseAttribution: 'http://bouchon.invalide',
  baseUssd: 'http://bouchon.invalide',
  delaiRequeteMs: 15000,
};

const BAIL_VALIDE: BailLocal = {
  msisdn: '237650000001',
  expire_le: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  attribution_id: 'a3a2b1c0-0000-0000-0000-000000000001',
};

/** La course : si `promesse` ne résout pas en `delaiMs`, c'est que le code
 *  attend quelque chose qu'il n'a pas le droit d'attendre. */
function auPlusTard<T>(promesse: Promise<T>, delaiMs: number): Promise<T> {
  return Promise.race([
    promesse,
    new Promise<never>((_, rejeter) => {
      const minuterie = setTimeout(
        () => rejeter(new Error(`le routage a attendu plus de ${delaiMs} ms — il attend le réseau`)),
        delaiMs,
      );
      // Ne pas retenir le processus jest sur la minuterie perdante.
      (minuterie as unknown as { unref?: () => void }).unref?.();
    }),
  ]);
}

beforeEach(async () => {
  mockVerifierBail.mockClear();
  mockVerifierBail.mockImplementation(() => new Promise(() => undefined));
  await effacerBail();
});

describe('demarrerLocal — la décision est locale, immédiate, sans réseau', () => {
  test('bail présent et valide → composition, SANS attendre le réseau infiniment lent', async () => {
    await ecrireBail(BAIL_VALIDE);
    const coordination = new Coordination(CONFIGURATION); // le « redémarrage »
    const destination = await auPlusTard(coordination.demarrerLocal(), 500);
    expect(destination).toBe('composition');
    expect(coordination.msisdn()).toBe(BAIL_VALIDE.msisdn);
    // La preuve nette : AUCUN appel réseau n'a même été émis par la décision.
    expect(mockVerifierBail).not.toHaveBeenCalled();
  });

  test('aucun bail → accueil (phase 1), toujours sans réseau', async () => {
    const coordination = new Coordination(CONFIGURATION);
    const destination = await auPlusTard(coordination.demarrerLocal(), 500);
    expect(destination).toBe('accueil');
    expect(mockVerifierBail).not.toHaveBeenCalled();
  });

  test('bail échu à l’horloge locale → écran 13 (EF-15), sans réseau', async () => {
    await ecrireBail({ ...BAIL_VALIDE, expire_le: new Date(Date.now() - 1000).toISOString() });
    const coordination = new Coordination(CONFIGURATION);
    const destination = await auPlusTard(coordination.demarrerLocal(), 500);
    expect(destination).toBe('echec_bail');
    expect(mockVerifierBail).not.toHaveBeenCalled();
  });
});

describe('verifierBailEnFond — corrige après coup, ne route jamais a priori', () => {
  test('serveur : absent → bascule vers l’écran 13', async () => {
    await ecrireBail(BAIL_VALIDE);
    const coordination = new Coordination(CONFIGURATION);
    await coordination.demarrerLocal();
    mockVerifierBail.mockResolvedValueOnce({ issue: 'absent' });
    expect(await coordination.verifierBailEnFond()).toBe('echec_bail');
  });

  test('serveur : 200 → resynchronise l’échéance, aucune bascule (null)', async () => {
    await ecrireBail(BAIL_VALIDE);
    const coordination = new Coordination(CONFIGURATION);
    await coordination.demarrerLocal();
    const echeanceServeur = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    mockVerifierBail.mockResolvedValueOnce({
      issue: 'ok',
      valeur: {
        msisdn: BAIL_VALIDE.msisdn,
        expire_le: echeanceServeur,
        attribution_id: BAIL_VALIDE.attribution_id,
      },
    });
    expect(await coordination.verifierBailEnFond()).toBeNull();
    const { lireBail } = require('../src/persistance/depot') as typeof import('../src/persistance/depot');
    expect((await lireBail())?.expire_le).toBe(echeanceServeur);
  });

  test('échec réseau → on POURSUIT sur la foi du stocké (null, bail intact)', async () => {
    await ecrireBail(BAIL_VALIDE);
    const coordination = new Coordination(CONFIGURATION);
    await coordination.demarrerLocal();
    mockVerifierBail.mockResolvedValueOnce({ issue: 'reseau' });
    expect(await coordination.verifierBailEnFond()).toBeNull();
    expect(coordination.msisdn()).toBe(BAIL_VALIDE.msisdn);
  });

  test('aucun bail chargé → la vérification ne part même pas', async () => {
    const coordination = new Coordination(CONFIGURATION);
    await coordination.demarrerLocal();
    expect(await coordination.verifierBailEnFond()).toBeNull();
    expect(mockVerifierBail).not.toHaveBeenCalled();
  });
});
