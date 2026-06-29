import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkForge AI — Technical Blueprint",
  description: "Next-Gen Internal Linking Engine: A comprehensive 6-phase technical architecture for building an LLM-powered internal linking SaaS using RAG + Vector Search.",
  keywords: ["internal linking", "SEO", "RAG", "vector search", "LLM", "anchor text", "LinkWhisper alternative", "SaaS architecture"],
  authors: [{ name: "LinkForge AI Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "LinkForge AI — Technical Blueprint",
    description: "Next-Gen Internal Linking Engine: RAG + Vector Search architecture for automated internal linking.",
    url: "https://chat.z.ai",
    siteName: "LinkForge AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkForge AI — Technical Blueprint",
    description: "Next-Gen Internal Linking Engine: RAG + Vector Search architecture.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
