import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { clientEnv } from "@/lib/env"

export async function POST() {
  try {
    const supabase = createClient(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY)

    // Get the schema SQL from our schema API route
    const schemaResponse = await fetch(new URL("/api/schema", "http://localhost:3000"))
    if (!schemaResponse.ok) {
      throw new Error(`Failed to fetch schema: ${schemaResponse.statusText}`)
    }

    const schemaSql = await schemaResponse.text()

    // In a real application, you would use a more secure approach to execute SQL
    // For this example, we'll use a simplified approach
    // Note: This requires the `pg_execute_sql` function to be available in your Supabase project
    // You may need to create this function or use a different approach

    // Split the SQL into individual statements
    const statements = schemaSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    // Execute each statement
    for (const stmt of statements) {
      const { error } = await supabase.rpc("pg_execute_sql", { sql: stmt })
      if (error) {
        console.error("Error executing SQL:", error)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to execute SQL: ${error.message}`,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to initialize database: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
