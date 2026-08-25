/** Mock jest officiel du presse-papiers — pas de module natif sous jest. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mock = require('@react-native-clipboard/clipboard/jest/clipboard-mock');
export default mock;
