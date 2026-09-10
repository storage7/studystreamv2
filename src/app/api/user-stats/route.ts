import { db } from "@/db";
import { batches, subjects, lectures, permissions } from "@/db/schema";
import { inArray, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth"; 
import { NextResponse } from "next/server";

// PREVENT CACHING: Forces Next.js to fetch live data on every page load
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Identify the correct column object to prevent ORM mapping crashes
    const userCol = permissions.userId || (permissions as any).user_id;

    const allUserPermissions = await db
      .select()
      .from(permissions)
      .where(eq(userCol, session.id));

    // 2. Extract batch IDs, checking both camelCase and snake_case properties
    // We also filter in memory to explicitly ensure the 'granted' boolean is true
    const allowedBatchIds = Array.from(new Set(
      allUserPermissions
        .filter((p: any) => p.granted === true)
        .map((p: any) => p.batchId || p.batch_id)
        .filter((id): id is string => id !== null && id !== undefined)
    ));

    // 3. Return 0 immediately if user has no active batch permissions
    if (allowedBatchIds.length === 0) {
      return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 });
    }

    const batchesCount = allowedBatchIds.length;

    // 4. Define fallback columns for relations based on your SQL schema
    const subjectsBatchCol = subjects.batchId || (subjects as any).batch_id;
    const lecturesSubjectCol = lectures.subjectId || (lectures as any).subject_id;

    // 5. Count Subjects using PostgreSQL ::int cast to prevent string coercion bugs
    const subjectsResult = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(subjects)
      .where(inArray(subjectsBatchCol, allowedBatchIds));

    // 6. Fetch allowed subjects to filter lectures safely
    const allowedSubjects = await db
      .select()
      .from(subjects)
      .where(inArray(subjectsBatchCol, allowedBatchIds));

    const allowedSubjectIds = allowedSubjects
      .map((s: any) => s.id)
      .filter((id): id is string => id !== null && id !== undefined);

    // 7. Count Lectures
    let lecturesCount = 0;
    if (allowedSubjectIds.length > 0) {
      const lecturesResult = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(lectures)
        .where(inArray(lecturesSubjectCol, allowedSubjectIds));
        
      lecturesCount = Number(lecturesResult[0]?.value || 0);
    }

    return NextResponse.json({
      batches: batchesCount,
      subjects: Number(subjectsResult[0]?.value || 0),
      lectures: lecturesCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Safe fallback to prevent UI crashes
    return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 }); 
  }
}
