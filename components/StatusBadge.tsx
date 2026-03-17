const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700",
  },
  in_review: {
    label: "In Review",
    className: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
  },
  final: {
    label: "Final",
    className: "bg-blue-100 text-blue-800",
  },
  archived: {
    label: "Archived",
    className: "bg-red-100 text-red-700",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
  changes_requested: {
    label: "Changes Requested",
    className: "bg-orange-100 text-orange-800",
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
