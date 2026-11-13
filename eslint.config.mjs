import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'extracted_project/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
