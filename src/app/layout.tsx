import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkForge AI — AI-Powered Internal Linking for SEO",
  description: "Automatically generate smart internal link suggestions for your website using AI. Improve your SEO with contextual, high-quality internal links.",
  keywords: ["internal linking", "SEO", "AI", "anchor text", "link suggestions", "site structure", "LinkWhisper alternative", "SaaS"],
  authors: [{ name: "LinkForge AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "LinkForge AI — AI-Powered Internal Linking",
    description: "Generate smart internal link suggestions automatically. Better linking, better SEO.",
    url: "https://chat.z.ai",
    siteName: "LinkForge AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkForge AI — AI-Powered Internal Linking",
    description: "Generate smart internal link suggestions automatically.",
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
