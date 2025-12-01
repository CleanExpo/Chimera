/**
 * GitHub Token API
 *
 * Returns the GitHub access token for the authenticated user.
 * This allows us to keep the token in HTTP-only cookies while
 * still making it available to client-side GitHub API calls.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Try to get token from cookie first
    const tokenFromCookie = cookieStore.get("github_token")?.value;

    if (tokenFromCookie) {
      return NextResponse.json({ token: tokenFromCookie });
    }

    // Try to get from Supabase user metadata as fallback
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user?.user_metadata?.github_token) {
      return NextResponse.json({ token: user.user_metadata.github_token });
    }

    // No token found
    return NextResponse.json({ token: null }, { status: 404 });
  } catch (error) {
    console.error("[GitHub] Token retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve GitHub token" },
      { status: 500 }
    );
  }
}
