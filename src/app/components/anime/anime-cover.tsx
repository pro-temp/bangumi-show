"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { animeTitle } from "@/lib/anime/display";
import type { AnimeWork } from "@/lib/anime/model";

export function AnimeCover({ anime, className = "" }: { anime: AnimeWork; className?: string }) {
  return (
    <CoverImage
      badge={anime.type}
      className={className}
      src={anime.imageUrl}
      title={animeTitle(anime)}
    />
  );
}

export function CoverImage({
  badge,
  className = "",
  src,
  title
}: {
  badge?: string;
  className?: string;
  src?: string;
  title: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const hasImage = Boolean(src && !failed);

  return (
    <div
      className={`relative aspect-[3/4] shrink-0 overflow-hidden rounded-[5px] bg-[var(--surface)] ${className}`}
    >
      {!hasImage || !loaded ? <CoverPlaceholder badge={badge} /> : null}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          decoding="async"
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          src={src}
        />
      ) : null}
    </div>
  );
}

function CoverPlaceholder({ badge }: { badge?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e8eaec] text-[var(--muted)]">
      <ImageOff aria-hidden className="h-5 w-5 opacity-45" />
      {badge ? <span className="mt-1.5 text-[10px] font-semibold">{badge}</span> : null}
    </div>
  );
}
