"use client";

import { ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ColorEditor, type ColorRow } from "@/components/forms/color-editor";
import {
  Field,
  FormSection,
  SelectInput,
  Switch,
  TextArea,
  TextInput,
} from "@/components/forms/fields";
import { KeyValueEditor, type KeyValueRow } from "@/components/forms/key-value-editor";
import { Button, buttonClasses } from "@/components/ui/button";
import { apiRequest, discardUpload } from "@/lib/api/client";
import { humanizeKey } from "@/lib/utils/format";
import { slugify } from "@/lib/utils/slug";
import { MAX_PRODUCT_IMAGES } from "@/lib/validations/product";
import type { CategorySummary, Product } from "@/types";
import { ImageManager, resolvePrimaryKey, type GalleryItem } from "./image-manager";

interface ProductFormProps {
  product?: Product;
  categories: (CategorySummary & { is_active: boolean })[];
}

function initialState(product?: Product) {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category_id: product?.category_id ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    features: (product?.features ?? []).map<KeyValueRow>((f, i) => ({
      key: `feature-${i}`,
      label: f.label,
      value: f.value,
    })),
    specifications: Object.entries(product?.specifications ?? {}).map<KeyValueRow>(([k, v], i) => ({
      key: `spec-${i}`,
      label: humanizeKey(k),
      value: v,
    })),
    colors: (product?.available_colors ?? []).map<ColorRow>((c, i) => ({
      key: `color-${i}`,
      name: c.name,
      hex: c.hex ?? null,
    })),
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? true,
    is_active: product?.is_active ?? true,
    sort_order: product?.sort_order ?? 0,
  };
}

function initialImages(product?: Product): GalleryItem[] {
  return (product?.images ?? []).map((image) => ({
    key: image.id,
    id: image.id,
    cloudinary_public_id: image.cloudinary_public_id,
    image_url: image.image_url,
    width: image.width,
    height: image.height,
    format: image.format,
    alt_text: image.alt_text ?? "",
    is_primary: image.is_primary,
    status: "ready",
    progress: 1,
  }));
}

/** Groups "features.0.label" style API errors by prefix. */
function nestedErrors(fieldErrors: Record<string, string[]>, prefix: string) {
  const result: Record<string, string> = {};
  for (const [path, messages] of Object.entries(fieldErrors)) {
    if (path.startsWith(`${prefix}.`) && messages[0])
      result[path.slice(prefix.length + 1)] = messages[0];
  }
  return result;
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => initialState(product));
  const [images, setImages] = useState<GalleryItem[]>(() => initialImages(product));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };
  const updateImages = (updater: (items: GalleryItem[]) => GalleryItem[]) => {
    setImages(updater);
    setDirty(true);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const uploading = images.some((i) => i.status === "optimizing" || i.status === "uploading");
  const failedUploads = images.filter((i) => i.status === "error").length;
  const effectiveSlug = slugTouched ? form.slug : slugify(form.name);
  const slugChanged = isEdit && product && effectiveSlug !== product.slug;
  const err = (key: string) => errors[key]?.[0];

  const payload = useMemo(() => {
    const primaryKey = resolvePrimaryKey(images);
    return {
      name: form.name,
      slug: effectiveSlug,
      category_id: form.category_id,
      short_description: form.short_description,
      description: form.description,
      features: form.features.map(({ label, value }) => ({ label, value })),
      specifications: form.specifications.map(({ label, value }) => ({ key: label, value })),
      available_colors: form.colors.map(({ name, hex }) => ({ name, hex })),
      is_featured: form.is_featured,
      is_new_arrival: form.is_new_arrival,
      is_active: form.is_active,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      images: images
        .filter(
          (image) => image.status === "ready" && image.cloudinary_public_id && image.image_url,
        )
        .map((image) => ({
          ...(image.id ? { id: image.id } : {}),
          cloudinary_public_id: image.cloudinary_public_id!,
          image_url: image.image_url!,
          alt_text: image.alt_text,
          width: image.width ?? null,
          height: image.height ?? null,
          format: image.format ?? null,
          is_primary: image.key === primaryKey,
        })),
    };
  }, [form, images, effectiveSlug]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (uploading) {
      toast.warning("Please wait for the images to finish uploading.");
      return;
    }
    setSaving(true);
    setErrors({});

    const result = await apiRequest<{ id: string; slug: string }>(
      isEdit ? `/api/products/${product!.id}` : "/api/products",
      { method: isEdit ? "PATCH" : "POST", body: payload },
    );
    if (!result.ok) {
      setSaving(false);
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      if (result.status === 401) router.push("/admin/login");
      return;
    }

    setDirty(false);
    // Drop failed upload placeholders; they were never saved.
    setImages((prev) => prev.filter((image) => image.status === "ready"));

    if (isEdit) {
      toast.success(
        result.data.slug !== product!.slug
          ? `Saved. The product URL is now /product/${result.data.slug}`
          : "Product saved",
      );
      // Stay disabled: the refreshed product (new updated_at) remounts this
      // form with saved image ids, preventing a double submit.
      router.refresh();
    } else {
      toast.success("Product created");
      router.push("/admin/products");
      router.refresh();
    }
  }

  function onCancel() {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    // Remove images uploaded during this session that were never saved.
    images
      .filter((image) => !image.id && image.cloudinary_public_id)
      .forEach((image) => discardUpload(image.cloudinary_public_id!));
    setDirty(false);
    router.push("/admin/products");
  }

  const featureErrors = nestedErrors(errors, "features");
  const specErrors = nestedErrors(errors, "specifications");

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <FormSection title="Basic information">
          <Field label="Product name" required error={err("name")}>
            {(props) => (
              <TextInput
                {...props}
                value={form.name}
                maxLength={160}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Premium Black Trolley Bag"
              />
            )}
          </Field>

          <Field
            label="URL slug"
            error={err("slug")}
            hint={
              <>
                /product/<span className="font-medium text-ink">{effectiveSlug || "…"}</span>
                {!slugTouched && " · generated from the name"}
              </>
            }
          >
            {(props) => (
              <TextInput
                {...props}
                value={effectiveSlug}
                maxLength={120}
                onChange={(event) => {
                  setSlugTouched(true);
                  update("slug", slugify(event.target.value));
                }}
              />
            )}
          </Field>
          {slugChanged && (
            <p className="flex gap-2 rounded-lg border border-gold/40 bg-gold-soft/50 p-3 text-xs text-ink">
              <TriangleAlert aria-hidden className="size-4 shrink-0 text-gold-deep" />
              Changing the slug changes the product URL. QR stickers already printed for this
              product will stop working and must be reprinted.
            </p>
          )}

          <Field label="Category" required error={err("category_id")}>
            {(props) => (
              <SelectInput
                {...props}
                value={form.category_id}
                onChange={(event) => update("category_id", event.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.is_active ? " (inactive)" : ""}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
          {categories.length === 0 && (
            <p className="text-sm text-danger">
              Create a category first.{" "}
              <Link href="/admin/categories/new" className="underline">
                Add category
              </Link>
            </p>
          )}

          <Field
            label="Short description"
            error={err("short_description")}
            hint={`${form.short_description.length}/300 · shown on product cards`}
          >
            {(props) => (
              <TextArea
                {...props}
                value={form.short_description}
                maxLength={300}
                rows={2}
                className="min-h-20"
                onChange={(event) => update("short_description", event.target.value)}
              />
            )}
          </Field>

          <Field label="Description" error={err("description")}>
            {(props) => (
              <TextArea
                {...props}
                value={form.description}
                maxLength={5000}
                rows={6}
                onChange={(event) => update("description", event.target.value)}
              />
            )}
          </Field>
        </FormSection>

        <FormSection
          title="Images"
          description="The first image is the primary image unless you choose another."
        >
          <ImageManager
            items={images}
            onChange={updateImages}
            subfolder={selectedCategory?.slug}
            max={MAX_PRODUCT_IMAGES}
          />
          {err("images") && <p className="text-sm text-danger">{err("images")}</p>}
          {failedUploads > 0 && (
            <p className="text-xs text-danger">
              {failedUploads} image(s) failed to upload and will not be saved. Remove them and try
              again.
            </p>
          )}
        </FormSection>

        <FormSection
          title="Features"
          description="Key highlights, e.g. Material → ABS, Wheels → 4 Wheel."
        >
          <KeyValueEditor
            legend="Feature"
            rows={form.features}
            onChange={(rows) => update("features", rows)}
            labelPlaceholder="Feature (e.g. Material)"
            valuePlaceholder="Value (e.g. ABS)"
            addLabel="Add feature"
            max={30}
            errors={featureErrors}
          />
        </FormSection>

        <FormSection
          title="Specifications"
          description="Detailed technical information shown as a table."
        >
          <KeyValueEditor
            legend="Specification"
            rows={form.specifications}
            onChange={(rows) => update("specifications", rows)}
            labelPlaceholder="Name (e.g. Size)"
            valuePlaceholder="Value (e.g. 24 inch)"
            addLabel="Add specification"
            max={40}
            errors={specErrors}
          />
        </FormSection>

        <FormSection title="Available colours">
          <ColorEditor colors={form.colors} onChange={(colors) => update("colors", colors)} />
        </FormSection>
      </div>

      <div className="space-y-6">
        <FormSection title="Visibility">
          <Switch
            label="Active"
            description="Inactive products are hidden from the website and their URL shows 404."
            checked={form.is_active}
            onChange={(value) => update("is_active", value)}
          />
          <Switch
            label="Featured"
            description="Show in the homepage Featured Collection."
            checked={form.is_featured}
            onChange={(value) => update("is_featured", value)}
          />
          <Switch
            label="New Arrival"
            description="Show in the homepage New Arrivals."
            checked={form.is_new_arrival}
            onChange={(value) => update("is_new_arrival", value)}
          />
          <Field label="Display order" hint="Lower numbers appear first." error={err("sort_order")}>
            {(props) => (
              <TextInput
                {...props}
                type="number"
                inputMode="numeric"
                value={String(form.sort_order)}
                onChange={(event) =>
                  update("sort_order", Number.parseInt(event.target.value || "0", 10))
                }
              />
            )}
          </Field>
        </FormSection>

        <div className="sticky top-20 space-y-3 rounded-2xl border border-line bg-paper p-5">
          <Button type="submit" className="w-full" disabled={saving || uploading}>
            {(saving || uploading) && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {uploading
              ? "Uploading images…"
              : saving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create product"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          {isEdit && product?.is_active && (
            <a
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full" })}
            >
              View on website <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
          {dirty && <p className="text-center text-xs text-muted">You have unsaved changes.</p>}
        </div>
      </div>
    </form>
  );
}
