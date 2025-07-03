"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { supabase, deleteDailyUpdatePhoto } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Trash2, Calendar, Clock } from "lucide-react"
import { formatDateTimeInTimezone } from "@/lib/timezone-utils"

interface DailyUpdate {
  id: string
  message: string | null
  photo_url: string | null
  update_type: string
  created_at: string
  date: string
}

interface DailyUpdatesFeedProps {
  refreshTrigger: number
}

const UPDATE_TYPE_CONFIG = {
  general: { label: "General Update", emoji: "📝", color: "bg-gray-100 text-gray-800" },
  meal: { label: "Meal Time", emoji: "🍽️", color: "bg-orange-100 text-orange-800" },
  nap: { label: "Nap Time", emoji: "😴", color: "bg-blue-100 text-blue-800" },
  activity: { label: "Activity", emoji: "🎨", color: "bg-green-100 text-green-800" },
  milestone: { label: "Milestone", emoji: "🌟", color: "bg-yellow-100 text-yellow-800" },
  concern: { label: "Concern", emoji: "⚠️", color: "bg-red-100 text-red-800" },
}

export function DailyUpdatesFeed({ refreshTrigger }: DailyUpdatesFeedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [userTimezone, setUserTimezone] = useState("America/New_York")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUpdates()
    }
  }, [user, refreshTrigger, selectedDate])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("timezone").eq("id", user?.id).single()

      if (error) throw error
      if (data?.timezone) {
        setUserTimezone(data.timezone)
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchUpdates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("daily_updates")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", selectedDate)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.log("Daily updates table not found - please run database setup")
          setUpdates([])
          return
        }
        throw error
      }

      setUpdates(data || [])
    } catch (error: any) {
      console.error("Error fetching updates:", error)
      toast({
        title: "Error",
        description: "Failed to load daily updates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUpdate = async (updateId: string, photoUrl: string | null) => {
    try {
      // Delete photo from storage if exists
      if (photoUrl) {
        await deleteDailyUpdatePhoto(photoUrl)
      }

      // Delete update from database
      const { error } = await supabase.from("daily_updates").delete().eq("id", updateId)

      if (error) throw error

      // Remove from local state
      setUpdates(updates.filter((update) => update.id !== updateId))

      toast({
        title: "Update deleted",
        description: "The daily update has been removed.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete update",
        variant: "destructive",
      })
    }
  }

  const getUpdateTypeConfig = (type: string) => {
    return UPDATE_TYPE_CONFIG[type as keyof typeof UPDATE_TYPE_CONFIG] || UPDATE_TYPE_CONFIG.general
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Daily Updates
          </CardTitle>
          <CardDescription>Your updates for the selected date</CardDescription>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {updates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No updates for this date yet.</p>
            <p className="text-sm text-gray-500 mt-1">Share your first update above!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const typeConfig = getUpdateTypeConfig(update.update_type)
            return (
              <Card key={update.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={typeConfig.color}>
                        <span className="mr-1">{typeConfig.emoji}</span>
                        {typeConfig.label}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateTimeInTimezone(update.created_at, userTimezone)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUpdate(update.id, update.photo_url)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {update.photo_url && (
                    <div className="mb-3">
                      <img
                        src={update.photo_url || "/placeholder.svg"}
                        alt="Daily update"
                        className="w-full max-w-md h-64 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {update.message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">{update.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
