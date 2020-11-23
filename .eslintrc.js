module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'plugin:react/recommended',
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 10,
    sourceType: 'module'
  },
  plugins: [
    'jest',
    'react',
    '@typescript-eslint'
  ],
  rules: {
    'no-console': 'warn',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1
      }
    ],
    quotes: [
      'error',
      'single'
    ],
    semi: [
      'error',
      'always'
    ],
    'space-in-parens': [
      'error'
    ],
    'space-infix-ops': 'error',
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'comma-spacing': 'error',
    'space-before-function-paren': [
      'error',
      'never'
    ],
    'eol-last': [
      'error',
      'always'
    ],
    'keyword-spacing': [
      'error',
      {
        before: true,
        after: true,
        overrides: {
          do: {
            after: false
          },
          for: {
            after: false
          },
          if: {
            after: false
          },
          switch: {
            after: false
          },
          while: {
            after: false
          },
          catch: {
            after: false
          }
        }
      }
    ],
    'array-bracket-spacing': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
