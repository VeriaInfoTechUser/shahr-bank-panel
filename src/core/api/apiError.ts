/**
 * Centralized API error handling: types, normalization, logging, and toast.
 * Enterprise-grade, multi-client SaaS ready.
 */

import { toast } from 'vue3-toastify';

export interface ApiErrorNormalized {
  message: string;
  code: number;
  details?: unknown;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

export interface ApiErrorLogEntry {
  endpoint: string;
  method: string;
  statusCode: number;
  message: string;
  requestId: string;
  timestamp: string;
  details?: unknown;
}

const errorLogs: ApiErrorLogEntry[] = [];

export function logApiError(entry: ApiErrorLogEntry): void {
  const log: ApiErrorLogEntry = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  errorLogs.push(log);
  if (import.meta.env.DEV) {
    console.error('[API Error]', log);
  }
}

export function getApiErrorLogs(): ApiErrorLogEntry[] {
  return [...errorLogs];
}

export function clearApiErrorLogs(): void {
  errorLogs.length = 0;
}

export type ToastLevel = 'error' | 'warning' | 'info' | 'none';

let globalToastEnabled: ToastLevel = 'error';

export function setGlobalToastEnabled(level: ToastLevel): void {
  globalToastEnabled = level;
}

export function showErrorToast(message: string, level: ToastLevel = 'error'): void {
  if (globalToastEnabled === 'none' || level === 'none') return;
  if (globalToastEnabled === 'error' && level !== 'error') return;

  toast(message, {
    theme: 'auto',
    type: level,
    autoClose: 5000,
    dangerouslyHTMLString: true,
  });
}

/**
 * Normalize any error into ApiErrorNormalized format.
 */
export function normalizeError(
  err: unknown,
  context?: { requestId?: string; endpoint?: string; method?: string }
): ApiErrorNormalized {
  const base = {
    message: 'An unexpected error occurred.',
    code: 0,
    details: undefined as unknown | undefined,
    requestId: context?.requestId,
    endpoint: context?.endpoint,
    method: context?.method,
  };

  if (err instanceof Error) {
    base.message = err.message;

    const axiosErr = err as {
      response?: { status?: number; data?: unknown };
      config?: { url?: string; method?: string };
      code?: string;
    };

    if (axiosErr.response) {
      base.code = axiosErr.response.status ?? 0;
      const data = axiosErr.response.data as Record<string, unknown> | undefined;
      if (Array.isArray(data?.error)) {
        base.message = (data.error as string[]).filter(Boolean).join('<br/>');
        base.details = data.error;
      } else if (data?.error && typeof data.error === 'object' && data.error !== null) {
        const errObj = data.error as Record<string, unknown>;
        base.message = (errObj.message as string) ?? base.message;
        base.details = errObj;
      } else if (typeof data?.message === 'string') {
        base.message = data.message;
      } else if (typeof data?.message === 'object' && data?.message !== null) {
        base.details = data.message;
      }
      base.endpoint = base.endpoint ?? axiosErr.config?.url;
      base.method = base.method ?? axiosErr.config?.method?.toUpperCase();
    }

    if (err.name === 'NetworkError' || err.message?.toLowerCase().includes('network') || axiosErr.code === 'ERR_NETWORK') {
      base.code = 0;
      base.message = 'Network error. Please check your connection.';
    }
    if (
      err.name === 'AxiosError' &&
      (err.message?.toLowerCase().includes('timeout') || axiosErr.code === 'ECONNABORTED')
    ) {
      base.code = 408;
      base.message = 'Request timed out. Please try again.';
    }
  }

  return base;
}

/**
 * Handle error: normalize, log, optionally toast, then rethrow or return.
 */
export function handleApiError(
  err: unknown,
  options: {
    requestId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    showToast?: boolean;
    toastLevel?: ToastLevel;
  } = {}
): ApiErrorNormalized {
  const { requestId, endpoint, method, statusCode, showToast = true, toastLevel = 'error' } = options;
  const normalized = normalizeError(err, { requestId, endpoint, method });
  if (statusCode !== undefined) normalized.code = statusCode;

  logApiError({
    endpoint: normalized.endpoint ?? 'unknown',
    method: normalized.method ?? 'UNKNOWN',
    statusCode: normalized.code,
    message: normalized.message,
    requestId: normalized.requestId ?? 'unknown',
    timestamp: new Date().toISOString(),
    details: normalized.details,
  });

  if (showToast && normalized.code !== 401) {
    // 401: handled by http interceptor (logout), avoid duplicate toast
    showErrorToast(normalized.message, toastLevel);
  }

  return normalized;
}

/**
 * Create an ApiError that can be thrown and normalized later.
 */
export class ApiError extends Error {
  code: number;
  details?: unknown;
  requestId?: string;
  endpoint?: string;
  method?: string;

  constructor(
    message: string,
    code: number = 0,
    details?: unknown,
    context?: { requestId?: string; endpoint?: string; method?: string }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.requestId = context?.requestId;
    this.endpoint = context?.endpoint;
    this.method = context?.method;
  }
}
