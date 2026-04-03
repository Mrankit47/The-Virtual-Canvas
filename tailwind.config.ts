import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "#f5f5f0", // Off-white canvas base
        ink: "#111111", // Deep black
      },
      fontFamily: {
        serif: ['var(--font-playfair-display)'],
        sans: ['var(--font-inter)'],
      }
    },
  },
  plugins: [],
};
export default config;
