import type { BangumiSearchRequest, BangumiSearchResponse, BangumiSubject } from "./types";

export type BangumiClientOptions = {
  baseUrl?: string;
  accessToken?: string;
  userAgent?: string;
  fetcher?: typeof fetch;
};

export type BangumiSourceHealth = {
  name: "bangumi";
  status: "ready" | "degraded";
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
};

const defaultBaseUrl = "https://api.bgm.tv";
const defaultUserAgent = "bangumi-show/0.1.0 (local use)";

let health: BangumiSourceHealth = {
  name: "bangumi",
  status: "ready"
};

export class BangumiClient {
  private readonly baseUrl: string;
  private readonly accessToken?: string;
  private readonly userAgent: string;
  private readonly fetcher: typeof fetch;

  constructor(options: BangumiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.BANGUMI_API_BASE_URL ?? defaultBaseUrl;
    this.accessToken = options.accessToken ?? process.env.BANGUMI_ACCESS_TOKEN;
    this.userAgent = options.userAgent ?? process.env.BANGUMI_USER_AGENT ?? defaultUserAgent;
    this.fetcher = options.fetcher ?? fetch;
  }

  async searchSubjects(input: {
    keyword?: string;
    sort?: BangumiSearchRequest["sort"];
    filter?: BangumiSearchRequest["filter"];
    limit?: number;
    offset?: number;
  }): Promise<BangumiSearchResponse> {
    const params = new URLSearchParams({
      limit: String(input.limit ?? 20),
      offset: String(input.offset ?? 0)
    });

    return this.request<BangumiSearchResponse>(`/v0/search/subjects?${params.toString()}`, {
      method: "POST",
      body: JSON.stringify({
        keyword: input.keyword,
        sort: input.sort ?? "match",
        filter: input.filter
      })
    });
  }

  async getSubject(subjectId: string): Promise<BangumiSubject> {
    return this.request<BangumiSubject>(`/v0/subjects/${encodeURIComponent(subjectId)}`);
  }

  getHealth(): BangumiSourceHealth {
    return health;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": this.userAgent,
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...init.headers
      }
    });

    if (!response.ok) {
      const message = await safeResponseText(response);
      markError(`Bangumi API ${response.status}: ${message || response.statusText}`);
      throw new BangumiApiError(response.status, message || response.statusText);
    }

    markSuccess();
    return (await response.json()) as T;
  }
}

export class BangumiApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "BangumiApiError";
  }
}

export const bangumiClient = new BangumiClient();

function markSuccess(): void {
  health = {
    name: "bangumi",
    status: "ready",
    lastSuccessAt: new Date().toISOString(),
    lastErrorAt: health.lastErrorAt,
    lastError: health.lastError
  };
}

function markError(message: string): void {
  health = {
    name: "bangumi",
    status: "degraded",
    lastSuccessAt: health.lastSuccessAt,
    lastErrorAt: new Date().toISOString(),
    lastError: message
  };
}

async function safeResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
