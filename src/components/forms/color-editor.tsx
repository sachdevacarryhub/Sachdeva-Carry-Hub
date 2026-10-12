"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { inputClass } from "./fields";
import { newRowKey } from "./key-value-editor";

export interface ColorRow {
  key: string;
  name: string;
  hex: string | null;
}

const PRESETS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Blue", hex: "#2B4C7E" },
  { name: "Grey", hex: "#8A8A8A" },
  { name: "Red", hex: "#9E2B25" },
  { name: "Maroon", hex: "#5E1A1D" },
  { name: "Pink", hex: "#D8A7A0" },
  { name: "Brown", hex: "#6B4A2E" },
  { name: "Beige", hex: "#D9C7A7" },
  { name: "Green", hex: "#3D5A3A" },
  { name: "Purple", hex: "#5B3F7A" },
  { name: "White", hex: "#F5F5F2" },
];

export function ColorEditor({
  colors,
  onChange,
  max = 20,
}: {
  colors: ColorRow[];
  onChange: (colors: ColorRow[]) => void;
  max?: number;
}) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#111111");
  const [withSwatch, setWithSwatch] = useState(true);

  const has = (value: string) =>
    colors.some((c) => c.name.toLowerCase() === value.trim().toLowerCase());

  function add(colorName: string, colorHex: string | null) {
    const trimmed = colorName.trim();
    if (!trimmed || has(trimmed) || colors.length >= max) return;
    onChange([...colors, { key: newRowKey(), name: trimmed.slice(0, 40), hex: colorHex }]);
  }

  return (
    <div className="space-y-4">
      {colors.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected colours">
          {colors.map((color) => (
            <li
              key={color.key}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-cream/60 pr-1 pl-3 text-sm"
            >
              {color.hex && (
                <span
                  aria-hidden
                  className="size-4 rounded-full border border-ink/15"
                  style={{ backgroundColor: color.hex }}
                />
              )}
              {color.name}
              <button
                type="button"
                onClick={() => onChange(colors.filter((c) => c.key !== color.key))}
                aria-label={`Remove colour ${color.name}`}
                className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No colours added yet.</p>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-muted">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              disabled={has(preset.name) || colors.length >= max}
              onClick={() => add(preset.name, preset.hex)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs hover:border-ink/40 disabled:opacity-35"
            >
              <span
                aria-hidden
                className="size-3 rounded-full border border-ink/15"
                style={{ backgroundColor: preset.hex }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          aria-label="Custom colour name"
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(name, withSwatch ? hex : null);
              setName("");
            }
          }}
          placeholder="Custom colour, e.g. Olive"
          className={cn(inputClass, "h-10 text-sm sm:flex-1")}
        />
        <label className="inline-flex h-10 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={withSwatch}
            onChange={(e) => setWithSwatch(e.target.checked)}
          />
          Swatch
          <input
            type="color"
            aria-label="Swatch colour"
            value={hex}
            disabled={!withSwatch}
            onChange={(event) => setHex(event.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-paper disabled:opacity-40"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            add(name, withSwatch ? hex : null);
            setName("");
          }}
          disabled={!name.trim() || has(name) || colors.length >= max}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-ink/80 px-3 text-sm font-medium disabled:opacity-40"
        >
          <Plus aria-hidden className="size-4" /> Add
        </button>
      </div>
    </div>
  );
}
