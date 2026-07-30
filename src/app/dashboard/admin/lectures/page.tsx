"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";

interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  lectureNumber: number;
  thumbnail: string | null;
  duration: string | null;
  servers: { name: string; url: string }[];
}

interface Subject { id: string; name: string; batchId: string; }
interface Batch { id: string; name: string; }

export default function AdminLecturesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Lecture | null>(null);
  const [filterSubject, setFilterSubject] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    subjectId: "", title: "", description: "", lectureNumber: 1,
    thumbnail: "", duration: "",
    servers: [{ name: "Server 1", url: "" }] as { name: string; url: string }[],
  });

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/lectures").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
    ]).then(([lData, sData, bData]) => {
      setLectures(lData.lectures || []);
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
    setForm({
      subjectId: subjects[0]?.id || "", title: "", description: "", lectureNumber: 1,
      thumbnail: "", duration: "",
      servers: [{ name: "Server 1", url: "" }],
    });
    setShowModal(true);
  };

  const openEdit = (l: Lecture) => {
    setEditItem(l);
    setForm({
      subjectId: l.subjectId, title: l.title, description: l.description || "",
      lectureNumber: l.lectureNumber, thumbnail: l.thumbnail || "", duration: l.duration || "",
      servers: l.servers.length > 0 ? l.servers : [{ name: "Server 1", url: "" }],
    });
    setShowModal(true);
  };

  const addServer = () => {
    setForm({ ...form, servers: [...form.servers, { name: `Server ${form.servers.length + 1}`, url: "" }] });
  };

  const removeServer = (idx: number) => {
    setForm({ ...form, servers: form.servers.filter((_, i) => i !== idx) });
  };

  const updateServer = (idx: number, key: "name" | "url", value: string) => {
    const servers = [...form.servers];
    servers[idx] = { ...servers[idx], [key]: value };
    setForm({ ...form, servers });
  };

  const handleSave = async () => {
    if (!form.title || !form.subjectId) { addToast("Title and subject required", "error"); return; }
    const payload = {
      ...form,
      servers: form.servers.filter((s) => s.url.trim()),
    };
    try {
      if (editItem) {
        await fetch(`/api/lectures/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        addToast("Lecture updated");
      } else {
        await fetch("/api/lectures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        addToast("Lecture created");
      }
      setShowModal(false);
      fetchData();
    } catch { addToast("Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lecture?")) return;
    await fetch(`/api/lectures/${id}`, { method: "DELETE" });
    addToast("Lecture deleted");
    fetchData();
  };

  const filtered = lectures
    .filter((l) => (!filterSubject || l.subjectId === filterSubject))
    .filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "—";

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Manage Lectures ({lectures.length})</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand w-40" />
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={openCreate} className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap">
            + Add Lecture
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase hidden md:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase hidden lg:table-cell">Servers</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-surface-3/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-muted">{l.lectureNumber}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium max-w-xs truncate">{l.title}</td>
                    <td className="px-4 py-3 text-sm text-text-muted hidden md:table-cell">{subjectName(l.subjectId)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted hidden lg:table-cell">{l.servers.length}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-surface-3 rounded-lg text-text-muted hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(l.id)} className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">{editItem ? "Edit Lecture" : "Create Lecture"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Subject</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  {subjects.map((s) => {
                    const b = batches.find((bb) => bb.id === s.batchId);
                    return <option key={s.id} value={s.id}>{b?.name} → {s.name}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Lecture #</label>
                  <input type="number" value={form.lectureNumber} onChange={(e) => setForm({ ...form, lectureNumber: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Thumbnail URL</label>
                  <input type="text" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Duration</label>
                  <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="1:30:00" />
                </div>
              </div>

              {/* Servers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-text-muted">Streaming Servers</label>
                  <button onClick={addServer} className="text-xs text-brand hover:text-brand-light transition-colors">+ Add Server</button>
                </div>
                {form.servers.map((server, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="text" value={server.name} onChange={(e) => updateServer(idx, "name", e.target.value)} className="w-28 px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Name" />
                    <input type="text" value={server.url} onChange={(e) => updateServer(idx, "url", e.target.value)} className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Embed URL" />
                    {form.servers.length > 1 && (
                      <button onClick={() => removeServer(idx)} className="p-1 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
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
