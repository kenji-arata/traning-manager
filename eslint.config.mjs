import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Disable ESLint stylistic rules that conflict with Prettier
  eslintConfigPrettier,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    // Surface Prettier issues in ESLint as warnings
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'warn',
      // Defer stylistic quotes to Prettier (avoid conflicts)
      quotes: 'off',
    },
  },
];

export default eslintConfig;
