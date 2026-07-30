import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lectures } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const [lecture] = await db.select().from(lectures).where(eq(lectures.id, id)).limit(1);

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  return NextResponse.json({ lecture });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.subjectId !== undefined) updates.subjectId = body.subjectId;
  if (body.description !== undefined) updates.description = body.description;
  if (body.lectureNumber !== undefined) updates.lectureNumber = body.lectureNumber;
  if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail;
  if (body.duration !== undefined) updates.duration = body.duration;
  if (body.servers !== undefined) updates.servers = body.servers;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

  const [updated] = await db
    .update(lectures)
    .set(updates)
    .where(eq(lectures.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  return NextResponse.json({ lecture: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(lectures).where(eq(lectures.id, id));
  return NextResponse.json({ success: true });
}
