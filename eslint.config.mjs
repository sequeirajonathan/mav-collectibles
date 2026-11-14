/* eslint-disable import/no-unused-modules */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-unused-vars": "off", // Turn off base rule as it can report incorrect errors
      "no-unused-expressions": "error",
      // React Compiler-oriented rules introduced in eslint-plugin-react-hooks 7.
      // Kept visible as warnings; existing call sites predate them.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/refs": "warn",
      "import/no-unused-modules": ["error", {
        "unusedExports": true,
        "ignoreExports": [
          "**/app/**/*.tsx",
          "**/app/**/*.ts",
          "**/app/**/page.tsx",
          "**/app/**/layout.tsx",
          "**/app/**/route.ts",
          "**/components/**/*.tsx",
          "proxy.ts",
          "next.config.ts",
          "prisma.config.ts",
          "postcss.config.mjs"
        ]
      }]
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        node: {
          paths: ["."],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
  },

]);

export default eslintConfig;
