"use client";

import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.current);
  const sows = useQuery(api.sows.list, {});
  const templates = useQuery(api.templates.list);
  const createSow = useMutation(api.sows.create);
  const removeSow = useMutation(api.sows.remove);
  const duplicateSow = useMutation(api.sows.duplicate);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  async function handleCreate() {
    setCreating(true);
    try {
      const id = await createSow({ title: "New SOW" });
      router.push(`/sow/${id}/step1`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeSow({ id: deleteTarget as any });
    setDeleteTarget(null);
  }

  async function handleDuplicate(id: string) {
    const newId = await duplicateSow({ id: id as any });
    router.push(`/sow/${newId}/step1`);
  }

  if (authLoading || !sows) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SOW Generator</h1>
            <p className="text-xs text-gray-500">
              Logged in as {currentUser?.name ?? currentUser?.email ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/templates")}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Templates
            </button>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Statements of Work
          </h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "+ New SOW"}
          </button>
        </div>

        {templates && templates.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Start from Template
            </h3>
            <div className="flex gap-2 flex-wrap">
              {templates.map((t) => (
                <button
                  key={t._id}
                  onClick={handleCreate}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {sows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-400">No SOWs yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sows.map((sow) => (
                  <tr
                    key={sow._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/sow/${sow._id}/step1`)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{sow.title}</span>
                      {sow.clientInfo?.company_name && (
                        <p className="text-xs text-gray-500">{sow.clientInfo.company_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sow.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">v{sow.currentVersion}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sow._creationTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => router.push(`/sow/${sow._id}/preview`)} className="text-xs text-blue-600 hover:text-blue-700">Preview</button>
                        <button onClick={() => router.push(`/sow/${sow._id}/versions`)} className="text-xs text-gray-500 hover:text-gray-700">History</button>
                        <button onClick={() => handleDuplicate(sow._id)} className="text-xs text-green-600 hover:text-green-700">Duplicate</button>
                        <button onClick={() => setDeleteTarget(sow._id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete SOW"
        message="Are you sure you want to archive this SOW? It can be restored later."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
