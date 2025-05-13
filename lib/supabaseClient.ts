import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xulktftuucmibxrkhfbh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bGt0ZnR1dWNtaWJ4cmtoZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNzMxMTIsImV4cCI6MjA2MjY0OTExMn0.EnqD3A45Hgtq25VPda4LTO_Q9TjcK6VByzBi6ZjoA8U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 