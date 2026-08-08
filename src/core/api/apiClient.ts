import { httpRequest } from './http';
import { httpRaw, downloadAsBlob } from './httpRaw';
import type { AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  result?: boolean;
  data?: T;
  error?: { message?: string };
}

export class ApiClient {
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const config: AxiosRequestConfig = { method: 'GET', url: endpoint, params };
    return httpRequest<T>(config);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { silent?: boolean }
  ): Promise<T> {
    const config: AxiosRequestConfig = { method: 'POST', url: endpoint, data: body };
    if (options?.silent) {
      (config as AxiosRequestConfig & { silent?: boolean }).silent = true;
    }
    return httpRequest<T>(config);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const config: AxiosRequestConfig = { method: 'PUT', url: endpoint, data: body };
    return httpRequest<T>(config);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const config: AxiosRequestConfig = { method: 'PATCH', url: endpoint, data: body };
    return httpRequest<T>(config);
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    const config: AxiosRequestConfig = { method: 'DELETE', url: endpoint, data: body };
    return httpRequest<T>(config);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: endpoint,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    return httpRequest<T>(config);
  }

  async download(endpoint: string, body?: unknown): Promise<Blob> {
    return downloadAsBlob(endpoint, body);
  }

  async raw(endpoint: string, options?: { method?: string; body?: unknown }): Promise<Response> {
    return httpRaw(endpoint, {
      method: (options?.method as 'GET' | 'POST') ?? 'GET',
      body: options?.body,
    });
  }
}

export const apiClient = new ApiClient();
