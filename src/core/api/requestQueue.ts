const pendingRequests = new Map<string, Promise<unknown>>();

export function getRequestKey(method: string, url: string, body?: unknown): string {
  const bodyStr = body ? JSON.stringify(body) : '';
  return `${method}:${url}:${bodyStr}`;
}

export function getPendingRequest<T>(key: string): Promise<T> | undefined {
  return pendingRequests.get(key) as Promise<T> | undefined;
}

export function setPendingRequest<T>(key: string, promise: Promise<T>): void {
  pendingRequests.set(key, promise);
  promise.finally(() => pendingRequests.delete(key));
}

export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}
