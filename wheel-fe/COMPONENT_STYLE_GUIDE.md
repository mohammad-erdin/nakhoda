# Component Style Guide

Purpose
- Provide a short, consistent style and structure guide for single-file Vue components (`.vue`).
- Use the `src/pages/Login.vue` component as the canonical example.

Principles
- Be explicit and readable.
- Group related rules and keep styles scoped to the component when possible.
- Favor Tailwind `@apply` inside `lang="scss"` blocks for composable utility patterns.
- Keep theme logic and state in composables (e.g., `useDisplay`) and use class-based dark mode on `document.documentElement` when you need global dark styles.

File / Component Structure
1. Template
   - Keep markup minimal and semantic.
   - Use descriptive class names for structural pieces (e.g., `.page`, `.top-panel`, `.page-inner`, `.card`).
   - Prefer composable components (no inline complex logic in templates).

2. ```<script setup lang="ts">```
   - Import composables and stores from the `@/composables` and `@/stores` namespaces.
   - Keep component logic thin — most shared or side-effect logic should live in composables.
   - Example: `const { isDark, toggleTheme } = useDisplay();` — access reactive state directly.

3. ```<style scoped lang="scss">```
   - Add `@reference 'tailwindcss';` at top.
   - Order and indent selectors in an SCSS/nested way following this hierarchy:
     - Root block (e.g., `.page`) — contains general layout styles.
     - Child blocks (e.g., `.hero`, `.top-panel`, `.page-inner`, `.card`).
     - Within each block, order: layout -> visual -> states -> nested sub-elements (`.heading`, etc.).
   - Use `@apply` for Tailwind utilities instead of repeating raw utility classes in CSS.
   - Use `:deep()` for deep selectors (e.g., icons inside Ant components):
     - `:deep(.anticon) { font-size: 18px; }
   - Theme handling:
     - Use the **class-based** dark approach: `document.documentElement.classList.toggle('dark', isDark)` from a composable.
     - In scoped styles use `.dark .page { @apply ... }` or wrap dark overrides inside `.dark{ .page { ... } }` and nest overrides.
     - Keep default (light) styles in the root `.page` block when it need to be dark, it will be override inside `.dark`.

Styling conventions (from `Login.vue` example)
- Prefer smaller, softer shadows in light mode, stronger slightly darker shadows in dark mode.
- Keep visual differences (background, card border, text colors) in theme blocks rather than toggling individual class lists in markup.

Example skeleton (SCSS nesting pattern)

```scss
@reference 'tailwindcss';

.page {
  @apply bg-white; /* default */
  @apply relative min-h-screen w-full overflow-hidden;
  transition: background-color .25s ease, color .25s ease;

  .top-panel { /* fixed panel */
    .top-panel-content {
      .theme-toggle { /* icon / button */ }
    }
  }

  .page-inner {
    .card { /* padding, border, shadow */
      .heading { /* title & description */ }
    }
  }
}

:global(.dark) {
  .page { @apply bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950; }
  .page .card { @apply border-slate-600 bg-slate-900/50; }
}
```

JavaScript / Composable Guidelines
- Keep theme toggling in a composable (e.g., `useDisplay`) so multiple components can read/write one reactive source.
- The composable should:
  - initialize `isDark` from stored settings or system preference
  - update local storage or store via `st.setSetting('theme', value)`
  - toggle `document.documentElement.classList.toggle('dark', isDark)` so CSS `.dark` rules apply globally