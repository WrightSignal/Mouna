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
          user_role: string | null
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
          user_role?: string | null
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
          user_role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          description: string | null
          family_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          family_code?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          family_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: string
          hourly_rate: number | null
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role: string
          hourly_rate?: number | null
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          role?: string
          hourly_rate?: number | null
          is_active?: boolean
          joined_at?: string
        }
      }
      family_invitations: {
        Row: {
          id: string
          family_id: string
          invited_by: string
          invited_email: string
          role: string
          hourly_rate: number | null
          invitation_code: string
          status: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          invited_by: string
          invited_email: string
          role: string
          hourly_rate?: number | null
          invitation_code?: string
          status?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          invited_by?: string
          invited_email?: string
          role?: string
          hourly_rate?: number | null
          invitation_code?: string
          status?: string
          expires_at?: string
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

// Family-related types
export type UserRole = 'parent' | 'nanny'

export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyInvitation = Database['public']['Tables']['family_invitations']['Row']

export type FamilyWithMembers = Family & {
  family_members: (FamilyMember & {
    user_profiles: {
      first_name: string | null
      last_name: string | null
      profile_picture_url: string | null
    }
  })[]
}

// Helper function to create a family
export const createFamily = async (name: string, description?: string) => {
  const { data, error } = await supabase
    .from("families")
    .insert({
      name,
      description,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to join family as member
export const joinFamily = async (familyId: string, role: UserRole, hourlyRate?: number) => {
  const { data, error } = await supabase
    .from("family_members")
    .insert({
      family_id: familyId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      role,
      hourly_rate: hourlyRate
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to get user's families
export const getUserFamilies = async () => {
  const { data, error } = await supabase
    .from("family_members")
    .select(`
      *,
      families (
        id,
        name,
        description,
        family_code,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq("is_active", true)

  if (error) throw error
  return data
}

// Helper function to get family members
export const getFamilyMembers = async (familyId: string) => {
  const { data, error } = await supabase
    .from("family_members")
    .select(`
      *,
      user_profiles (
        first_name,
        last_name,
        profile_picture_url,
        user_role
      )
    `)
    .eq("family_id", familyId)
    .eq("is_active", true)

  if (error) throw error
  return data
}

// Helper function to invite user to family
export const inviteToFamily = async (
  familyId: string, 
  email: string, 
  role: UserRole, 
  hourlyRate?: number
) => {
  const { data, error } = await supabase
    .from("family_invitations")
    .insert({
      family_id: familyId,
      invited_by: (await supabase.auth.getUser()).data.user?.id,
      invited_email: email,
      role,
      hourly_rate: hourlyRate
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to accept family invitation
export const acceptFamilyInvitation = async (invitationCode: string) => {
  // First, get the invitation details
  const { data: invitation, error: inviteError } = await supabase
    .from("family_invitations")
    .select("*")
    .eq("invitation_code", invitationCode)
    .eq("status", "pending")
    .single()

  if (inviteError) throw inviteError
  
  // Check if invitation is still valid
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error("Invitation has expired")
  }

  // Add user to family
  const { data: member, error: memberError } = await supabase
    .from("family_members")
    .insert({
      family_id: invitation.family_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      role: invitation.role,
      hourly_rate: invitation.hourly_rate
    })
    .select()
    .single()

  if (memberError) throw memberError

  // Update invitation status
  const { error: updateError } = await supabase
    .from("family_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id)

  if (updateError) throw updateError

  return member
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
