"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, FormSection, TextArea, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import type { StoreSettings } from "@/types";
import { SingleImageUpload } from "./single-image-upload";

type FormState = {
  store_name: string;
  owner_name: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  instagram_url: string;
  google_maps_url: string;
  logo_url: string;
  favicon_url: string;
  established_on: string;
};

function toForm(settings: StoreSettings): FormState {
  return {
    store_name: settings.store_name,
    owner_name: settings.owner_name ?? "",
    phone_primary: settings.phone_primary ?? "",
    phone_secondary: settings.phone_secondary ?? "",
    whatsapp_number: settings.whatsapp_number ?? "",
    address: settings.address ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    pincode: settings.pincode ?? "",
    instagram_url: settings.instagram_url ?? "",
    google_maps_url: settings.google_maps_url ?? "",
    logo_url: settings.logo_url ?? "",
    favicon_url: settings.favicon_url ?? "",
    established_on: settings.established_on ?? "",
  };
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(() => toForm(settings));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };
  const err = (key: keyof FormState) => errors[key]?.[0];

  const text = (
    key: keyof FormState,
    label: string,
    options: {
      required?: boolean;
      hint?: string;
      type?: string;
      placeholder?: string;
      inputMode?: "tel" | "url" | "numeric";
    } = {},
  ) => (
    <Field label={label} required={options.required} hint={options.hint} error={err(key)}>
      {(props) => (
        <TextInput
          {...props}
          type={options.type ?? "text"}
          inputMode={options.inputMode}
          placeholder={options.placeholder}
          value={form[key]}
          onChange={(event) => set(key)(event.target.value)}
        />
      )}
    </Field>
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const result = await apiRequest("/api/settings", { method: "PATCH", body: form });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    setDirty(false);
    toast.success("Store information saved. The website is updated.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-5xl gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <FormSection title="Store">
          <div className="grid gap-5 sm:grid-cols-2">
            {text("store_name", "Store name", { required: true })}
            {text("owner_name", "Owner name")}
          </div>
          <Field
            label="Established on"
            error={err("established_on")}
            hint="Shown on the About page."
          >
            {(props) => (
              <TextInput
                {...props}
                type="date"
                value={form.established_on}
                onChange={(event) => set("established_on")(event.target.value)}
              />
            )}
          </Field>
        </FormSection>

        <FormSection
          title="Contact"
          description="Used for Call and WhatsApp buttons across the website."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {text("phone_primary", "Primary phone", {
              type: "tel",
              inputMode: "tel",
              hint: "Used by every “Call Now” button.",
              placeholder: "7248543292",
            })}
            {text("phone_secondary", "Secondary phone", { type: "tel", inputMode: "tel" })}
          </div>
          {text("whatsapp_number", "WhatsApp number", {
            type: "tel",
            inputMode: "tel",
            hint: "Leave empty to use the primary phone. Indian numbers get +91 automatically.",
          })}
          {text("instagram_url", "Instagram URL", {
            type: "url",
            inputMode: "url",
            placeholder: "https://www.instagram.com/sachdevacarryhub/",
          })}
        </FormSection>

        <FormSection title="Address & map">
          <Field label="Address" error={err("address")}>
            {(props) => (
              <TextArea
                {...props}
                rows={2}
                className="min-h-20"
                value={form.address}
                onChange={(event) => set("address")(event.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            {text("city", "City")}
            {text("state", "State")}
            {text("pincode", "Pincode", { inputMode: "numeric" })}
          </div>
          {text("google_maps_url", "Google Maps URL", {
            type: "url",
            inputMode: "url",
            hint: "Open your store in Google Maps → Share → Copy link.",
          })}
        </FormSection>
      </div>

      <div className="space-y-6">
        <FormSection
          title="Logo"
          description="Optional. Replaces the built-in logo; use a transparent PNG."
        >
          <SingleImageUpload
            label="Store logo"
            folder="branding"
            aspect="aspect-[4/3]"
            value={form.logo_url ? { url: form.logo_url, publicId: null } : null}
            onUploaded={(image) => set("logo_url")(image.image_url)}
            onRemove={() => set("logo_url")("")}
          />
          {err("logo_url") && <p className="text-sm text-danger">{err("logo_url")}</p>}
        </FormSection>
        <FormSection title="Favicon" description="Optional. A square image works best.">
          <SingleImageUpload
            label="Favicon"
            folder="branding"
            aspect="aspect-square w-28"
            value={form.favicon_url ? { url: form.favicon_url, publicId: null } : null}
            onUploaded={(image) => set("favicon_url")(image.image_url)}
            onRemove={() => set("favicon_url")("")}
          />
          {err("favicon_url") && <p className="text-sm text-danger">{err("favicon_url")}</p>}
        </FormSection>
        <div className="space-y-3 rounded-2xl border border-line bg-paper p-5">
          <Button type="submit" className="w-full" disabled={saving || !dirty}>
            {saving && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {saving ? "Saving…" : "Save store information"}
          </Button>
          {dirty && <p className="text-center text-xs text-muted">You have unsaved changes.</p>}
        </div>
      </div>
    </form>
  );
}
