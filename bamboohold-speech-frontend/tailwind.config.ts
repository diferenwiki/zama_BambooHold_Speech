import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#0F766E",
          DEFAULT: "#0F766E",
          dark: "#14B8A6",
        },
        accent: {
          light: "#F59E0B",
          DEFAULT: "#F59E0B",
          dark: "#FCD34D",
        },
        neutral: {
          light: "#6B7280",
          DEFAULT: "#6B7280",
          dark: "#9CA3AF",
        },
        status: {
          safe: "#10B981",
          caution: "#FBBF24",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        subtle: "0 2px 8px rgba(0, 0, 0, 0.08)",
        elevated: "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;

