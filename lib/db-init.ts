import { createClient } from "@supabase/supabase-js"
import { clientEnv } from "./env"
import { readFileFromUrl } from "./file-utils"

/**
 * Initialize the database schema
 * This should be run once to set up the database tables
 */
export async function initializeDatabase() {
  try {
    const supabase = createClient(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY)

    // Check if tables already exist
    const { data: existingTables, error: tablesError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public")

    if (tablesError) {
      console.error("Error checking existing tables:", tablesError)
      return { success: false, error: tablesError.message }
    }

    // If tables already exist, don't recreate them
    if (existingTables && existingTables.some((t) => t.tablename === "shelters")) {
      return { success: true, message: "Database schema already initialized" }
    }

    // Get the schema SQL
    // In a real app, you would load this from a file or a URL
    // For this example, we'll use a placeholder approach
    const schemaUrl = "/api/schema" // This would be an API route that returns the schema SQL
    const schemaSql = await readFileFromUrl(schemaUrl)

    // Execute the SQL to create the schema
    const { error: schemaError } = await supabase.rpc("exec_sql", { sql: schemaSql })

    if (schemaError) {
      console.error("Error initializing database schema:", schemaError)
      return { success: false, error: schemaError.message }
    }

    return { success: true, message: "Database schema initialized successfully" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, error: (error as Error).message }
  }
}
