import { NextResponse } from "next/server";

// 1. Force Next.js to bypass the build cache and evaluate dynamically
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      batches: 2,       // Manually enter Batch count
      subjects: 9,      // Manually enter Subject count
      lectures: 129,    // Manually enter Lecture count
    },
    {
      // 2. Force the user's browser to never cache the response
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
