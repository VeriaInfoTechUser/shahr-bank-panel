/**
 * Accessibility utilities for ESG Report
 * WCAG 2.1 AA compliance helpers
 */

/**
 * ARIA label builder
 */
export function buildAriaLabel(parts: string[]): string {
  return parts.filter((p) => p && typeof p === 'string').join(', ')
}

/**
 * Get ARIA description for numeric values
 * @example
 * getValueDescription(2850, 'tonnes', 'CO2e emissions')
 * // Returns: "2,850 tonnes of CO2e emissions"
 */
export function getValueDescription(
  value: number,
  unit: string,
  label: string
): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(value)
  return `${formatted} ${unit} ${label}`
}

/**
 * WCAG AA color contrast checker
 * @param foreground - RGB hex color #RRGGBB
 * @param background - RGB hex color #RRGGBB
 * @returns contrast ratio and pass/fail status
 */
export function checkContrast(
  foreground: string,
  background: string
): {
  ratio: number
  passAA: boolean
  passAAA: boolean
} {
  const luminance = (rgb: string): number => {
    const hex = rgb.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const [rs, gs, bs] = [r, g, b].map((x) => {
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = luminance(foreground)
  const l2 = luminance(background)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= 4.5, // Normal text
    passAAA: ratio >= 7, // Enhanced
  }
}

/**
 * Generate keyboard shortcut hints
 */
export const KeyboardShortcuts = {
  TAB: 'Tab',
  SHIFT_TAB: 'Shift + Tab',
  ENTER: 'Enter',
  SPACE: 'Space',
  ARROW_UP: 'Arrow Up',
  ARROW_DOWN: 'Arrow Down',
  ARROW_LEFT: 'Arrow Left',
  ARROW_RIGHT: 'Arrow Right',
  ESCAPE: 'Escape',
  HOME: 'Home',
  END: 'End',
} as const

/**
 * Focus management utilities
 */
export const FocusUtils = {
  /**
   * Find all focusable elements
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(container.querySelectorAll(selector)).filter((el) => {
      const style = window.getComputedStyle(el as HTMLElement)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }) as HTMLElement[]
  },

  /**
   * Set focus to element with announcement
   */
  setFocus(el: HTMLElement, announce?: string) {
    el.focus()

    if (announce) {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.className = 'sr-only'
      announcement.textContent = announce
      document.body.appendChild(announcement)

      setTimeout(() => announcement.remove(), 1000)
    }
  },

  /**
   * Trap focus within container
   */
  createFocusTrap(container: HTMLElement) {
    return {
      focusableElements: FocusUtils.getFocusableElements(container),
      handleKeyDown: (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return

        const focusableElements = FocusUtils.getFocusableElements(container)
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      },
    }
  },
}

/**
 * Screen reader only text
 */
export const screenReaderOnly = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`

/**
 * Announce changes to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => announcement.remove(), 2000)
}

/**
 * Format data for screen readers
 */
export const a11yFormatters = {
  /**
   * Read large numbers naturally
   * @example
   * readNumber(1234567) // "1.2 million"
   */
  readNumber: (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} million`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} thousand`
    }
    return num.toString()
  },

  /**
   * Read percentage with context
   */
  readPercentage: (value: number, label: string): string => {
    return `${value} percent ${label}`
  },

  /**
   * Read currency value
   */
  readCurrency: (value: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value)
  },

  /**
   * Read date naturally
   */
  readDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },

  /**
   * Read trend direction
   */
  readTrend: (value: number): string => {
    if (value > 0) return 'increased'
    if (value < 0) return 'decreased'
    return 'unchanged'
  },
}

/**
 * Build accessible table headers
 */
export function buildTableAriaLabel(
  rowIndex: number,
  colIndex: number,
  headerRow: string[],
  headerCol?: string
): string {
  const parts = [
    `Row ${rowIndex + 1}`,
    `Column ${headerRow[colIndex]}`,
  ]

  if (headerCol) {
    parts.unshift(headerCol)
  }

  return parts.join(' '
}

/**
 * Create accessible skip links
 */
export function createSkipLink(target: string, label: string): HTMLElement {
  const link = document.createElement('a')
  link.href = `#${target}`
  link.textContent = label
  link.className = 'skip-link'
  link.setAttribute('aria-label', label)

  // CSS for skip link (add to your stylesheet)
  // .skip-link {
  //   position: absolute;
  //   top: -40px;
  //   left: 0;
  //   background: #000;
  //   color: white;
  //   padding: 8px;
  //   text-decoration: none;
  //   z-index: 100;
  // }
  // .skip-link:focus {
  //   top: 0;
  // }

  return link
}

/**
 * Validate ARIA attributes on element
 */
export function validateAriaAttributes(el: HTMLElement): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  const ariaAttrs = Array.from(el.attributes).filter((attr) =>
    attr.name.startsWith('aria-')
  )

  if (ariaAttrs.length === 0 && ['BUTTON', 'A', 'INPUT'].includes(el.tagName)) {
    warnings.push(`${el.tagName} element missing ARIA attributes`)
  }

  // Check aria-label or aria-labelledby
  const hasLabel =
    el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
  const hasTextContent = el.textContent?.trim().length ?? 0 > 0

  if (!hasLabel && !hasTextContent && el.hasAttribute('aria-hidden') === false) {
    warnings.push(`Interactive element lacks accessible label`)
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

/**
 * Export all validators for testing
 */
export const a11yValidators = {
  checkContrast,
  validateAriaAttributes,
}
