"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useAuth } from "../../layout";

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  lectureNumber: number;
  thumbnail: string | null;
  duration: string | null;
  subjectId: string;
  servers: { name: string; url: string }[];
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [activeServer, setActiveServer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/lectures/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLecture(d.lecture);
        if (d.lecture) {
          // Load last server from localStorage
          const saved = localStorage.getItem(`server_${id}`);
          if (saved) setActiveServer(parseInt(saved));

          // Fetch all lectures in same subject for playlist
          fetch(`/api/lectures?subjectId=${d.lecture.subjectId}`)
            .then((r) => r.json())
            .then((ld) => setAllLectures(ld.lectures || []));

          // Record history
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lectureId: id, progress: 0 }),
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check favorite
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        const favs = d.favorites || [];
        setIsFavorite(favs.some((f: { lectureId: string }) => f.lectureId === id));
      });
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: id }),
    });
    setIsFavorite((prev) => !prev);
  }, [id]);

  const switchServer = (idx: number) => {
    setActiveServer(idx);
    localStorage.setItem(`server_${id}`, String(idx));
    // Save to history
    if (lecture) {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: id,
          lastServer: lecture.servers[idx]?.name,
        }),
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-video skeleton rounded-2xl" />
        <div className="h-8 w-96 skeleton rounded-lg" />
        <div className="h-4 w-64 skeleton rounded-lg" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
        <p className="text-text-muted">Lecture not found</p>
        <Link href="/dashboard" className="text-brand mt-4 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const serverUrl = lecture.servers[activeServer]?.url;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Video Player */}
      <div className="relative bg-black rounded-2xl overflow-hidden">
        <div className="aspect-video relative">
          {serverUrl ? (
            <iframe
              src={serverUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-3">
              <p className="text-text-muted">No streaming server available</p>
            </div>
          )}

          {/* Floating Watermark */}
          {user && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="watermark-float absolute text-white/[0.08] text-sm font-medium select-none whitespace-nowrap" style={{ top: "10%", left: "5%" }}>
                {user.fullName} • {user.mobile}
              </div>
              <div className="watermark-float absolute text-white/[0.08] text-sm font-medium select-none whitespace-nowrap" style={{ top: "50%", left: "40%", animationDelay: "-10s" }}>
                {user.fullName} • {user.mobile}
              </div>
              <div className="watermark-float absolute text-white/[0.08] text-sm font-medium select-none whitespace-nowrap" style={{ top: "80%", left: "20%", animationDelay: "-20s" }}>
                {user.fullName} • {user.mobile}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lecture Info */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted mb-1">Lecture {lecture.lectureNumber}</p>
              <h1 className="text-xl lg:text-2xl font-bold text-white">{lecture.title}</h1>
            </div>
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                isFavorite ? "text-red-500 bg-red-500/10" : "text-text-muted hover:text-white hover:bg-surface-3"
              }`}
            >
              <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {lecture.description && (
            <p className="text-text-muted mt-3">{lecture.description}</p>
          )}

          {/* Server Switcher */}
          {lecture.servers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-muted mb-3">Streaming Servers</h3>
              <div className="flex flex-wrap gap-2">
                {lecture.servers.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => switchServer(idx)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeServer === idx
                        ? "bg-brand text-white"
                        : "bg-surface-2 text-text-muted border border-border hover:border-brand/50 hover:text-white"
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Playlist sidebar */}
        {allLectures.length > 1 && (
          <div className="lg:w-80 flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-muted mb-3">
              Playlist ({allLectures.length} lectures)
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {allLectures.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/watch/${l.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    l.id === id
                      ? "bg-brand/10 border border-brand/30"
                      : "bg-surface-2 border border-border hover:border-brand/30"
                  }`}
                >
                  <span className={`text-sm font-medium w-8 text-center ${l.id === id ? "text-brand" : "text-text-muted"}`}>
                    {l.lectureNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${l.id === id ? "text-brand" : "text-white"}`}>
                      {l.title}
                    </p>
                    {l.duration && <p className="text-xs text-text-muted">{l.duration}</p>}
                  </div>
                  {l.id === id && (
                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
