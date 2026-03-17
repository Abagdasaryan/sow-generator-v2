import { type ReactNode } from "react";

interface RepeatableFieldProps<T> {
  label: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
}

export function RepeatableField<T>({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = "Add",
  minItems = 0,
  maxItems = 50,
}: RepeatableFieldProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="text-xs text-gray-500">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No items yet. Click "{addLabel}" to add one.
        </p>
      )}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                #{index + 1}
              </span>
              {items.length > minItems && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {items.length < maxItems && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          <svg
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {addLabel}
        </button>
      )}
    </div>
  );
}
