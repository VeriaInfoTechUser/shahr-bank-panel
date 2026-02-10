import { ref } from 'vue';
import { ApiError, type ApiErrorNormalized } from '@/core/api/apiError';

export interface UseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiErrorNormalized, variables: TVariables) => void;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  options: UseMutationOptions<TData, TVariables>
) {
  const { mutationFn, onSuccess, onError } = options;

  const data = ref<TData | null>(null);
  const error = ref<ApiErrorNormalized | null>(null);
  const isLoading = ref(false);

  async function mutate(variables: TVariables): Promise<TData | undefined> {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await mutationFn(variables);
      data.value = result;
      onSuccess?.(result, variables);
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
      onError?.(normalized, variables);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function reset(): void {
    data.value = null;
    error.value = null;
    isLoading.value = false;
  }

  return {
    data,
    error,
    isLoading,
    mutate,
    reset,
  };
}
