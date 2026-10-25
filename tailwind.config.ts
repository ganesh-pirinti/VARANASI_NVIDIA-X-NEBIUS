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
        // Premium Cream & NVIDIA Green Design System
        app: {
          DEFAULT: "#F7F5EF", // Main warm cream background
          secondary: "#F0EEE6", // Secondary deeper cream surface
          elevated: "#FFFFFF", // Elevated pure white surface
          card: "#FFFDF8", // Card warm ivory background
          input: "#FFFFFF", // Input clean background
        },
        surface: {
          app: "#F7F5EF",
          secondary: "#F0EEE6",
          elevated: "#FFFFFF",
          card: "#FFFDF8",
          input: "#FFFFFF",
        },
        nvidia: {
          green: "#76B900", // Signature NVIDIA Green
          hover: "#659F00", // Green hover state
          surface: "#EFF6E4", // Pale green surface for active states/badges
          muted: "#DDEBC9", // Muted pale green
          dark: "#294500", // Dark green text for pale green surfaces
          light: "#659F00", // Green active/hover alias
          border: "#76B900", // Green border accent
        },
        gold: {
          DEFAULT: "#C6A45A", // Subtle warm gold
          surface: "#FAF5EA",
        },
        // Neutralized aliases
        nebius: {
          cyan: "#76B900",
          teal: "#76B900",
          blue: "#64685F",
          soft: "#659F00",
        },
        text: {
          primary: "#242820", // Warm primary charcoal
          secondary: "#64685F", // Warm secondary text
          muted: "#878C82", // Muted warm grey
        },
        border: {
          standard: "#E4E1D7", // Standard warm grey border
          subtle: "#ECE9E0", // Subtle warm border
          hover: "#D5D1C5", // Card hover border
          active: "#76B900", // Focused/active green border
        },
        status: {
          success: "#2E7D32", // Verified Success green
          warning: "#B45309", // Warning dark amber
          error: "#C62828", // Error dark red
          info: "#2563EB", // Information blue
        },
        disabled: {
          text: "#9CA3AF",
          bg: "#EAE7DF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      boxShadow: {
        "card": "0 2px 10px rgba(36, 40, 32, 0.04), 0 1px 3px rgba(36, 40, 32, 0.02)",
        "card-hover": "0 6px 20px -2px rgba(36, 40, 32, 0.07), 0 2px 6px -1px rgba(36, 40, 32, 0.04)",
        "elevated": "0 12px 32px -4px rgba(36, 40, 32, 0.08)",
        "nvidia-glow": "0 2px 10px rgba(118, 185, 0, 0.25)",
        "nebius-glow": "0 2px 10px rgba(118, 185, 0, 0.25)",
      },
      borderRadius: {
        "card": "12px",
      },
    },
  },
  plugins: [],
};
export default config;
