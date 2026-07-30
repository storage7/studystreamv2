import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      mobile: users.mobile,
      role: users.role,
      active: users.active,
      expiresAt: users.expiresAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { fullName, mobile, password, role, active, expiresAt } = body;

  if (!fullName || !mobile || !password) {
    return NextResponse.json(
      { error: "fullName, mobile, password required" },
      { status: 400 }
    );
  }

  // Check duplicate mobile
  const existing = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Mobile number already exists" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      fullName,
      mobile,
      passwordHash,
      role: role || "guest",
      active: active !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning({
      id: users.id,
      fullName: users.fullName,
      mobile: users.mobile,
      role: users.role,
      active: users.active,
      expiresAt: users.expiresAt,
      createdAt: users.createdAt,
    });

  return NextResponse.json({ user: newUser }, { status: 201 });
}
