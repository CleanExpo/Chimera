# GitHub Integration Setup Guide

This guide explains how to set up the GitHub "Push to Repo" functionality in the Chimera Command Center.

## Overview

The GitHub integration allows users to push generated code directly from the Decision Desk to their GitHub repositories. This feature uses GitHub OAuth for authentication and the GitHub API for repository operations.

## Features

- OAuth authentication with GitHub
- Repository selection from user's repos
- Branch selection or creation
- File path customization
- Custom commit messages
- Direct push to GitHub without manual download/upload

## Prerequisites

1. A GitHub account
2. Admin access to create a GitHub OAuth App

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"** or **"Register a new application"**
3. Fill in the application details:
   - **Application name**: Chimera (or your preferred name)
   - **Homepage URL**: `http://localhost:3030` (for development)
   - **Application description**: AI-powered development platform
   - **Authorization callback URL**: `http://localhost:3030/api/github/callback`

4. Click **"Register application"**
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file (or `.env` for development):

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

**Important**: Never commit your `.env.local` or `.env` files with real credentials to version control!

## Step 3: Production Deployment

For production deployments, update your OAuth App settings:

1. Go back to your [GitHub OAuth Apps](https://github.com/settings/developers)
2. Click on your application
3. Update the **Authorization callback URL** to your production domain:
   ```
   https://your-domain.com/api/github/callback
   ```
4. You can add multiple callback URLs by creating separate OAuth Apps for development and production

## Architecture

### Files Created

#### Backend/API Routes
- `apps/web/app/api/github/auth/route.ts` - Initiates OAuth flow
- `apps/web/app/api/github/callback/route.ts` - Handles OAuth callback
- `apps/web/app/api/github/disconnect/route.ts` - Removes GitHub connection
- `apps/web/app/api/github/token/route.ts` - Returns access token for client

#### GitHub Client Library
- `apps/web/lib/github/client.ts` - GitHub API wrapper using Octokit
- `apps/web/lib/github/types.ts` - TypeScript type definitions

#### React Components
- `apps/web/components/github/PushDialog.tsx` - Main push dialog UI
- `apps/web/components/github/RepoSelector.tsx` - Repository selector dropdown
- `apps/web/components/github/BranchSelector.tsx` - Branch selector with create option

#### Hooks
- `apps/web/hooks/use-github-auth.ts` - GitHub authentication state management

#### Updated Components
- `apps/web/components/dashboard/DecisionDesk.tsx` - Integrated push functionality

## Usage Flow

### For Users

1. **Generate Code**: Use the Command Center to generate code with either team
2. **Connect GitHub**: Click "Push to Repo" → "Connect GitHub"
3. **Authorize**: Grant Chimera access to your repositories
4. **Configure Push**:
   - Select repository
   - Select or create branch
   - Specify file path (e.g., `src/components/MyComponent.tsx`)
   - Customize commit message
5. **Push**: Click "Push to GitHub" to commit the code

### For Developers

```typescript
// Using the GitHub client directly
import { pushToRepo } from "@/lib/github/client";

const result = await pushToRepo(accessToken, {
  owner: "your-username",
  repo: "your-repo",
  branch: "main",
  path: "src/components/MyComponent.tsx",
  content: generatedCode,
  message: "feat: Add component from Chimera",
});
```

## Security Features

1. **HTTP-Only Cookies**: GitHub access tokens are stored in secure HTTP-only cookies
2. **Token Validation**: Tokens are validated before use
3. **Scoped Access**: Only requests `repo` and `read:user` scopes
4. **Supabase Integration**: Optionally stores token in user metadata for persistence

## Scopes Required

The OAuth app requests the following GitHub scopes:

- `repo` - Access to repositories (read and write)
- `read:user` - Read user profile information

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/auth` | GET | Initiates OAuth flow |
| `/api/github/callback` | GET | Handles OAuth callback |
| `/api/github/disconnect` | POST | Removes GitHub connection |
| `/api/github/token` | GET | Returns access token |

## Troubleshooting

### "GitHub OAuth is not configured" Error
- Ensure `GITHUB_CLIENT_ID` is set in your environment variables
- Restart your development server after adding env vars

### "Failed to push to GitHub" Error
- Check that your token hasn't expired
- Verify you have push access to the repository
- Ensure the branch exists or you're creating a new one
- Check file path doesn't conflict with existing protected files

### OAuth Callback Fails
- Verify callback URL matches exactly in GitHub OAuth App settings
- Check for typos in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Ensure you're using the correct environment (dev vs. production URLs)

### Token Validation Fails
- Disconnect and reconnect your GitHub account
- Check that the OAuth App is still active
- Verify scopes haven't changed

## Rate Limits

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests per hour
- **OAuth App**: Additional quota based on OAuth app

For high-volume usage, consider:
- Caching repository and branch lists
- Implementing request throttling
- Using GitHub Apps instead of OAuth Apps

## Future Enhancements

Potential improvements to consider:

1. **Pull Request Creation**: Create PRs instead of direct pushes
2. **Multi-file Push**: Push multiple files in one commit
3. **GitHub Actions Integration**: Trigger workflows after push
4. **Organization Repos**: Support for org repositories
5. **Commit History**: View push history within Chimera
6. **Branch Protection**: Detect and handle protected branches
7. **Conflict Resolution**: Handle merge conflicts gracefully

## Support

For issues or questions:
1. Check the [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
2. Review [Octokit Documentation](https://github.com/octokit/rest.js)
3. Open an issue in the Chimera repository

## License

This integration follows the same license as the main Chimera project.
