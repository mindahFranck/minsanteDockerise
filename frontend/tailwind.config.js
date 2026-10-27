/** @type {import('tailwindcss').Config} */

// Palette de marque, reprise du système de design BAOBAB. Le bleu Tailwind est
// remappé dessus : les écrans qui utilisent encore `bg-blue-600` & co. passent
// sur la marque sans être réécrits un par un.
const brand = {
  50: "#e6f2f9",
  100: "#cfe0f4",
  200: "#a6cbea",
  300: "#6fb0de",
  400: "#3794d0",
  500: "#007ac3",
  600: "#0069a8",
  700: "#00578c",
  800: "#00476f",
  900: "#00395a",
  950: "#002236",
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand,
        blue: brand,
        indigo: brand,
        header: "#003758",
        surface: "#f8f8f8",
        "table-head": "#dfe6ee",
        "table-head-foreground": "#3f5165",
        "row-alt": "#f6f8fa",
        "row-hover": "#eef2f6",
        track: "#e8ebee",
        success: { DEFAULT: "#00a832", soft: "#e6f6eb" },
        warning: { DEFAULT: "#f6821f", soft: "#feecdd" },
        danger: { DEFAULT: "#e5484d", soft: "#fdecec" },
      },
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        table: ['Manrope', '"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sm: "0 7px 15px 0 rgb(16 24 40 / 0.11)",
        md: "0 10px 22px 0 rgb(16 24 40 / 0.16)",
        lg: "0 16px 32px 0 rgb(16 24 40 / 0.2)",
      },
    },
  },
  plugins: [],
}
