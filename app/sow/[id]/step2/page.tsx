"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FormField } from "@/components/FormField";
import { RepeatableField } from "@/components/RepeatableField";
import type {
  IntegrationDetails,
  SourceTargetSystem,
  IntegrationProcess,
} from "@/lib/types";
import { defaultIntegrationDetails } from "@/lib/defaults";

const systemOptions = [
  { value: "NetSuite", label: "NetSuite" },
  { value: "Salesforce", label: "Salesforce" },
  { value: "SQL Server", label: "SQL Server" },
  { value: "MySQL", label: "MySQL" },
  { value: "PostgreSQL", label: "PostgreSQL" },
  { value: "REST API", label: "REST API" },
  { value: "SFTP", label: "SFTP" },
  { value: "SAP", label: "SAP" },
  { value: "HubSpot", label: "HubSpot" },
  { value: "Shopify", label: "Shopify" },
  { value: "Custom", label: "Custom" },
];

const dataObjectOptions = [
  "Customers",
  "Contacts",
  "Orders",
  "Sales Orders",
  "Purchase Orders",
  "Items",
  "Products",
  "Invoices",
  "Payments",
  "Opportunities",
  "Leads",
  "Accounts",
  "Inventory",
  "Shipments",
  "Journal Entries",
  "Custom Records",
];

const emptySystem: SourceTargetSystem = {
  name: "",
  type: "",
  version: "",
  environment: "sandbox",
};

const emptyProcess: IntegrationProcess = {
  name: "",
  description: "",
  source: "",
  target: "",
  direction: "source_to_target",
  frequency: "scheduled",
  trigger_type: "",
  data_objects: [],
  estimated_records: "<1K/day",
};

export default function Step2Page() {
  const { id } = useParams<{ id: string }>();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");
  const updateSow = useMutation(api.sows.update);
  const [data, setData] = useState<IntegrationDetails>(
    defaultIntegrationDetails
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sow?.integrationDetails) {
      setData({ ...defaultIntegrationDetails, ...sow.integrationDetails });
    }
  }, [sow]);

  function updateData(updates: Partial<IntegrationDetails>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function updateSystem(
    type: "source_systems" | "target_systems",
    index: number,
    field: keyof SourceTargetSystem,
    value: string
  ) {
    const systems = [...data[type]];
    systems[index] = { ...systems[index], [field]: value };
    updateData({ [type]: systems });
  }

  function updateProcess(
    index: number,
    field: keyof IntegrationProcess,
    value: string | string[]
  ) {
    const processes = [...data.integrations];
    processes[index] = { ...processes[index], [field]: value };
    updateData({ integrations: processes });
  }

  function toggleDataObject(processIndex: number, obj: string) {
    const process = data.integrations[processIndex];
    const objects = process.data_objects.includes(obj)
      ? process.data_objects.filter((o) => o !== obj)
      : [...process.data_objects, obj];
    updateProcess(processIndex, "data_objects", objects);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateSow({ id: id as any, integrationDetails: data });
    } finally {
      setSaving(false);
    }
  }

  const allSystems = [
    ...data.source_systems.map((s) => s.name).filter(Boolean),
    ...data.target_systems.map((s) => s.name).filter(Boolean),
  ];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Integration Details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Define the integration platform, systems, and processes.
        </p>
      </div>

      {/* Platform */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Integration Platform
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Platform"
            name="platform"
            as="select"
            options={[
              { value: "boomi", label: "Boomi AtomSphere" },
              { value: "celigo", label: "Celigo integrator.io" },
              { value: "other", label: "Other" },
            ]}
            value={data.platform}
            onChange={(e) =>
              updateData({
                platform: e.target.value as IntegrationDetails["platform"],
              })
            }
          />
          <FormField
            label="Platform Version"
            name="platform_version"
            value={data.platform_version}
            onChange={(e) =>
              updateData({
                platform_version: (e.target as HTMLInputElement).value,
              })
            }
          />
        </div>
      </div>

      {/* Source Systems */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <RepeatableField
          label="Source Systems"
          items={data.source_systems}
          onAdd={() =>
            updateData({
              source_systems: [...data.source_systems, { ...emptySystem }],
            })
          }
          onRemove={(i) =>
            updateData({
              source_systems: data.source_systems.filter((_, idx) => idx !== i),
            })
          }
          addLabel="Add Source System"
          renderItem={(_, index) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                label="System"
                name={`source_${index}_name`}
                as="select"
                options={systemOptions}
                value={data.source_systems[index].name}
                onChange={(e) =>
                  updateSystem("source_systems", index, "name", e.target.value)
                }
              />
              <FormField
                label="Version"
                name={`source_${index}_version`}
                value={data.source_systems[index].version}
                onChange={(e) =>
                  updateSystem(
                    "source_systems",
                    index,
                    "version",
                    (e.target as HTMLInputElement).value
                  )
                }
              />
              <FormField
                label="Environment"
                name={`source_${index}_env`}
                as="select"
                options={[
                  { value: "sandbox", label: "Sandbox" },
                  { value: "production", label: "Production" },
                ]}
                value={data.source_systems[index].environment}
                onChange={(e) =>
                  updateSystem(
                    "source_systems",
                    index,
                    "environment",
                    e.target.value
                  )
                }
              />
            </div>
          )}
        />
      </div>

      {/* Target Systems */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <RepeatableField
          label="Target Systems"
          items={data.target_systems}
          onAdd={() =>
            updateData({
              target_systems: [...data.target_systems, { ...emptySystem }],
            })
          }
          onRemove={(i) =>
            updateData({
              target_systems: data.target_systems.filter((_, idx) => idx !== i),
            })
          }
          addLabel="Add Target System"
          renderItem={(_, index) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                label="System"
                name={`target_${index}_name`}
                as="select"
                options={systemOptions}
                value={data.target_systems[index].name}
                onChange={(e) =>
                  updateSystem("target_systems", index, "name", e.target.value)
                }
              />
              <FormField
                label="Version"
                name={`target_${index}_version`}
                value={data.target_systems[index].version}
                onChange={(e) =>
                  updateSystem(
                    "target_systems",
                    index,
                    "version",
                    (e.target as HTMLInputElement).value
                  )
                }
              />
              <FormField
                label="Environment"
                name={`target_${index}_env`}
                as="select"
                options={[
                  { value: "sandbox", label: "Sandbox" },
                  { value: "production", label: "Production" },
                ]}
                value={data.target_systems[index].environment}
                onChange={(e) =>
                  updateSystem(
                    "target_systems",
                    index,
                    "environment",
                    e.target.value
                  )
                }
              />
            </div>
          )}
        />
      </div>

      {/* Integration Processes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <RepeatableField
          label="Integration Processes"
          items={data.integrations}
          onAdd={() =>
            updateData({
              integrations: [...data.integrations, { ...emptyProcess }],
            })
          }
          onRemove={(i) =>
            updateData({
              integrations: data.integrations.filter((_, idx) => idx !== i),
            })
          }
          addLabel="Add Integration Process"
          renderItem={(process, index) => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  label="Process Name"
                  name={`proc_${index}_name`}
                  required
                  value={process.name}
                  placeholder="e.g., Order Sync"
                  onChange={(e) =>
                    updateProcess(
                      index,
                      "name",
                      (e.target as HTMLInputElement).value
                    )
                  }
                />
                <FormField
                  label="Source System"
                  name={`proc_${index}_source`}
                  as="select"
                  options={[
                    { value: "", label: "Select..." },
                    ...allSystems.map((s) => ({ value: s, label: s })),
                  ]}
                  value={process.source}
                  onChange={(e) =>
                    updateProcess(index, "source", e.target.value)
                  }
                />
                <FormField
                  label="Target System"
                  name={`proc_${index}_target`}
                  as="select"
                  options={[
                    { value: "", label: "Select..." },
                    ...allSystems.map((s) => ({ value: s, label: s })),
                  ]}
                  value={process.target}
                  onChange={(e) =>
                    updateProcess(index, "target", e.target.value)
                  }
                />
                <FormField
                  label="Direction"
                  name={`proc_${index}_direction`}
                  as="select"
                  options={[
                    { value: "source_to_target", label: "Source to Target" },
                    { value: "bidirectional", label: "Bidirectional" },
                  ]}
                  value={process.direction}
                  onChange={(e) =>
                    updateProcess(index, "direction", e.target.value)
                  }
                />
                <FormField
                  label="Frequency"
                  name={`proc_${index}_frequency`}
                  as="select"
                  options={[
                    { value: "real_time", label: "Real-time" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "event_driven", label: "Event-driven" },
                  ]}
                  value={process.frequency}
                  onChange={(e) =>
                    updateProcess(index, "frequency", e.target.value)
                  }
                />
                <FormField
                  label="Trigger Type"
                  name={`proc_${index}_trigger`}
                  as="select"
                  options={[
                    { value: "", label: "Select..." },
                    { value: "api_polling", label: "API Polling" },
                    { value: "webhook", label: "Webhook" },
                    { value: "saved_search", label: "Saved Search" },
                    { value: "scheduled_script", label: "Scheduled Script" },
                    { value: "manual", label: "Manual" },
                  ]}
                  value={process.trigger_type}
                  onChange={(e) =>
                    updateProcess(index, "trigger_type", e.target.value)
                  }
                />
                <FormField
                  label="Estimated Volume"
                  name={`proc_${index}_volume`}
                  as="select"
                  options={[
                    { value: "<1K/day", label: "< 1K records/day" },
                    { value: "1K-10K/day", label: "1K - 10K records/day" },
                    { value: "10K-100K/day", label: "10K - 100K records/day" },
                    { value: "100K+/day", label: "100K+ records/day" },
                  ]}
                  value={process.estimated_records}
                  onChange={(e) =>
                    updateProcess(index, "estimated_records", e.target.value)
                  }
                />
              </div>

              {/* Data Objects Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Objects
                </label>
                <div className="flex flex-wrap gap-2">
                  {dataObjectOptions.map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggleDataObject(index, obj)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border ${
                        process.data_objects.includes(obj)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                label="Description"
                name={`proc_${index}_desc`}
                as="textarea"
                value={process.description}
                placeholder="Brief description of this integration process..."
                onChange={(e) =>
                  updateProcess(
                    index,
                    "description",
                    (e.target as HTMLTextAreaElement).value
                  )
                }
              />
            </div>
          )}
        />
      </div>

      <div className="flex justify-end">
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
