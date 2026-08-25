/**
 * Mock jest OFFICIEL d'async-storage (v3) — un dépôt EN MÉMOIRE au
 * comportement identique au vrai. Placé dans `__mocks__/` racine : jest
 * l'applique automatiquement à TOUTES les suites (règle des manual mocks
 * pour les paquets de node_modules), sans `jest.mock` par fichier.
 */
export { default, createAsyncStorage } from '@react-native-async-storage/async-storage/jest';
