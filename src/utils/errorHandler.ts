/**
 * Error handling utilities for ESG Report
 * Handles graceful error recovery, user-friendly messages, and monitoring integration
 */

// Error monitoring service type
interface MonitoringService {
  captureException(error: Error, context?: Record<string, any>): void
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
}

let monitoringService: MonitoringService | null = null

/**
 * Initialize error monitoring (e.g., Sentry, LogRocket)
 * @example
 * initializeErrorMonitoring({
 *   captureException: (error) => Sentry.captureException(error),
 *   captureMessage: (msg) => Sentry.captureMessage(msg)
 * })
 */
export function initializeErrorMonitoring(service: MonitoringService) {
  monitoringService = service
}

/**
 * Application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Log error with monitoring service
 */
export function logError(
  error: Error | AppError,
  context?: Record<string, any>
) {
  // Console logging for development
  console.error('Error logged:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  })

  // Send to monitoring service if available
  if (monitoringService) {
    if (error instanceof AppError) {
      monitoringService.captureException(error, {
        userMessage: error.userMessage,
        code: error.code,
        statusCode: error.statusCode,
        ...context,
      })
    } else {
      monitoringService.captureException(error, context)
    }
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json)
  } catch (error) {
    logError(
      new AppError(
        `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Invalid data format',
        'JSON_PARSE_ERROR'
      )
    )
    return fallback
  }
}

/**
 * Safely access nested object property
 * @example
 * const year = safeAccess(data, 'meta.reporting_year', null)
 */
export function safeAccess<T = any>(
  obj: any,
  path: string,
  fallback: T
): T {
  try {
    const value = path.split('.').reduce((curr, prop) => curr?.[prop], obj)
    return value !== undefined ? value : fallback
  } catch (error) {
    logError(
      new AppError(
        `Failed to access path: ${path}`,
        'Data access error',
        'PATH_ACCESS_ERROR'
      )
    )
    return fallback
  }
}

/**
 * Validate required fields in object
 */
export function validateRequiredFields(
  obj: any,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  fields.forEach((field) => {
    const value = safeAccess(obj, field, undefined)
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Handle API response errors
 */
export function handleApiError(response: any): AppError {
  const statusCode = response?.status || 500
  const message = response?.data?.message || 'An error occurred'
  
  const errorMap: Record<number, { user: string; code: string }> = {
    400: { user: 'Invalid request. Please try again.', code: 'BAD_REQUEST' },
    401: { user: 'Session expired. Please login again.', code: 'UNAUTHORIZED' },
    403: { user: 'You do not have permission to access this.', code: 'FORBIDDEN' },
    404: { user: 'Report not found.', code: 'NOT_FOUND' },
    429: { user: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
    500: { user: 'Server error. Please try again later.', code: 'SERVER_ERROR' },
    503: { user: 'Service unavailable. Please try again later.', code: 'SERVICE_UNAVAILABLE' },
  }

  const errorInfo = errorMap[statusCode] || {
    user: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  }

  return new AppError(message, errorInfo.user, errorInfo.code, statusCode)
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: any): AppError {
  const isTimeout = error?.code === 'ECONNABORTED'
  const isNetworkError = error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR'

  if (isTimeout) {
    return new AppError(
      'Request timeout',
      'Request took too long. Please check your connection and try again.',
      'TIMEOUT_ERROR',
      408
    )
  }

  if (isNetworkError) {
    return new AppError(
      'Network error',
      'Unable to connect. Please check your internet connection.',
      'NETWORK_ERROR',
      0
    )
  }

  return new AppError(
    error?.message || 'Unknown error',
    'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR'
  )
}

/**
 * User-friendly error message
 */
export function getUserErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.userMessage
  }

  // Generic fallback for unknown errors
  return 'An unexpected error occurred. Please try again or contact support.'
}

/**
 * Check if error is critical (requires immediate attention)
 */
export function isCriticalError(error: AppError): boolean {
  const criticalCodes = [
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'DATABASE_ERROR',
    'AUTHENTICATION_ERROR',
  ]

  return criticalCodes.includes(error.code)
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options

  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      logError(
        new AppError(
          `Attempt ${attempt} failed: ${(error as Error).message}`,
          'Request failed. Retrying...',
          'RETRY_ATTEMPT',
          500
        )
      )

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffFactor, maxDelay)
      }
    }
  }

  throw (
    lastError ||
    new AppError(
      'All retry attempts failed',
      'Failed after multiple attempts. Please try again.',
      'MAX_RETRIES_EXCEEDED'
    )
  )
}

/**
 * Type guard for AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError
}
