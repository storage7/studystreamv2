import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batches } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const all = await db
    .select()
    .from(batches)
    .orderBy(asc(batches.sortOrder), asc(batches.createdAt));

  return NextResponse.json({ batches: all });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, description, sortOrder, thumbnail } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const [batch] = await db
    .insert(batches)
    .values({
      name,
      description: description || null,
      sortOrder: sortOrder || 0,
      thumbnail: thumbnail || null,
    })
    .returning();

  return NextResponse.json({ batch }, { status: 201 });
}
