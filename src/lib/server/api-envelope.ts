import type { ApiEnvelope, AnimeSourceName } from "@/lib/anime/model";

export type EnvelopeInput<T> = {
  data: T;
  source: ApiEnvelope<T>["source"];
  sourceLinks?: string[];
  cachedAt?: string;
  warnings?: string[];
};

export function apiEnvelope<T>({
  data,
  source,
  sourceLinks = [],
  cachedAt = new Date().toISOString(),
  warnings = []
}: EnvelopeInput<T>): ApiEnvelope<T> {
  return {
    data,
    source,
    sourceLinks,
    cachedAt,
    warnings
  };
}

export function sourceLinksFor(source: AnimeSourceName, ids: string[]): string[] {
  if (source !== "bangumi") {
    return [];
  }

  return ids.map((id) => `https://bgm.tv/subject/${id}`);
}
