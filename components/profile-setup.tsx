"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { User } from "lucide-react"

interface ProfileSetupProps {
  onProfileCreated: () => void
  existingProfile?: any
}

export function ProfileSetup({ onProfileCreated, existingProfile }: ProfileSetupProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    hourly_rate: "",
    pto_balance_vacation: "0",
    pto_balance_sick: "0",
    pto_balance_personal: "0",
  })

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        first_name: existingProfile.first_name || "",
        last_name: existingProfile.last_name || "",
        hourly_rate: existingProfile.hourly_rate?.toString() || "",
        pto_balance_vacation: existingProfile.pto_balance_vacation?.toString() || "0",
        pto_balance_sick: existingProfile.pto_balance_sick?.toString() || "0",
        pto_balance_personal: existingProfile.pto_balance_personal?.toString() || "0",
      })
    }
  }, [existingProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const profileData = {
        id: user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        hourly_rate: Number.parseFloat(formData.hourly_rate) || null,
        pto_balance_vacation: Number.parseFloat(formData.pto_balance_vacation) || 0,
        pto_balance_sick: Number.parseFloat(formData.pto_balance_sick) || 0,
        pto_balance_personal: Number.parseFloat(formData.pto_balance_personal) || 0,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("user_profiles").upsert(profileData)

      if (error) throw error

      toast({
        title: existingProfile ? "Profile updated" : "Profile created",
        description: existingProfile
          ? "Your profile has been updated successfully."
          : "Welcome! Your profile has been set up.",
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {existingProfile ? "Update Profile" : "Set Up Your Profile"}
          </h1>
          <p className="text-gray-600 mt-2">
            {existingProfile
              ? "Update your profile information"
              : "Let's get your profile set up to start tracking time"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Enter your basic information and hourly rate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">PTO Balances (Days)</Label>
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
                    : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
