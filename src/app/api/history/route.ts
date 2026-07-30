import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchHistory, lectures } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const history = await db
    .select({
      id: watchHistory.id,
      lectureId: watchHistory.lectureId,
      progress: watchHistory.progress,
      completed: watchHistory.completed,
      lastServer: watchHistory.lastServer,
      lastWatched: watchHistory.lastWatched,
      lectureTitle: lectures.title,
      lectureThumbnail: lectures.thumbnail,
      lectureNumber: lectures.lectureNumber,
      subjectId: lectures.subjectId,
    })
    .from(watchHistory)
    .innerJoin(lectures, eq(watchHistory.lectureId, lectures.id))
    .where(eq(watchHistory.userId, user!.id))
    .orderBy(desc(watchHistory.lastWatched))
    .limit(50);

  return NextResponse.json({ history });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { lectureId, progress, completed, lastServer } = await request.json();

  if (!lectureId) {
    return NextResponse.json({ error: "lectureId required" }, { status: 400 });
  }

  // Upsert
  const [existing] = await db
    .select()
    .from(watchHistory)
    .where(
      and(eq(watchHistory.userId, user!.id), eq(watchHistory.lectureId, lectureId))
    )
    .limit(1);

  if (existing) {
    await db
      .update(watchHistory)
      .set({
        progress: progress ?? existing.progress,
        completed: completed ?? existing.completed,
        lastServer: lastServer ?? existing.lastServer,
        lastWatched: new Date(),
      })
      .where(eq(watchHistory.id, existing.id));
  } else {
    await db.insert(watchHistory).values({
      userId: user!.id,
      lectureId,
      progress: progress || 0,
      completed: completed || false,
      lastServer: lastServer || null,
    });
  }

  return NextResponse.json({ success: true });
}
