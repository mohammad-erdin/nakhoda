import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import { rules } from '../shared/eslint/rules.js'

import globals from 'globals';
export default [
	{
		ignores: [
			'node_modules/**',
			'public/**',
			'dist/**', 
			'build/**',
			'vendor/**',
			'cache/**',
			'*.config.{ts,js,cjs}',
		]
	},
  
	js.configs.recommended,
	{
		plugins: { '@typescript-eslint': tsPlugin }
	},
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			globals: { 
				...globals.browser,
				...globals.node
			 },
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: './tsconfig.json',
			}
		},
		rules
	}
]
