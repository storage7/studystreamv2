import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, lectures } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const favs = await db
    .select({
      id: favorites.id,
      lectureId: favorites.lectureId,
      createdAt: favorites.createdAt,
      lectureTitle: lectures.title,
      lectureThumbnail: lectures.thumbnail,
      lectureNumber: lectures.lectureNumber,
      subjectId: lectures.subjectId,
    })
    .from(favorites)
    .innerJoin(lectures, eq(favorites.lectureId, lectures.id))
    .where(eq(favorites.userId, user!.id))
    .orderBy(desc(favorites.createdAt));

  return NextResponse.json({ favorites: favs });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { lectureId } = await request.json();

  if (!lectureId) {
    return NextResponse.json({ error: "lectureId required" }, { status: 400 });
  }

  // Toggle
  const [existing] = await db
    .select()
    .from(favorites)
    .where(
      and(eq(favorites.userId, user!.id), eq(favorites.lectureId, lectureId))
    )
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return NextResponse.json({ favorited: false });
  } else {
    await db.insert(favorites).values({ userId: user!.id, lectureId });
    return NextResponse.json({ favorited: true });
  }
}
