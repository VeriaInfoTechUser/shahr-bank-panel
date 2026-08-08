import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getCookie, eraseCookie } from '@/utils/cookie';
import { setCurrentUser } from '@/utils/cookie';
import { generateRequestId, logAudit } from './auditLogger';
import { withRetry } from './retryHandler';
import { base_url } from '@/constants/config';
import { handleApiError, ApiError } from './apiError';

const LOGOUT_ENDPOINTS = ['user/authentication/logout'];

let routerInstance: ReturnType<typeof import('@/router').default> | null = null;
function getRouter() {
  if (!routerInstance) {
    routerInstance = import('@/router').then(m => m.default);
  }
  return routerInstance;
}

function handleUnauthorized(): void {
  setCurrentUser(null);
  eraseCookie('utn');
  getRouter().then(r => r.push({ name: 'auth-login' }));
}

function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: base_url,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      const token = getCookie('utn');
      if (token) {
        config.headers.token = token;
      }

      const requestId = generateRequestId();
      (config as AxiosRequestConfig & { requestId?: string }).requestId = requestId;
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      const requestId = (response.config as AxiosRequestConfig & { requestId?: string }).requestId;
      const userId = getCookie('utn') ? 'authenticated' : null;
      logAudit({
        requestId: requestId ?? 'unknown',
        userId,
        endpoint: response.config.url ?? '',
        method: response.config.method ?? 'GET',
        status: response.status,
      });
      return response;
    },
    (error) => {
      const requestId = (error.config as AxiosRequestConfig & { requestId?: string })?.requestId;
      const endpoint = error.config?.url ?? 'unknown';
      const method = (error.config?.method ?? 'GET').toUpperCase();
      // درخواست‌های پس‌زمینه/اختیاری (مثل lookup اسامی) نباید برای کاربر توست خطا نمایش دهند
      const silent =
        (error.config as AxiosRequestConfig & { silent?: boolean })?.silent === true;

      const normalized = handleApiError(error, {
        requestId: requestId ?? 'unknown',
        endpoint,
        method,
        showToast: !silent,
      });

      const userId = getCookie('utn') ? 'authenticated' : null;
      logAudit({
        requestId: requestId ?? 'unknown',
        userId,
        endpoint,
        method,
        status: normalized.code,
      });

      if (normalized.code === 401) {
        const url = error.config?.url ?? '';
        const isLogout = LOGOUT_ENDPOINTS.some((ep) => url.includes(ep));
        // درخواست‌های اختیاری/پس‌زمینه (مثل lookup اسامی اعضا) نباید نشست کاربر را باطل کنند
        if (!isLogout && !silent) {
          handleUnauthorized();
        }
      }

      return Promise.reject(
        new ApiError(normalized.message, normalized.code, normalized.details, {
          requestId: normalized.requestId,
          endpoint: normalized.endpoint,
          method: normalized.method,
        })
      );
    }
  );

  return client;
}

export const http = createHttpClient();

export async function httpRequest<T>(config: AxiosRequestConfig): Promise<T> {
  return withRetry(async () => {
    const response = await http.request<T>(config);
    return response.data;
  });
}
