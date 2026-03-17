"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FormField } from "@/components/FormField";
import { RepeatableField } from "@/components/RepeatableField";
import { DataTable } from "@/components/DataTable";
import type { ScopeDeliverables, Phase, Milestone, Role } from "@/lib/types";
import { defaultScopeDeliverables } from "@/lib/defaults";

export default function Step3Page() {
  const { id } = useParams<{ id: string }>();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");
  const updateSow = useMutation(api.sows.update);
  const [data, setData] = useState<ScopeDeliverables>(
    defaultScopeDeliverables
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (sow?.scopeDeliverables) {
      setData({ ...defaultScopeDeliverables, ...sow.scopeDeliverables });
    }
  }, [sow]);

  function updateData(updates: Partial<ScopeDeliverables>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function updatePhase(index: number, field: keyof Phase, value: unknown) {
    const phases = [...data.phases];
    phases[index] = { ...phases[index], [field]: value };
    updateData({ phases });
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateSow({ id: id as any, scopeDeliverables: data });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!id) return;
    setGenerating(true);
    try {
      await handleSave();
      await fetch("/api/generate", {
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
      // After generation, the sow query will auto-update via Convex reactivity
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Scope & Deliverables
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Define project phases, milestones, assumptions, and exclusions.
        </p>
      </div>

      {/* Phases */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <RepeatableField
          label="Project Phases"
          items={data.phases}
          onAdd={() =>
            updateData({
              phases: [
                ...data.phases,
                { name: "", description: "", duration_weeks: 1, deliverables: [] },
              ],
            })
          }
          onRemove={(i) =>
            updateData({ phases: data.phases.filter((_, idx) => idx !== i) })
          }
          addLabel="Add Phase"
          renderItem={(phase, index) => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField
                  label="Phase Name"
                  name={`phase_${index}_name`}
                  value={phase.name}
                  onChange={(e) =>
                    updatePhase(index, "name", (e.target as HTMLInputElement).value)
                  }
                />
                <FormField
                  label="Duration (weeks)"
                  name={`phase_${index}_duration`}
                  type="number"
                  value={String(phase.duration_weeks)}
                  onChange={(e) =>
                    updatePhase(
                      index,
                      "duration_weeks",
                      parseInt((e.target as HTMLInputElement).value) || 0
                    )
                  }
                />
              </div>
              <FormField
                label="Description"
                name={`phase_${index}_desc`}
                as="textarea"
                value={phase.description}
                onChange={(e) =>
                  updatePhase(
                    index,
                    "description",
                    (e.target as HTMLTextAreaElement).value
                  )
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deliverables
                </label>
                {phase.deliverables.map((d, di) => (
                  <div key={di} className="flex items-center gap-2 mb-1">
                    <input
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                      value={d}
                      onChange={(e) => {
                        const deliverables = [...phase.deliverables];
                        deliverables[di] = e.target.value;
                        updatePhase(index, "deliverables", deliverables);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const deliverables = phase.deliverables.filter(
                          (_, idx) => idx !== di
                        );
                        updatePhase(index, "deliverables", deliverables);
                      }}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updatePhase(index, "deliverables", [
                      ...phase.deliverables,
                      "",
                    ])
                  }
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add Deliverable
                </button>
              </div>
            </div>
          )}
        />
      </div>

      {/* Milestones */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Milestones
        </h3>
        <DataTable<Milestone & Record<string, unknown>>
          columns={[
            { key: "name", header: "Milestone", editable: true },
            { key: "date", header: "Target Date", editable: true, type: "text" },
            {
              key: "payment_trigger",
              header: "Triggers Payment",
              render: (item, index) => (
                <input
                  type="checkbox"
                  checked={item.payment_trigger as boolean}
                  onChange={(e) => {
                    const milestones = [...data.milestones];
                    milestones[index] = {
                      ...milestones[index],
                      payment_trigger: e.target.checked,
                    };
                    updateData({ milestones });
                  }}
                />
              ),
            },
          ]}
          data={data.milestones as (Milestone & Record<string, unknown>)[]}
          onCellChange={(index, key, value) => {
            const milestones = [...data.milestones];
            milestones[index] = { ...milestones[index], [key]: value };
            updateData({ milestones });
          }}
          onRowAdd={() =>
            updateData({
              milestones: [
                ...data.milestones,
                { name: "", date: "", payment_trigger: false },
              ],
            })
          }
          onRowRemove={(i) =>
            updateData({
              milestones: data.milestones.filter((_, idx) => idx !== i),
            })
          }
          addLabel="Add Milestone"
        />
      </div>

      {/* Assumptions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Assumptions
        </h3>
        {data.assumptions.map((a, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="mt-2 text-gray-400 text-xs">{i + 1}.</span>
            <textarea
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              rows={1}
              value={a}
              onChange={(e) => {
                const assumptions = [...data.assumptions];
                assumptions[i] = e.target.value;
                updateData({ assumptions });
              }}
            />
            <button
              type="button"
              onClick={() =>
                updateData({
                  assumptions: data.assumptions.filter((_, idx) => idx !== i),
                })
              }
              className="mt-1 text-xs text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateData({ assumptions: [...data.assumptions, ""] })
          }
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add Assumption
        </button>
      </div>

      {/* Exclusions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Exclusions
        </h3>
        {data.exclusions.map((e, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="mt-2 text-gray-400 text-xs">{i + 1}.</span>
            <textarea
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              rows={1}
              value={e}
              onChange={(ev) => {
                const exclusions = [...data.exclusions];
                exclusions[i] = ev.target.value;
                updateData({ exclusions });
              }}
            />
            <button
              type="button"
              onClick={() =>
                updateData({
                  exclusions: data.exclusions.filter((_, idx) => idx !== i),
                })
              }
              className="mt-1 text-xs text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateData({ exclusions: [...data.exclusions, ""] })}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add Exclusion
        </button>
      </div>

      {/* Acceptance Criteria */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Acceptance Criteria
        </h3>
        {data.acceptance_criteria.map((c, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <input
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              value={c}
              onChange={(e) => {
                const criteria = [...data.acceptance_criteria];
                criteria[i] = e.target.value;
                updateData({ acceptance_criteria: criteria });
              }}
            />
            <button
              type="button"
              onClick={() =>
                updateData({
                  acceptance_criteria: data.acceptance_criteria.filter(
                    (_, idx) => idx !== i
                  ),
                })
              }
              className="text-xs text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateData({
              acceptance_criteria: [...data.acceptance_criteria, ""],
            })
          }
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add Criterion
        </button>
      </div>

      {/* Roles & Responsibilities */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Roles & Responsibilities
        </h3>
        <DataTable<Role & Record<string, unknown>>
          columns={[
            { key: "role", header: "Role", editable: true },
            { key: "responsibility", header: "Responsibility", editable: true },
            {
              key: "party",
              header: "Party",
              editable: true,
              type: "select",
              options: [
                { value: "consultant", label: "Consultant" },
                { value: "client", label: "Client" },
              ],
            },
          ]}
          data={data.roles as (Role & Record<string, unknown>)[]}
          onCellChange={(index, key, value) => {
            const roles = [...data.roles];
            roles[index] = { ...roles[index], [key]: value };
            updateData({ roles });
          }}
          onRowAdd={() =>
            updateData({
              roles: [
                ...data.roles,
                { role: "", responsibility: "", party: "consultant" },
              ],
            })
          }
          onRowRemove={(i) =>
            updateData({ roles: data.roles.filter((_, idx) => idx !== i) })
          }
          addLabel="Add Role"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
        >
          {generating ? "Generating AI Content..." : "Generate AI Content"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
