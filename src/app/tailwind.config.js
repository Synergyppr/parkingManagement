import colors from "tailwindcss/colors";

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        gray: colors.gray,
        green: colors.green,
        blue: colors.blue,
        // Add only the colors you use; this avoids Tailwind's default color functions (oklch)
      },
    },
  },
};

export default tailwindConfig;
