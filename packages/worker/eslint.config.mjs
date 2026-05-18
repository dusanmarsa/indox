import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config({ ignores: ["node_modules/**"] }, tseslint.configs.recommended, {
  languageOptions: { parserOptions: { tsconfigRootDir: __dirname } },
});
