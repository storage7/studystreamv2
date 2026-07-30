"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export default function AdminBatchesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Batch | null>(null);
  const [form, setForm] = useState({ name: "", description: "", sortOrder: 0 });

  const fetchData = useCallback(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d) => { setBatches(d.batches || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") { router.push("/dashboard"); return; }
    fetchData();
  }, [user, router, fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", description: "", sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (b: Batch) => {
    setEditItem(b);
    setForm({ name: b.name, description: b.description || "", sortOrder: b.sortOrder });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { addToast("Name required", "error"); return; }
    try {
      if (editItem) {
        await fetch(`/api/batches/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addToast("Batch updated");
      } else {
        await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        addToast("Batch created");
      }
      setShowModal(false);
      fetchData();
    } catch { addToast("Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch and all its subjects/lectures?")) return;
    await fetch(`/api/batches/${id}`, { method: "DELETE" });
    addToast("Batch deleted");
    fetchData();
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Batches</h1>
        <button onClick={openCreate} className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors">
          + Add Batch
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
      ) : batches.length === 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-12 text-center">
          <p className="text-text-muted">No batches yet. Create your first batch!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-surface-2 border border-border rounded-xl p-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{b.name}</h3>
                {b.description && <p className="text-xs text-text-muted mt-0.5">{b.description}</p>}
                <p className="text-xs text-text-muted mt-0.5">Order: {b.sortOrder}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(b)} className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors">
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
            <h2 className="text-lg font-semibold text-white mb-4">{editItem ? "Edit Batch" : "Create Batch"}</h2>
            <div className="space-y-4">
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
