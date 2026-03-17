"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { FormField } from "@/components/FormField";
import { DataTable } from "@/components/DataTable";
import type {
  PricingTerms,
  RateEntry,
  PhasePricing,
  PaymentScheduleEntry,
} from "@/lib/types";
import { defaultPricingTerms } from "@/lib/defaults";

export default function Step4Page() {
  const { id } = useParams<{ id: string }>();
  const sow = useQuery(api.sows.get, id ? { id: id as any } : "skip");
  const updateSow = useMutation(api.sows.update);
  const [data, setData] = useState<PricingTerms>(defaultPricingTerms);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sow?.pricingTerms) {
      setData({ ...defaultPricingTerms, ...sow.pricingTerms });
    }
  }, [sow]);

  function updateData(updates: Partial<PricingTerms>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  // Auto-calculate total from phases_pricing
  const calculatedTotal = data.phases_pricing.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateSow({
        id: id as any,
        pricingTerms: { ...data, total_amount: data.total_amount || calculatedTotal },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pricing & Terms</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define billing type, rates, payment schedule, and terms.
        </p>
      </div>

      {/* Billing Type */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Billing Structure
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Billing Type"
            name="billing_type"
            as="select"
            options={[
              { value: "fixed", label: "Fixed Fee" },
              { value: "time_and_materials", label: "Time & Materials" },
              { value: "hybrid", label: "Hybrid" },
            ]}
            value={data.billing_type}
            onChange={(e) =>
              updateData({
                billing_type: e.target.value as PricingTerms["billing_type"],
              })
            }
          />
          <FormField
            label="Currency"
            name="currency"
            as="select"
            options={[
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
              { value: "CAD", label: "CAD" },
              { value: "AUD", label: "AUD" },
            ]}
            value={data.currency}
            onChange={(e) => updateData({ currency: e.target.value })}
          />
          <FormField
            label="Payment Terms"
            name="payment_terms"
            as="select"
            options={[
              { value: "15", label: "Net 15" },
              { value: "30", label: "Net 30" },
              { value: "45", label: "Net 45" },
              { value: "60", label: "Net 60" },
            ]}
            value={String(data.payment_terms_days)}
            onChange={(e) =>
              updateData({ payment_terms_days: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Rate Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Rate Table
        </h3>
        <DataTable<RateEntry & Record<string, unknown>>
          columns={[
            { key: "role", header: "Role", editable: true },
            { key: "rate", header: "Rate", editable: true, type: "number" },
            {
              key: "unit",
              header: "Unit",
              editable: true,
              type: "select",
              options: [
                { value: "hourly", label: "Hourly" },
                { value: "daily", label: "Daily" },
              ],
            },
          ]}
          data={data.rates as (RateEntry & Record<string, unknown>)[]}
          onCellChange={(index, key, value) => {
            const rates = [...data.rates];
            rates[index] = { ...rates[index], [key]: value };
            updateData({ rates });
          }}
          onRowAdd={() =>
            updateData({
              rates: [...data.rates, { role: "", rate: 0, unit: "hourly" }],
            })
          }
          onRowRemove={(i) =>
            updateData({ rates: data.rates.filter((_, idx) => idx !== i) })
          }
          addLabel="Add Rate"
        />
      </div>

      {/* Phase Pricing */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Phase Pricing
        </h3>
        <DataTable<PhasePricing & Record<string, unknown>>
          columns={[
            { key: "phase", header: "Phase", editable: true },
            { key: "hours", header: "Est. Hours", editable: true, type: "number" },
            { key: "amount", header: "Amount", editable: true, type: "number" },
          ]}
          data={data.phases_pricing as (PhasePricing & Record<string, unknown>)[]}
          onCellChange={(index, key, value) => {
            const pricing = [...data.phases_pricing];
            pricing[index] = { ...pricing[index], [key]: value };
            updateData({ phases_pricing: pricing });
          }}
          onRowAdd={() =>
            updateData({
              phases_pricing: [
                ...data.phases_pricing,
                { phase: "", hours: 0, amount: 0 },
              ],
            })
          }
          onRowRemove={(i) =>
            updateData({
              phases_pricing: data.phases_pricing.filter((_, idx) => idx !== i),
            })
          }
          addLabel="Add Phase"
        />
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-medium text-gray-700">
            Total Project Amount
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              (Auto: {data.currency}{" "}
              {calculatedTotal.toLocaleString()})
            </span>
            <input
              type="number"
              className="w-40 rounded border border-gray-300 px-3 py-1 text-sm text-right font-semibold"
              value={data.total_amount || calculatedTotal}
              onChange={(e) =>
                updateData({ total_amount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Payment Schedule
        </h3>
        <DataTable<PaymentScheduleEntry & Record<string, unknown>>
          columns={[
            { key: "milestone", header: "Milestone", editable: true },
            {
              key: "percentage",
              header: "%",
              editable: true,
              type: "number",
              width: "80px",
            },
            { key: "amount", header: "Amount", editable: true, type: "number" },
            { key: "due", header: "Due", editable: true },
          ]}
          data={
            data.payment_schedule as (PaymentScheduleEntry &
              Record<string, unknown>)[]
          }
          onCellChange={(index, key, value) => {
            const schedule = [...data.payment_schedule];
            schedule[index] = { ...schedule[index], [key]: value };
            updateData({ payment_schedule: schedule });
          }}
          onRowAdd={() =>
            updateData({
              payment_schedule: [
                ...data.payment_schedule,
                { milestone: "", percentage: 0, amount: 0, due: "" },
              ],
            })
          }
          onRowRemove={(i) =>
            updateData({
              payment_schedule: data.payment_schedule.filter(
                (_, idx) => idx !== i
              ),
            })
          }
          addLabel="Add Payment"
        />
      </div>

      {/* Change Order & Travel */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Additional Terms
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Change Order Rate ($/hr)"
            name="change_order_rate"
            type="number"
            value={String(data.change_order_rate)}
            onChange={(e) =>
              updateData({
                change_order_rate:
                  parseFloat((e.target as HTMLInputElement).value) || 0,
              })
            }
          />
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.travel_expenses_included}
                onChange={(e) =>
                  updateData({ travel_expenses_included: e.target.checked })
                }
              />
              Travel & Expenses Included
            </label>
            {data.travel_expenses_included && (
              <FormField
                label="Travel Cap"
                name="travel_cap"
                type="number"
                value={String(data.travel_cap)}
                onChange={(e) =>
                  updateData({
                    travel_cap:
                      parseFloat((e.target as HTMLInputElement).value) || 0,
                  })
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Terms & Conditions
        </h3>
        <FormField
          label=""
          name="terms_and_conditions"
          as="textarea"
          value={data.terms_and_conditions}
          onChange={(e) =>
            updateData({
              terms_and_conditions: (e.target as HTMLTextAreaElement).value,
            })
          }
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
