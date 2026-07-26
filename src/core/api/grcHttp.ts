import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getCookie, eraseCookie } from '@/utils/cookie';
import { setCurrentUser } from '@/utils/cookie';
import { grc_base_url } from '@/constants/config';
import { handleApiError, ApiError } from './apiError';

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

function createGrcHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: grc_base_url,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      const token = getCookie('utn');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalized = handleApiError(error, {
        requestId: 'grc',
        endpoint: error.config?.url ?? 'unknown',
        method: (error.config?.method ?? 'GET').toUpperCase(),
        showToast: true,
      });

      if (normalized.code === 401) {
        handleUnauthorized();
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

export const grcHttp = createGrcHttpClient();

export async function grcHttpRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await grcHttp.request<T>(config);
  return response.data;
}
