export const rules = {
	'arrow-body-style': ['error', 'as-needed'],
	'camelcase': 'off',
	'indent': ['error', 'tab', { SwitchCase: 1 }],
	'key-spacing': ['error', { beforeColon: false, afterColon: true }],
	'no-console': 'off',
	'no-debugger': 'off',
	'no-empty':'off',
	'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
	'no-param-reassign': 'off',
	'no-undef': 'error',
	'no-unused-vars': 'off',
	'@typescript-eslint/no-unused-vars': ['error', { 
		vars: 'all', 
		args: 'after-used',
		varsIgnorePattern: '^_',
		argsIgnorePattern: '^_',
		caughtErrorsIgnorePattern: '^_'
	}],
	'object-curly-spacing': ['error', 'always'],
	'prefer-arrow-callback': 'error',
	'prefer-const': 'error',
	'prefer-template': 'error',
	'space-infix-ops': ['error', { int32Hint: false }],
	'symbol-description': 'off'
};

export const vueRules = {
    ...rules,
    'vue/block-order': [
		'error',
		{
			order: ['template', 'script', 'style']
		}
	],
	'vue/html-indent': ['error', 'tab', {
		attribute: 1,
		baseIndent: 1,
		closeBracket: 0,
		alignAttributesVertically: true,
		ignores: []
	}],
	'vue/multi-word-component-names': 'off',
	'vue/no-unused-components': 'error',
	'vue/no-unused-vars': 'off',
	'vue/no-v-html': 'off'
}
// export const globals = {
// 	console: 'readonly',
// 	window: 'readonly',
// 	document: 'readonly',
// 	localStorage: 'readonly',
// 	navigator: 'readonly',
// 	fetch: 'readonly'
// };

// export const nodeGlobals = {
// 	process: 'readonly',
// 	global: 'readonly',
// 	Buffer: 'readonly',
// 	__dirname: 'readonly',
// 	__filename: 'readonly'
// };
