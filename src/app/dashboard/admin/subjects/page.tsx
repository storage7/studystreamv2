"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  batchId: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface Batch {
  id: string;
  name: string;
}

export default function AdminSubjectsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [form, setForm] = useState({ batchId: "", name: "", description: "", sortOrder: 0 });
  const [filterBatch, setFilterBatch] = useState("");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/subjects").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
    ]).then(([sData, bData]) => {
      setSubjects(sData.subjects || []);
      setBatches(bData.batches || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") { router.push("/dashboard"); return; }
    fetchData();
  }, [user, router, fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ batchId: batches[0]?.id || "", name: "", description: "", sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditItem(s);
    setForm({ batchId: s.batchId, name: s.name, description: s.description || "", sortOrder: s.sortOrder });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.batchId) { addToast("Name and batch required", "error"); return; }
    try {
      if (editItem) {
        await fetch(`/api/subjects/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addToast("Subject updated");
      } else {
        await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addToast("Subject created");
      }
      setShowModal(false);
      fetchData();
    } catch { addToast("Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject and all its lectures?")) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    addToast("Subject deleted");
    fetchData();
  };

  const filtered = filterBatch ? subjects.filter((s) => s.batchId === filterBatch) : subjects;
  const batchName = (id: string) => batches.find((b) => b.id === id)?.name || "—";

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Manage Subjects</h1>
        <div className="flex items-center gap-3">
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={openCreate} className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap">
            + Add Subject
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No subjects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-surface-2 border border-border rounded-xl p-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">Batch: {batchName(s.batchId)} · Order: {s.sortOrder}</p>
                {s.description && <p className="text-xs text-text-muted mt-0.5">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(s)} className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">{editItem ? "Edit Subject" : "Create Subject"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Batch</label>
                <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" rows={3} />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
