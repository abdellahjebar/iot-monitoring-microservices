/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // ENTERPRISE COLOR SYSTEM
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Background Layers (Dark Theme)
        "bg-0": "#09090B",  // Deepest - App shell
        "bg-1": "#0F0F12",  // Cards, panels
        "bg-2": "#18181B",  // Elevated surfaces
        "bg-3": "#27272A",  // Hover states

        // Borders
        "border-subtle": "#27272A",
        "border-default": "#3F3F46",
        "border-strong": "#52525B",

        // Text
        "text-primary": "#FAFAFA",
        "text-secondary": "#A1A1AA",
        "text-tertiary": "#71717A",
        "text-disabled": "#52525B",

        // Accent - Cyan (Primary)
        "cyan": "#06B6D4",
        "cyan-soft": "#083344",
        "cyan-hover": "#22D3EE",

        // Status Colors
        "success": "#22C55E",
        "success-soft": "#052E16",
        "warning": "#F59E0B",
        "warning-soft": "#422006",
        "error": "#EF4444",
        "error-soft": "#450A0A",
        "violet": "#8B5CF6",
        "violet-soft": "#2E1065",

        // Shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#06B6D4",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#27272A",
          foreground: "#FAFAFA",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#27272A",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#18181B",
          foreground: "#FAFAFA",
        },
        popover: {
          DEFAULT: "#0F0F12",
          foreground: "#FAFAFA",
        },
        card: {
          DEFAULT: "#0F0F12",
          foreground: "#FAFAFA",
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // SPACING SCALE (4px base)
      // ═══════════════════════════════════════════════════════════════
      spacing: {
        "18": "4.5rem",   // 72px
        "22": "5.5rem",   // 88px
      },

      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h1": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "h2": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h3": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["0.875rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "caption": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
        "metric": ["2.25rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },

      // ═══════════════════════════════════════════════════════════════
      // BORDER RADIUS
      // ═══════════════════════════════════════════════════════════════
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        xl: "16px",
      },

      // ═══════════════════════════════════════════════════════════════
      // ANIMATIONS & KEYFRAMES
      // ═══════════════════════════════════════════════════════════════
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.2s ease-out forwards",
        "pulse-live": "pulse-live 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },

      // ═══════════════════════════════════════════════════════════════
      // BOX SHADOWS (Glows)
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.3)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
