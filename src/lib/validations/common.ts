import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/utils/slug";

export const uuidSchema = z.uuid("Invalid id.");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(SLUG_MAX_LENGTH, `Slug must be at most ${SLUG_MAX_LENGTH} characters.`)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only.");

/** Optional slug: empty string means "generate from the name". */
export const optionalSlugSchema = z.union([z.literal(""), slugSchema]).optional();

/** Trimmed optional text; empty strings become null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .nullish()
    .transform((value) => (value ? value : null));

/** Optional absolute http(s) URL; empty strings become null. */
export const optionalHttpUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long.")
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => {
    if (value === null) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid URL starting with https://");

/** Cloudinary delivery URL for our account's uploads. */
export const cloudinaryUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  }, "Image URL must be a Cloudinary https URL.");

export const CLOUDINARY_ROOT_FOLDER = "sachdeva-carry-hub";

export const cloudinaryPublicIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_\-/]+$/, "Invalid image id.")
  .refine(
    (value) => value.startsWith(`${CLOUDINARY_ROOT_FOLDER}/`) && !value.includes(".."),
    "Image does not belong to this website.",
  );
