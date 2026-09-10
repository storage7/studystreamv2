import { db } from "@/db";
import { getSession } from "@/lib/auth"; 
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Diagnostic log 1: Verify the exact UUID being searched
    console.log("Fetching stats for User ID:", session.id);

    // Added ::uuid cast to ensure PostgreSQL doesn't reject the parameter
    const result = await db.execute(sql`
      WITH allowed_batches AS (
        SELECT DISTINCT batch_id
        FROM permissions
        WHERE user_id = ${session.id}::uuid
          AND granted = true
          AND batch_id IS NOT NULL
      ),
      allowed_subjects AS (
        SELECT id
        FROM subjects
        WHERE batch_id IN (SELECT batch_id FROM allowed_batches)
      )
      SELECT 
        (SELECT COUNT(*)::int FROM allowed_batches) AS batches_count,
        (SELECT COUNT(*)::int FROM allowed_subjects) AS subjects_count,
        (SELECT COUNT(*)::int FROM lectures WHERE subject_id IN (SELECT id FROM allowed_subjects)) AS lectures_count
    `);

    // Diagnostic log 2: See exactly what Postgres returns before formatting
    console.log("Raw DB Result:", JSON.stringify(result));

    const row = Array.isArray(result) ? result[0] : result?.rows?.[0];

    if (!row) {
      console.log("No row found, returning 0");
      return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 });
    }

    return NextResponse.json({
      batches: Number(row.batches_count || 0),
      subjects: Number(row.subjects_count || 0),
      lectures: Number(row.lectures_count || 0),
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 }); 
  }
}
