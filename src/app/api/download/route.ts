import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const FILES: Record<string, { path: string; type: string }> = {
  "logo-v1": { path: "public/logo-v1.png", type: "image/png" },
  "logo-v2": { path: "public/logo-v2.png", type: "image/png" },
  "logo-v3": { path: "public/logo-v3.png", type: "image/png" },
  "logo-v4": { path: "public/logo-v4-full.png", type: "image/png" },
  "favicon-v1": { path: "public/favicon-v1.png", type: "image/png" },
  "favicon-v2": { path: "public/favicon-v2.png", type: "image/png" },
  "demo-pptx": { path: "public/LinkForge_Demo.pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  "demo-script": { path: "public/LinkForge_Demo_Script.md", type: "text/markdown" },
  "store-header": { path: "public/linkforge-store-header.png", type: "image/png" },
};

const FILENAMES: Record<string, string> = {
  "logo-v1": "LinkForge_Logo_V1_DualLink.png",
  "logo-v2": "LinkForge_Logo_V2_NodeChain.png",
  "logo-v3": "LinkForge_Logo_V3_LetterL.png",
  "logo-v4": "LinkForge_Logo_V4_FullWordmark.png",
  "favicon-v1": "LinkForge_Favicon_V1.png",
  "favicon-v2": "LinkForge_Favicon_V2.png",
  "demo-pptx": "LinkForge_Demo.pptx",
  "demo-script": "LinkForge_Demo_Script.md",
  "store-header": "LinkForge_Store_Header.png",
};

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("file");

  if (!key || !FILES[key]) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid file. Use ?file=logo-v1, logo-v2, logo-v3, logo-v4, favicon-v1, favicon-v2, demo-pptx, demo-script, store-header" }),
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