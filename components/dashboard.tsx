"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Clock, LogOut, DollarSign, Calendar } from "lucide-react"
import { TimeTracker } from "./time-tracker"
import { MileageTracker } from "./mileage-tracker"
import { ProfileSetup } from "./profile-setup"
import { TimeSummary } from "./time-summary"
import { MileageSummary } from "./mileage-summary"

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user?.id).single()

      if (error) {
        // If table doesn't exist or no profile found, show profile setup
        if (error.code === "PGRST116" || error.code === "42P01") {
          setProfile(null)
        } else {
          console.error("Error fetching profile:", error)
          toast({
            title: "Database Error",
            description: "Please make sure the database tables are set up correctly.",
            variant: "destructive",
          })
        }
      } else {
        setProfile(data)
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    })
  }

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    return "User"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profile) {
    return <ProfileSetup onProfileCreated={fetchProfile} />
  }

  const displayName = getDisplayName()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Nanny Time Tracker</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.profile_picture_url || undefined} alt={displayName} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">Welcome, {profile.first_name || "User"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("time")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "time"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Time Tracking
            </button>
            <button
              onClick={() => setActiveTab("mileage")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mileage"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Mileage
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${profile.hourly_rate || "0.00"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vacation Days</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.pto_balance_vacation || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sick Days</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.pto_balance_sick || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personal Days</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.pto_balance_personal || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeTracker />
              <TimeSummary />
            </div>

            <MileageSummary />
          </div>
        )}

        {activeTab === "time" && <TimeTracker />}
        {activeTab === "mileage" && <MileageTracker />}
        {activeTab === "profile" && <ProfileSetup onProfileCreated={fetchProfile} existingProfile={profile} />}
      </main>
    </div>
  )
}
