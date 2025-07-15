import colors from "tailwindcss/colors";

const tailwindConfig = {
  theme: {
    extend: {
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.3)" },
        },
      },
      animation: {
        shake: "shake 0.3s ease-in-out",
        blink: "blink 1.2s ease-in-out infinite",
      },
      colors: {
        gray: colors.gray,
        green: colors.green,
        blue: colors.blue,
        // Add only the colors you use; this avoids Tailwind's default color functions (oklch)
      },
      screens: {
        xs: "375px",
      },
    },
  },
};

export default tailwindConfig;
