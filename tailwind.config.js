/** @type {import('tailwindcss').Config} */
export default {
  // 1. THIS IS THE MOST IMPORTANT PART: Tell Tailwind to scan our new folder!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This catch-all covers everything inside src/
  ],
  theme: {
    extend: {
      // 2. Ensure your custom Basquiat colors are defined here!
      colors: {
        'chalky-white': '#f8f9fa',
        'emergency-red': '#ff003c',
        'legacy-gold': '#ffd700',
        // cyan-400 and emerald-500 are built into Tailwind automatically
      },
      fontFamily: {
        // If you have a specific terminal font, map it here
        'terminal': ['"Courier New"', 'monospace'], 
      }
    },
  },
  plugins: [require('@tailwindcss/forms'),],
}
