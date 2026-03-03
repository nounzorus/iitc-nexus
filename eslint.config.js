import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // IITC globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        GM_info: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        jsxPragma: 'h',
        jsxFragmentName: 'Fragment',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[hFragment]$' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-implicit-globals': 'error',
      'no-shadow': 'warn',
    },
  },
  {
    files: ['**/*.stories.jsx'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'storybook-static/'],
  },
];
