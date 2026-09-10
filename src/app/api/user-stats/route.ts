import { db } from "@/db";
import { batches, subjects, lectures, permissions } from "@/db/schema";
import { eq, inArray, count } from "drizzle-orm";
import { getSession } from "@/lib/auth"; 
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Select the entire row to bypass Drizzle column-alias bugs.
    // We STRICTLY query only session.id to prevent Postgres UUID casting crashes.
    const allUserPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.userId, session.id));

    // 2. Extract batchIds securely and remove any duplicates
    const allowedBatchIds = Array.from(new Set(
      allUserPermissions
        .map((p) => p.batchId)
        .filter((id): id is string => id !== null && id !== undefined)
    ));

    // 3. Return 0 immediately if no valid grants are found for this user UUID
    if (allowedBatchIds.length === 0) {
      return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 });
    }

    const batchesCount = allowedBatchIds.length;

    // 4. Count Subjects
    const [subjectsResult] = await db
      .select({ value: count() })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    // 5. Fetch allowed subjects to filter lectures safely
    const allowedSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    const allowedSubjectIds = allowedSubjects
      .map((s) => s.id)
      .filter((id): id is string => id !== null);

    // 6. Count Lectures
    let lecturesCount = 0;
    if (allowedSubjectIds.length > 0) {
      const [lecturesResult] = await db
        .select({ value: count() })
        .from(lectures)
        .where(inArray(lectures.subjectId, allowedSubjectIds));
        
      lecturesCount = Number(lecturesResult?.value || 0);
    }

    return NextResponse.json({
      batches: batchesCount,
      subjects: Number(subjectsResult?.value || 0),
      lectures: lecturesCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Fallback to 0 if a database crash occurs
    return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 }); 
  }
}
