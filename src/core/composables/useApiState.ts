import { ref, shallowRef } from 'vue';
import { normalizeError, ApiError, type ApiErrorNormalized } from '@/core/api/apiError';

export const globalLoading = ref(false);
export const globalError = ref<ApiErrorNormalized | null>(null);

export interface UseApiStateOptions {
  /** When true, handle() sets global loading/error. Default: false (local only) */
  useGlobal?: boolean;
}

export function useApiState(options: UseApiStateOptions = {}) {
  const { useGlobal = false } = options;

  const loading = ref(false);
  const error = shallowRef<ApiErrorNormalized | null>(null);

  function setLoading(value: boolean): void {
    loading.value = value;
    if (useGlobal) globalLoading.value = value;
  }

  function setError(err: ApiErrorNormalized | string | null): void {
    const normalized: ApiErrorNormalized | null =
      err === null
        ? null
        : typeof err === 'string'
          ? { message: err, code: 0 }
          : err;
    error.value = normalized;
    if (useGlobal) globalError.value = normalized;
  }

  function clearError(): void {
    error.value = null;
    if (useGlobal) globalError.value = null;
  }

  /**
   * Wrap an async API call with loading/error handling.
   * Errors are already logged/toasted by http/httpRaw interceptors.
   * This sets local error state for UI display.
   */
  async function handle<T>(fn: () => Promise<T>): Promise<T> {
    setLoading(true);
    clearError();

    try {
      const result = await fn();
      return result;
    } catch (err) {
      const normalized =
        err instanceof ApiError
          ? {
              message: err.message,
              code: err.code,
              details: err.details,
              requestId: err.requestId,
              endpoint: err.endpoint,
              method: err.method,
            }
          : normalizeError(err);
      setError(normalized);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    globalLoading: useGlobal ? globalLoading : undefined,
    globalError: useGlobal ? globalError : undefined,
    setLoading,
    setError,
    clearError,
    handle,
  };
}
