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
          profile_picture_url: string | null
          timezone: string | null
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
          profile_picture_url?: string | null
          timezone?: string | null
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
          profile_picture_url?: string | null
          timezone?: string | null
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
      daily_updates: {
        Row: {
          id: string
          user_id: string
          date: string
          message: string | null
          photo_url: string | null
          update_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          message?: string | null
          photo_url?: string | null
          update_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          message?: string | null
          photo_url?: string | null
          update_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper function to upload profile picture
export const uploadProfilePicture = async (userId: string, file: File) => {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/profile.${fileExt}`

  const { data, error } = await supabase.storage.from("profile-pictures").upload(fileName, file, {
    upsert: true,
  })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-pictures").getPublicUrl(fileName)

  return publicUrl
}

// Helper function to delete profile picture
export const deleteProfilePicture = async (userId: string) => {
  const { error } = await supabase.storage
    .from("profile-pictures")
    .remove([`${userId}/profile.jpg`, `${userId}/profile.jpeg`, `${userId}/profile.png`, `${userId}/profile.webp`])

  if (error) console.error("Error deleting profile picture:", error)
}

// Helper function to upload daily update photo
export const uploadDailyUpdatePhoto = async (userId: string, file: File) => {
  const fileExt = file.name.split(".").pop()
  const timestamp = Date.now()
  const fileName = `${userId}/${timestamp}.${fileExt}`

  const { data, error } = await supabase.storage.from("daily-updates").upload(fileName, file)

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from("daily-updates").getPublicUrl(fileName)

  return publicUrl
}

// Helper function to delete daily update photo
export const deleteDailyUpdatePhoto = async (photoUrl: string) => {
  try {
    // Extract the file path from the URL
    const urlParts = photoUrl.split("/")
    const bucketIndex = urlParts.findIndex((part) => part === "daily-updates")
    if (bucketIndex === -1) return

    const filePath = urlParts.slice(bucketIndex + 1).join("/")
    const { error } = await supabase.storage.from("daily-updates").remove([filePath])

    if (error) console.error("Error deleting daily update photo:", error)
  } catch (error) {
    console.error("Error parsing photo URL:", error)
  }
}
