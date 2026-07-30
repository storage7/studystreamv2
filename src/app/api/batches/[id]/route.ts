import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batches } from "@/db/schema";
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
  if (body.description !== undefined) updates.description = body.description;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail;

  const [updated] = await db
    .update(batches)
    .set(updates)
    .where(eq(batches.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ batch: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(batches).where(eq(batches.id, id));
  return NextResponse.json({ success: true });
}
