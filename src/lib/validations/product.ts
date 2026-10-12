import { z } from "zod";
import {
  cloudinaryPublicIdSchema,
  cloudinaryUrlSchema,
  optionalSlugSchema,
  optionalText,
  uuidSchema,
} from "./common";

export const MAX_PRODUCT_IMAGES = 12;

const featureSchema = z.object({
  label: z.string().trim().min(1, "Feature name is required.").max(60, "Max 60 characters."),
  value: z.string().trim().min(1, "Feature value is required.").max(200, "Max 200 characters."),
});

const specificationRowSchema = z.object({
  key: z.string().trim().min(1, "Specification name is required.").max(60, "Max 60 characters."),
  value: z
    .string()
    .trim()
    .min(1, "Specification value is required.")
    .max(200, "Max 200 characters."),
});

const colorSchema = z.object({
  name: z.string().trim().min(1, "Colour name is required.").max(40, "Max 40 characters."),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #111111.")
    .nullish()
    .transform((value) => value ?? null),
});

export const productImageInputSchema = z.object({
  /** Present for images that are already saved. */
  id: uuidSchema.optional(),
  cloudinary_public_id: cloudinaryPublicIdSchema,
  image_url: cloudinaryUrlSchema,
  alt_text: optionalText(200),
  width: z.number().int().positive().max(10000).nullish(),
  height: z.number().int().positive().max(10000).nullish(),
  format: z.string().trim().max(10).nullish(),
  is_primary: z.boolean().default(false),
});

/** Converts the spec rows into the JSON object stored in the database. */
function rowsToSpecifications(rows: { key: string; value: string }[]) {
  const result: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (key) result[key] = row.value;
  }
  return result;
}

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required.").max(160, "Max 160 characters."),
    slug: optionalSlugSchema,
    category_id: uuidSchema
      .or(z.literal("").transform(() => null))
      .refine((value) => value !== null, "Please choose a category."),
    short_description: optionalText(300),
    description: optionalText(5000),
    features: z.array(featureSchema).max(30, "Up to 30 features.").default([]),
    specifications: z
      .array(specificationRowSchema)
      .max(40, "Up to 40 specifications.")
      .default([])
      .transform(rowsToSpecifications),
    available_colors: z.array(colorSchema).max(20, "Up to 20 colours.").default([]),
    is_featured: z.boolean().default(false),
    is_new_arrival: z.boolean().default(false),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().min(-100000).max(100000).default(0),
    images: z
      .array(productImageInputSchema)
      .max(MAX_PRODUCT_IMAGES, `Up to ${MAX_PRODUCT_IMAGES} images per product.`)
      .default([])
      .refine(
        (images) => images.filter((image) => image.is_primary).length <= 1,
        "Only one image can be the primary image.",
      )
      .refine(
        (images) =>
          new Set(images.map((image) => image.cloudinary_public_id)).size === images.length,
        "The same image was added twice.",
      ),
  })
  .strict();

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductInputParsed = z.output<typeof productInputSchema>;

/** Quick toggles from the product list. */
export const productFlagsSchema = z
  .object({
    is_featured: z.boolean().optional(),
    is_new_arrival: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export const productListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
  featured: z.enum(["1", "true"]).optional(),
  new: z.enum(["1", "true"]).optional(),
});
