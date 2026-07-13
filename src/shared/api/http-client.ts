export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface HttpClient {
  get<T>(path: string, config?: RequestConfig): Promise<T>;
  post<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  put<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(path: string, config?: RequestConfig): Promise<T>;
}
