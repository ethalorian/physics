import type { Config } from "tailwindcss";

/**
 * Tailwind v4 note
 * ----------------
 * This project runs Tailwind CSS v4 with the CSS-first config in
 * `src/app/globals.css` (`@import "tailwindcss"`, `@theme inline`,
 * `@custom-variant dark`, `@plugin "tailwindcss-animate"`).
 *
 * In v4, this file is NOT auto-loaded — it only applies if a `@config`
 * directive points at it. It intentionally does NOT redefine colors:
 * the design tokens (oklch) are the single source of truth in globals.css.
 * The previous version wrapped those oklch tokens in `hsl(var(--token))`,
 * which is invalid CSS — that color map has been removed to avoid confusion.
 *
 * Keep design tokens in globals.css. Use this file only for content globs
 * or JS-side theme additions if/when you wire it up via `@config`.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
  },
  plugins: [],
};

export default config;
