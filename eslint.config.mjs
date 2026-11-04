import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default defineConfig(
    { ignores: ['dist/**'] },
    {
        files: ['**/*.{js,mjs,ts,tsx}'],
        extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    },
    // TanStack Table's hook is intentionally used without React Compiler.
    { files: ['src/App.tsx'], rules: { 'react-hooks/incompatible-library': 'off' } },
    prettier,
)
