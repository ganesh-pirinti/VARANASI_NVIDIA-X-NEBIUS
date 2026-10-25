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
        // Core Design System Tokens
        app: {
          DEFAULT: "#071521",
          secondary: "#0B1722",
          elevated: "#101F2C",
          card: "#122432",
          input: "#0A1823",
        },
        surface: {
          app: "#071521",
          secondary: "#0B1722",
          elevated: "#101F2C",
          card: "#122432",
          input: "#0A1823",
        },
        nebius: {
          cyan: "#25C6D8",
          teal: "#21B7B0",
          blue: "#3978FF",
          soft: "#8AEAF0",
        },
        nvidia: {
          green: "#76B900",
          surface: "#172914",
          border: "#385D22",
          light: "#8ED100",
        },
        text: {
          primary: "#F4F8FC",
          secondary: "#B6C7D5",
          muted: "#8297A8",
        },
        border: {
          standard: "#223847",
          subtle: "#1A2D3B",
        },
        status: {
          success: "#76B900",
          warning: "#F5B94C",
          error: "#FF6B70",
          info: "#38BDF8",
        },
        // Compatible scale mapping aligned to new palette
        navy: {
          950: "#071521", // Main application background
          900: "#0B1722", // Secondary background
          850: "#101F2C", // Elevated surface
          800: "#122432", // Card surface
          750: "#162B3C", // Intermediate elevated border/surface
          700: "#223847", // Standard border
          650: "#1A2D3B", // Subtle border
          600: "#2A4557",
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
        "card": "0 4px 20px -2px rgba(3, 10, 16, 0.45), 0 0 0 1px rgba(34, 56, 71, 0.6)",
        "card-hover": "0 8px 30px -4px rgba(37, 198, 216, 0.12), 0 0 0 1px rgba(37, 198, 216, 0.35)",
        "nvidia-glow": "0 0 20px -3px rgba(118, 185, 0, 0.25), 0 0 0 1px rgba(56, 93, 34, 0.7)",
        "nebius-glow": "0 0 24px -3px rgba(37, 198, 216, 0.22), 0 0 0 1px rgba(37, 198, 216, 0.4)",
      },
      borderRadius: {
        "card": "14px",
      },
    },
  },
  plugins: [],
};
export default config;
