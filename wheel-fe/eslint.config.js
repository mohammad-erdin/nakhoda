import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import { vueRules } from '../shared/eslint/rules.js'
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
	...pluginVue.configs['flat/strongly-recommended'],
	{
		plugins: { '@typescript-eslint': tsPlugin }
	},
	{
		files: ['**/*.vue'],
		rules: vueRules,
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser
			},
			parser: vueParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.vue'],
				project: './tsconfig.json'
			}
		}
	},

	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser
			},
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.vue']
			}
		},
		rules: vueRules
	}
]
