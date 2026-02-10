import { ref, shallowRef, watch } from 'vue';
import { ApiError, type ApiErrorNormalized } from '@/core/api/apiError';

export interface UseQueryOptions<T> {
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean;
  /** Skip automatic toast on error (toast is shown by http interceptor). Set true to handle in UI. */
  silent?: boolean;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

export function useQuery<T>(
  queryKey: string | (string | number | undefined)[],
  queryFn: () => Promise<T>,
  options: Omit<UseQueryOptions<T>, 'queryFn'> = {}
) {
  const { enabled = true, staleTime = 0, refetchOnMount = true } = options;
  const key = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);

  const data = shallowRef<T | null>(null);
  const error = ref<ApiErrorNormalized | null>(null);
  const isLoading = ref(false);
  const isFetching = ref(false);

  async function execute(): Promise<T | undefined> {
    if (staleTime > 0) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < staleTime) {
        data.value = cached.data as T;
        return cached.data as T;
      }
    }

    isFetching.value = true;
    isLoading.value = true;
    error.value = null;

    try {
      const result = await queryFn();
      data.value = result;
      if (staleTime > 0) {
        cache.set(key, { data: result, timestamp: Date.now() });
      }
      return result;
    } catch (err) {
      const normalized: ApiErrorNormalized =
        err instanceof ApiError
          ? {
              message: err.message,
              code: err.code,
              details: err.details,
              requestId: err.requestId,
              endpoint: err.endpoint,
              method: err.method,
            }
          : {
              message: (err as Error).message || 'An error occurred',
              code: 0,
            };
      error.value = normalized;
      throw err;
    } finally {
      isLoading.value = false;
      isFetching.value = false;
    }
  }

  function invalidate(): void {
    cache.delete(key);
  }

  if (enabled && refetchOnMount) {
    execute();
  }

  return {
    data,
    error,
    isLoading,
    isFetching,
    execute,
    invalidate,
  };
}
