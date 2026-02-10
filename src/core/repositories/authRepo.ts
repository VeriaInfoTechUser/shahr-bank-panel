import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';

export interface LoginCredentials {
  identity: string;
  credential: string;
  source?: string;
}

export interface LoginResponse {
  result?: boolean;
  data?: {
    access_token: string;
    token_payload?: { exp?: number };
    [key: string]: unknown;
  };
  error?: { message?: string };
}

export class AuthRepo extends BaseRepo {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('identity', credentials.identity);
    formData.append('credential', credentials.credential);
    formData.append('source', credentials.source ?? 'customer');
    return this.postFormData<LoginResponse>(endpoints.auth.login, formData);
  }

  async logout(allSession = false): Promise<unknown> {
    return this.post(endpoints.auth.logout, { all_session: allSession ? 1 : 0 });
  }
}

export const authRepo = new AuthRepo();
