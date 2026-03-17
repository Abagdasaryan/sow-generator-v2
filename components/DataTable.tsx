interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  editable?: boolean;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onCellChange?: (index: number, key: string, value: string | number) => void;
  onRowAdd?: () => void;
  onRowRemove?: (index: number) => void;
  addLabel?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onCellChange,
  onRowAdd,
  onRowRemove,
  addLabel = "Add Row",
  emptyMessage = "No data",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
            {onRowRemove && (
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 w-16">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onRowRemove ? 1 : 0)}
                className="px-3 py-4 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-sm">
                  {col.render ? (
                    col.render(row, rowIndex)
                  ) : col.editable && onCellChange ? (
                    col.type === "select" ? (
                      <select
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={String(row[col.key] ?? "")}
                        onChange={(e) =>
                          onCellChange(rowIndex, col.key, e.target.value)
                        }
                      >
                        {col.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type || "text"}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        value={String(row[col.key] ?? "")}
                        onChange={(e) =>
                          onCellChange(
                            rowIndex,
                            col.key,
                            col.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                      />
                    )
                  ) : (
                    <span>{String(row[col.key] ?? "")}</span>
                  )}
                </td>
              ))}
              {onRowRemove && (
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRowRemove(rowIndex)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {onRowAdd && (
        <button
          type="button"
          onClick={onRowAdd}
          className="mt-2 inline-flex items-center rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          <svg
            className="mr-1.5 h-3.5 w-3.5"
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
