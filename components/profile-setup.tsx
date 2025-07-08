"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { supabase, UserRole, createFamily, joinFamily } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { User, Users, Baby } from "lucide-react"
import { ProfilePictureUpload } from "./profile-picture-upload"
import { TimezoneSelector } from "./timezone-selector"
import { getDetectedTimezone } from "@/lib/timezone-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfileSetupProps {
  onProfileCreated: () => void
  existingProfile?: any
}

export function ProfileSetup({ onProfileCreated, existingProfile }: ProfileSetupProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_role: "" as UserRole | "",
    hourly_rate: "",
    pto_balance_vacation: "0",
    pto_balance_sick: "0",
    pto_balance_personal: "0",
    timezone: getDetectedTimezone(),
  })
  const [familyData, setFamilyData] = useState({
    family_name: "",
    family_description: "",
  })
  const [step, setStep] = useState<'role' | 'profile' | 'family'>('role')

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        first_name: existingProfile.first_name || "",
        last_name: existingProfile.last_name || "",
        user_role: (existingProfile.user_role as UserRole) || "",
        hourly_rate: existingProfile.hourly_rate?.toString() || "",
        pto_balance_vacation: existingProfile.pto_balance_vacation?.toString() || "0",
        pto_balance_sick: existingProfile.pto_balance_sick?.toString() || "0",
        pto_balance_personal: existingProfile.pto_balance_personal?.toString() || "0",
        timezone: existingProfile.timezone || getDetectedTimezone(),
      })
      setProfilePictureUrl(existingProfile.profile_picture_url)
      // Skip role selection if editing existing profile
      setStep(existingProfile.user_role ? 'profile' : 'role')
    }
  }, [existingProfile])

  const handleRoleSelection = (role: UserRole) => {
    setFormData({ ...formData, user_role: role })
    setStep('profile')
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If user is a parent and it's a new profile, go to family creation
    if (formData.user_role === 'parent' && !existingProfile) {
      setStep('family')
      return
    }
    
    // Otherwise, save profile and complete
    await saveProfile()
  }

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create the profile
      await saveProfile(false) // Don't show success toast yet
      
      // Then create the family
      const family = await createFamily(familyData.family_name, familyData.family_description)
      
      // Add the parent as a family member
      await joinFamily(family.id, 'parent')

      toast({
        title: "Profile and family created!",
        description: `Welcome! Your family "${familyData.family_name}" has been set up.`,
      })

      onProfileCreated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (showToast = true) => {
    setLoading(true)

    try {
      const profileData = {
        id: user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_role: formData.user_role,
        hourly_rate: Number.parseFloat(formData.hourly_rate) || null,
        pto_balance_vacation: Number.parseFloat(formData.pto_balance_vacation) || 0,
        pto_balance_sick: Number.parseFloat(formData.pto_balance_sick) || 0,
        pto_balance_personal: Number.parseFloat(formData.pto_balance_personal) || 0,
        profile_picture_url: profilePictureUrl,
        timezone: formData.timezone,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("user_profiles").upsert(profileData)

      if (error) throw error

      if (showToast) {
        toast({
          title: existingProfile ? "Profile updated" : "Profile created",
          description: existingProfile
            ? "Your profile has been updated successfully."
            : "Welcome! Your profile has been set up.",
        })

        onProfileCreated()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name} ${formData.last_name}`
    }
    if (formData.first_name) {
      return formData.first_name
    }
    return "User"
  }

  const renderStepContent = () => {
    switch (step) {
      case 'role':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Role</CardTitle>
              <CardDescription>
                Are you a parent looking to hire a nanny, or a nanny looking to work with families?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#440044] hover:bg-[#44004410] cursor-pointer transition-colors"
                  onClick={() => handleRoleSelection('parent')}
                >
                  <div className="text-center">
                                         <Users className="h-12 w-12 text-[#440044] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Parent</h3>
                    <p className="text-sm text-gray-600">
                      I want to hire a nanny and manage family scheduling, communication, and payments.
                    </p>
                  </div>
                </div>
                
                <div
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#440044] hover:bg-[#44004410] cursor-pointer transition-colors"
                  onClick={() => handleRoleSelection('nanny')}
                >
                  <div className="text-center">
                                         <Baby className="h-12 w-12 text-[#440044] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Nanny</h3>
                    <p className="text-sm text-gray-600">
                      I provide childcare services and want to track my time, communicate with families, and manage multiple clients.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Enter your basic information, upload a profile picture, and set your preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <ProfilePictureUpload
                  userId={user?.id || ""}
                  currentImageUrl={profilePictureUrl}
                  userName={getDisplayName()}
                  onImageUpdate={setProfilePictureUrl}
                />
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Show role indicator */}
                <div className="space-y-2">
                  <Label>Role</Label>
                                     <div className="flex items-center space-x-2 p-3 bg-[#44004410] rounded-lg">
                     {formData.user_role === 'parent' ? <Users className="h-5 w-5 text-[#440044]" /> : <Baby className="h-5 w-5 text-[#440044]" />}
                     <span className="font-medium text-[#440044] capitalize">{formData.user_role}</span>
                  </div>
                </div>

                {/* Only show hourly rate for nannies */}
                {formData.user_role === 'nanny' && (
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Default Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      This can be customized for each family you work with.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Timezone Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Time Zone Settings</h3>
                <TimezoneSelector
                  value={formData.timezone}
                  onChange={(timezone) => setFormData({ ...formData, timezone })}
                />
              </div>

              <Separator />

              {/* PTO Balances */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">PTO Balances (Days)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vacation" className="text-sm">
                      Vacation
                    </Label>
                    <Input
                      id="vacation"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.pto_balance_vacation}
                      onChange={(e) => setFormData({ ...formData, pto_balance_vacation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sick" className="text-sm">
                      Sick
                    </Label>
                    <Input
                      id="sick"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.pto_balance_sick}
                      onChange={(e) => setFormData({ ...formData, pto_balance_sick: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personal" className="text-sm">
                      Personal
                    </Label>
                    <Input
                      id="personal"
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={formData.pto_balance_personal}
                      onChange={(e) => setFormData({ ...formData, pto_balance_personal: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? existingProfile
                    ? "Updating..."
                    : "Creating Profile..."
                  : existingProfile
                    ? "Update Profile"
                    : formData.user_role === 'parent' ? "Continue to Family Setup" : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )

      case 'family':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Family</CardTitle>
              <CardDescription>
                Set up your family profile to start inviting nannies and managing childcare.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFamilySubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="family_name">Family Name</Label>
                  <Input
                    id="family_name"
                    type="text"
                    placeholder="The Smith Family"
                    value={familyData.family_name}
                    onChange={(e) => setFamilyData({ ...familyData, family_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_description">Description (Optional)</Label>
                  <Input
                    id="family_description"
                    type="text"
                    placeholder="Brief description of your family..."
                    value={familyData.family_description}
                    onChange={(e) => setFamilyData({ ...familyData, family_description: e.target.value })}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your family will be created with a unique family code</li>
                    <li>• You can invite nannies to join your family</li>
                    <li>• Nannies can track time, log activities, and communicate with you</li>
                    <li>• You'll be able to view all family-related data and reports</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Family..." : "Create Family & Complete Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#440044] p-3 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {existingProfile ? "Update Profile" : 
             step === 'role' ? "Welcome to Mouna" :
             step === 'profile' ? "Set Up Your Profile" :
             "Create Your Family"}
          </h1>
          <p className="text-gray-600 mt-2">
            {existingProfile
              ? "Update your profile information and preferences"
              : step === 'role' ? "Let's get started by setting up your account"
              : step === 'profile' ? "Enter your information and preferences"
              : "Set up your family to start managing childcare"}
          </p>
        </div>

        {renderStepContent()}
      </div>
    </div>
  )
}
