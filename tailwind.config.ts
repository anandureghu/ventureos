import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0D0F16", // page background
          800: "#11141D",
          700: "#161A24", // panel
          600: "#1D2230", // raised panel / border-strong
          500: "#272D3D"  // hairline border
        },
        signal: {
          violet: "#7C5CFF", // primary accent — "venture violet"
          green: "#3FB68B",  // revenue / active / done
          amber: "#E8A33D",  // validation / waiting
          red: "#E5484D",    // blocked / loss
          blue: "#4C8DFF"
        },
        fg: {
          DEFAULT: "#E7E9F0",
          muted: "#8A90A3",
          faint: "#5A6072"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        xl: "14px"
      }
    }
  },
  plugins: []
};
export default config;
