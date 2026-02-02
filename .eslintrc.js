module.exports = {
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-native/no-inline-styles': 'warn',
    // Downgrade cosmetic rules to warnings (don't block commits, but provide feedback)
    'react-native/no-color-literals': 'warn',
    'react-native/sort-styles': 'warn',
    'react-native/no-unused-styles': 'off', // Disabled to avoid noise from unused helper styles
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    // Disable import/namespace - crashes with TypeScript 5.6+ until eslint-plugin-import is updated
    'import/namespace': 'off',
    'import/no-unresolved': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
