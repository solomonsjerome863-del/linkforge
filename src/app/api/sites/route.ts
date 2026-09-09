import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import { isOnTrial, getEffectiveLimits } from "@/lib/types";

/**
 * GET /api/sites — list a user's sites (cookie-authenticated)
 * POST /api/sites — create a new site with server-side plan-limit checks
 *
 * User identity: resolved from the httpOnly session cookie first
 * (transitional fallback to client-supplied userId is logged).
 */

// ─── GET ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = resolveUserId(request, searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        usageLinks: true,
        usageQueries: true,
        sites: {
          orderBy: { createdAt: "desc" },
          include: { pages: { select: { id: true, status: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Sites fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteUrl, siteName } = body;
    const userId = resolveUserId(
      request,
      typeof body.userId === "string" ? body.userId : null
    );

    // ── Validation ──
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: "Missing required field: siteUrl" },
        { status: 400 }
      );
    }

    let normalizedUrl: string;
    try {
      const parsed = new URL(siteUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error("Unsupported protocol");
      }
      normalizedUrl = parsed.origin;
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid website URL (e.g., https://example.com)" },
        { status: 400 }
      );
    }

    // ── Plan / trial limit enforcement ──
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        _count: { select: { sites: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const onTrial = isOnTrial(user.subscriptionStatus, user.trialEndsAt);
    const effectiveLimits = getEffectiveLimits(user.plan, user.subscriptionStatus, user.trialEndsAt);
    const siteCount = user._count.sites;

    if (effectiveLimits.maxSites !== -1 && siteCount >= effectiveLimits.maxSites) {
      const message = onTrial
        ? "Trial accounts are limited to 1 site. Upgrade your subscription to add more sites."
        : `Site limit reached (${siteCount} of ${effectiveLimits.maxSites} sites on the ${user.plan} plan). Upgrade to add more sites.`;
      return NextResponse.json(
        { error: message, code: "SITE_LIMIT_REACHED" },
        { status: 403 }
      );
    }

    // ── Create the site ──
    const site = await db.site.create({
      data: {
        userId,
        url: normalizedUrl,
        name: siteName ? String(siteName).trim().slice(0, 100) : normalizedUrl,
        status: "pending",
      },
    });

    console.log(`[Sites] ${user.email} added site ${normalizedUrl} (${onTrial ? "trial" : user.plan} plan)`);

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error("Site create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
