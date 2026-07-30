"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  lectureNumber: number;
  thumbnail: string | null;
  duration: string | null;
  servers: { name: string; url: string }[];
}

export default function SubjectLecturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "title">("number");

  useEffect(() => {
    fetch(`/api/lectures?subjectId=${id}`)
      .then((r) => r.json())
      .then((d) => { setLectures(d.lectures || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const filtered = lectures
    .filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      String(l.lectureNumber).includes(search)
    )
    .sort((a, b) =>
      sortBy === "number"
        ? a.lectureNumber - b.lectureNumber
        : a.title.localeCompare(b.title)
    );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded-lg" />
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard/batches" className="text-sm text-text-muted hover:text-white transition-colors">← Back to Batches</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Lectures</h1>
          <p className="text-text-muted text-sm">{filtered.length} lectures</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lectures..."
            className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-64"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "number" | "title")}
            className="px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="number">By Number</option>
            <option value="title">By Title</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No lectures found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lecture) => (
            <Link
              key={lecture.id}
              href={`/dashboard/watch/${lecture.id}`}
              className="group flex items-center gap-4 bg-surface-2 border border-border rounded-2xl p-4 hover:border-brand/50 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-40 sm:w-48 aspect-video bg-surface-3 rounded-xl flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                {lecture.thumbnail ? (
                  <img src={lecture.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-3xl font-bold text-text-muted/20">#{lecture.lectureNumber}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {lecture.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {lecture.duration}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-text-muted mb-1">Lecture {lecture.lectureNumber}</p>
                    <h3 className="text-base font-semibold text-white group-hover:text-brand transition-colors line-clamp-1">
                      {lecture.title}
                    </h3>
                    {lecture.description && (
                      <p className="text-sm text-text-muted mt-1 line-clamp-2 hidden sm:block">{lecture.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {lecture.servers.length > 0 && (
                    <span className="text-xs text-text-muted bg-surface-3 px-2 py-1 rounded-lg">
                      {lecture.servers.length} server{lecture.servers.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
