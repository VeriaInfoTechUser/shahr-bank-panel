export interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  retryableStatuses?: number[];
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  delayMs: 1000,
  retryableStatuses: [408, 429, 500, 502, 503],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, delayMs, retryableStatuses } = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (attempt === maxRetries || !retryableStatuses.includes(status ?? 0)) {
        throw err;
      }

      await sleep(delayMs * Math.pow(2, attempt));
    }
  }

  throw lastError;
}
