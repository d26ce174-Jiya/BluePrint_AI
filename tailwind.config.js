/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── Inter font family ── */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      /* ── Map to CSS custom properties ── */
      colors: {
        background:  'hsl(var(--background) / <alpha-value>)',
        foreground:  'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT:    'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          hover:      'hsl(var(--primary-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input:  'hsl(var(--input) / <alpha-value>)',
        ring:   'hsl(var(--ring) / <alpha-value>)',
      },

      /* ── Border radius scale ── */
      borderRadius: {
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      /* ── Spacing: base 24px unit ── */
      spacing: {
        '4.5':  '1.125rem',
        '5.5':  '1.375rem',
        '6.5':  '1.625rem',
        '7.5':  '1.875rem',
        '13':   '3.25rem',
        '15':   '3.75rem',
        '17':   '4.25rem',
        '18':   '4.5rem',
        '22':   '5.5rem',
        '26':   '6.5rem',
        '30':   '7.5rem',
        '112':  '28rem',
        '128':  '32rem',
        '144':  '36rem',
      },

      /* ── Typography scale ── */
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:    ['0.875rem',  { lineHeight: '1.375rem' }],
        base:  ['1rem',      { lineHeight: '1.625rem' }],
        lg:    ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',   { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.75rem' }],
        '5xl': ['3rem',      { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem',   { lineHeight: '4.25rem' }],
        '7xl': ['4.5rem',    { lineHeight: '5rem' }],
      },

      /* ── Box shadows ── */
      boxShadow: {
        xs:      'var(--shadow-xs)',
        sm:      'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md:      'var(--shadow-md)',
        lg:      'var(--shadow-lg)',
        xl:      'var(--shadow-xl)',
        primary: 'var(--shadow-primary)',
        'primary-lg': '0 8px 32px 0 hsl(239 84% 67% / 0.36)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },

      /* ── Animation durations ── */
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },

      /* ── Keyframes ── */
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% center' },
          '100%': { backgroundPosition: '400% center' },
        },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(239 84% 67% / 0.3)' },
          '50%':      { boxShadow: '0 0 0 8px hsl(239 84% 67% / 0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%':      { transform: 'rotate(1.5deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-8px) rotate(1deg)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.5s ease both',
        'slide-down': 'slideDown 0.25s ease both',
        'shimmer':    'shimmer 2.5s linear infinite',
        'pulse-soft': 'pulseSoft 2.5s infinite',
        'wiggle':     'wiggle 3s ease-in-out infinite',
        'float-slow': 'floatSlow 5s ease-in-out infinite',
        'blink':      'blink 1s step-end infinite',
        'spin-slow':  'spin 8s linear infinite',
      },

      /* ── Backdrop blur ── */
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
