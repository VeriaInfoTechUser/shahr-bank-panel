# Setup & Configuration Guide

## Testing Setup

### Install Dependencies

```bash
npm install --save-dev vitest @vitest/ui @testing-library/vue
npm install --save-dev @testing-library/jest-dom happy-dom
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/__tests__/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Run Tests

```bash
# Watch mode
npm run test

# UI dashboard
npm run test:ui

# Coverage report
npm run test:coverage
```

---

## Error Monitoring Setup

### Sentry Integration

**1. Install:**
```bash
npm install @sentry/vue @sentry/tracing
```

**2. Initialize in main.ts:**

```typescript
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'
import { createApp } from 'vue'
import { initializeErrorMonitoring } from '@/utils/errorHandler'
import App from './App.vue'

const app = createApp(App)

// Initialize Sentry
Sentry.init({
  app,
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new BrowserTracing(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.url?.includes('/api/')) {
      delete event.request.cookies
    }
    return event
  },
})

// Initialize error monitoring
initializeErrorMonitoring({
  captureException: (error, context) => Sentry.captureException(error, { extra: context }),
  captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
})

app.use(Sentry.ErrorBoundary)
```

**3. Environment Variables (.env.production):**

```
VITE_SENTRY_DSN=https://your-key@sentry.io/your-project
```

### LogRocket Integration (Optional)

```typescript
import LogRocket from 'logrocket'
import { initializeErrorMonitoring } from '@/utils/errorHandler'

LogRocket.init(process.env.VITE_LOGROCKET_ID)

initializeErrorMonitoring({
  captureException: (error) => LogRocket.captureException(error),
  captureMessage: (msg) => LogRocket.log(msg),
})
```

---

## Performance Monitoring

### Add Google Analytics

```typescript
import { initializeAnalytics, track } from '@/utils/analytics'

// Track page views
track('page_view', { title: 'Report Overview' })

// Track user actions
track('tab_switched', { tab: 'environmental' })

// Track performance metrics
track('report_load_time', { duration: 2500 })
```

### Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log) // Cumulative Layout Shift
getFID(console.log) // First Input Delay
getFCP(console.log) // First Contentful Paint
getLCP(console.log) // Largest Contentful Paint
getTTFB(console.log) // Time to First Byte
```

---

## Accessibility Audit

### Automated Tools

```bash
# Install axe
npm install --save-dev @axe-core/react

# Run in tests
import { axe } from 'jest-axe'

it('should not have accessibility violations', async () => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Manual Checklist

- [ ] Tab through all pages (keyboard navigation)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check color contrast with axe DevTools
- [ ] Verify focus indicators visible
- [ ] Test with browser zoom at 200%
- [ ] Test with reduced motion enabled
- [ ] Check all form labels associated
- [ ] Verify ARIA labels appropriate

### Browser Extensions

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

---

## Environment Variables

### Development (.env.development)

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Production (.env.production)

```
VITE_API_BASE_URL=https://api.example.com
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_LOGROCKET_ID=your-app-id
VITE_GA_ID=G-XXXXXXXXXX
VITE_LOG_LEVEL=error
```

### Build Variables

Access in code:
```typescript
import.meta.env.VITE_API_BASE_URL
import.meta.env.MODE // 'development' or 'production'
```

---

## Browser Support

Target browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

### Polyfills

```typescript
// main.ts
if (!window.requestIdleCallback) {
  window.requestIdleCallback = (callback) => setTimeout(callback, 0)
}

if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = clearTimeout
}
```

---

## Build Optimization

### Vite Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'charts': ['chart.js', 'd3'],
          'i18n': ['vue-i18n'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
  },
})
```

### Code Splitting

```typescript
// Use dynamic imports for sections
const EnvironmentalSection = defineAsyncComponent(() =>
  import('@/components/sections/EnvironmentalSection.vue')
)

const SocialSection = defineAsyncComponent(() =>
  import('@/components/sections/SocialSection.vue')
)
```

---

## PWA Configuration (Optional)

### Install PWA Plugin

```bash
npm install --save-dev vite-plugin-pwa
```

### Configure vite.config.ts

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ESG Report',
        short_name: 'ESG',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
```

---

## Continuous Integration (CI/CD)

### GitHub Actions (.github/workflows/test.yml)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks (husky)

```bash
npm install husky --save-dev
npx husky install

# Add pre-commit hook
echo "npm run lint && npm run test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

---

## Security Hardening

### Content Security Policy

Add to index.html:

```html
<meta 
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.example.com https://sentry.io;
  "
>
```

### Environment Variable Protection

```typescript
// main.ts - Check sensitive values
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL not configured')
}

// Don't expose API keys in client code
// Use backend endpoints instead
```

### XSS Prevention

```typescript
// Use Vue's built-in XSS protection
// ✅ Safe - Vue auto-escapes
<div>{{ userInput }}</div>

// ❌ Unsafe - Only use for trusted content
<div v-html="trustedHtml"></div>

// ✅ Safe alternative
<div v-html="sanitize(userInput)"></div>
```

---

## Deployment

### Static Hosting (Vercel, Netlify)

```bash
# Build
npm run build

# Output is in dist/
# Configure to serve dist/index.html for all routes
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url"
  }
}
```

### Docker Deployment

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Monitoring Checklist

- [ ] Sentry configured for error tracking
- [ ] Analytics events tracked
- [ ] Performance metrics collected
- [ ] Web vitals monitored
- [ ] Error logs aggregated
- [ ] User feedback mechanism enabled
- [ ] Uptime monitoring configured
- [ ] CDN cache strategy defined

---

## Support & Resources

- [Vitest Docs](https://vitest.dev)
- [Vue Testing Docs](https://vuejs.org/guide/scaling-up/testing.html)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
