import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Night shift" palette — every hue is semantic (see src/lib/palette.ts)
        navy: {
          950: "#0A1A1C", // scrubs night (page)
          900: "#0D2124",
          800: "#13292C",
          700: "#1A3739",
          600: "#24474A",
        },
        cyan: {
          DEFAULT: "#45E0A0", // pulse green: care maintained / Sentinel
          soft: "#8EF0C5",
        },
        energy: {
          green: "#45E0A0",
          amber: "#F2B544",
          red: "#FF4D5E",
        },
        source: {
          solar: "#F2C14E",
          diesel: "#E06A3C",
          battery: "#7CB8FF",
          grid: "#A3AEC2",
        },
        surface: {
          DEFAULT: "#102528",
          raised: "#163133",
          border: "#24474A",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-archivo)",
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: ["var(--font-archivo)", "sans-serif"],
        mono: ["Consolas", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
