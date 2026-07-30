import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { mobile, password } = await request.json();

    if (!mobile || !password) {
      return NextResponse.json({ redirect: true }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);

    if (!user) {
      return NextResponse.json({ redirect: true }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ redirect: true }, { status: 401 });
    }

    if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
      return NextResponse.json({ redirect: true }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ redirect: true }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ redirect: true }, { status: 401 });
  }
}
