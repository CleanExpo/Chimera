/**
 * GitHub API Client
 * Handles all GitHub API operations using Octokit
 */

import { Octokit } from "@octokit/rest";
import type {
  GitHubRepository,
  GitHubBranch,
  GitHubUser,
  GitHubCreateFileRequest,
  GitHubCreateFileResponse,
  PushToRepoConfig,
} from "./types";

/**
 * Create an authenticated Octokit instance
 */
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

/**
 * Get the authenticated user's information
 */
export async function getAuthenticatedUser(
  accessToken: string
): Promise<GitHubUser> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();

  return {
    login: data.login,
    id: data.id,
    avatar_url: data.avatar_url,
    name: data.name,
    email: data.email,
    bio: data.bio,
  };
}

/**
 * List repositories for the authenticated user
 */
export async function listRepositories(
  accessToken: string,
  options?: {
    type?: "all" | "owner" | "member";
    sort?: "created" | "updated" | "pushed" | "full_name";
    direction?: "asc" | "desc";
    per_page?: number;
  }
): Promise<GitHubRepository[]> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    type: options?.type || "owner",
    sort: options?.sort || "updated",
    direction: options?.direction || "desc",
    per_page: options?.per_page || 100,
  });

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    owner: {
      login: repo.owner!.login,
      avatar_url: repo.owner!.avatar_url,
    },
    description: repo.description,
    html_url: repo.html_url,
    default_branch: repo.default_branch || "main",
    permissions: repo.permissions,
  }));
}

/**
 * List branches for a repository
 */
export async function listBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return data.map((branch) => ({
    name: branch.name,
    commit: {
      sha: branch.commit.sha,
      url: branch.commit.url,
    },
    protected: branch.protected,
  }));
}

/**
 * Create a new branch from an existing branch
 */
export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  newBranch: string,
  fromBranch: string = "main"
): Promise<GitHubBranch> {
  const octokit = createGitHubClient(accessToken);

  // Get the SHA of the base branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  });

  // Create the new branch
  const { data } = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: refData.object.sha,
  });

  return {
    name: newBranch,
    commit: {
      sha: data.object.sha,
      url: data.url,
    },
    protected: false,
  };
}

/**
 * Get file content from a repository
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; sha: string } | null> {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ("content" in data && typeof data.content === "string") {
      return {
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
      };
    }

    return null;
  } catch (error: any) {
    // File doesn't exist (404)
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update a file in a repository
 */
export async function createOrUpdateFile(
  accessToken: string,
  config: GitHubCreateFileRequest
): Promise<GitHubCreateFileResponse> {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: config.path,
    message: config.message,
    content: config.content,
    branch: config.branch,
    sha: config.sha,
  });

  return data as GitHubCreateFileResponse;
}

/**
 * Push code to a GitHub repository
 * This is the main function used by the UI
 */
export async function pushToRepo(
  accessToken: string,
  config: PushToRepoConfig
): Promise<GitHubCreateFileResponse> {
  // If creating a new branch, do that first
  if (config.createBranch && config.baseBranch) {
    await createBranch(
      accessToken,
      config.owner,
      config.repo,
      config.branch,
      config.baseBranch
    );
  }

  // Check if file already exists to get its SHA (needed for updates)
  const existingFile = await getFileContent(
    accessToken,
    config.owner,
    config.repo,
    config.path,
    config.branch
  );

  // Encode content to base64
  const contentBase64 = Buffer.from(config.content).toString("base64");

  // Create or update the file
  return createOrUpdateFile(accessToken, {
    owner: config.owner,
    repo: config.repo,
    path: config.path,
    message: config.message,
    content: contentBase64,
    branch: config.branch,
    sha: existingFile?.sha,
  });
}

/**
 * Validate GitHub access token
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    await getAuthenticatedUser(accessToken);
    return true;
  } catch {
    return false;
  }
}
