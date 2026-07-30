"use client";

import { useState, useCallback } from "react";
import { useAuth, useToast } from "../../layout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminBulkImportPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [mode, setMode] = useState<"csv" | "json">("csv");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[]; total: number } | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") { router.push("/dashboard"); }
  }, [user, router]);

  const parseCsv = useCallback((csvText: string) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string | number> = {};
      headers.forEach((h, idx) => {
        if (h === "lectureNumber") {
          row[h] = parseInt(values[idx]) || i;
        } else {
          row[h] = values[idx] || "";
        }
      });
      rows.push(row);
    }
    return rows;
  }, []);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      let data;
      if (mode === "json") {
        data = JSON.parse(jsonInput);
        if (!Array.isArray(data)) data = [data];
      } else {
        data = parseCsv(csvInput);
      }

      if (!data || data.length === 0) {
        addToast("No data to import", "error");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/admin/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      const result = await res.json();
      setResult(result);

      if (result.imported > 0) {
        addToast(`Imported ${result.imported} lectures`);
      }
      if (result.errors?.length > 0) {
        addToast(`${result.errors.length} errors`, "error");
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".json")) {
        setMode("json");
        setJsonInput(text);
      } else {
        setMode("csv");
        setCsvInput(text);
      }
    };
    reader.readAsText(file);
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Bulk Import Lectures</h1>

      <div className="bg-surface-2 border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-3">Upload File</h3>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand file:text-white hover:file:bg-brand-dark file:cursor-pointer"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setMode("csv")} className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${mode === "csv" ? "bg-brand text-white" : "bg-surface-2 text-text-muted border border-border"}`}>
          CSV
        </button>
        <button onClick={() => setMode("json")} className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${mode === "json" ? "bg-brand text-white" : "bg-surface-2 text-text-muted border border-border"}`}>
          JSON
        </button>
      </div>

      {mode === "csv" ? (
        <div>
          <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-4">
            <p className="text-xs text-text-muted mb-2">CSV Format: title, batchName, subjectName, lectureNumber, description, duration, server1, server2, server3</p>
            <code className="text-xs text-brand block bg-surface p-3 rounded-lg overflow-x-auto">
              title,batchName,subjectName,lectureNumber,description,duration,server1,server2{"\n"}
              Intro to Physics,PCM Batch,Physics,1,Introduction,1:30:00,https://embed.example.com/1,https://embed2.example.com/1
            </code>
          </div>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
            rows={12}
            placeholder="Paste CSV content here..."
          />
        </div>
      ) : (
        <div>
          <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-4">
            <p className="text-xs text-text-muted mb-2">JSON Format: Array of objects with title, batchName, subjectName, lectureNumber, server1-5</p>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
            rows={12}
            placeholder='[{"title":"Lecture 1","batchName":"PCM Batch","subjectName":"Physics","lectureNumber":1,"server1":"https://..."}]'
          />
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={importing}
        className="px-6 py-3 bg-brand text-white font-medium rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {importing ? "Importing..." : "Import Lectures"}
      </button>

      {result && (
        <div className="bg-surface-2 border border-border rounded-2xl p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-white mb-3">Import Results</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{result.total}</p>
              <p className="text-xs text-text-muted">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{result.imported}</p>
              <p className="text-xs text-text-muted">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{result.errors?.length || 0}</p>
              <p className="text-xs text-text-muted">Errors</p>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-danger">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
