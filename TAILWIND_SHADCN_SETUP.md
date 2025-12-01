# 🎨 Tailwind CSS v4 + shadcn/ui Integration Guide

Complete setup guide for using Tailwind CSS v4 and shadcn/ui with the Claude Code Agent Orchestration System.

## 📋 Overview

This project uses:
- **Tailwind CSS v4** - Latest version with `@import` syntax and CSS-first configuration
- **shadcn/ui** - Beautiful, accessible UI components built with Radix UI
- **Vite** - Fast build tool with native Tailwind v4 plugin support
- **React + TypeScript** - Type-safe component development

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Tailwind CSS v4 with Vite plugin
- React and TypeScript
- shadcn/ui utilities (clsx, tailwind-merge)

### 2. Initialize shadcn/ui (Optional)

The project is pre-configured, but you can reinitialize if needed:

```bash
npx shadcn@latest init
```

### 3. Add shadcn/ui Components

Install components as needed:

```bash
# Single component
npx shadcn@latest add button

# Multiple components
npx shadcn@latest add button card dialog

# All components
npx shadcn@latest add --all
```

### 4. Start Development Server

```bash
npm run dev
```

## 🔧 Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),  // Tailwind v4 Vite plugin
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### src/index.css (Tailwind v4 Syntax)

```css
@import "tailwindcss";

@theme {
  --font-family: 'Inter', system-ui, sans-serif;
  
  /* Custom color palette */
  --color-primary: oklch(0.55 0.25 262);
  --color-primary-foreground: oklch(0.99 0 0);
  
  /* Spacing scale */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### components.json (shadcn/ui Config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### tsconfig.json (Path Aliases)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🎨 Tailwind CSS v4 Features

### New @import Syntax

```css
/* Old (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New (v4) */
@import "tailwindcss";
```

### CSS-First Theme Configuration

```css
@theme {
  /* Colors using OKLCH */
  --color-brand: oklch(0.5 0.2 200);
  --color-accent: oklch(0.7 0.15 150);
  
  /* Breakpoints */
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
  
  /* Spacing */
  --spacing-base: 1rem;
  
  /* Typography */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### Using Custom Theme Variables

```tsx
<div className="bg-[--color-brand] text-[--color-accent]">
  Custom themed content
</div>
```

## 🧩 shadcn/ui Component Usage

### Basic Component Installation

```bash
# Install button component
npx shadcn@latest add button
```

This creates:
- `src/components/ui/button.tsx` - Component file
- Updates `package.json` - Adds dependencies

### Using Components

```tsx
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  )
}
```

### Available Component Variants

Most shadcn/ui components support variants:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

## 🎯 Common shadcn/ui Components

### Essential Components

```bash
# Forms
npx shadcn@latest add form input textarea select checkbox

# Layout
npx shadcn@latest add card separator

# Feedback
npx shadcn@latest add dialog alert toast

# Navigation
npx shadcn@latest add button dropdown-menu tabs
```

### Advanced Components

```bash
# Data Display
npx shadcn@latest add table calendar chart

# Overlays
npx shadcn@latest add sheet popover tooltip

# Complex UI
npx shadcn@latest add command navigation-menu
```

## 🔨 Utility Function: cn()

The `cn()` utility combines class names with Tailwind merge:

```tsx
import { cn } from "@/lib/utils"

function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn(
      "base-styles",
      "default-modifier",
      className  // User overrides
    )}>
      Content
    </div>
  )
}
```

## 🎨 Theming with Tailwind v4

### Light/Dark Mode

```css
@theme {
  /* Light mode */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.2 0 0);
}

@media (prefers-color-scheme: dark) {
  @theme {
    /* Dark mode */
    --color-background: oklch(0.2 0 0);
    --color-foreground: oklch(0.95 0 0);
  }
}
```

### Using Theme Colors

```tsx
<div className="bg-[--color-background] text-[--color-foreground]">
  Themed content
</div>
```

## 📦 Project Structure

```
claude-code-agents-wizard-v2/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts         # cn() utility
│   ├── hooks/               # Custom React hooks
│   └── index.css            # Tailwind v4 config
├── components.json          # shadcn/ui config
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── package.json             # Dependencies
```

## 🚨 Common Issues

### Issue: TypeScript errors for missing modules

**Solution:** Run `npm install` to install all dependencies.

### Issue: Tailwind classes not working

**Solution:** Ensure `src/index.css` is imported in your main entry point:

```tsx
// src/main.tsx
import './index.css'
```

### Issue: Path aliases not resolving

**Solution:** Verify `tsconfig.json` and `vite.config.ts` have matching path configurations.

### Issue: shadcn components not found

**Solution:** Run `npx shadcn@latest add [component]` to install the component.

## 📚 Resources

### Tailwind CSS v4
- [Official Docs](https://tailwindcss.com/docs)
- [Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vite Plugin](https://tailwindcss.com/docs/installation/framework-guides/vite)

### shadcn/ui
- [Official Site](https://ui.shadcn.com)
- [Components](https://ui.shadcn.com/docs/components)
- [CLI Reference](https://ui.shadcn.com/docs/cli)
- [Themes](https://ui.shadcn.com/themes)

### Color Systems
- [OKLCH Color Picker](https://oklch.com)
- [Tailwind Color Generator](https://uicolors.app/create)

## 💡 Best Practices

### 1. Use CSS Variables for Theme

```css
@theme {
  --color-primary: oklch(0.5 0.2 250);
}
```

### 2. Leverage cn() for Conditional Classes

```tsx
<Button className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)} />
```

### 3. Create Reusable Component Wrappers

```tsx
// src/components/my-button.tsx
import { Button } from "@/components/ui/button"

export function MyButton({ children, ...props }) {
  return (
    <Button className="custom-brand-styling" {...props}>
      {children}
    </Button>
  )
}
```

### 4. Use Type-Safe Variants

```tsx
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

type ButtonProps = VariantProps<typeof buttonVariants>
```

## 🎓 Next Steps

1. **Explore Components**: Browse [shadcn/ui components](https://ui.shadcn.com/docs/components)
2. **Customize Theme**: Modify `src/index.css` with your brand colors
3. **Build UI**: Start creating your interface with shadcn components
4. **Add Animations**: Install motion libraries for transitions
5. **Optimize**: Use Vite's build optimizations for production

---

**Happy Building!** 🚀
