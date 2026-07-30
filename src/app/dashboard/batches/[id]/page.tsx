"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Subject {
  id: string;
  name: string;
  description: string | null;
}

interface Batch {
  id: string;
  name: string;
}

export default function BatchSubjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/subjects?batchId=${id}`).then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
    ]).then(([sData, bData]) => {
      setSubjects(sData.subjects || []);
      const found = (bData.batches || []).find((b: Batch) => b.id === id);
      setBatch(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const SUBJECT_COLORS = [
    "from-blue-500/20 to-blue-600/5",
    "from-purple-500/20 to-purple-600/5",
    "from-emerald-500/20 to-emerald-600/5",
    "from-orange-500/20 to-orange-600/5",
    "from-pink-500/20 to-pink-600/5",
    "from-cyan-500/20 to-cyan-600/5",
  ];

  const SUBJECT_ICONS = [
    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/dashboard/batches" className="hover:text-white transition-colors">Batches</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-white">{batch?.name || "Batch"}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">{batch?.name} – Subjects</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No subjects in this batch yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((subject, idx) => (
            <Link
              key={subject.id}
              href={`/dashboard/subjects/${subject.id}`}
              className="group bg-surface-2 border border-border rounded-2xl overflow-hidden hover:border-brand/50 transition-all hover:shadow-xl"
            >
              <div className={`h-24 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} flex items-center justify-center`}>
                <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={SUBJECT_ICONS[idx % SUBJECT_ICONS.length]} />
                </svg>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
                {subject.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{subject.description}</p>
                )}
                <div className="mt-3 flex items-center text-brand text-sm font-medium">
                  View Lectures →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
