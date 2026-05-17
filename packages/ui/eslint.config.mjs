import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ["storybook-static/**", "node_modules/**"] },
  tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
    languageOptions: { parserOptions: { tsconfigRootDir: __dirname } },
  },
  {
    files: ["**/*.stories.tsx", "**/*.stories.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  }
);
