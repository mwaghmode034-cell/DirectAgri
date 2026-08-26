const config = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        soil: "#5b4636",
        leaf: "#2f6f4e",
        crop: "#d9a441",
        sky: "#d8eef0",
        ink: "#1d2522"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(29, 37, 34, 0.12)"
      }
    }
  },
  plugins: []
};

module.exports = config;
