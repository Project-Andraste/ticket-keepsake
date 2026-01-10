//@ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	// commons
	eslint.configs.recommended,
	tseslint.configs.recommended,
	// react
	pluginReact.configs.flat['recommended'],
	pluginReact.configs.flat['jsx-runtime'],
	pluginReactHooks.configs.flat['recommended'],
	pluginReactRefresh.configs.recommended,
	{
		settings: { react: { version: 'detect' } },
		rules: {
			'react/prop-types': 'off',
			'react/jsx-no-undef': ['error', { allowGlobals: true }],
		},
	},
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.es2024,
			},
		},
	},
	{
		ignores: ['.wxt/**/*'],
	},
	eslintConfigPrettier,
);
