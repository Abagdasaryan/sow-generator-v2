"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { TiptapEditor } from "@/components/TiptapEditor";
import { ApprovalBanner } from "@/components/ApprovalBanner";
import { CommentThread } from "@/components/CommentThread";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");
  const rawComments = useQuery(
    api.comments.listBySow,
    id ? { sowId: id as any } : "skip"
  );
  const updateSow = useMutation(api.sows.update);
  const addComment = useMutation(api.comments.create);
  const updateCommentMut = useMutation(api.comments.update);
  const submitForReview = useMutation(api.approvals.submitForReview);

  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");

  // Map Convex comments to the shape CommentThread expects, including section
  const mappedComments = (rawComments ?? []).map((c) => ({
    id: c._id,
    section: c.section,
    user_name: (c as any).userName ?? "Unknown",
    content: c.content,
    resolved: c.resolved,
    created_at: new Date(c._creationTime).toISOString(),
  }));

  function commentsForSection(section: string) {
    return mappedComments.filter((c) => c.section === section);
  }

  async function loadPreview() {
    if (!id) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/export/pdf?preview=true&sowId=${id}`);
      if (!res.ok) throw new Error("Failed to load preview");
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml("<p>Failed to load preview</p>");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleExport(format: "pdf" | "docx") {
    if (!id) return;
    setExporting(format);
    try {
      const endpoint =
        format === "pdf" ? "/api/export/pdf" : "/api/export/docx";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sowId: id }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sow?.title || "SOW"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleGenerate() {
    if (!id) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sowId: id,
          sections: [
            "executive_summary",
            "scope_narratives",
            "architecture_description",
            "deliverables_prose",
          ],
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      // After generation, reload preview if on preview tab
      if (activeTab === "preview") {
        await loadPreview();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveContent(section: string, html: string) {
    if (!sow || !id) return;
    const gc = { ...sow.generatedContent, [section]: html };
    await updateSow({
      id: id as any,
      generatedContent: gc,
    });
  }

  async function handleSaveScopeNarrative(name: string, html: string) {
    if (!sow || !id) return;
    const narratives = {
      ...(sow.generatedContent?.scope_narratives || {}),
      [name]: html,
    };
    const gc = { ...sow.generatedContent, scope_narratives: narratives };
    await updateSow({
      id: id as any,
      generatedContent: gc,
    });
  }

  async function handleAddComment(section: string, content: string) {
    if (!id) return;
    await addComment({
      sowId: id as any,
      section,
      content,
    });
  }

  async function handleResolveComment(commentId: string) {
    await updateCommentMut({
      id: commentId as any,
      resolved: true,
    });
  }

  async function handleSubmitForReview() {
    if (!id || !sow?.userId) return;
    // Submit for self-review (in a real app, would pick a reviewer)
    await submitForReview({
      sowId: id as any,
      assignedTo: sow.userId,
    });
  }

  async function handleFinalize() {
    if (!sow || !id) return;
    await updateSow({
      id: id as any,
      status: "final",
    });
  }

  const gc = sow?.generatedContent;

  return (
    <div className="space-y-6 pb-20">
      {/* Approval Banner */}
      {sow && (
        <ApprovalBanner
          sowStatus={sow.status}
          onSubmitForReview={handleSubmitForReview}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("preview")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "preview"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "edit"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Edit AI Content
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Regenerate AI Content"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {exporting === "pdf" ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={() => handleExport("docx")}
            disabled={!!exporting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting === "docx" ? "Exporting..." : "Export Word"}
          </button>
          {sow?.status === "approved" && (
            <button
              onClick={handleFinalize}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Finalize
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "preview" ? (
        <div className="space-y-4">
          {!previewHtml && !previewLoading && (
            <div className="flex justify-center">
              <button
                onClick={loadPreview}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Load Preview
              </button>
            </div>
          )}
          {previewLoading && (
            <p className="text-center text-sm text-gray-400">
              Loading preview...
            </p>
          )}
          {previewHtml && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div
                className="p-8 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Executive Summary
              </h3>
              <CommentThread
                section="executive_summary"
                comments={commentsForSection("executive_summary")}
                onAdd={handleAddComment}
                onResolve={handleResolveComment}
              />
            </div>
            <TiptapEditor
              content={gc?.executive_summary || ""}
              onChange={(html) => handleSaveContent("executive_summary", html)}
            />
          </div>

          {/* Architecture Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Integration Architecture
              </h3>
              <CommentThread
                section="architecture_description"
                comments={commentsForSection("architecture_description")}
                onAdd={handleAddComment}
                onResolve={handleResolveComment}
              />
            </div>
            <TiptapEditor
              content={gc?.architecture_description || ""}
              onChange={(html) =>
                handleSaveContent("architecture_description", html)
              }
            />
          </div>

          {/* Scope Narratives */}
          {gc?.scope_narratives &&
            typeof gc.scope_narratives === "object" &&
            Object.entries(
              gc.scope_narratives as Record<string, string>
            ).map(([name, narrative]) => (
              <div
                key={name}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Scope: {name}
                  </h3>
                  <CommentThread
                    section={`scope_${name}`}
                    comments={commentsForSection(`scope_${name}`)}
                    onAdd={handleAddComment}
                    onResolve={handleResolveComment}
                  />
                </div>
                <TiptapEditor
                  content={narrative}
                  onChange={(html) => handleSaveScopeNarrative(name, html)}
                />
              </div>
            ))}

          {/* Deliverables Prose */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Deliverables
              </h3>
              <CommentThread
                section="deliverables_prose"
                comments={commentsForSection("deliverables_prose")}
                onAdd={handleAddComment}
                onResolve={handleResolveComment}
              />
            </div>
            <TiptapEditor
              content={gc?.deliverables_prose || ""}
              onChange={(html) => handleSaveContent("deliverables_prose", html)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
