module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui'),require('@tailwindcss/forms'),],

  // daisyUI config (optional)
  daisyui: {
    styled: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "forest",
    themes: [
      {
        garden: {
          ...require("daisyui/src/colors/themes")["[data-theme=garden]"],
          primary: "#325ba9",
          secondary: "#000000",
         "neutral-content": "#f7f7f7"
        },
      },
    {
      forest: {
        ...require("daisyui/src/colors/themes")["[data-theme=forest]"],
        primary: "#38accf",
        secondary: "#c2f7ffff",
        "primary-content":"#c2f7ffff",
        "base-100": "#FFFFFF",
        outline: "#FFFFFF"
      },
    },
    "cmyk", "light", "dark", "black", "forest",],
  },
}
