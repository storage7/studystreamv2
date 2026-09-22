"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./layout";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
}

interface HistoryItem {
  lectureId: string;
  lectureTitle: string;
  lectureThumbnail: string | null;
  lectureNumber: number;
  subjectId: string;
  lastWatched: string;
  progress: number;
}

interface Stats {
  batches: number;
  subjects: number;
  lectures: number;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({ batches: 0, subjects: 0, lectures: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Batches Safely
        const bRes = await fetch("/api/batches");
        if (bRes.ok) {
          const bData = await bRes.json();
          setBatches(bData.batches || []);
        }

        // 2. Fetch History Safely
        const hRes = await fetch("/api/history");
        if (hRes.ok) {
          const hData = await hRes.json();
          const sortedHistory = (hData.history || []).sort(
            (a: HistoryItem, b: HistoryItem) => 
              new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
          );
          setHistory(sortedHistory);
        }

        // 3. Fetch Stats Safely
        const sRes = await fetch("/api/user-stats");
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.stats) {
            setStats(sData.stats);
          }
        }
      } catch (error) {
        console.error("Dashboard failed to load some data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.fullName?.split(" ")[0]} 👋
        </h1>
        <p className="text-text-muted mt-1">Ready to continue learning?</p>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          <h3 className="text-sm font-medium text-text-muted mb-1">Batches</h3>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            {stats.batches}
          </p>
        </div>
        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          <h3 className="text-sm font-medium text-text-muted mb-1">Subjects</h3>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            {stats.subjects}
          </p>
        </div>
        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          <h3 className="text-sm font-medium text-text-muted mb-1">Lectures</h3>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">
            {stats.lectures}
          </p>
        </div>
      </div>

      {/* Continue Watching */}
      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Continue Watching</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {history.slice(0, 1).map((item) => (
              <Link
                key={item.lectureId}
                href={`/dashboard/watch/${item.lectureId}`}
                className="group bg-surface-2 border border-border rounded-2xl overflow-hidden hover:border-brand/50 transition-all hover:shadow-xl hover:shadow-brand/5"
              >
                <div className="aspect-video bg-surface-3 relative flex items-center justify-center">
                  {item.lectureThumbnail ? (
                    <img src={item.lectureThumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(item.progress / 36, 100)}%` }} />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-white truncate">{item.lectureTitle}</p>
                  <p className="text-xs text-text-muted mt-1">Lecture {item.lectureNumber}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Batches */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Your Batches</h2>
        {batches.length === 0 ? (
          <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-text-muted">No batches available yet</p>
            <p className="text-text-muted text-sm mt-1">Contact your administrator to get access</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {batches.map((batch) => (
              <Link
                key={batch.id}
                href={`/dashboard/batches/${batch.id}`}
                className="group bg-surface-2 border border-border rounded-2xl p-6 hover:border-brand/50 transition-all hover:shadow-xl hover:shadow-brand/5"
              >
                <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{batch.name}</h3>
                {batch.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{batch.description}</p>
                )}
                <div className="mt-4 flex items-center text-brand text-sm font-medium group-hover:gap-2 transition-all">
                  View Subjects
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
