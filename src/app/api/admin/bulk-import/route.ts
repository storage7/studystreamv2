import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lectures, subjects, batches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-helpers";

interface ImportRow {
  title: string;
  subjectId?: string;
  subjectName?: string;
  batchName?: string;
  description?: string;
  lectureNumber?: number;
  thumbnail?: string;
  duration?: string;
  server1?: string;
  server2?: string;
  server3?: string;
  server4?: string;
  server5?: string;
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const rows: ImportRow[] = body.data;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    // Cache for batch/subject lookups
    const subjectCache = new Map<string, string>();
    const batchCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.title) {
        errors.push(`Row ${i + 1}: Missing title`);
        continue;
      }

      let subjectId = row.subjectId;

      // If subjectName provided, look up or create
      if (!subjectId && row.subjectName) {
        const cacheKey = `${row.batchName || ""}::${row.subjectName}`;
        if (subjectCache.has(cacheKey)) {
          subjectId = subjectCache.get(cacheKey);
        } else {
          // Find or create batch
          let batchId: string | undefined;
          if (row.batchName) {
            if (batchCache.has(row.batchName)) {
              batchId = batchCache.get(row.batchName);
            } else {
              const [existingBatch] = await db
                .select()
                .from(batches)
                .where(eq(batches.name, row.batchName))
                .limit(1);
              if (existingBatch) {
                batchId = existingBatch.id;
              } else {
                const [newBatch] = await db
                  .insert(batches)
                  .values({ name: row.batchName })
                  .returning();
                batchId = newBatch.id;
              }
              batchCache.set(row.batchName, batchId!);
            }
          }

          if (batchId) {
            const [existingSub] = await db
              .select()
              .from(subjects)
              .where(eq(subjects.name, row.subjectName))
              .limit(1);
            if (existingSub) {
              subjectId = existingSub.id;
            } else {
              const [newSub] = await db
                .insert(subjects)
                .values({ name: row.subjectName, batchId })
                .returning();
              subjectId = newSub.id;
            }
            subjectCache.set(cacheKey, subjectId!);
          }
        }
      }

      if (!subjectId) {
        errors.push(`Row ${i + 1}: Cannot resolve subject`);
        continue;
      }

      // Build servers array
      const servers: { name: string; url: string }[] = [];
      for (let s = 1; s <= 5; s++) {
        const key = `server${s}` as keyof ImportRow;
        const url = row[key];
        if (url && typeof url === "string" && url.trim()) {
          servers.push({ name: `Server ${s}`, url: url.trim() });
        }
      }

      await db.insert(lectures).values({
        subjectId,
        title: row.title,
        description: row.description || null,
        lectureNumber: row.lectureNumber || i + 1,
        thumbnail: row.thumbnail || null,
        duration: row.duration || null,
        servers,
        sortOrder: row.lectureNumber || i + 1,
      });

      imported++;
    }

    return NextResponse.json({ imported, errors, total: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
