import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) updates.name = body.name;
  if (body.batchId !== undefined) updates.batchId = body.batchId;
  if (body.description !== undefined) updates.description = body.description;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail;

  const [updated] = await db
    .update(subjects)
    .set(updates)
    .where(eq(subjects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ subject: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(subjects).where(eq(subjects.id, id));
  return NextResponse.json({ success: true });
}
