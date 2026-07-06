import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/server/anime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const result = await searchAnime({ query });

  return NextResponse.json(result);
}
