/**
 * GitHub OAuth - Callback Handler
 *
 * This route handles the OAuth callback from GitHub.
 * It exchanges the authorization code for an access token and stores it.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("[GitHub OAuth] Error:", error);
    return NextResponse.redirect(
      `${origin}/dashboard?github_error=${encodeURIComponent(error)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/dashboard?github_error=missing_parameters`
    );
  }

  try {
    // Decode state to get return URL
    const stateData = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8")
    );
    const returnTo = stateData.returnTo || "/dashboard";

    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GitHub OAuth credentials not configured");
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("No access token received from GitHub");
    }

    // Get user information from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub user information");
    }

    const githubUser = await userResponse.json();

    // Store GitHub access token in Supabase user metadata
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // User not authenticated with Supabase - store in cookie instead
      const response = NextResponse.redirect(`${origin}${returnTo}?github_connected=true`);

      // Store GitHub data in secure HTTP-only cookies
      response.cookies.set("github_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      response.cookies.set(
        "github_user",
        JSON.stringify({
          login: githubUser.login,
          id: githubUser.id,
          avatar_url: githubUser.avatar_url,
          name: githubUser.name,
        }),
        {
          httpOnly: false, // Allow client-side access for display
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        }
      );

      return response;
    }

    // Update user metadata in Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        github_token: accessToken,
        github_user: {
          login: githubUser.login,
          id: githubUser.id,
          avatar_url: githubUser.avatar_url,
          name: githubUser.name,
        },
      },
    });

    if (updateError) {
      console.error("[GitHub OAuth] Failed to update user metadata:", updateError);
      // Continue anyway - we'll use cookies as fallback
    }

    // Redirect back to the app
    return NextResponse.redirect(`${origin}${returnTo}?github_connected=true`);
  } catch (error) {
    console.error("[GitHub OAuth] Callback error:", error);
    return NextResponse.redirect(
      `${origin}/dashboard?github_error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error"
      )}`
    );
  }
}
