/* eslint-disable import/no-unused-modules */
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-unused-vars": "off", // Turn off base rule as it can report incorrect errors
      "no-unused-expressions": "error",
      "import/no-unused-modules": ["error", {
        "unusedExports": true,
        "ignoreExports": [
          "**/app/**/*.tsx",
          "**/app/**/*.ts",
          "**/app/**/page.tsx",
          "**/app/**/layout.tsx",
          "**/app/**/route.ts",
          "**/components/**/*.tsx",
          "middleware.ts"
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
];

export default eslintConfig;
