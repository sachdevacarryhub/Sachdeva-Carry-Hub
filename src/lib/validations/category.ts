import { z } from "zod";
import {
  cloudinaryPublicIdSchema,
  cloudinaryUrlSchema,
  optionalSlugSchema,
  optionalText,
} from "./common";

export const categoryInputSchema = z
  .object({
    name: z.string().trim().min(2, "Category name is required.").max(120, "Max 120 characters."),
    slug: optionalSlugSchema,
    description: optionalText(600),
    image_url: cloudinaryUrlSchema.nullish().transform((value) => value ?? null),
    image_public_id: cloudinaryPublicIdSchema.nullish().transform((value) => value ?? null),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().min(-100000).max(100000).default(0),
  })
  .strict()
  .refine((value) => Boolean(value.image_url) === Boolean(value.image_public_id), {
    message: "Image data is incomplete. Please upload the image again.",
    path: ["image_url"],
  });

export const categoryPatchSchema = z
  .object({
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(-100000).max(100000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export type CategoryInput = z.input<typeof categoryInputSchema>;
