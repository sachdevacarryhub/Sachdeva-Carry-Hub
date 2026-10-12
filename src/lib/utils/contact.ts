import type { StoreSettings } from "@/types";

/**
 * Normalises an Indian phone number to E.164 digits without "+",
 * e.g. "72485 43292" -> "917248543292". Returns null for unusable input.
 */
export function toE164Digits(phone: string | null | undefined, defaultCountryCode = "91") {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function telHref(phone: string | null | undefined): string | null {
  const digits = toE164Digits(phone);
  return digits ? `tel:+${digits}` : null;
}

/** Human-friendly display: "+91 72485 43292". */
export function formatPhone(phone: string | null | undefined): string | null {
  const digits = toE164Digits(phone);
  if (!digits) return phone?.trim() || null;
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

/** Builds a wa.me link with an optional pre-filled message. */
export function whatsappHref(phone: string | null | undefined, message?: string): string | null {
  const digits = toE164Digits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function productEnquiryMessage(productName: string, productUrl: string | null): string {
  const lines = ["Hello, I am interested in:", productName];
  if (productUrl) lines.push("", "Product:", productUrl);
  return lines.join("\n");
}

/** WhatsApp number falls back to the primary phone. */
export function whatsappNumber(settings: StoreSettings): string | null {
  return settings.whatsapp_number || settings.phone_primary;
}

export function fullAddress(settings: StoreSettings): string | null {
  const locality = [settings.city, settings.state].filter(Boolean).join(", ");
  const parts = [settings.address, locality, settings.pincode].filter((part): part is string =>
    Boolean(part && part.trim()),
  );
  return parts.length ? parts.join(", ") : null;
}

/** Instagram handle for display, derived from the configured URL. */
export function instagramHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : null;
  } catch {
    return null;
  }
}

/** Keyless Google Maps embed URL derived from the store address. */
export function mapsEmbedUrl(settings: StoreSettings): string | null {
  const address = fullAddress(settings);
  if (!address) return null;
  const query = [settings.store_name, address].filter(Boolean).join(", ");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

export function mapsDirectionsUrl(settings: StoreSettings): string | null {
  if (settings.google_maps_url) return settings.google_maps_url;
  const address = fullAddress(settings);
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
}
