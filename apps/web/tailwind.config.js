/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border:      'hsl(var(--border))',
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-dark': `
          linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-md': '40px 40px',
      },
      animation: {
        'shimmer':        'shimmer 2.4s linear infinite',
        'fade-in':        'fadeIn 0.2s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'pulse-slow':     'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':      'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'glow-pulse':     'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      boxShadow: {
        'glow-blue':    '0 0 20px rgba(59,130,246,0.15), 0 0 40px rgba(59,130,246,0.05)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.05)',
        'glow-amber':   '0 0 20px rgba(245,158,11,0.15), 0 0 40px rgba(245,158,11,0.05)',
        'glow-red':     '0 0 20px rgba(239,68,68,0.20),  0 0 40px rgba(239,68,68,0.08)',
        'inner-top':    'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
