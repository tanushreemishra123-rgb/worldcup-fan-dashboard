# Responsive Design Evidence (REQ_12 / REQ-RESP-001)

The application is responsive across desktop, tablet and mobile. Evidence:

## 1. Viewport meta tag
In `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## 2. Media queries
Media queries exist in BOTH `index.html` (inline `<style>` block) and `css/styles.css`:

```css
@media (max-width: 820px){   /* tablet: fewer columns */
  .stats{grid-template-columns:repeat(2,1fr)}
  .form{grid-template-columns:1fr}
  .groups{grid-template-columns:1fr}
}
@media (max-width: 480px){   /* phone: single column, tighter padding */
  .stats{grid-template-columns:1fr}
  .wrap{padding:0 12px}
  h1.big{font-size:38px}
  .teamgrid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
}
@media (prefers-reduced-motion: reduce){  /* accessibility */
  .ticker-inner{animation:none}
  .bar-fill{transition:none}
}
```

## 3. Fluid layout
- Layout uses CSS Grid and Flexbox with fluid widths (no fixed-pixel container widths).
- The fan-support chart is inline SVG with a `viewBox`, so it scales to any width.
- Touch/tap: all interactive elements are standard `<button>`/`<a>` elements, which are
  fully touch-operable on mobile; navigation is single-tap.

This satisfies responsive design across desktop, tablet, and mobile viewports.
