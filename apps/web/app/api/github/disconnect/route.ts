/**
 * GitHub OAuth - Disconnect
 *
 * This route removes the GitHub access token from user storage.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Clear from Supabase user metadata if user is authenticated
    if (user && !userError) {
      await supabase.auth.updateUser({
        data: {
          github_token: null,
          github_user: null,
        },
      });
    }

    // Clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete("github_token");
    response.cookies.delete("github_user");

    return response;
  } catch (error) {
    console.error("[GitHub] Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub" },
      { status: 500 }
    );
  }
}
