import { createClient } from "@supabase/supabase-js"
import { clientEnv } from "./env"

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createClient(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
  },
})

// Helper function to check if the database connection is working
export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase.from("shelters").select("id").limit(1)

    if (error) {
      console.error("Database connection error:", error)
      return { connected: false, error: error.message }
    }

    return { connected: true }
  } catch (error) {
    console.error("Database connection error:", error)
    return { connected: false, error: (error as Error).message }
  }
}
