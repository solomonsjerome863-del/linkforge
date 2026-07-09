import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://linkforge.digital";
const SITE_NAME = "LinkForge";
const SITE_TAGLINE = "AI-Powered Internal Linking for SEO";
const SITE_DESCRIPTION =
  "Automatically generate smart internal link suggestions for your website using AI. Improve your SEO with contextual, high-quality internal links. Works with WordPress, Shopify, Webflow, and any website.";

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "internal linking",
    "internal links SEO",
    "AI link building",
    "anchor text optimization",
    "link suggestions",
    "site structure",
    "orphan page detection",
    "content analysis",
    "LinkWhisper alternative",
    "SEO tool",
    "internal link manager",
    "LinkForge",
  ],
  authors: [{ name: "LinkForge", url: SITE_URL }],
  creator: "LinkForge",
  publisher: "LinkForge",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: "Generate smart internal link suggestions automatically. Better linking, better rankings.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: "Generate smart internal link suggestions automatically. Better linking, better rankings.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      description: SITE_DESCRIPTION,
      sameAs: [],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "99",
        priceCurrency: "USD",
        offerCount: 3,
      },
      description: SITE_DESCRIPTION,
      featureList: [
        "AI-powered internal link suggestions",
        "Real web crawling and content extraction",
        "Keyword overlap analysis",
        "Orphan page detection",
        "Anchor text generation",
        "Bulk approve/reject operations",
        "Analytics dashboard",
        "CSV/JSON export",
      ],
      screenshot: `${SITE_URL}/og-image.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is internal linking and why does it matter?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Internal linking connects pages within your website. It helps search engines discover and understand your content hierarchy, distributes page authority, improves user navigation, and boosts rankings for important pages.",
          },
        },
        {
          "@type": "Question",
          name: "How does LinkForge generate link suggestions?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LinkForge crawls your website, extracts content and headings from each page, analyzes keyword overlap between pages using TF-overlap scoring, and generates contextual anchor text suggestions for the most relevant internal linking opportunities.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a free plan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! LinkForge offers a free Starter plan with 1 site, up to 50 pages per site, and 100 monthly link suggestions. No credit card required.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}