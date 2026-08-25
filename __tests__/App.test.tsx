/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  // act ASYNCHRONE : le démarrage enchaîne des lectures locales (langue,
  // bail) avant de router — l'act synchrone du gabarit expirait sans les
  // laisser se poser.
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
