/**
 * __tests__/composition.test.tsx
 * ==============================
 * La CONSIGNE de composition — demande Direction du 27/08 : sur l'écran de
 * composition, rien ne disait à l'usager quoi taper.
 *
 * Quatre propriétés, et chacune existe parce qu'elle pouvait rater :
 *
 *   1. Le code est VISIBLE avant la saisie. C'est la demande elle-même.
 *   2. Il vient de la CONFIGURATION — un test qui passerait avec un code en
 *      dur ne prouverait rien : on rend ici un code arbitraire et on vérifie
 *      que c'est LUI qui s'affiche.
 *   3. Il DISPARAÎT à la première touche. Sur un vrai terminal personne ne
 *      souffle le code ; l'aide amorce puis s'écarte.
 *   4. Sans code configuré, AUCUNE consigne — jamais une phrase à trou.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { EcranComposition } from '../src/presentation/EcranComposition';

const MSISDN = '237684696030';

function rendre(codeUssd?: string) {
  let arbre!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    arbre = ReactTestRenderer.create(
      <EcranComposition
        langue="fr"
        msisdn={MSISDN}
        surAppel={() => {}}
        codeUssd={codeUssd}
      />,
    );
  });
  return arbre;
}

/** Tout le texte rendu, mis à plat — on interroge l'écran, pas sa structure. */
function texteRendu(arbre: ReactTestRenderer.ReactTestRenderer): string {
  const morceaux: string[] = [];
  const parcourir = (noeud: unknown): void => {
    if (typeof noeud === 'string') {
      morceaux.push(noeud);
      return;
    }
    if (Array.isArray(noeud)) {
      noeud.forEach(parcourir);
      return;
    }
    if (noeud && typeof noeud === 'object' && 'children' in noeud) {
      parcourir((noeud as { children: unknown }).children);
    }
  };
  parcourir(arbre.toJSON());
  return morceaux.join('');
}

/** Appuie sur une touche du clavier, par son libellé d'accessibilité. */
function appuyer(arbre: ReactTestRenderer.ReactTestRenderer, touche: string) {
  const bouton = arbre.root
    .findAll((n) => n.props.accessibilityLabel === touche)
    .find((n) => typeof n.props.onPress === 'function');
  if (!bouton) throw new Error(`touche introuvable : ${touche}`);
  ReactTestRenderer.act(() => bouton.props.onPress());
}

describe('La consigne de composition', () => {
  test('le code est visible AVANT toute saisie', () => {
    const texte = texteRendu(rendre('*321#'));
    expect(texte).toContain('*321#');
    expect(texte).toContain('Composez');
  });

  test("le code affiché est CELUI de la configuration, pas un code en dur", () => {
    // Si un jour l'opérateur passe à *777#, c'est *777# qui doit s'afficher.
    const texte = texteRendu(rendre('*777#'));
    expect(texte).toContain('*777#');
    expect(texte).not.toContain('*321#');
  });

  test('la consigne DISPARAÎT dès la première touche', () => {
    const arbre = rendre('*321#');
    expect(texteRendu(arbre)).toContain('Composez');

    appuyer(arbre, '*');

    const apres = texteRendu(arbre);
    expect(apres).not.toContain('Composez');
    // ...et ce qui reste à l'écran est bien la SAISIE de l'usager.
    expect(apres).toContain('*');
  });

  test('sans code configuré, aucune consigne — jamais une phrase à trou', () => {
    for (const vide of [undefined, '']) {
      const texte = texteRendu(rendre(vide));
      expect(texte).not.toContain('Composez');
      expect(texte).not.toContain('{code}');
    }
  });

  test("le numéro attribué reste affiché, et n'est jamais saisissable", () => {
    const arbre = rendre('*321#');
    // INV-SIM-04 / CR-08 — aucun champ de saisie sur cet écran.
    expect(arbre.root.findAll((n) => String(n.type) === 'TextInput')).toHaveLength(0);
    expect(texteRendu(arbre)).toContain('684');
  });
});
