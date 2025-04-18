import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-out': {
					from: { opacity: '1' },
					to: { opacity: '0' }
				},
				'slide-in': {
					from: { transform: 'translateY(20px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'scale-in': {
					from: { transform: 'scale(0.95)', opacity: '0' },
					to: { transform: 'scale(1)', opacity: '1' }
				},
				'bounce-small': {
					'0%, 100%': { transform: 'translateY(0)' },
					'25%': { transform: 'translateY(-5px)' },
					'50%': { transform: 'translateY(0)' },
					'75%': { transform: 'translateY(-3px)' }
				},
				'pulse-gentle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.85' }
				},
				'slide-in-right': {
					from: { transform: 'translateX(100%)', opacity: '0' },
					to: { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-in-left': {
					from: { transform: 'translateX(-100%)', opacity: '0' },
					to: { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-out-to-left': {
					from: { transform: 'translateX(0)', opacity: '1' },
					to: { transform: 'translateX(-100%)', opacity: '0' }
				},
				'slide-out-to-right': {
					from: { transform: 'translateX(0)', opacity: '1' },
					to: { transform: 'translateX(100%)', opacity: '0' }
				},
				'zoom-in-fade': {
					from: { transform: 'scale(0.9)', opacity: '0' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' },
					to: { transform: 'scale(1)', opacity: '1' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
				},
				'bounce-once': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'like-heart': {
					'0%': { transform: 'scale(1)' },
					'25%': { transform: 'scale(1.2)' },
					'50%': { transform: 'scale(0.95)' },
					'100%': { transform: 'scale(1)' }
				},
				'like-active': {
					'0%': { backgroundColor: 'transparent' },
					'25%': { backgroundColor: 'rgba(var(--primary), 0.1)' },
					'100%': { backgroundColor: 'transparent' }
				},
				'like-inactive': {
					'0%': { backgroundColor: 'rgba(var(--primary), 0.1)' },
					'100%': { backgroundColor: 'transparent' }
				},
				'particle-1': {
					'0%': { transform: 'translate(0, 0) scale(0)', opacity: '0' },
					'15%': { transform: 'translate(-5px, -10px) scale(0.2)', opacity: '1' },
					'100%': { transform: 'translate(-15px, -30px) scale(0)', opacity: '0' }
				},
				'particle-2': {
					'0%': { transform: 'translate(0, 0) scale(0)', opacity: '0' },
					'15%': { transform: 'translate(5px, -10px) scale(0.2)', opacity: '1' },
					'100%': { transform: 'translate(15px, -30px) scale(0)', opacity: '0' }
				},
				'particle-3': {
					'0%': { transform: 'translate(0, 0) scale(0)', opacity: '0' },
					'15%': { transform: 'translate(-10px, -5px) scale(0.2)', opacity: '1' },
					'100%': { transform: 'translate(-30px, -15px) scale(0)', opacity: '0' }
				},
				'particle-4': {
					'0%': { transform: 'translate(0, 0) scale(0)', opacity: '0' },
					'15%': { transform: 'translate(10px, -5px) scale(0.2)', opacity: '1' },
					'100%': { transform: 'translate(30px, -15px) scale(0)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-out': 'fade-out 0.5s ease-out',
				'slide-in': 'slide-in 0.6s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'bounce-small': 'bounce-small 2s ease-in-out infinite',
				'pulse-gentle': 'pulse-gentle 3s ease-in-out infinite',
				'slide-in-right': 'slide-in-right 0.6s ease-out',
				'slide-in-left': 'slide-in-left 0.6s ease-out',
				'slide-out-to-left': 'slide-out-to-left 0.6s ease-out',
				'slide-out-to-right': 'slide-out-to-right 0.6s ease-out',
				'zoom-in-fade': 'zoom-in-fade 0.6s ease-out',
				'shake': 'shake 0.8s ease-in-out',
				'bounce-once': 'bounce-once 0.6s ease-in-out',
				'like-heart': 'like-heart 0.7s ease-in-out',
				'like-active': 'like-active 1s ease-out',
				'like-inactive': 'like-inactive 1s ease-out',
				'particle-1': 'particle-1 0.8s ease-out forwards',
				'particle-2': 'particle-2 0.8s ease-out forwards',
				'particle-3': 'particle-3 0.8s ease-out forwards',
				'particle-4': 'particle-4 0.8s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
