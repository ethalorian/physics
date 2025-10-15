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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "test-service-account.js",
      "scripts/**/*.js",
    ],
  },
  {
    rules: {
      // Turn some errors into warnings for production build
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "warn", // Allow apostrophes and quotes in JSX
      "@next/next/no-img-element": "warn", // Allow img elements with warning
      "react-hooks/exhaustive-deps": "warn", // Warn about missing deps
    },
  },
];

export default eslintConfig;
