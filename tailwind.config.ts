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
        // Professional White & NVIDIA Green Design System
        app: {
          DEFAULT: "#FFFFFF", // Main white background
          secondary: "#F5F6F7", // Secondary light grey surface
          elevated: "#FFFFFF", // Elevated pure white surface
          card: "#FFFFFF", // Card pure white background
          input: "#FFFFFF", // Input pure white background
        },
        surface: {
          app: "#FFFFFF",
          secondary: "#F5F6F7",
          elevated: "#FFFFFF",
          card: "#FFFFFF",
          input: "#FFFFFF",
        },
        nvidia: {
          green: "#76B900", // Signature NVIDIA Green
          hover: "#659F00", // Green hover state
          surface: "#F2F8E8", // Pale green surface for active states/badges
          dark: "#355900", // Dark green text for pale green surfaces
          light: "#659F00", // Green active/hover alias
          border: "#76B900", // Green border accent
        },
        // Neutralized aliases
        nebius: {
          cyan: "#76B900",
          teal: "#76B900",
          blue: "#555A60",
          soft: "#659F00",
        },
        text: {
          primary: "#1F1F1F", // Primary charcoal text
          secondary: "#555A60", // Secondary text
          muted: "#707780", // Muted text
        },
        border: {
          standard: "#DADDE1", // Standard grey border
          subtle: "#E8EAED", // Subtle light grey border
          hover: "#B8C0C8", // Card hover border
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
          bg: "#F3F4F6",
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
        "card": "0 2px 8px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.08)",
        "nvidia-glow": "0 2px 8px rgba(118, 185, 0, 0.20)",
        "nebius-glow": "0 2px 8px rgba(118, 185, 0, 0.20)",
      },
      borderRadius: {
        "card": "12px",
      },
    },
  },
  plugins: [],
};
export default config;
