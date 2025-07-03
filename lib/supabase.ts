import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          hourly_rate: number | null
          pto_balance_vacation: number | null
          pto_balance_sick: number | null
          pto_balance_personal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          hourly_rate?: number | null
          pto_balance_vacation?: number | null
          pto_balance_sick?: number | null
          pto_balance_personal?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          hourly_rate?: number | null
          pto_balance_vacation?: number | null
          pto_balance_sick?: number | null
          pto_balance_personal?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          clock_in: string | null
          clock_out: string | null
          break_duration: number | null
          manual_entry: boolean | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clock_in?: string | null
          clock_out?: string | null
          break_duration?: number | null
          manual_entry?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clock_in?: string | null
          clock_out?: string | null
          break_duration?: number | null
          manual_entry?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mileage_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          miles: number
          start_location: string | null
          end_location: string | null
          purpose: string | null
          rate_per_mile: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          miles: number
          start_location?: string | null
          end_location?: string | null
          purpose?: string | null
          rate_per_mile?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          miles?: number
          start_location?: string | null
          end_location?: string | null
          purpose?: string | null
          rate_per_mile?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
