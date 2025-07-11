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
      },
      animation: {
        shake: "shake 0.3s ease-in-out",
      },
      colors: {
        gray: colors.gray,
        green: colors.green,
        blue: colors.blue,
        // Add only the colors you use; this avoids Tailwind's default color functions (oklch)
      },
      screens: {
        'xs': '375px',
      },
    },
  },
};

export default tailwindConfig;
