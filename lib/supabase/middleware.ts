import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Simplified: let everything pass through for testing/debugging
  return NextResponse.next();
}
