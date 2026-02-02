import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
	{
		ignores: [
			'node_modules/**',
			'public/**',
			'dist/**', 
			'build/**',
			'vendor/**',
			'cache/**'
		]
	},
  
	js.configs.recommended,
	...pluginVue.configs['flat/strongly-recommended'],
  
	{
		files: ['**/*.{vue,js,ts}'],
		languageOptions: {
			parser: '@typescript-eslint/parser',
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.vue']
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				global: 'readonly'
			}
		},
		rules: {
		rules: {
			'indent': ['error', 'tab', { SwitchCase: 1 }],
			'vue/html-indent': ['error', 'tab', {
				attribute: 1,
				baseIndent: 1,
				closeBracket: 0,
				alignAttributesVertically: true,
				ignores: []
			}],
			'vue/multi-word-component-names': 'off',
			'no-console': 'off',
			'no-debugger': 'off',
			'camelcase': 'off',
			'no-param-reassign': 'off',
			'symbol-description': 'off',
			'vue/no-v-html': 'off',
			'prefer-const': 'error',
			'prefer-arrow-callback': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
			'vue/no-unused-components': 'error',
			'no-unused-vars': ['error', { 
				vars: 'all', 
				args: 'after-used',
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_'
			}],
			'vue/no-unused-vars': 'error',
			'no-undef': 'error',
			'prefer-template': 'error',
			'vue/block-order': [
				'error',
				{
					order: ['template', 'script', 'style']
				}
			],
			'key-spacing': ['error', { beforeColon: false, afterColon: true }],
			'object-curly-spacing': ['error', 'always']
			,
			'space-infix-ops': ['error', { int32Hint: false }]
		}
	}
]
