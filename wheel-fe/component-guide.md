# Component/Page Guide

- Provide a small, reusable design system for any page or component
- Use Tailwind utilities inside scoped SCSS via `@apply` to keep templates clean and maintainable.
- The order of template is : ```<template>```, ```<script>```, ```<style>```
- Keep mode **setup** on script : ```script setup lang="ts"```
- Keep styles **scoped**: `style scoped lang="scss"` in component.
- Import Tailwind utilities with `@reference 'tailwindcss';` at the top of the scoped style block so `@apply` works predictably.
- Use `@apply` to reuse Tailwind utility sets rather than littering the template with many utility classes.
- Use small amounts of raw CSS for complex properties (box-shadow, backdrop-filter, radial gradient) that Tailwind doesn't cover directly.

Example SCSS pattern (from the login page):

```scss
@reference 'tailwindcss';

.page {
  @apply relative min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-hidden;
}

.card {
  @apply w-full max-w-[360px] rounded-xl p-6 border border-slate-600 bg-slate-900/50;
  box-shadow: 0 12px 40px rgba(2,6,23,0.6);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
```

---

## Reusable patterns & tips ✅

- Use small **SCSS placeholders** or component-level classes as single-responsibility atoms (e.g., `card`, `heading`).
- Keep templates tidy: prefer semantic class names (above) over long utility lists inside markup.
