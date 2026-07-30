"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryItem {
  lectureId: string;
  lectureTitle: string;
  lectureThumbnail: string | null;
  lectureNumber: number;
  lastWatched: string;
  progress: number;
  completed: boolean;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        const rawHistory: HistoryItem[] = d.history || [];
        
        // Deduplicate history items by lectureId, keeping the most recent one
        const historyMap = new Map<string, HistoryItem>();
        
        rawHistory.forEach((item) => {
          const existing = historyMap.get(item.lectureId);
          if (!existing || new Date(item.lastWatched) > new Date(existing.lastWatched)) {
            historyMap.set(item.lectureId, item);
          }
        });

        // Convert back to an array and sort by last watched (newest first)
        const uniqueHistory = Array.from(historyMap.values()).sort(
          (a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
        );

        setHistory(uniqueHistory);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded-lg" />
        {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Watch History</h1>

      {history.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-text-muted">No watch history yet</p>
          <Link href="/dashboard/batches" className="text-brand text-sm mt-2 inline-block">Start watching →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Link
              key={item.lectureId} // Simplified key since duplicates are removed
              href={`/dashboard/watch/${item.lectureId}`}
              className="flex items-center gap-4 bg-surface-2 border border-border rounded-2xl p-4 hover:border-brand/50 transition-all group"
            >
              <div className="w-32 sm:w-40 aspect-video bg-surface-3 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                {item.lectureThumbnail ? (
                  <img src={item.lectureThumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-text-muted/20">#{item.lectureNumber}</span>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
                  <div className="h-full bg-brand" style={{ width: `${Math.min(item.progress / 36, 100)}%` }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white group-hover:text-brand transition-colors truncate">
                  {item.lectureTitle}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Lecture {item.lectureNumber} • {new Date(item.lastWatched).toLocaleDateString()}
                </p>
                {item.completed && (
                  <span className="inline-flex items-center gap-1 text-xs text-success mt-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Completed
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
