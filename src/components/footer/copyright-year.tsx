import { cacheLife } from "next/cache";

/** Current year, cached so the footer stays part of the static shell. */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
