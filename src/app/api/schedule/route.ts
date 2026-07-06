import { NextResponse } from "next/server";
import { getSeasonSchedule } from "@/lib/server/anime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const season = searchParams.get("season");

  const result = await getSeasonSchedule({
    year: year ? Number(year) : undefined,
    season: season ?? undefined
  });

  return NextResponse.json(result);
}
