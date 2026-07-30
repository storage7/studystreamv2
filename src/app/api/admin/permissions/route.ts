import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const userId = request.nextUrl.searchParams.get("userId");

  const query = userId
    ? db.select().from(permissions).where(eq(permissions.userId, userId))
    : db.select().from(permissions);

  const all = await query;
  return NextResponse.json({ permissions: all });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { userId, batchId, subjectId, lectureId, granted } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [perm] = await db
    .insert(permissions)
    .values({
      userId,
      batchId: batchId || null,
      subjectId: subjectId || null,
      lectureId: lectureId || null,
      granted: granted !== false,
    })
    .returning();

  return NextResponse.json({ permission: perm }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await db.delete(permissions).where(eq(permissions.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
