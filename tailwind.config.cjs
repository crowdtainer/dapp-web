module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],

  // daisyUI config (optional)
  daisyui: {
    styled: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "forest",
    themes: [{
      garden: {
        ...require("daisyui/src/colors/themes")["[data-theme=garden]"],
        secondary: "#456a39",
       "neutral-content": "#f7f7f7"
      },
    },
    {
      forest: {
        ...require("daisyui/src/colors/themes")["[data-theme=forest]"],
        primary: "#10b981",
        secondary: "#2e6b1a",
        "base-100": "#456a39",
      },
    },"cmyk", "light", "dark", "black", "forest",],
  },
}
