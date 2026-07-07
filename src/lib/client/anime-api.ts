import type { AnimeSeason, ApiEnvelope, AnimeWork } from "@/lib/anime/model";

export type SchedulePayload = {
  year: number;
  season: AnimeSeason;
  items: AnimeWork[];
};

export type ScheduleRequest = {
  year?: number;
  season?: AnimeSeason;
};

export async function fetchSchedule(
  input: ScheduleRequest = {}
): Promise<ApiEnvelope<SchedulePayload>> {
  const params = new URLSearchParams();
  if (input.year) {
    params.set("year", String(input.year));
  }
  if (input.season) {
    params.set("season", input.season);
  }

  const query = params.toString();
  return fetchEnvelope<SchedulePayload>(query ? `/api/schedule?${query}` : "/api/schedule");
}

export async function searchAnime(query: string): Promise<ApiEnvelope<AnimeWork[]>> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }

  return fetchEnvelope<AnimeWork[]>(`/api/search?${params.toString()}`);
}

export async function fetchAnimeDetail(id: string): Promise<ApiEnvelope<AnimeWork | null>> {
  return fetchEnvelope<AnimeWork | null>(`/api/anime/${encodeURIComponent(id)}`);
}

async function fetchEnvelope<T>(url: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  return (await response.json()) as ApiEnvelope<T>;
}
