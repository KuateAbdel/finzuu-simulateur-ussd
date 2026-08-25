module.exports = {
  preset: '@react-native/jest-preset',
  // async-storage (v3) est livré en ESM : il doit passer par babel comme
  // les autres paquets react-native — sans quoi `import` casse la suite.
  // Son MOCK officiel (en mémoire) est servi par __mocks__/ à la racine.
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-native-async-storage)',
  ],
};
