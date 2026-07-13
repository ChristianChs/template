export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}
