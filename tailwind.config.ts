import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // YWG Brand Colors - Easy to edit here!
        primary: '#f0b324',      // Gold/Yellow
        secondary: '#dc4405',    // Orange-Red
        accent: '#004677',       // Deep Blue
      },
    },
  },
  plugins: [],
}
export default config
