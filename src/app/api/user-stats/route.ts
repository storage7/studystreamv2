import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batches, subjects, lectures } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Using sql`count(*)` is the most reliable way to count rows in Drizzle
    const [batchesCount] = await db.select({ value: sql<number>`count(*)` }).from(batches);
    const [subjectsCount] = await db.select({ value: sql<number>`count(*)` }).from(subjects);
    const [lecturesCount] = await db.select({ value: sql<number>`count(*)` }).from(lectures);

    return NextResponse.json({
      stats: {
        // Enforce Number type just in case the database returns it as a string
        batches: Number(batchesCount?.value) || 0,
        subjects: Number(subjectsCount?.value) || 0,
        lectures: Number(lecturesCount?.value) || 0,
      },
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
