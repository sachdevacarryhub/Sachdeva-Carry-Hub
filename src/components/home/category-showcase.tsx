import { CategoryCard } from "@/components/categories/category-card";
import { Reveal } from "@/components/shared/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveCategories } from "@/lib/data/public";

export async function CategoryShowcase() {
  const categories = await getActiveCategories();
  if (!categories.ok || categories.data.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Shop by category"
          title={<span id="categories-heading">Find the right bag for every day</span>}
          description="From long journeys to the school run and evenings out — explore each collection."
          action={{ href: "/products", label: "View all products" }}
        />
        <ul className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category, index) => (
            <Reveal as="li" key={category.id} delay={Math.min(index, 3) * 0.08}>
              <CategoryCard category={category} index={index} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
