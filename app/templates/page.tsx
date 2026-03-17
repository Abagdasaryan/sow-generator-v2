"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function TemplateManagerPage() {
  const router = useRouter();
  const templates = useQuery(api.templates.list);
  const removeTemplate = useMutation(api.templates.remove);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeTemplate({ id: deleteTarget as any });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const loading = templates === undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-blue-600"
            >
              &larr; Dashboard
            </button>
            <h1 className="mt-1 text-lg font-semibold text-gray-900">
              SOW Templates
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-6 text-sm text-gray-500">
          Templates let you save SOW configurations and quickly create new SOWs
          from them. To create a template, duplicate a SOW from the dashboard,
          then save it as a template.
        </p>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : !templates || templates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-400">No templates yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </span>
                  {t.description && (
                    <p className="text-xs text-gray-500">{t.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Created{" "}
                    {new Date(t._creationTime).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(t._id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
