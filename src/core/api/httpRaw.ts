import { getCookie } from '@/utils/cookie';
import { generateRequestId, logAudit } from './auditLogger';
import { withRetry } from './retryHandler';
import { base_url } from '@/constants/config';
import { handleApiError, ApiError } from './apiError';

export interface RawRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function httpRaw(
  endpoint: string,
  options: RawRequestOptions = {}
): Promise<Response> {
  const { method = 'GET', body, headers = {} } = options;
  const requestId = generateRequestId();

  const fetchOptions: RequestInit = {
    method,
    mode: 'cors',
    headers: {
      token: getCookie('utn') ?? '',
      ...headers,
    },
  };

  if (body) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
      delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
    } else {
      fetchOptions.body = JSON.stringify(body);
      (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const startTime = Date.now();

  try {
    const response = await withRetry(async () => {
      const res = await fetch(`${base_url}${endpoint}`, fetchOptions);
      const userId = getCookie('utn') ? 'authenticated' : null;
      logAudit({
        requestId,
        userId,
        endpoint,
        method,
        status: res.status,
        duration: Date.now() - startTime,
      });
      return res;
    });

    if (!response.ok) {
      let errMessage = `Request failed with status ${response.status}`;
      let errDetails: unknown;
      try {
        const errData = await response.json();
        if (errData?.error?.message) {
          errMessage = errData.error.message;
        } else if (typeof errData?.message === 'string') {
          errMessage = errData.message;
        }
        errDetails = errData;
      } catch {
        //
      }

      const normalized = handleApiError(new Error(errMessage), {
        requestId,
        endpoint,
        method: method.toUpperCase(),
        statusCode: response.status,
        showToast: true,
      });
      normalized.details = errDetails;

      throw new ApiError(normalized.message, response.status, normalized.details, {
        requestId,
        endpoint,
        method: method.toUpperCase(),
      });
    }

    return response;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    const normalized = handleApiError(err, {
      requestId,
      endpoint,
      method: method.toUpperCase(),
      showToast: true,
    });

    throw new ApiError(normalized.message, normalized.code, normalized.details, {
      requestId,
      endpoint,
      method: method.toUpperCase(),
    });
  }
}

export async function downloadAsBlob(
  endpoint: string,
  body?: unknown
): Promise<Blob> {
  const response = await httpRaw(endpoint, {
    method: 'POST',
    body: body ?? {},
    headers: { 'Content-Type': 'application/json' },
  });

  return response.blob();
}
