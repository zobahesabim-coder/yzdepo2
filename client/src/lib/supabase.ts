import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://yveljrocbggsutbeoksf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZWxqcm9jYmdnc3V0YmVva3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDYyOTUsImV4cCI6MjEwODQyMjI5NX0.tZKysmiOCItRvAJnHxj2v7cD3a_yglMfnrmpSpfLGpQ";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
