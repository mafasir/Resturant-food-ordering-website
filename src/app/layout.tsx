import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ToastProvider } from "@/components/toast-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "FeastCraft is a modern kitchen serving wood-fired pizza, flame-grilled mains, fresh bowls and hand-crafted desserts. Order online for fast delivery or pickup.",
  keywords: [
    "restaurant",
    "food delivery",
    "online ordering",
    "pizza",
    "burgers",
    "FeastCraft",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Wood-fired pizza, flame-grilled mains, fresh bowls and hand-crafted desserts.",
    images: [
      {
        url: "/images/site/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Wood-fired pizza, flame-grilled mains, fresh bowls and hand-crafted desserts.",
    images: ["/images/site/og.png"],
  },
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-cream">
        <ToastProvider>
          <CartProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ember-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
              Skip to content
            </a>
            <SiteHeader user={user} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
