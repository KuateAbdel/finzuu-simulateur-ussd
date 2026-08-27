/**
 * __tests__/configuration.test.ts
 * ===============================
 * Le garde-fou du `.env` — né d'un défaut vu le 27/08 sur l'Itel A665L.
 *
 * `CODE_USSD=*321#` s'affichait « *321 » : dans un fichier .env, `#` ouvre un
 * COMMENTAIRE, et le dièse partait SILENCIEUSEMENT. Les tests de l'écran ne
 * pouvaient rien voir — ils passent le code en prop, sans traverser le .env.
 *
 * Ce fichier teste donc l'autre bout de la chaîne : la valeur telle qu'elle
 * arrive RÉELLEMENT du fichier, après la transformation babel. C'est le seul
 * endroit du projet où le contenu du .env est mis à l'épreuve.
 */

import { CODE_USSD } from '../src/configuration';

describe('Le code USSD tel qu’il sort du .env', () => {
  test('il est renseigné', () => {
    expect(CODE_USSD).not.toBe('');
  });

  test('un code USSD entamé par * se TERMINE par #', () => {
    // C'est exactement le défaut du 27/08 : `*321` au lieu de `*321#`.
    // Un code tronqué est pire qu'un code absent — il a l'air juste, et
    // l'usager compose quelque chose qui n'ouvrira aucun menu.
    if (CODE_USSD.startsWith('*')) {
      expect(CODE_USSD).toMatch(/^\*[\d*]+#$/);
    }
  });

  test('il ne porte ni blanc ni guillemet résiduel', () => {
    // Des guillemets mal retirés produiraient `"*321#"` affiché tel quel.
    expect(CODE_USSD).toBe(CODE_USSD.trim());
    expect(CODE_USSD).not.toMatch(/["']/);
  });
});
