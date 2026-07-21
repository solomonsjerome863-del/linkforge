import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const IMAGES: Record<string, string> = {
  "logo-svg": "public/logo.svg",
  "logo-png": "public/logo.png",
  "favicon-svg": "public/favicon.svg",
  "og-image": "public/og-image.png",
  "icon-512": "public/icon-512.png",
  "icon-192": "public/icon-192.png",
  "apple-touch-icon": "public/apple-touch-icon.png",
};

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("file");
  if (!key || !IMAGES[key]) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  try {
    const buffer = await readFile(join(process.cwd(), IMAGES[key]));
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}