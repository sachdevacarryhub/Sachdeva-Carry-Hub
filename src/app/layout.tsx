import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cloudinaryTransform } from "@/lib/cloudinary/url";
import { getStoreSettings } from "@/lib/data/public";
import { getMetadataBase } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const name = settings.store_name;
  const where = settings.city ? ` in ${settings.city}` : "";
  const description = `${name} is a bag showroom${where} for trolley bags, school bags and ladies purses. Browse the collection online, then visit the store or enquire on WhatsApp.`;

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: `${name} | Premium Bags & Trolley Bags`,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    icons: {
      // Cloudinary favicons are served as small PNGs for widest browser support.
      icon: settings.favicon_url
        ? cloudinaryTransform(settings.favicon_url, "f_png,c_fill,w_64,h_64")
        : "/brand/icon.png",
      apple: "/brand/apple-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: name,
      locale: "en_IN",
      title: `${name} | Premium Bags & Trolley Bags`,
      description,
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
