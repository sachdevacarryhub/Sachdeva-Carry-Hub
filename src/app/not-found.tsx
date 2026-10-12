import type { Metadata } from "next";
import { Footer } from "@/components/footer/footer";
import { Navbar } from "@/components/navbar/navbar";
import { MotionProvider } from "@/components/shared/motion-provider";
import { NotFoundContent } from "@/components/shared/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Unmatched URLs: rendered with the public site chrome. */
export default function RootNotFound() {
  return (
    <MotionProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          <NotFoundContent />
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
