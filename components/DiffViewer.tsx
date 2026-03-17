interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

export function DiffViewer({
  oldContent,
  newContent,
  oldLabel = "Previous Version",
  newLabel = "Current Version",
}: DiffViewerProps) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-2">
        <div className="border-b border-r border-gray-200 bg-red-50 px-3 py-2">
          <span className="text-xs font-medium text-red-700">{oldLabel}</span>
        </div>
        <div className="border-b border-gray-200 bg-green-50 px-3 py-2">
          <span className="text-xs font-medium text-green-700">{newLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 text-xs font-mono">
        {Array.from({ length: maxLines }).map((_, i) => {
          const oldLine = oldLines[i] || "";
          const newLine = newLines[i] || "";
          const changed = oldLine !== newLine;
          return (
            <div key={i} className="contents">
              <div
                className={`border-r border-gray-200 px-3 py-0.5 ${
                  changed ? "bg-red-50 text-red-800" : ""
                }`}
              >
                {oldLine || "\u00A0"}
              </div>
              <div
                className={`px-3 py-0.5 ${
                  changed ? "bg-green-50 text-green-800" : ""
                }`}
              >
                {newLine || "\u00A0"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
