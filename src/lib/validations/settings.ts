import { z } from "zod";
import { optionalHttpUrl, optionalText } from "./common";

const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number is too long.")
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => {
    if (value === null) return true;
    const digits = value.replace(/\D/g, "");
    return /^[+\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
  }, "Enter a valid phone number, e.g. 7248543292 or +91 72485 43292.");

export const storeSettingsSchema = z
  .object({
    store_name: z.string().trim().min(2, "Store name is required.").max(120),
    owner_name: optionalText(120),
    phone_primary: phoneSchema,
    phone_secondary: phoneSchema,
    whatsapp_number: phoneSchema,
    address: optionalText(300),
    city: optionalText(120),
    state: optionalText(120),
    pincode: z
      .string()
      .trim()
      .nullish()
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || /^\d{6}$/.test(value), "Pincode must be 6 digits."),
    instagram_url: optionalHttpUrl,
    google_maps_url: optionalHttpUrl,
    logo_url: optionalHttpUrl,
    favicon_url: optionalHttpUrl,
    established_on: z
      .string()
      .trim()
      .nullish()
      .transform((value) => (value ? value : null))
      .refine(
        (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "Use the date picker (YYYY-MM-DD).",
      ),
  })
  .strict();

export type StoreSettingsInput = z.input<typeof storeSettingsSchema>;
