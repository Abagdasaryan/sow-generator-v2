"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function VersionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const versions = useQuery(
    api.versions.listBySow,
    id ? { sowId: id as any } : "skip"
  );
  const createSnapshot = useMutation(api.versions.createSnapshot);
  const revertVersion = useMutation(api.versions.revert);

  const [revertTarget, setRevertTarget] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const [reverting, setReverting] = useState(false);

  async function handleRevert() {
    if (!id || !revertTarget) return;
    setReverting(true);
    try {
      await revertVersion({
        sowId: id as any,
        versionId: revertTarget as any,
      });
      setRevertTarget(null);
      router.push(`/sow/${id}/step1`);
    } finally {
      setReverting(false);
    }
  }

  async function handleCreateSnapshot() {
    if (!id) return;
    setSnapshotting(true);
    try {
      await createSnapshot({
        sowId: id as any,
        changeSummary: "Manual snapshot",
      });
    } finally {
      setSnapshotting(false);
    }
  }

  const loading = versions === undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push(`/sow/${id}/step1`)}
              className="text-sm text-gray-500 hover:text-blue-600"
            >
              &larr; Back to SOW
            </button>
            <h1 className="mt-1 text-lg font-semibold text-gray-900">
              Version History
            </h1>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={snapshotting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {snapshotting ? "Creating..." : "Create Snapshot"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : !versions || versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-400">No version history yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    Version {v.versionNumber}
                  </span>
                  {v.changeSummary && (
                    <p className="text-xs text-gray-500">{v.changeSummary}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(v._creationTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setRevertTarget(v._id)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Revert to this version
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!revertTarget}
        title="Revert Version"
        message="This will replace the current SOW data with the selected version. This action creates a new version entry."
        confirmLabel={reverting ? "Reverting..." : "Revert"}
        variant="danger"
        onConfirm={handleRevert}
        onCancel={() => setRevertTarget(null)}
      />
    </div>
  );
}
