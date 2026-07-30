"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FavItem {
  lectureId: string;
  lectureTitle: string;
  lectureThumbnail: string | null;
  lectureNumber: number;
  createdAt: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => { setFavorites(d.favorites || []); setLoading(false); })
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
      <h1 className="text-2xl font-bold text-white">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-text-muted">No favorites yet</p>
          <Link href="/dashboard/batches" className="text-brand text-sm mt-2 inline-block">Browse lectures →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((item) => (
            <Link
              key={item.lectureId}
              href={`/dashboard/watch/${item.lectureId}`}
              className="group bg-surface-2 border border-border rounded-2xl overflow-hidden hover:border-brand/50 transition-all"
            >
              <div className="aspect-video bg-surface-3 relative flex items-center justify-center">
                {item.lectureThumbnail ? (
                  <img src={item.lectureThumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-text-muted/20">#{item.lectureNumber}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-white truncate">{item.lectureTitle}</p>
                <p className="text-xs text-text-muted mt-1">Lecture {item.lectureNumber}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
