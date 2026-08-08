import { apiClient } from '../api/apiClient';

export interface PaginatedResponse<T> {
  data: {
    list: T[];
    paginator: { count: number; page?: number; limit?: number };
  };
}

export interface ApiResult<T> {
  result: boolean;
  data?: T;
  error?: { message?: string };
}

export abstract class BaseRepo {
  protected client = apiClient;

  protected async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.client.get<T>(endpoint, params);
  }

  protected async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { silent?: boolean }
  ): Promise<T> {
    return this.client.post<T>(endpoint, body, options);
  }

  protected async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.client.put<T>(endpoint, body);
  }

  protected async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.client.delete<T>(endpoint, body);
  }

  protected async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.client.postFormData<T>(endpoint, formData);
  }
}
