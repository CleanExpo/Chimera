# Chimera Auth System - Usage Guide

## Quick Start

### Client Components (use-auth hook)

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await signIn(
          formData.get('email') as string,
          formData.get('password') as string
        );
      }}>
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Sign In</button>
      </form>
    );
  }

  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Server Components

```tsx
import { getCurrentUser, requireAuth } from '@/lib/supabase/server';

// Optional authentication
export default async function DashboardPage() {
  const { user, error } = await getCurrentUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  return <div>Welcome {user.email}</div>;
}

// Required authentication (throws if not logged in)
export default async function ProtectedPage() {
  const user = await requireAuth(); // Throws error if not authenticated

  return <div>Welcome {user.email}</div>;
}
```

### Client-side Auth Functions

```tsx
import { signIn, signUp, signOut, resetPassword, getCurrentUser } from '@/lib/supabase/client';

// Sign in
const { error } = await signIn('user@example.com', 'password');
if (error) console.error('Login failed:', error);

// Sign up
const { error } = await signUp('user@example.com', 'password');
if (error) console.error('Signup failed:', error);

// Sign out
await signOut();

// Get current user
const { user, error } = await getCurrentUser();

// Reset password
const { error } = await resetPassword('user@example.com');
```

## Protected Routes

Routes protected by middleware (auto-redirect to /login):
- `/dashboard`
- `/command-center`
- `/settings`

## User Menu Component

```tsx
import { UserMenu } from '@/components/layout/user-menu';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <header>
      <UserMenu user={user} onSignOut={signOut} />
    </header>
  );
}
```

## Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Common Patterns

### Conditional Rendering Based on Auth

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export function ConditionalContent() {
  const { user } = useAuth();

  return (
    <div>
      {user ? (
        <div>Authenticated content</div>
      ) : (
        <div>Public content</div>
      )}
    </div>
  );
}
```

### Loading States

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  return <div>{user.email}</div>;
}
```

### Form with Error Handling

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const { error } = await signIn(
      formData.get('email') as string,
      formData.get('password') as string
    );

    if (error) {
      setError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## API Routes with Auth

```typescript
// app/api/protected/route.ts
import { getCurrentUser } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({ data: 'Protected data', user });
}
```

## Testing

### Manual Testing Checklist
1. Visit `/command-center` without login → redirects to `/login`
2. Register new account → receive confirmation email
3. Confirm email → redirects to `/dashboard`
4. Navigate to `/command-center` → see Command Center with user menu
5. Click avatar → see dropdown with email
6. Click logout → redirect to `/login`
7. Try to access `/command-center` → redirect to `/login`

## Troubleshooting

**User is null after login:**
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Check browser cookies (should see `sb-*-auth-token`)

**Redirects not working:**
- Check middleware is running: add console.log in `middleware.ts`
- Verify route is in `protectedPaths` array

**Email confirmation not arriving:**
- Check spam folder
- Verify Supabase email settings
- Default limit is 3 emails/hour on free tier

## Reference

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs)
