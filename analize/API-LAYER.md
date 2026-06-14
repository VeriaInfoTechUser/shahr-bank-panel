# API Layer Analysis

## HTTP Client (`src/core/api/http.ts`)

- **Base URL:** `http://localhost:8085/` (configurable)
- **Timeout:** 30s
- **Auth:** Token from cookie `utn`, sent as `token` header
- **Interceptors:** Request (auth token, requestId), Response (audit logging)
- **Error Handling:** Normalized via `handleApiError()`, toast notifications
- **Retry:** `withRetry()` wrapper for failed requests
- **Audit:** Logs all requests/responses with requestId, userId, endpoint, method, status

## API Client (`src/core/api/apiClient.ts`)

```typescript
apiClient.get<T>(endpoint, params)
apiClient.post<T>(endpoint, body)
apiClient.put<T>(endpoint, body)
apiClient.patch<T>(endpoint, body)
apiClient.delete<T>(endpoint, body)
apiClient.postFormData<T>(endpoint, formData)
apiClient.download(endpoint, body)
apiClient.raw(endpoint, options)
```

## Endpoints (`src/core/api/endpoints.ts`)

| Module | Endpoint Pattern |
|--------|-----------------|
| Auth | `user/authentication/login`, `user/authentication/logout` |
| Profile | `user/profile/view`, `user/profile/update`, `user/profile/history` |
| Password | `user/password/update`, `user/password/add` |
| Notifications | `notification/count`, `notification/list` |
| ERM Rules | `erm/rule/list`, `erm/rule/add`, `erm/rule/edit`, `erm/rule/delete` |
| ERM Tasks | `erm/task/list`, `erm/task/add`, `erm/task/edit`, `erm/task/delete` |
| ERM Compliance | `erm/compliance/list`, `erm/compliance/dashboard`, `erm/compliance/performance` |
| ERM Risk | `erm/risk/list`, `erm/risk/dashboard`, `erm/risk/performance` |
| ERM Members | `erm/member/list`, `erm/member/add`, `erm/member/update`, `erm/member/delete` |
| ESG | `content/item/list`, `content/item/update`, `content/dashboard/get`, `content/report/get` |
| Admin Users | `admin/user/profile/list`, `admin/user/profile/add`, `admin/user/profile/edit` |
| Logger | `admin/logger/history/list` |

## Response Format

```typescript
interface ApiResponse<T> {
  result?: boolean;
  data?: T;
  error?: { message?: string };
}
```

## Error Handling (`src/core/api/apiError.ts`)

- Normalizes all HTTP errors to `ApiError` class
- Shows toast via `vue3-toastify`
- Special handling for 401 (auto-logout)
