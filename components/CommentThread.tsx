import { useState } from "react";

interface Comment {
  id: string;
  user_name: string;
  content: string;
  resolved: boolean;
  created_at: string;
}

interface CommentThreadProps {
  section: string;
  comments: Comment[];
  onAdd: (section: string, content: string) => void;
  onResolve: (commentId: string) => void;
}

export function CommentThread({
  section,
  comments,
  onAdd,
  onResolve,
}: CommentThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unresolvedCount > 0 && (
          <span className="font-medium text-blue-600">{unresolvedCount}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-8 z-20 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 px-3 py-2">
            <h4 className="text-xs font-semibold text-gray-600 uppercase">
              Comments on {section}
            </h4>
          </div>
          <div className="max-h-60 overflow-y-auto p-3 space-y-3">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400">No comments yet.</p>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded border p-2 text-xs ${
                  comment.resolved
                    ? "border-green-200 bg-green-50 opacity-60"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {comment.user_name}
                  </span>
                  <span className="text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">{comment.content}</p>
                {!comment.resolved && (
                  <button
                    type="button"
                    onClick={() => onResolve(comment.id)}
                    className="mt-1 text-green-600 hover:text-green-700"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 p-3">
            <textarea
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              rows={2}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (newComment.trim()) {
                  onAdd(section, newComment.trim());
                  setNewComment("");
                }
              }}
              className="mt-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
