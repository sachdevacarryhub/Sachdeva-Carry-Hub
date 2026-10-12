"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { inputClass } from "./fields";
import { cn } from "@/lib/utils/cn";

export interface KeyValueRow {
  key: string;
  label: string;
  value: string;
}

interface KeyValueEditorProps {
  legend: string;
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  labelPlaceholder: string;
  valuePlaceholder: string;
  addLabel: string;
  max: number;
  /** Field errors keyed by "<index>.label" / "<index>.value". */
  errors?: Record<string, string>;
}

let counter = 0;
export const newRowKey = () => `row-${Date.now()}-${(counter += 1)}`;

/** Dynamic list of label/value rows (features, specifications). */
export function KeyValueEditor({
  legend,
  rows,
  onChange,
  labelPlaceholder,
  valuePlaceholder,
  addLabel,
  max,
  errors = {},
}: KeyValueEditorProps) {
  const update = (index: number, patch: Partial<KeyValueRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      {rows.length === 0 && <p className="mb-3 text-sm text-muted">Nothing added yet.</p>}
      <ol className="space-y-2.5">
        {rows.map((row, index) => {
          const labelError = errors[`${index}.label`] ?? errors[`${index}.key`];
          const valueError = errors[`${index}.value`];
          return (
            <li
              key={row.key}
              className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
            >
              <div>
                <input
                  aria-label={`${legend} ${index + 1} name`}
                  aria-invalid={labelError ? true : undefined}
                  value={row.label}
                  maxLength={60}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder={labelPlaceholder}
                  className={cn(inputClass, "h-10 text-sm")}
                />
                {labelError && <p className="mt-1 text-xs text-danger">{labelError}</p>}
              </div>
              <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                <input
                  aria-label={`${legend} ${index + 1} value`}
                  aria-invalid={valueError ? true : undefined}
                  value={row.value}
                  maxLength={200}
                  onChange={(event) => update(index, { value: event.target.value })}
                  placeholder={valuePlaceholder}
                  className={cn(inputClass, "h-10 text-sm")}
                />
                {valueError && <p className="mt-1 text-xs text-danger">{valueError}</p>}
              </div>
              <div className="flex items-start gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${legend.toLowerCase()} ${index + 1} up`}
                  className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-ink/5 disabled:opacity-30"
                >
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move ${legend.toLowerCase()} ${index + 1} down`}
                  className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-ink/5 disabled:opacity-30"
                >
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  aria-label={`Remove ${legend.toLowerCase()} ${index + 1}`}
                  className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        disabled={rows.length >= max}
        onClick={() => onChange([...rows, { key: newRowKey(), label: "", value: "" }])}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-ink/25 px-3 text-sm font-medium text-ink hover:border-gold disabled:opacity-40"
      >
        <Plus aria-hidden className="size-4" /> {addLabel}
      </button>
    </fieldset>
  );
}
