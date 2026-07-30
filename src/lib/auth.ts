import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_me"
);
const COOKIE_NAME = "study_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Added constant for Max-Age in seconds to ensure browser persistence
const SESSION_DURATION_SEC = 7 * 24 * 60 * 60; 

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const jwt = await new SignJWT({ userId, token })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(SECRET);

  await db.insert(sessions).values({ userId, token, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_DURATION_SEC, // explicitly sets the cookie's lifespan
  });

  return jwt;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;

    const { payload } = await jwtVerify(cookie.value, SECRET);
    const userId = payload.userId as string;
    const token = payload.token as string;

    // Verify session exists and not expired
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) return null;

    // Get user
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        mobile: users.mobile,
        role: users.role,
        active: users.active,
        expiresAt: users.expiresAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.active) return null;

    // Check user expiry
    if (user.expiresAt && new Date(user.expiresAt) < new Date()) return null;

    return user;
  } catch {
    return null;
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (cookie?.value) {
      try {
        const { payload } = await jwtVerify(cookie.value, SECRET);
        const token = payload.token as string;
        await db.delete(sessions).where(eq(sessions.token, token));
      } catch {
        // Token invalid, just clear cookie
      }
    }
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // ignore
  }
}
