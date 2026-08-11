/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blueprint: {
          bg: "#0B0C0E",        // near-black canvas
          panel: "#141519",     // sidebar / card background
          line: "#EDEDEF",      // primary text
          muted: "#8B8D93",     // secondary text
          grid: "rgba(255,255,255,0.03)",
          border: "rgba(255,255,255,0.10)",
        },
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#F2C583",
        },
        teal: {
          DEFAULT: "#4FB0A5",
          soft: "#8FD4CB",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "blueprint-grid":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
