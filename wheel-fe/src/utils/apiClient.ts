const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : undefined;

  console.log(`[API] ${method} ${url}`, body ? JSON.parse(body) : '');

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  console.log(`[API] Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const message = await response.text();
    console.error(`[API] Error: ${message}`);
    throw new Error(message || 'Request failed');
  }

  const data = await response.json() as Promise<T>;
  console.log(`[API] Data:`, data);
  return data;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body });
export const apiPut = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body });
export const apiPatch = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' });
