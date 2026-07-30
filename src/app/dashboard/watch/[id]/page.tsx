"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
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
  const [theaterMode, setTheaterMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

          // Fetch all lectures in same subject for prev/next
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

  const goFullscreen = useCallback(() => {
    if (playerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  }, []);

  const goPiP = useCallback(async () => {
    // PiP for iframes is complex; we'll try to use the document PiP API
    if (iframeRef.current && document.pictureInPictureEnabled) {
      try {
        // Can't directly PiP an iframe, but we show a message
        alert("PiP works best with direct video elements. Try fullscreen mode instead.");
      } catch {
        // ignore
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") goFullscreen();
      if (e.key === "t" || e.key === "T") setTheaterMode((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goFullscreen]);

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

  // Find prev/next
  const currentIdx = allLectures.findIndex((l) => l.id === id);
  const prevLecture = currentIdx > 0 ? allLectures[currentIdx - 1] : null;
  const nextLecture = currentIdx < allLectures.length - 1 ? allLectures[currentIdx + 1] : null;

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
    <div className={`space-y-6 ${theaterMode ? "max-w-none" : "max-w-6xl mx-auto"}`}>
      {/* Video Player */}
      <div ref={playerRef} className="relative bg-black rounded-2xl overflow-hidden group">
        <div className={`${theaterMode ? "aspect-[21/9]" : "aspect-video"} relative`}>
          {serverUrl ? (
            <iframe
              ref={iframeRef}
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

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {prevLecture && (
                <Link href={`/dashboard/watch/${prevLecture.id}`} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Previous Lecture">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              {nextLecture && (
                <Link href={`/dashboard/watch/${nextLecture.id}`} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Next Lecture">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTheaterMode((p) => !p)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Theater Mode (T)">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              <button onClick={goPiP} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Picture in Picture">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </button>
              <button onClick={goFullscreen} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Fullscreen (F)">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
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

          {/* Keyboard shortcuts */}
          <div className="mt-6 p-4 bg-surface-2 border border-border rounded-xl">
            <h3 className="text-sm font-semibold text-text-muted mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-text-muted"><kbd className="bg-surface-3 px-2 py-0.5 rounded text-white text-xs">F</kbd> Fullscreen</span>
              <span className="text-text-muted"><kbd className="bg-surface-3 px-2 py-0.5 rounded text-white text-xs">T</kbd> Theater Mode</span>
            </div>
          </div>
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
