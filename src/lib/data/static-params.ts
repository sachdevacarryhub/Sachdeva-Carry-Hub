/**
 * With Cache Components, generateStaticParams must return at least one entry.
 * When the database is empty or unreachable at build time we return this
 * placeholder, which simply renders the 404 page. Real slugs are rendered on
 * demand and cached after the first visit.
 */
export const PLACEHOLDER_SLUG = "__placeholder__";
