import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coupang: {
          red: "#E60012",
          darkRed: "#C4000F",
          blue: "#0073E6",
          lightBg: "#F7F9FA",
          cardBg: "#FFFFFF",
          textMain: "#111111",
          textSub: "#666666",
          border: "#E5E7EB",
        },
      },
      boxShadow: {
        glow: "0 4px 20px -2px rgba(230, 0, 18, 0.25)",
        tray: "0 -4px 25px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
