import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Catalog, CatalogSkeleton, parseCatalogParams } from "@/components/products/catalog";
import { Container } from "@/components/ui/container";
import { getActiveCategories } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse trolley bags, school bags and ladies purses available at our showroom. Search and filter the full collection.",
  alternates: { canonical: "/products" },
};

async function CatalogSection({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const [raw, categories] = await Promise.all([searchParams, getActiveCategories()]);
  return (
    <Catalog
      basePath="/products"
      filters={parseCatalogParams(raw)}
      categories={categories.ok ? categories.data.map(({ slug, name }) => ({ slug, name })) : []}
    />
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title="All Products"
        description="Trolley bags, school bags and ladies purses — browse everything available at the showroom."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Products" }]}
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogSection searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
