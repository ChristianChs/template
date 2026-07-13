import type { HttpClient } from "./http-client";
import { createFetchClient } from "./adapters/fetch.adapter";
// import { createAxiosClient } from "./adapters/axios.adapter";

export const api: HttpClient = createFetchClient(process.env.NEXT_PUBLIC_API_URL!);
