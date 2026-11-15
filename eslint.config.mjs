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
      // No `any`, and no switching the type checker off.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
      "@typescript-eslint/no-non-null-assertion": "error",
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
          "**/*.d.ts",
          "tests/**",
          "vitest.config.mts",
          "playwright.config.ts",
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
  // Type-aware rules: catch `any` leaking in from untyped JSON, libraries or casts.
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
]);

export default eslintConfig;
