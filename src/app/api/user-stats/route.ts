import { db } from "@/db";
import { subjects, lectures, permissions } from "@/db/schema";
import { eq, inArray, count } from "drizzle-orm";
import { getSession } from "@/lib/auth"; 
import { NextResponse } from "next/server";

// PREVENT CACHING: Forces Next.js to fetch fresh stats on every load
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Fetch batch IDs the user has permission to access
    const userPermissions = await db
      .select({ batchId: permissions.batchId })
      .from(permissions)
      .where(eq(permissions.userId, session.id));

    const allowedBatchIds = userPermissions
      .map((p) => p.batchId)
      .filter((id): id is string => id !== null);

    // 2. Return 0 if the user has no granted courses
    if (allowedBatchIds.length === 0) {
      return NextResponse.json({
        batches: 0,
        subjects: 0,
        lectures: 0,
      });
    }

    // 3. Batches count is exactly the length of the granted array
    const batchesCount = allowedBatchIds.length;

    // 4. Count subjects linked to these batches
    const [subjectsResult] = await db
      .select({ value: count() })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));
      
    // Enforce strict Number typing to prevent string coercion bugs in the frontend
    const subjectsCount = Number(subjectsResult?.value || 0);

    // 5. Fetch allowed subjects to securely filter lectures
    const allowedSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    const allowedSubjectIds = allowedSubjects
      .map((s) => s.id)
      .filter((id): id is string => id !== null);

    // 6. Count lectures linked to these subjects
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
      subjects: subjectsCount,
      lectures: lecturesCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Fallback to 0 safely so the UI doesn't crash on error
    return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 });
  }
}
