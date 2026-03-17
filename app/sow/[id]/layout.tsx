"use client";

import { useQuery } from "convex/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

const steps = [
  { path: "step1", label: "Client Info", number: 1 },
  { path: "step2", label: "Integration Details", number: 2 },
  { path: "step3", label: "Scope & Deliverables", number: 3 },
  { path: "step4", label: "Pricing & Terms", number: 4 },
  { path: "preview", label: "Preview & Export", number: 5 },
];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");

  const currentPath = pathname.split("/").pop() || "step1";
  const currentStepIndex = steps.findIndex((s) => s.path === currentPath);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-blue-600">
              &larr; Dashboard
            </button>
            <h1 className="mt-1 text-lg font-semibold text-gray-900">{sow?.title || "New SOW"}</h1>
          </div>
          <div className="text-xs text-gray-400">
            {sow?.status && <span className="uppercase">{sow.status}</span>}
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex">
            {steps.map((step, i) => {
              const isActive = i === currentStepIndex;
              const isCompleted = i < currentStepIndex;
              return (
                <button
                  key={step.path}
                  onClick={() => router.push(`/sow/${id}/${step.path}`)}
                  className={`relative flex-1 py-3 text-center text-xs font-medium transition-colors ${
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive ? "bg-blue-600 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? "\u2713" : step.number}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex > 0) router.push(`/sow/${id}/${steps[currentStepIndex - 1].path}`);
            }}
            disabled={currentStepIndex === 0}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30"
          >
            Back
          </button>
          <span className="text-xs text-gray-400">Step {currentStepIndex + 1} of {steps.length}</span>
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex < steps.length - 1) router.push(`/sow/${id}/${steps[currentStepIndex + 1].path}`);
            }}
            disabled={currentStepIndex === steps.length - 1}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-30"
          >
            {currentStepIndex === steps.length - 2 ? "Preview" : "Save & Continue"}
          </button>
        </div>
      </footer>
    </div>
  );
}
