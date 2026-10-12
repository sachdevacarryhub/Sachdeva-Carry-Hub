"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, FormSection, Switch, TextArea, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { apiRequest, discardUpload } from "@/lib/api/client";
import { slugify } from "@/lib/utils/slug";
import type { Category } from "@/types";
import { SingleImageUpload } from "./single-image-upload";

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState<{ url: string; publicId: string | null } | null>(
    category?.image_url ? { url: category.image_url, publicId: category.image_public_id } : null,
  );
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const err = (key: string) => errors[key]?.[0];
  const touch = () => setDirty(true);

  /** Uploaded in this session and not yet saved: safe to delete from Cloudinary. */
  const isUnsavedUpload = (publicId: string | null | undefined) =>
    Boolean(publicId && publicId !== category?.image_public_id);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const result = await apiRequest<{ id: string; slug: string }>(
      isEdit ? `/api/categories/${category!.id}` : "/api/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        body: {
          name,
          slug: effectiveSlug,
          description,
          image_url: image?.url ?? null,
          image_public_id: image?.publicId ?? null,
          is_active: isActive,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      },
    );
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    setDirty(false);
    toast.success(isEdit ? "Category saved" : "Category created");
    router.push("/admin/categories");
    router.refresh();
  }

  function onCancel() {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    if (isUnsavedUpload(image?.publicId)) discardUpload(image!.publicId!);
    setDirty(false);
    router.push("/admin/categories");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-5xl gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <FormSection title="Category details">
          <Field label="Name" required error={err("name")}>
            {(props) => (
              <TextInput
                {...props}
                value={name}
                maxLength={120}
                onChange={(event) => {
                  setName(event.target.value);
                  touch();
                }}
                placeholder="e.g. Trolley Bags"
              />
            )}
          </Field>
          <Field
            label="URL slug"
            error={err("slug")}
            hint={
              <>
                /category/<span className="font-medium text-ink">{effectiveSlug || "…"}</span>
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
                  setSlug(slugify(event.target.value));
                  touch();
                }}
              />
            )}
          </Field>
          {isEdit && effectiveSlug !== category!.slug && (
            <p className="flex gap-2 rounded-lg border border-gold/40 bg-gold-soft/50 p-3 text-xs text-ink">
              <TriangleAlert aria-hidden className="size-4 shrink-0 text-gold-deep" />
              Changing the slug changes this category&apos;s URL. Existing links to it will stop
              working.
            </p>
          )}
          <Field
            label="Description"
            error={err("description")}
            hint="Shown on the category card and page."
          >
            {(props) => (
              <TextArea
                {...props}
                value={description}
                maxLength={600}
                rows={3}
                onChange={(event) => {
                  setDescription(event.target.value);
                  touch();
                }}
              />
            )}
          </Field>
        </FormSection>

        <FormSection title="Category image">
          <SingleImageUpload
            label={name || "Category image"}
            folder="categories"
            value={image}
            onUploaded={(uploaded) => {
              if (isUnsavedUpload(image?.publicId)) discardUpload(image!.publicId!);
              setImage({ url: uploaded.image_url, publicId: uploaded.cloudinary_public_id });
              touch();
            }}
            onRemove={() => {
              if (isUnsavedUpload(image?.publicId)) discardUpload(image!.publicId!);
              setImage(null);
              touch();
            }}
          />
          {err("image_url") && <p className="text-sm text-danger">{err("image_url")}</p>}
        </FormSection>
      </div>

      <div className="space-y-6">
        <FormSection title="Visibility">
          <Switch
            label="Active"
            description="Inactive categories and their products are hidden from the website. Products are kept."
            checked={isActive}
            onChange={(value) => {
              setIsActive(value);
              touch();
            }}
          />
          <Field label="Display order" hint="Lower numbers appear first.">
            {(props) => (
              <TextInput
                {...props}
                type="number"
                inputMode="numeric"
                value={String(sortOrder)}
                onChange={(event) => {
                  setSortOrder(Number.parseInt(event.target.value || "0", 10));
                  touch();
                }}
              />
            )}
          </Field>
        </FormSection>
        <div className="space-y-3 rounded-2xl border border-line bg-paper p-5">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create category"}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
