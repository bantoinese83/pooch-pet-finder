/**
 * Environment variables required for the application
 *
 * Client-safe environment variables (must be prefixed with NEXT_PUBLIC_)
 */
export const clientEnv = {
  // Google Maps
  MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  MAPS_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "",

  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  // LiveKit (if used for real-time features)
  LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
}

/**
 * Server-only environment variables (do not prefix with NEXT_PUBLIC_)
 * These should only be imported in server components or API routes
 */
export const serverEnv = {
  // AWS
  AWS_REGION: process.env.AWS_REGION || "",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "",

  // No NPM_RC or NPM_TOKEN - these are not needed for this application
}

// Validation function to check if required environment variables are set
export function validateClientEnv() {
  const missingVars = []

  if (!clientEnv.MAPS_API_KEY) missingVars.push("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
  if (!clientEnv.SUPABASE_URL) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!clientEnv.SUPABASE_ANON_KEY) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (missingVars.length > 0) {
    console.warn(`Missing client environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}

// Server-side validation should only be called in server components or API routes
export function validateServerEnv() {
  const missingVars = []

  if (!serverEnv.AWS_REGION) missingVars.push("AWS_REGION")
  if (!serverEnv.AWS_ACCESS_KEY_ID) missingVars.push("AWS_ACCESS_KEY_ID")
  if (!serverEnv.AWS_SECRET_ACCESS_KEY) missingVars.push("AWS_SECRET_ACCESS_KEY")
  if (!serverEnv.AWS_S3_BUCKET_NAME) missingVars.push("AWS_S3_BUCKET_NAME")

  if (missingVars.length > 0) {
    console.warn(`Missing server environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}
