import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lectures } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const subjectId = request.nextUrl.searchParams.get("subjectId");

  const query = subjectId
    ? db.select().from(lectures).where(eq(lectures.subjectId, subjectId)).orderBy(asc(lectures.lectureNumber))
    : db.select().from(lectures).orderBy(asc(lectures.lectureNumber));

  const all = await query;
  return NextResponse.json({ lectures: all });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { subjectId, title, description, lectureNumber, thumbnail, duration, servers, sortOrder } = body;

  if (!subjectId || !title) {
    return NextResponse.json({ error: "subjectId and title required" }, { status: 400 });
  }

  const [lecture] = await db
    .insert(lectures)
    .values({
      subjectId,
      title,
      description: description || null,
      lectureNumber: lectureNumber || 1,
      thumbnail: thumbnail || null,
      duration: duration || null,
      servers: servers || [],
      sortOrder: sortOrder || 0,
    })
    .returning();

  return NextResponse.json({ lecture }, { status: 201 });
}
