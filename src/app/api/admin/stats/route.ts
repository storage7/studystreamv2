import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, batches, subjects, lectures, watchHistory } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [userCount] = await db.select({ count: count() }).from(users);
  const [batchCount] = await db.select({ count: count() }).from(batches);
  const [subjectCount] = await db.select({ count: count() }).from(subjects);
  const [lectureCount] = await db.select({ count: count() }).from(lectures);
  const [activeUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.active, true));
  const [historyCount] = await db.select({ count: count() }).from(watchHistory);

  return NextResponse.json({
    stats: {
      users: userCount.count,
      activeUsers: activeUsers.count,
      batches: batchCount.count,
      subjects: subjectCount.count,
      lectures: lectureCount.count,
      totalViews: historyCount.count,
    },
  });
}
