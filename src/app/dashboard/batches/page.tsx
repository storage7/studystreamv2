"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Batch {
  id: string;
  name: string;
  description: string | null;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d) => { setBatches(d.batches || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">All Batches</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batches..."
          className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No batches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((batch) => (
            <Link
              key={batch.id}
              href={`/dashboard/batches/${batch.id}`}
              className="group bg-surface-2 border border-border rounded-2xl p-6 hover:border-brand/50 transition-all hover:shadow-xl"
            >
              <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">{batch.name}</h3>
              {batch.description && (
                <p className="text-sm text-text-muted mt-1 line-clamp-2">{batch.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
