export type RecentSearchRepository = {
  list(): string[];
  add(query: string): string[];
  clear(): void;
};
