---
description: "Use when creating components, styling UI elements, writing CSS/Tailwind classes, or defining themes. Enforces the Colick brand design system: colors, backgrounds, text palette, and font."
applyTo: "front-office/src/**"
---

# Colick Design System

## Brand Colors

| Role      | Hex       | Tailwind Custom / Usage          |
|-----------|-----------|----------------------------------|
| Primary   | `#023047` | Dark navy — headers, buttons     |
| Secondary | `#219ebc` | Teal — links, accents            |
| Accent    | `#fb8500` | Orange — CTAs, highlights        |
| Error     | `#EF4444` | Red — error states               |
| Success   | `#22C55E` | Green — success states           |
| Warning   | `#F97316` | Orange — warnings                |

## Background Colors

| Role                | Hex       |
|---------------------|-----------|
| Background Primary  | `#f5f5f5` |
| Background Secondary| `#F9FAFB` |
| Background Dark     | `#111827` |

## Text Colors

| Role           | Hex       |
|----------------|-----------|
| Text Primary   | `#111827` |
| Text Secondary | `#6B7280` |
| Text Muted     | `#9CA3AF` |

## Typography

- **Font**: Poppins — must be applied globally and on all components.

## Rules

- Always use the exact hex values above. Do not substitute with default Tailwind palette equivalents (e.g., do not use `blue-900` instead of `#023047`).
- Configure these colors in `tailwind.config.js` under `theme.extend.colors` and reference them by name (e.g., `bg-primary`, `text-secondary`).
- Never hardcode raw hex values inline in templates; always reference the named Tailwind token.
- Apply `font-['Poppins']` or configure Poppins as the default sans-serif in Tailwind config.
- Use `bg-background-dark` (`#111827`) for dark sections, never plain `bg-black`.

## Tailwind Config Reference

```js
// tailwind.config.js — extend colors with these tokens
colors: {
  primary:    '#023047',
  secondary:  '#219ebc',
  accent:     '#fb8500',
  error:      '#EF4444',
  success:    '#22C55E',
  warning:    '#F97316',
  background: {
    primary:   '#f5f5f5',
    secondary: '#F9FAFB',
    dark:      '#111827',
  },
  text: {
    primary:   '#111827',
    secondary: '#6B7280',
    muted:     '#9CA3AF',
  },
}
```
