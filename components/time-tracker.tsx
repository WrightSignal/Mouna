"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Play, Square, Clock } from "lucide-react"
import { formatTimeInTimezone } from "@/lib/timezone-utils"

export function TimeTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isClocked, setIsClocked] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<any>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userTimezone, setUserTimezone] = useState("America/New_York")

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      checkActiveEntry()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClocked && currentEntry) {
      interval = setInterval(() => {
        const clockInTime = new Date(currentEntry.clock_in).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - clockInTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isClocked, currentEntry])

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

  const checkActiveEntry = async () => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user?.id)
        .is("clock_out", null)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        // If table doesn't exist, just continue without active entry
        if (error.code === "42P01") {
          console.log("Time entries table not found - please run database setup")
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setCurrentEntry(data[0])
        setIsClocked(true)
        const clockInTime = new Date(data[0].clock_in).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - clockInTime) / 1000))
      }
    } catch (error: any) {
      console.error("Error checking active entry:", error)
    }
  }

  const handleClockIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user?.id,
          clock_in: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setCurrentEntry(data)
      setIsClocked(true)
      setElapsedTime(0)

      toast({
        title: "Clocked in",
        description: `Your shift has started at ${formatTimeInTimezone(new Date(), userTimezone)}`,
      })
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

  const handleClockOut = async () => {
    if (!currentEntry) return

    setLoading(true)
    try {
      const clockOutTime = new Date()
      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOutTime.toISOString(),
          updated_at: clockOutTime.toISOString(),
        })
        .eq("id", currentEntry.id)

      if (error) throw error

      const hours = Math.floor(elapsedTime / 3600)
      const minutes = Math.floor((elapsedTime % 3600) / 60)

      setIsClocked(false)
      setCurrentEntry(null)
      setElapsedTime(0)

      toast({
        title: "Clocked out",
        description: `Shift completed at ${formatTimeInTimezone(clockOutTime, userTimezone)} - Duration: ${hours}h ${minutes}m`,
      })
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Time Tracker
        </CardTitle>
        <CardDescription>{isClocked ? "Currently clocked in" : "Ready to start your shift"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isClocked && (
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-purple-600 mb-2">{formatTime(elapsedTime)}</div>
            <p className="text-sm text-gray-600">
              Started at {currentEntry && formatTimeInTimezone(currentEntry.clock_in, userTimezone)}
            </p>
          </div>
        )}

        <div className="flex justify-center">
          {!isClocked ? (
            <Button
              onClick={handleClockIn}
              disabled={loading}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              <Play className="h-5 w-5 mr-2" />
              Clock In
            </Button>
          ) : (
            <Button onClick={handleClockOut} disabled={loading} size="lg" variant="destructive" className="px-8 py-3">
              <Square className="h-5 w-5 mr-2" />
              Clock Out
            </Button>
          )}
        </div>

        {loading && <div className="text-center text-sm text-gray-600">Processing...</div>}

        {/* Current time in user's timezone */}
        <div className="text-center text-sm text-gray-500">
          Current time: {formatTimeInTimezone(new Date(), userTimezone)}
        </div>
      </CardContent>
    </Card>
  )
}
