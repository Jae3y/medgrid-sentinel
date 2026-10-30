import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060D1F",
          900: "#0B1F3A",
          800: "#12294B",
          700: "#1B3A63",
          600: "#27507F",
        },
        cyan: {
          DEFAULT: "#22D3EE",
          soft: "#7DE9F7",
        },
        energy: {
          green: "#34D399",
          amber: "#F59E0B",
          red: "#EF4444",
        },
        surface: {
          DEFAULT: "#0F2440",
          raised: "#16304F",
          border: "#24466E",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["Consolas", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
