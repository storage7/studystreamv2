import { db } from "@/db";
import { batches, subjects, lectures, permissions } from "@/db/schema";
import { eq, inArray, count } from "drizzle-orm";
import { getSession } from "@/lib/auth"; 
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    
    // Check for session directly since the session object IS the user data
    if (!session || !session.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.id;

    // 1. Fetch batch IDs the user has permission to access
    const userPermissions = await db
      .select({ batchId: permissions.batchId })
      .from(permissions)
      .where(eq(permissions.userId, userId));

    const allowedBatchIds = userPermissions.map((p) => p.batchId);

    // 2. Return 0 if the user has no granted courses
    if (allowedBatchIds.length === 0) {
      return NextResponse.json({
        batches: 0,
        subjects: 0,
        lectures: 0,
      });
    }

    // 3. Count batches and subjects filtered by allowed IDs
    const [batchesCount] = await db
      .select({ value: count() })
      .from(batches)
      .where(inArray(batches.id, allowedBatchIds));

    const [subjectsCount] = await db
      .select({ value: count() })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    // 4. Count lectures based on the allowed subjects
    const allowedSubjects = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(inArray(subjects.batchId, allowedBatchIds));

    const allowedSubjectIds = allowedSubjects.map((s) => s.id);

    let lecturesCount = { value: 0 };
    if (allowedSubjectIds.length > 0) {
      const [result] = await db
        .select({ value: count() })
        .from(lectures)
        .where(inArray(lectures.subjectId, allowedSubjectIds));
      lecturesCount = result;
    }

    return NextResponse.json({
      batches: batchesCount.value,
      subjects: subjectsCount.value,
      lectures: lecturesCount.value,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
