/**
 * Environment detection utilities
 */

/**
 * Check if running on Vercel serverless environment
 */
export function isVercel(): boolean {
  return process.env.VERCEL === "1" || !!process.env.VERCEL_URL;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if local filesystem operations are available
 * Returns false on Vercel/serverless environments
 */
export function isLocalFilesystemAvailable(): boolean {
  // On Vercel, filesystem is read-only and limited
  if (isVercel()) return false;

  // Allow in development or non-Vercel production
  return true;
}

/**
 * Standard error response for local-only features
 */
export function localOnlyFeatureResponse() {
  return {
    error: "This feature is only available in local development",
    message: "Workspace file operations require local filesystem access. For full workspace features, run the app locally or use the desktop version.",
    code: "LOCAL_ONLY_FEATURE",
  };
}
