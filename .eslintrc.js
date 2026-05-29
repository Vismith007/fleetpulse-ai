module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parserOptions: {
    project: ['./apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      settings: { react: { version: 'detect' } },
      rules: { 'react/react-in-jsx-scope': 'off' },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.ts'],
};
