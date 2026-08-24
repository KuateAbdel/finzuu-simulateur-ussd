module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Le SEUL pont entre .env et le code : les variables deviennent le
    // module '@env'. `allowUndefined: false` fait ECHOUER la compilation si
    // une variable du code manque au .env — un oubli de configuration se
    // voit a la construction, jamais en silence a l'execution.
    [
      'module:react-native-dotenv',
      { moduleName: '@env', path: '.env', allowUndefined: false },
    ],
  ],
};
