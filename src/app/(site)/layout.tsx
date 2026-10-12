import { Footer } from "@/components/footer/footer";
import { Navbar } from "@/components/navbar/navbar";
import { MotionProvider } from "@/components/shared/motion-provider";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
