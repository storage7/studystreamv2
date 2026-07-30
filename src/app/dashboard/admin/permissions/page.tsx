"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";

interface Permission {
  id: number;
  userId: string;
  batchId: string | null;
  subjectId: string | null;
  lectureId: string | null;
  granted: boolean;
}

interface User { id: string; fullName: string; mobile: string; }
interface Batch { id: string; name: string; }
interface Subject { id: string; name: string; batchId: string; }

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: "", batchId: "", subjectId: "", granted: true });
  const [filterUser, setFilterUser] = useState("");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/admin/permissions").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ]).then(([pData, uData, bData, sData]) => {
      setPermissions(pData.permissions || []);
      setAllUsers(uData.users || []);
      setAllBatches(bData.batches || []);
      setAllSubjects(sData.subjects || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") { router.push("/dashboard"); return; }
    fetchData();
  }, [user, router, fetchData]);

  const handleAdd = async () => {
    if (!form.userId) { addToast("Select a user", "error"); return; }
    await fetch("/api/admin/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        batchId: form.batchId || null,
        subjectId: form.subjectId || null,
        granted: form.granted,
      }),
    });
    addToast("Permission added");
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/permissions?id=${id}`, { method: "DELETE" });
    addToast("Permission removed");
    fetchData();
  };

  const userName = (id: string) => allUsers.find((u) => u.id === id)?.fullName || id;
  const batchName = (id: string | null) => id ? allBatches.find((b) => b.id === id)?.name || id : "All";
  const subjectName = (id: string | null) => id ? allSubjects.find((s) => s.id === id)?.name || id : "All";

  const filtered = filterUser ? permissions.filter((p) => p.userId === filterUser) : permissions;

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Permissions</h1>
        <div className="flex items-center gap-3">
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">All Users</option>
            {allUsers.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <button onClick={() => { setForm({ userId: allUsers[0]?.id || "", batchId: "", subjectId: "", granted: true }); setShowModal(true); }} className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap">
            + Add Permission
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No permissions configured. By default all users can access all content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-surface-2 border border-border rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-white">{userName(p.userId)}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Batch: {batchName(p.batchId)} · Subject: {subjectName(p.subjectId)} ·{" "}
                  <span className={p.granted ? "text-success" : "text-danger"}>{p.granted ? "Granted" : "Denied"}</span>
                </p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">Add Permission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">User</label>
                <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  {allUsers.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.mobile})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Batch (optional)</label>
                <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="">All Batches</option>
                  {allBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Subject (optional)</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="">All Subjects</option>
                  {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.granted} onChange={(e) => setForm({ ...form, granted: e.target.checked })} id="granted" />
                <label htmlFor="granted" className="text-sm text-text-muted">Access Granted</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
