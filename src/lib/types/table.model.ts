export interface CrudColumn<T> {
  title: string;
  dataIndex: keyof T & string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
  render?: (value: unknown, record: T) => React.ReactNode;
}

export interface PaginatedRequest {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
