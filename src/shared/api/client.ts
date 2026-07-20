import type { HttpClient } from "./http-client";
import { createFetchClient } from "./adapters/fetch.adapter";
import { createMockClient } from "./adapters/mock.adapter";
// import { createAxiosClient } from "./adapters/axios.adapter";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const api: HttpClient = useMock
  ? createMockClient()
  : createFetchClient(process.env.NEXT_PUBLIC_API_URL!);
