/**
 * Performance optimization utilities
 * Lazy loading, debouncing, virtualization helpers
 */

/**
 * Intersection Observer for lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null

  constructor(options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver(this.handleIntersection, {
      rootMargin: '50px',
      ...options,
    })
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement
        this.loadElement(el)
        this.observer?.unobserve(el)
      }
    })
  }

  /**
   * Observe element for lazy loading
   */
  observe(el: HTMLElement) {
    this.observer?.observe(el)
  }

  /**
   * Load element (override in subclass)
   */
  protected loadElement(el: HTMLElement) {
    // Override this method
    el.dispatchEvent(new Event('lazy-load'))
  }

  /**
   * Cleanup
   */
  disconnect() {
    this.observer?.disconnect()
  }
}

/**
 * Lazy load images
 */
export class LazyImageLoader extends LazyLoader {
  protected loadElement(el: HTMLElement) {
    if (el.tagName === 'IMG') {
      const img = el as HTMLImageElement
      const src = img.dataset.src
      const srcset = img.dataset.srcset

      if (src) {
        img.src = src
      }
      if (srcset) {
        img.srcset = srcset
      }

      img.removeAttribute('data-src')
      img.removeAttribute('data-srcset')
    }
  }
}

/**
 * Debounce function - delays execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function - limits execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Resize observer with debouncing
 */
export class ResponsiveObserver {
  private observer: ResizeObserver | null = null
  private debouncedCallback: ((entries: ResizeObserverEntry[]) => void) | null =
    null

  constructor(callback: (entries: ResizeObserverEntry[]) => void, delay = 250) {
    this.debouncedCallback = debounce(callback, delay)
    this.observer = new ResizeObserver(this.debouncedCallback)
  }

  observe(el: HTMLElement) {
    this.observer?.observe(el)
  }

  unobserve(el: HTMLElement) {
    this.observer?.unobserve(el)
  }

  disconnect() {
    this.observer?.disconnect()
  }
}

/**
 * Virtual scroll helper for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number
  visibleCount: number
  totalCount: number
  buffer?: number
}

export interface VirtualScrollState {
  scrollTop: number
  startIndex: number
  endIndex: number
  visibleItems: number[]
  offsetY: number
}

export class VirtualScroller {
  private options: VirtualScrollOptions
  private scrollTop = 0

  constructor(options: VirtualScrollOptions) {
    this.options = {
      buffer: 5,
      ...options,
    }
  }

  /**
   * Calculate visible items for current scroll position
   */
  getVisibleRange(scrollTop: number): VirtualScrollState {
    this.scrollTop = scrollTop
    const { itemHeight, visibleCount, totalCount, buffer = 5 } = this.options

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - buffer
    )
    const endIndex = Math.min(
      totalCount - 1,
      Math.ceil((scrollTop + visibleCount * itemHeight) / itemHeight) + buffer
    )

    const visibleItems = Array.from(
      { length: endIndex - startIndex + 1 },
      (_, i) => startIndex + i
    )

    return {
      scrollTop,
      startIndex,
      endIndex,
      visibleItems,
      offsetY: startIndex * itemHeight,
    }
  }

  /**
   * Get container height for virtual scroll
   */
  getContainerHeight(): number {
    return this.options.totalCount * this.options.itemHeight
  }
}

/**
 * Performance monitoring
 */
export interface PerformanceMetrics {
  name: string
  duration: number
  startTime: number
  endTime: number
}

export class PerformanceMonitor {
  private marks = new Map<string, number>()
  private metrics: PerformanceMetrics[] = []

  /**
   * Start measuring
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * End measurement and record metric
   */
  measure(name: string): PerformanceMetrics {
    const startTime = this.marks.get(name)

    if (!startTime) {
      console.warn(`No mark found for ${name}`)
      return { name, duration: 0, startTime: 0, endTime: 0 }
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    const metric: PerformanceMetrics = {
      name,
      duration,
      startTime,
      endTime,
    }

    this.metrics.push(metric)

    // Auto-cleanup old marks
    if (this.marks.size > 100) {
      const oldestMark = this.marks.entries().next().value
      this.marks.delete(oldestMark[0])
    }

    return metric
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get average duration for metric name
   */
  getAverageDuration(name: string): number {
    const matching = this.metrics.filter((m) => m.name === name)
    if (matching.length === 0) return 0

    const total = matching.reduce((sum, m) => sum + m.duration, 0)
    return total / matching.length
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.marks.clear()
    this.metrics = []
  }

  /**
   * Log metrics to console
   */
  logMetrics(): void {
    console.table(this.metrics)
  }
}

/**
 * Memory-efficient observer with automatic cleanup
 */
export class AutoCleanupObserver {
  private observers = new WeakMap<HTMLElement, IntersectionObserver>()
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(
    el: HTMLElement,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    if (!this.observers.has(el)) {
      const observer = new IntersectionObserver(this.callback, options)
      observer.observe(el)
      this.observers.set(el, observer)
    }

    return this.observers.get(el)!
  }

  unobserve(el: HTMLElement): void {
    const observer = this.observers.get(el)
    if (observer) {
      observer.unobserve(el)
    }
  }
}

/**
 * Batch updates for performance
 */
export class BatchUpdater<T> {
  private queue: T[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private callback: (items: T[]) => void

  constructor(
    callback: (items: T[]) => void,
    private batchSize = 50,
    private delay = 100
  ) {
    this.callback = callback
  }

  add(item: T): void {
    this.queue.push(item)

    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.delay)
    }
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length > 0) {
      const items = this.queue.splice(0)
      this.callback(items)
    }
  }
}

/**
 * Request idle callback fallback
 */
export async function scheduleIdleTask(callback: () => void): Promise<void> {
  if ('requestIdleCallback' in window) {
    return new Promise((resolve) => {
      (window as any).requestIdleCallback(() => {
        callback()
        resolve()
      })
    })
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        callback()
        resolve()
      }, 0)
    })
  }
}

/**
 * Analytics tracking with debouncing
 */
export class AnalyticsTracker {
  private queue: Array<{ event: string; data?: any }> = []
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private sendFn: (events: Array<{ event: string; data?: any }>) => Promise<void>,
    private delay = 5000
  ) {}

  track(event: string, data?: any): void {
    this.queue.push({ event, data })

    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => this.flush(), this.delay)
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length > 0) {
      const events = this.queue.splice(0)
      try {
        await this.sendFn(events)
      } catch (error) {
        console.error('Failed to send analytics:', error)
        // Re-add failed events to queue for retry
        this.queue.unshift(...events)
      }
    }
  }
}
