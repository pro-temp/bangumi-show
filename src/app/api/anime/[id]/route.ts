import { NextResponse } from "next/server";
import { getAnimeDetail } from "@/lib/server/anime-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await getAnimeDetail(id);

  return NextResponse.json(result);
}
