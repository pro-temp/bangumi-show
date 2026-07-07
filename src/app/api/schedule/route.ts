import { NextResponse } from "next/server";
import { getSeasonSchedule } from "@/lib/server/anime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const season = searchParams.get("season");
  const parsedYear = year ? Number(year) : undefined;

  const result = await getSeasonSchedule({
    year: parsedYear && Number.isFinite(parsedYear) ? parsedYear : undefined,
    season: season ?? undefined
  });

  return NextResponse.json(result);
}
