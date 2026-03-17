"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FormField } from "@/components/FormField";
import type { ClientInfo } from "@/lib/types";
import { defaultClientInfo } from "@/lib/defaults";

export default function Step1Page() {
  const { id } = useParams<{ id: string }>();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");
  const updateSow = useMutation(api.sows.update);
  const [data, setData] = useState<ClientInfo>(defaultClientInfo);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sow?.clientInfo) setData({ ...defaultClientInfo, ...sow.clientInfo });
  }, [sow]);

  function update(field: keyof ClientInfo, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateSow({
        id: id as any,
        title: data.project_name || sow?.title || "New SOW",
        clientInfo: data,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Client & Project Basics</h2>
        <p className="mt-1 text-sm text-gray-500">Enter the client and project information for this SOW.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Company Name" name="company_name" required value={data.company_name} onChange={(e) => update("company_name", (e.target as HTMLInputElement).value)} />
          <FormField label="Contact Name" name="contact_name" value={data.contact_name} onChange={(e) => update("contact_name", (e.target as HTMLInputElement).value)} />
          <FormField label="Contact Title" name="contact_title" value={data.contact_title} onChange={(e) => update("contact_title", (e.target as HTMLInputElement).value)} />
          <FormField label="Contact Email" name="contact_email" type="email" value={data.contact_email} onChange={(e) => update("contact_email", (e.target as HTMLInputElement).value)} />
          <FormField label="Contact Phone" name="contact_phone" type="tel" value={data.contact_phone} onChange={(e) => update("contact_phone", (e.target as HTMLInputElement).value)} />
        </div>
        <FormField label="Address" name="address" as="textarea" value={data.address} onChange={(e) => update("address", (e.target as HTMLTextAreaElement).value)} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Project Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Project Name" name="project_name" required value={data.project_name} onChange={(e) => update("project_name", (e.target as HTMLInputElement).value)} />
          <FormField label="Project Code" name="project_code" value={data.project_code} hint="Internal reference number" onChange={(e) => update("project_code", (e.target as HTMLInputElement).value)} />
          <FormField label="Start Date" name="start_date" type="date" value={data.start_date} onChange={(e) => update("start_date", (e.target as HTMLInputElement).value)} />
          <FormField label="End Date" name="end_date" type="date" value={data.end_date} onChange={(e) => update("end_date", (e.target as HTMLInputElement).value)} />
          <FormField label="Prepared By" name="prepared_by" value={data.prepared_by} onChange={(e) => update("prepared_by", (e.target as HTMLInputElement).value)} />
          <FormField label="SOW Date" name="prepared_date" type="date" value={data.prepared_date} onChange={(e) => update("prepared_date", (e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
