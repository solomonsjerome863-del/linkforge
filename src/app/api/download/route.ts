import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const FILES: Record<string, { path: string; type: string }> = {
  "logo-svg": { path: "public/logo.svg", type: "image/svg+xml" },
  "logo-png": { path: "public/logo.png", type: "image/png" },
  "favicon-svg": { path: "public/favicon.svg", type: "image/svg+xml" },
  "og-image": { path: "public/og-image.png", type: "image/png" },
  "icon-512": { path: "public/icon-512.png", type: "image/png" },
  "icon-192": { path: "public/icon-192.png", type: "image/png" },
  "apple-touch-icon": { path: "public/apple-touch-icon.png", type: "image/png" },
  "demo-pptx": { path: "public/LinkForge_Demo.pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  "demo-script": { path: "public/LinkForge_Demo_Script.md", type: "text/markdown" },
};

const FILENAMES: Record<string, string> = {
  "logo-svg": "LinkForge_Logo_Wordmark.svg",
  "logo-png": "LinkForge_Logo_1024x1024.png",
  "favicon-svg": "LinkForge_Favicon.svg",
  "og-image": "LinkForge_OG_Image_1200x630.png",
  "icon-512": "LinkForge_Icon_512x512.png",
  "icon-192": "LinkForge_Icon_192x192.png",
  "apple-touch-icon": "LinkForge_Apple_Touch_Icon.png",
  "demo-pptx": "LinkForge_Demo.pptx",
  "demo-script": "LinkForge_Demo_Script.md",
};

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("file");

  if (!key || !FILES[key]) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid file key" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const filePath = join(process.cwd(), FILES[key].path);
    const buffer = await readFile(filePath);
    const filename = FILENAMES[key];

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": FILES[key].type,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}