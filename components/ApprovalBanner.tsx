import { StatusBadge } from "./StatusBadge";

interface ApprovalBannerProps {
  sowStatus: string;
  approvalStatus?: string;
  approvalComments?: string;
  assignedToName?: string;
  onSubmitForReview?: () => void;
  onApprove?: () => void;
  onReject?: (comments: string) => void;
  onRequestChanges?: (comments: string) => void;
  canReview?: boolean;
}

export function ApprovalBanner({
  sowStatus,
  approvalStatus,
  approvalComments,
  assignedToName,
  onSubmitForReview,
  onApprove,
  onReject,
  onRequestChanges,
  canReview,
}: ApprovalBannerProps) {
  if (sowStatus === "draft" && onSubmitForReview) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div>
          <StatusBadge status="draft" />
          <span className="ml-2 text-sm text-gray-600">
            This SOW is in draft. Ready for review?
          </span>
        </div>
        <button
          type="button"
          onClick={onSubmitForReview}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Submit for Review
        </button>
      </div>
    );
  }

  if (sowStatus === "in_review") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <StatusBadge status="in_review" />
            <span className="ml-2 text-sm text-yellow-800">
              Awaiting review
              {assignedToName ? ` from ${assignedToName}` : ""}
            </span>
          </div>
          {canReview && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onRequestChanges?.("Changes requested")}
                className="rounded-md border border-orange-300 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50"
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => onReject?.("Rejected")}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          )}
        </div>
        {approvalComments && (
          <p className="mt-2 text-sm text-yellow-700">
            Reviewer notes: {approvalComments}
          </p>
        )}
      </div>
    );
  }

  if (sowStatus === "approved" || sowStatus === "final") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center">
        <StatusBadge status={sowStatus} />
        <span className="ml-2 text-sm text-green-700">
          {sowStatus === "final"
            ? "This SOW has been finalized."
            : "This SOW has been approved."}
        </span>
      </div>
    );
  }

  return null;
}
