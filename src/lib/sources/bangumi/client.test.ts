import { describe, expect, it, vi } from "vitest";
import { BangumiApiError, BangumiClient } from "./client";

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
}

describe("BangumiClient", () => {
  it("posts subject search requests with anime filter", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        data: [],
        total: 0
      })
    );
    const client = new BangumiClient({
      baseUrl: "https://api.example.test",
      accessToken: "token",
      userAgent: "bangumi-show-test",
      fetcher
    });

    await client.searchSubjects({ keyword: "测试", filter: { type: [2] }, limit: 10 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.example.test/v0/search/subjects?limit=10&offset=0");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer token",
      "User-Agent": "bangumi-show-test"
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      keyword: "测试",
      sort: "match",
      filter: { type: [2] }
    });
  });

  it("throws structured errors for failed responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("rate limited", { status: 429 }));
    const client = new BangumiClient({ baseUrl: "https://api.example.test", fetcher });

    await expect(client.getSubject("123")).rejects.toBeInstanceOf(BangumiApiError);
    await expect(client.getSubject("123")).rejects.toMatchObject({ status: 429 });
  });
});
