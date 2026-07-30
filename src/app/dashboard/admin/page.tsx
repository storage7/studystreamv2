"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../layout";
import { useRouter } from "next/navigation";

interface Stats {
  users: number;
  activeUsers: number;
  batches: number;
  subjects: number;
  lectures: number;
  totalViews: number;
}

const ADMIN_SECTIONS = [
  { href: "/dashboard/admin/users", label: "Users", desc: "Manage user accounts", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/dashboard/admin/batches", label: "Batches", desc: "Manage course batches", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/dashboard/admin/subjects", label: "Subjects", desc: "Manage subjects", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/dashboard/admin/lectures", label: "Lectures", desc: "Manage lecture content", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { href: "/dashboard/admin/permissions", label: "Permissions", desc: "Access control", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { href: "/dashboard/admin/import", label: "Bulk Import", desc: "Import lectures from CSV/JSON", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, [user, router]);

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Users", value: stats.users, color: "text-blue-400" },
            { label: "Active Users", value: stats.activeUsers, color: "text-green-400" },
            { label: "Batches", value: stats.batches, color: "text-purple-400" },
            { label: "Subjects", value: stats.subjects, color: "text-orange-400" },
            { label: "Lectures", value: stats.lectures, color: "text-pink-400" },
            { label: "Total Views", value: stats.totalViews, color: "text-cyan-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-2 border border-border rounded-2xl p-4">
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-surface-2 border border-border rounded-2xl p-6 hover:border-brand/50 transition-all hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
              <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">{section.label}</h3>
            <p className="text-sm text-text-muted mt-1">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
