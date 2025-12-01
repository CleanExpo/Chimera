/**
 * GitHub API Types
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  default_branch: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
}

export interface GitHubCreateFileRequest {
  owner: string;
  repo: string;
  path: string;
  message: string;
  content: string; // base64 encoded
  branch?: string;
  sha?: string; // required for updates
}

export interface GitHubCreateFileResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
  };
  commit: {
    sha: string;
    url: string;
    html_url: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

export interface GitHubAuthState {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  accessToken: string | null;
}

export interface PushToRepoConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
  createBranch?: boolean;
  baseBranch?: string;
}

export interface GitHubError {
  message: string;
  status?: number;
  documentation_url?: string;
}
