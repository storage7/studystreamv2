import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const batchId = request.nextUrl.searchParams.get("batchId");

  const query = batchId
    ? db.select().from(subjects).where(eq(subjects.batchId, batchId)).orderBy(asc(subjects.sortOrder))
    : db.select().from(subjects).orderBy(asc(subjects.sortOrder));

  const all = await query;
  return NextResponse.json({ subjects: all });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { batchId, name, description, sortOrder, thumbnail } = body;

  if (!batchId || !name) {
    return NextResponse.json({ error: "batchId and name required" }, { status: 400 });
  }

  const [subject] = await db
    .insert(subjects)
    .values({
      batchId,
      name,
      description: description || null,
      sortOrder: sortOrder || 0,
      thumbnail: thumbnail || null,
    })
    .returning();

  return NextResponse.json({ subject }, { status: 201 });
}
