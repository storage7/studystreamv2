import { db } from "@/db";
import { batches, subjects, lectures, permissions } from "@/db/schema";
import { eq, inArray, count, or } from "drizzle-orm";
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

    // 1. Identify user: Admins often grant access via Mobile number instead of UUID. 
    // This safely checks the DB for either match.
    const condition = session.mobile 
      ? or(eq(permissions.userId, session.id), eq(permissions.userId, session.mobile))
      : eq(permissions.userId, session.id);

    const userPermissions = await db
      .select({ batchId: permissions.batchId })
      .from(permissions)
      .where(condition);

    // 2. Filter nulls and remove duplicates to prevent counting identical batches twice
    const allowedBatchIds = Array.from(new Set(
      userPermissions
        .map((p) => p.batchId)
        .filter((id): id is string => id !== null)
    ));

    // 3. Return 0 immediately if no matches are found
    if (allowedBatchIds.length === 0) {
      return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 });
    }

    // 4. Count Batches
    const [batchesResult] = await db
      .select({ value: count() })
      .from(batches)
      .where(inArray(batches.id, allowedBatchIds));

    // 5. Count Subjects
    const [subjectsResult] = await db
      .select({ value: count() })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    // 6. Count Lectures
    const allowedSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    const allowedSubjectIds = allowedSubjects
      .map((s) => s.id)
      .filter((id): id is string => id !== null);

    let lecturesCount = 0;
    if (allowedSubjectIds.length > 0) {
      const [lecturesResult] = await db
        .select({ value: count() })
        .from(lectures)
        .where(inArray(lectures.subjectId, allowedSubjectIds));
        
      lecturesCount = Number(lecturesResult?.value || 0);
    }

    // Wrap results in Number() to prevent database string coercion bugs in the UI
    return NextResponse.json({
      batches: Number(batchesResult?.value || 0),
      subjects: Number(subjectsResult?.value || 0),
      lectures: lecturesCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Safe fallback to prevent UI crashes
    return NextResponse.json({ batches: 0, subjects: 0, lectures: 0 }); 
  }
}
