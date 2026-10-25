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
        // Clean, Classic, Professional NVIDIA Black / White / Grey / Green Palette
        app: {
          DEFAULT: "#0A0A0A", // Near-black background
          secondary: "#121212", // Secondary dark surface
          elevated: "#181818", // Elevated panel surface
          card: "#1E1E1E", // Card surface
          input: "#141414", // Recessed input surface
        },
        surface: {
          app: "#0A0A0A",
          secondary: "#121212",
          elevated: "#181818",
          card: "#1E1E1E",
          input: "#141414",
        },
        nvidia: {
          green: "#76B900", // Signature NVIDIA Green
          light: "#8ED100", // Bright highlight / hover
          dark: "#5E9400", // Dark active green
          surface: "rgba(118, 185, 0, 0.08)", // Subtle green tint for badges / highlights
          border: "rgba(118, 185, 0, 0.35)", // Subtle green border
        },
        // Aliased to green/white/grey to ensure zero cyan/teal/blue leaks
        nebius: {
          cyan: "#76B900",
          teal: "#76B900",
          blue: "#CCCCCC",
          soft: "#8ED100",
        },
        text: {
          primary: "#FFFFFF", // Crisp white
          secondary: "#CCCCCC", // Clean light grey
          muted: "#888888", // Balanced neutral grey
        },
        border: {
          standard: "#2A2A2A", // Clean subtle grey border
          subtle: "#1F1F1F", // Minimal recessed border
          active: "#404040", // Focused/hover grey border
        },
        status: {
          success: "#76B900", // NVIDIA Green
          warning: "#E5A93C", // Crisp Amber
          error: "#EF4444", // Clean Red
          info: "#CCCCCC", // Neutral clean grey
        },
        // Neutral dark grey scale
        navy: {
          950: "#0A0A0A",
          900: "#121212",
          850: "#181818",
          800: "#1E1E1E",
          750: "#242424",
          700: "#2A2A2A",
          650: "#1F1F1F",
          600: "#404040",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
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
        "card": "0 2px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px #262626",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.8), 0 0 0 1px #3A3A3A",
        "nvidia-glow": "0 0 16px -2px rgba(118, 185, 0, 0.25)",
        "nebius-glow": "0 0 16px -2px rgba(118, 185, 0, 0.25)",
      },
      borderRadius: {
        "card": "14px",
      },
    },
  },
  plugins: [],
};
export default config;
