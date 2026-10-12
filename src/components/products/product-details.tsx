import { humanizeKey } from "@/lib/utils/format";
import type { ProductColor, ProductFeature, ProductSpecifications } from "@/types";

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7">
      <h2 className="text-eyebrow mb-5 text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function ColorSwatches({ colors }: { colors: ProductColor[] }) {
  if (colors.length === 0) return null;
  return (
    <div>
      <p className="text-eyebrow mb-3 text-muted">
        Available colours <span className="text-ink/40">· {colors.length}</span>
      </p>
      <ul className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <li
            key={color.name}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-[13px] text-ink"
          >
            {color.hex && (
              <span
                aria-hidden
                className="size-4 rounded-full border border-ink/15 shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
            )}
            {color.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductDescription({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <DetailSection title="Description">
      <div className="space-y-4 text-[15px] leading-relaxed whitespace-pre-line text-ink/80">
        {text}
      </div>
    </DetailSection>
  );
}

export function FeatureList({ features }: { features: ProductFeature[] }) {
  if (features.length === 0) return null;
  return (
    <DetailSection title="Features">
      <dl className="grid gap-3 min-[420px]:grid-cols-2">
        {features.map((feature, index) => (
          <div
            key={`${feature.label}-${index}`}
            className="rounded-xl border border-line bg-paper px-4 py-3.5"
          >
            <dt className="text-xs text-muted">{feature.label}</dt>
            <dd className="mt-1 text-[15px] font-medium text-ink">{feature.value}</dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}

export function SpecificationTable({ specifications }: { specifications: ProductSpecifications }) {
  const entries = Object.entries(specifications);
  if (entries.length === 0) return null;
  return (
    <DetailSection title="Specifications">
      <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3.5 text-sm"
          >
            <dt className="text-muted">{humanizeKey(key)}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}
