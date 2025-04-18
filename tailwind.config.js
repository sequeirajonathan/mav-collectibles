/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors based on the logo
        brand: {
          blue: {
            light: '#5EAAE8', // Light blue from logo
            DEFAULT: '#2B7BBF', // Medium blue from logo
            dark: '#0F3A5D',   // Dark blue for dark mode
          },
          gold: {
            light: '#FFD966', // Light gold
            DEFAULT: '#E6B325', // Gold from logo
            dark: '#B38A00',  // Darker gold for contrast
          },
          // Background colors
          bg: {
            light: '#FFFFFF',
            dark: '#000000',  // Pure black for dark mode
          },
          // Text colors
          text: {
            light: '#1A202C',
            dark: '#F7FAFC',
          }
        },
      },
    },
  },
  plugins: [],
} 