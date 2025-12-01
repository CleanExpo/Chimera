/**
 * GitHub OAuth - Initiate Authorization
 *
 * This route redirects the user to GitHub's OAuth authorization page.
 * After authorization, GitHub will redirect back to /api/github/callback
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  // Get GitHub OAuth credentials from environment
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID in your environment variables." },
      { status: 500 }
    );
  }

  // Build GitHub OAuth authorization URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", `${origin}/api/github/callback`);
  githubAuthUrl.searchParams.set("scope", "repo read:user");

  // Use state parameter to pass return URL and verify callback
  const state = Buffer.from(
    JSON.stringify({ returnTo, timestamp: Date.now() })
  ).toString("base64");
  githubAuthUrl.searchParams.set("state", state);

  // Redirect to GitHub
  return NextResponse.redirect(githubAuthUrl.toString());
}
