# ESG Report Styling System

## Quick Start

### Import in your Vue component:
```scss
<style scoped lang="scss">
@import '@/styles/variables';

.my-component {
  @include media-md {
    // Responsive styles
  }
}
</style>
```

### Import globally (in main.ts/main.js):
```ts
import '@/styles/global.scss'
import '@/styles/utilities.scss'
import '@/styles/layout.scss'
```

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#2c5aa0` - Main brand color
- **Primary Light**: `#3d6fb0` - Lighter variant
- **Primary Dark**: `#1a3860` - Darker variant

### Status Colors
- **Success**: `#27ae60` ✓ - Positive actions
- **Warning**: `#f39c12` ⚠️ - Caution/alerts
- **Error**: `#e74c3c` ✗ - Errors/critical
- **Info**: `#3498db` ℹ️ - Information

### Neutral Colors
- **Dark**: `#34495e` - Main text
- **Medium**: `#7f8c8d` - Secondary text
- **Light**: `#bdc3c7` - Tertiary text
- **Lighter**: `#ecf0f1` - Light background

### CSS Variables (use in any context)
```css
var(--color-primary)
var(--color-success)
var(--color-warning)
var(--color-error)
var(--bg-primary)
var(--text-primary)
var(--text-secondary)
var(--border-color)
```

---

## Typography

### Font Families
- **Base Font**: `Vazir`, `Tahoma` (Persian-friendly)
- **Monospace**: `Courier New`, `IBM Plex Mono`

### Font Sizes
| Size | Value | Usage |
|------|-------|-------|
| xs | 12px | Captions, badges |
| sm | 14px | Small text |
| base | 16px | Body text (default) |
| lg | 18px | Slightly larger body |
| xl | 20px | Heading 4 |
| 2xl | 24px | Heading 2 |
| 3xl | 28px | Heading 1 |

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

### Mixins
```scss
@include font-h1;    // 28px, bold, tight line-height
@include font-h2;    // 24px, bold
@include font-h3;    // 20px, semibold
@include font-h4;    // 18px, semibold
@include font-body;  // 16px, normal, 1.5 line-height
@include font-body-sm; // 14px, normal
@include font-caption; // 12px, tight
```

---

## Spacing System

Based on **8px grid**:

| Size | Value | CSS Variable |
|------|-------|--------------|
| 0 | 0px | $space-0 |
| 1 | 4px | $space-1 |
| 2 | 8px | $space-2 |
| 3 | 12px | $space-3 |
| 4 | 16px | $space-4 |
| 6 | 24px | $space-6 |
| 8 | 32px | $space-8 |
| 10 | 40px | $space-10 |
| 12 | 48px | $space-12 |
| 16 | 64px | $space-16 |

### Usage
```scss
padding: $space-4;
margin: $space-6;
gap: $space-8;
```

---

## Responsive Breakpoints

### Mobile-First Approach
```scss
// Mobile (default)
.element {
  display: block;
}

// Tablet (768px+)
@include media-md {
  .element {
    display: grid;
  }
}

// Desktop (1024px+)
@include media-lg {
  .element {
    display: flex;
  }
}

// Large desktop (1200px+)
@include media-xl {
  .element {
    max-width: 1000px;
  }
}
```

### Breakpoints
| Name | Width |
|------|-------|
| xs | 320px |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1200px |
| 2xl | 1400px |

---

## RTL (Right-to-Left) Support

### Using Mixins
```scss
// Flexbox reverse
@include rtl-flex;

// Margins
@include rtl-margin-left($space-4);
@include rtl-margin-right($space-4);

// Borders
@include rtl-border-left($border-width-thin, solid, $primary-color);

// Text alignment
@include rtl-text-align('left'); // Will be 'right' in RTL
```

### Using CSS Selector
```scss
.component {
  margin-left: $space-4;
  
  [dir='rtl'] & {
    margin-left: 0;
    margin-right: $space-4;
  }
}
```

### Using CSS Logical Properties (automatic RTL)
```scss
.component {
  margin-inline-start: $space-4;  // Works for both LTR & RTL
  padding-inline-end: $space-4;
  border-inline-start: 3px solid;
}
```

---

## Dark Mode Support

### Using Prefers Color Scheme
```scss
@include dark-mode {
  .component {
    background: $dark-bg-primary;
    color: $dark-text-primary;
  }
}
```

### Using Data Attribute
```scss
// On HTML element: [data-theme='dark']
[data-theme='dark'] .component {
  background: $dark-bg-primary;
}
```

### CSS Variables (automatic)
```scss
.component {
  background-color: var(--bg-primary);  // Automatically switches
  color: var(--text-primary);
}
```

---

## Layout Utilities

### Container
```html
<div class="container">
  <!-- Max-width 1200px, centered, responsive padding -->
</div>
```

### Grid System
```html
<div class="grid grid-3">
  <!-- 1 col mobile, 2 col tablet, 3 col desktop -->
</div>

<div class="grid grid-auto">
  <!-- Auto-fill with 250px+ columns -->
</div>
```

### Flex Utilities
```scss
.flex-center        // Centered flex
.flex-between       // Flex with space-between
.flex-row          // Row direction
.flex-col          // Column direction
.items-center      // Align items center
.justify-center    // Justify content center
```

### Responsive Classes
```html
<div class="hidden-mobile">Visible on desktop</div>
<div class="block-mobile">Visible on mobile</div>
<div class="hidden-desktop">Visible on mobile</div>
```

---

## Common Components

### Card
```html
<div class="card">
  <!-- White background, border, shadow, hover effect -->
</div>
```

### Alert
```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>
<div class="alert alert-info">Info message</div>
```

### Badge
```html
<span class="badge">Default</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
```

### Button
```html
<button class="btn">Primary</button>
<button class="btn secondary">Secondary</button>
<button class="btn success">Success</button>
<button class="btn danger">Danger</button>
```

---

## Transitions & Animations

### Durations
```scss
$transition-fast: 150ms
$transition-base: 300ms  // Default
$transition-slow: 500ms
```

### Common Transitions
```scss
transition: all $transition-base;  // Smooth all properties
transition: background $transition-fast; // Fast background change
```

### Usage
```scss
.button {
  background: $primary-color;
  transition: all $transition-base;
  
  &:hover {
    background: $primary-dark;
  }
}
```

---

## Shadows

| Level | Value |
|-------|-------|
| none | 0 |
| sm | 0 1px 2px rgba(0,0,0,0.05) |
| md | 0 4px 6px rgba(0,0,0,0.1) |
| lg | 0 10px 15px rgba(0,0,0,0.1) |
| xl | 0 20px 25px rgba(0,0,0,0.1) |
| 2xl | 0 25px 50px rgba(0,0,0,0.25) |

```html
<div class="shadow">Basic shadow</div>
<div class="shadow-lg">Large shadow</div>
```

---

## Best Practices

### 1. Always Use Variables
```scss
// ✓ Good
padding: $space-4;
color: var(--color-primary);
border-radius: $radius-lg;

// ✗ Bad
padding: 16px;
color: #2c5aa0;
border-radius: 8px;
```

### 2. Mobile-First Approach
```scss
// ✓ Good
.component {
  display: block;      // Mobile
  @include media-md {
    display: grid;     // Tablet+
  }
}

// ✗ Bad
.component {
  display: grid;
  @include max-md {
    display: block;    // Harder to maintain
  }
}
```

### 3. Use Mixins for RTL
```scss
// ✓ Good
@include rtl-margin-left($space-4);

// ✗ Bad
margin-left: $space-4;
[dir='rtl'] & { margin-right: $space-4; }
```

### 4. Keep Responsive with Breakpoint Mixins
```scss
// ✓ Good
@include media-md {
  width: 50%;
}

// ✗ Bad
@media (min-width: 768px) {
  width: 50%;
}
```

### 5. Use CSS Variables for Dynamic Colors
```scss
// ✓ Good
background: var(--bg-primary);
color: var(--text-primary);

// ✗ Bad
background: $bg-primary;  // Won't update in dark mode
```

---

## Example Component

```vue
<template>
  <div class="card-component">
    <h2 class="title">Card Title</h2>
    <p class="description">Card description text</p>
    <button class="btn">Action</button>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/variables';

.card-component {
  @include card;  // Uses predefined card styles
  
  .title {
    @include font-h3;
    margin-bottom: $space-4;
    color: var(--text-primary);
  }
  
  .description {
    @include font-body;
    color: var(--text-secondary);
    margin-bottom: $space-6;
    
    @include media-md {
      font-size: $font-size-lg;
    }
  }
  
  .btn {
    width: 100%;
    
    @include media-md {
      width: auto;
    }
  }
  
  // RTL support
  [dir='rtl'] & {
    direction: rtl;
    text-align: right;
  }
}
</style>
```

---

## ThemeProvider Usage

```vue
<template>
  <ThemeProvider 
    :initial-theme="'auto'" 
    :show-toggle="true"
    @theme-change="onThemeChange"
  >
    <RouterView />
  </ThemeProvider>
</template>

<script setup>
import ThemeProvider from '@/components/ThemeProvider.vue'

const onThemeChange = (theme) => {
  console.log('Theme changed to:', theme)
}
</script>
```

---

## Utility Classes

All utility classes are available in `utilities.scss`:

```html
<!-- Spacing -->
<div class="p-4 m-6">Content</div>

<!-- Colors -->
<div class="text-primary bg-secondary">Text</div>

<!-- Display -->
<div class="flex justify-between items-center">Flex</div>

<!-- Responsive -->
<div class="hidden-mobile block-desktop">Desktop only</div>
<div class="w-full md:w-1/2 lg:w-1/3">Responsive width</div>

<!-- Text -->
<h1 class="text-3xl font-bold uppercase">Heading</h1>
```

---

For more examples, check the component files in `/src/components/`.
