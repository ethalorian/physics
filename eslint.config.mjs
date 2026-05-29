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
  {
    // Guardrail: every API route handler must go through the auth wrappers in
    // src/lib/api-auth.ts (withAuth / withRole / withEnrolledStudent), which
    // guarantee the 401/403 checks and generic-500 error handling. A raw
    // `export async function GET(...)` bypasses all of that and is exactly how
    // unauthenticated / IDOR routes shipped before. This rule fails the build on
    // any new raw handler. Intentionally public or un-wrappable routes (the
    // NextAuth handler, external webhooks, retired stubs) opt out per-handler
    // with `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
    files: ["src/app/api/**/route.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration > FunctionDeclaration[id.name=/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/]",
          message:
            "API route handlers must be wrapped with withAuth/withRole/withEnrolledStudent from '@/lib/api-auth' (e.g. `export const GET = withAuth(async (req, ctx) => { ... })`). If this route is intentionally public or cannot use the wrapper, add `// eslint-disable-next-line no-restricted-syntax -- <reason>` above the export.",
        },
      ],
    },
  },
];

export default eslintConfig;
