import { NextResponse } from "next/server";
import { getSourceStatus } from "@/lib/server/anime-service";

export async function GET() {
  const result = await getSourceStatus();

  return NextResponse.json(result);
}
