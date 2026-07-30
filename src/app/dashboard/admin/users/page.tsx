"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  fullName: string;
  mobile: string;
  role: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: "", mobile: "", password: "", role: "guest", active: true, expiresAt: "" });
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") { router.push("/dashboard"); return; }
    fetchUsers();
  }, [user, router, fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ fullName: "", mobile: "", password: "", role: "guest", active: true, expiresAt: "" });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      fullName: u.fullName,
      mobile: u.mobile,
      password: "",
      role: u.role,
      active: u.active,
      expiresAt: u.expiresAt ? u.expiresAt.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const body: Record<string, unknown> = {
      fullName: form.fullName,
      mobile: form.mobile,
      role: form.role,
      active: form.active,
      expiresAt: form.expiresAt || null,
    };
    if (form.password) body.password = form.password;

    try {
      if (editUser) {
        const res = await fetch(`/api/admin/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); addToast(d.error || "Error", "error"); return; }
        addToast("User updated successfully");
      } else {
        if (!form.password) { addToast("Password is required", "error"); return; }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); addToast(d.error || "Error", "error"); return; }
        addToast("User created successfully");
      }
      setShowModal(false);
      fetchUsers();
    } catch { addToast("Something went wrong", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    addToast("User deleted");
    fetchUsers();
  };

  const toggleActive = async (u: User) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    addToast(u.active ? "User disabled" : "User enabled");
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.includes(search)
  );

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-48"
          />
          <button onClick={openCreate} className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors whitespace-nowrap">
            + Add User
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase">Mobile</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase">Expires</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface-3/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{u.fullName}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{u.mobile}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${u.role === "admin" ? "bg-brand/20 text-brand" : "bg-surface-3 text-text-muted"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${u.active ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-surface-3 rounded-lg transition-colors text-text-muted hover:text-white" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => toggleActive(u)} className="p-1.5 hover:bg-surface-3 rounded-lg transition-colors text-text-muted hover:text-warning" title={u.active ? "Disable" : "Enable"}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={u.active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors text-text-muted hover:text-danger" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">
              {editUser ? "Edit User" : "Create User"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Mobile</label>
                <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">{editUser ? "New Password (leave blank to keep)" : "Password"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" id="active" />
                <label htmlFor="active" className="text-sm text-text-muted">Active</label>
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
