import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { batches, permissions } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const all = await db
    .select()
    .from(batches)
    .orderBy(asc(batches.sortOrder), asc(batches.createdAt));

  // 1. If user is an admin, grant access to everything immediately
  if (user.role === "admin") {
    return NextResponse.json({ batches: all });
  }

  // 2. Fetch the access control list for this specific user
  const userPerms = await db
    .select()
    .from(permissions)
    .where(eq(permissions.userId, user.id));

  // 3. Filter the batches based on the permission hierarchy using the boolean `granted` column
  const allowedBatches = all.filter((batch) => {
    // A. Check for explicit batch-level rules first (Highest Priority)
    const explicitDeny = userPerms.find((p) => p.batchId === batch.id && p.granted === false);
    if (explicitDeny) return false;

    const explicitGrant = userPerms.find((p) => p.batchId === batch.id && p.granted === true);
    if (explicitGrant) return true;

    // B. Check for global "All Batches" rules (batchId is null)
    const globalDeny = userPerms.find((p) => !p.batchId && p.granted === false);
    if (globalDeny) return false;

    const globalGrant = userPerms.find((p) => !p.batchId && p.granted === true);
    if (globalGrant) return true;

    // C. Default to denied if no rules match
    return false;
  });

  return NextResponse.json({ batches: allowedBatches });
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
