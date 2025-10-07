import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { dirname } from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  // Base config for all files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global ignores
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/.next/",
      "**/coverage/",
      "**/*.tsbuildinfo",
      "**/prisma/migrations/",
    ],
  },

  // Frontend packages (Next.js + React)
  {
    files: [
      "apps/app/**/*.{js,jsx,ts,tsx}",
      "apps/characters/**/*.{js,jsx,ts,tsx}",
      "apps/website/**/*.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./apps/app/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: react,
      "react-hooks": reactHooks,
      "@next/next": next,
    },
    settings: {
      react: { version: "detect" },
      next: {
        rootDir: "./apps/app/app",
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Next.js rules
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,

      // React rules
      ...reactHooks.configs.recommended.rules,
      "react/no-unescaped-entities": "off",

      // Project-specific rules
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "./*"],
              message:
                "Relative imports are not allowed. Use absolute or aliased imports instead.",
            },
            {
              group: ["@/components/ui/badge"],
              message: "Please import from '@/components/Badge' instead.",
            },
            {
              group: ["@/components/ui/tooltip"],
              message: "Please import from '@/components/Tooltip' instead.",
            },
            {
              group: ["@/components/ui/card"],
              message: "Please import from '@/components/Card' instead.",
            },
            {
              group: ["@/components/ui/button"],
              message: "Please import from '@/components/Button' instead.",
            },
          ],
        },
      ],
    },
  },

  // Database package (Node.js)
  {
    files: ["packages/database/**/*.{js,ts}"],
    ignores: ["packages/database/scripts/**"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./packages/database/tsconfig.json",
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off", // Allow console logs for seed scripts
    },
  },

  // Database scripts (without typed linting)
  {
    files: ["packages/database/scripts/**/*.{js,ts}"],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // CDK package (Node.js)
  {
    files: ["packages/cdk/**/*.{js,ts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./packages/cdk/tsconfig.json",
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          args: "after-used", // Allow unused parameters in CDK construct methods
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },

  // Test files across all packages
  {
    files: ["**/*.test.{js,ts,tsx}", "**/*.spec.{js,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  }
);
