# SCSS Architecture

This directory contains the SCSS (Sass) stylesheets for the Nakhoda Wheel frontend.

## File Structure

```
src/styles/
├── _variables.scss  # SCSS variables and CSS custom properties
├── _mixins.scss     # Reusable SCSS mixins
└── main.scss        # Main stylesheet with global styles
```

## Files

### `_variables.scss`
Contains both SCSS variables (compile-time) and CSS custom properties (runtime theming).

**SCSS Variables** (compile-time):
- Colors: `$color-primary`, `$color-danger`, `$color-success`, etc.
- Spacing: `$spacing-xs` (4px) through `$spacing-xl` (32px)
- Border radius: `$radius-sm` through `$radius-xl`
- Transitions: `$transition-fast`, `$transition-base`, `$transition-slow`

**CSS Custom Properties** (runtime theming):
- Dark theme (default)
- Light theme (via `[data-theme="light"]`)
- These allow dynamic theme switching without recompilation

### `_mixins.scss`
Reusable SCSS mixins for common patterns:

- `@mixin flex-center` - Center content with flexbox
- `@mixin flex-between` - Space-between layout
- `@mixin card-base` - Base card styling
- `@mixin input-base` - Consistent input styling with focus states
- `@mixin button-hover` - Smooth button hover effects
- `@mixin text-truncate` - Truncate text with ellipsis
- `@mixin grid-auto($min-width)` - Responsive auto-fit grid
- `@mixin light-theme-shadow` - Theme-aware box shadows

### `main.scss`
The main stylesheet that:
- Imports `_variables` and `_mixins`
- Contains base reset styles
- Customizes Ant Design components for dark theme
- Defines global utility classes

## Usage in Vue Components

### Importing SCSS Partials

```vue
<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

// Your styles here
</style>
```

### Using SCSS Variables

```scss
.my-component {
  margin: $spacing-md;  // 16px
  padding: $spacing-lg;  // 24px
  border-radius: $radius-md;  // 8px
  transition: all $transition-base;  // 0.2s ease
}
```

### Using SCSS Mixins

```scss
.centered-card {
  @include flex-center;
  @include card-base;
  min-height: 200px;
}

.responsive-grid {
  @include grid-auto(300px);  // Auto-fit grid with 300px min width
}
```

### Using SCSS Nesting

```scss
.container {
  padding: $spacing-md;
  
  &__header {
    @include flex-between;
    margin-bottom: $spacing-lg;
  }
  
  &__title {
    font-size: 24px;
    font-weight: 600;
  }
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
```

### Using CSS Custom Properties

For runtime theming, use CSS custom properties:

```scss
.my-element {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  
  &:hover {
    background: var(--color-surface-alt);
  }
}
```

## Best Practices

1. **Use SCSS variables** for compile-time constants (spacing, sizes, breakpoints)
2. **Use CSS custom properties** for theme-dependent colors
3. **Use mixins** for repeated patterns
4. **Use nesting** with BEM naming (`&__element`, `&--modifier`)
5. **Avoid deep nesting** (max 3-4 levels)
6. **Keep specificity low** - use classes over IDs or element selectors
7. **Use `:deep()` for scoped styles** that need to affect child components

## Theme System

The app supports light and dark themes using CSS custom properties:

```typescript
// To switch themes (in JS)
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.setAttribute('data-theme', 'dark');
```

All color values should reference `var(--color-*)` custom properties to ensure proper theming.

## Common Patterns

### Card Component
```scss
.my-card {
  @include card-base;
  @include light-theme-shadow;
  
  &__header {
    @include flex-between;
    margin-bottom: $spacing-md;
  }
  
  &__content {
    padding: $spacing-lg;
  }
}
```

### Input Component
```scss
.my-input {
  @include input-base;
  width: 100%;
  font-size: 14px;
}
```

### Responsive Grid
```scss
.grid-container {
  @include grid-auto(250px);  // Cards will be at least 250px wide
  margin-bottom: $spacing-lg;
}
```

## Compilation

SCSS is compiled by Vite during development and build:
- Development: Files are compiled on-the-fly with hot reload
- Production: Files are compiled and minified in the build

No additional configuration needed - Vite handles SCSS out of the box with the `sass` package installed.
