import { NextResponse } from "next/server";
import { suggestAnime } from "@/lib/server/anime-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const result = await suggestAnime({ query });

  return NextResponse.json(result);
}
