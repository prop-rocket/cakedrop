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
        primary: {
          DEFAULT: "#E8553A",
          50: "#FFF0ED",
          100: "#FDDDD6",
          200: "#F9B5A6",
          300: "#F48D76",
          400: "#EE6F53",
          500: "#E8553A",
          600: "#D13E24",
          700: "#A6311C",
          800: "#7B2515",
          900: "#50180D",
        },
        dark: "#1A1A2E",
        "light-bg": "#FFFBF7",
        "card-bg": "#FFF0ED",
      },
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ["PT Sans", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        badge: "99px",
        input: "10px",
      },
      boxShadow: {
        card: "0 20px 60px rgba(232, 85, 58, 0.15)",
        "button-hover": "0 8px 30px rgba(232, 85, 58, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
