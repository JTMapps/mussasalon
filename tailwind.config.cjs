const flowbite = require('flowbite/plugin')

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",               // your React code
    "./node_modules/flowbite/**/*.js",          // Flowbite core
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"  // Flowbite-React
  ],
  theme: {
    extend: {
      
    },
  },
  plugins: [
    flowbite,    // enables Flowbite components
  ],
}
