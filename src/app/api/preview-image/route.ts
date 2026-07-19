import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const IMAGES: Record<string, string> = {
  "logo-v1": "public/logo-v1.png",
  "logo-v2": "public/logo-v2.png",
  "logo-v3": "public/logo-v3.png",
  "logo-v4": "public/logo-v4-full.png",
  "favicon-v1": "public/favicon-v1.png",
  "favicon-v2": "public/favicon-v2.png",
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