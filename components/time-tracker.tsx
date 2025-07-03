"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Play, Square, Clock } from "lucide-react"
import { formatTimeInTimezone, getCurrentTimeInTimezone, calculateDuration, formatDuration } from "@/lib/timezone-utils"

export function TimeTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isClocked, setIsClocked] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<any>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userTimezone, setUserTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      return "America/New_York"
    }
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      checkActiveEntry()
    }
  }, [user])

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTimeInTimezone(userTimezone))
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [userTimezone])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClocked && currentEntry) {
      interval = setInterval(() => {
        const clockInTime = new Date(currentEntry.clock_in)
        const now = new Date() // Current UTC time
        const duration = calculateDuration(clockInTime, now)
        // Ensure we never show negative time
        setElapsedTime(Math.max(0, duration))
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
        console.log(`Loaded user timezone from profile: ${data.timezone}`)
      } else {
        // Fallback to detected timezone if no timezone in profile
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        setUserTimezone(detectedTimezone)
        console.log(`Using detected timezone (no profile timezone): ${detectedTimezone}`)
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error)
      // Fallback to detected timezone on error
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(detectedTimezone)
      console.log(`Using detected timezone (error fetching profile): ${detectedTimezone}`)
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
        const clockInTime = new Date(data[0].clock_in)
        const now = new Date() // Current UTC time
        const duration = calculateDuration(clockInTime, now)
        // Ensure we never show negative time
        setElapsedTime(Math.max(0, duration))
      }
    } catch (error: any) {
      console.error("Error checking active entry:", error)
    }
  }

  const handleClockIn = async () => {
    setLoading(true)
    try {
      // Get current UTC time for database storage
      const currentTime = new Date()

      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user?.id,
          clock_in: currentTime.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setCurrentEntry(data)
      setIsClocked(true)
      setElapsedTime(0)

      // Debug logging
      console.log(`Clock in time (UTC): ${currentTime.toISOString()}`)
      console.log(`User timezone: ${userTimezone}`)
      
      const localTime = formatTimeInTimezone(currentTime, userTimezone)
      console.log(`Formatted local time: ${localTime}`)

      toast({
        title: "Clocked in",
        description: `Your shift has started at ${localTime}`,
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
      // Get current UTC time for database storage
      const clockOutTime = new Date()

      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOutTime.toISOString(),
          updated_at: clockOutTime.toISOString(),
        })
        .eq("id", currentEntry.id)

      if (error) throw error

      // Calculate final duration using UTC times
      const clockInTime = new Date(currentEntry.clock_in)
      const totalDuration = calculateDuration(clockInTime, clockOutTime)
      const durationText = formatDuration(totalDuration)

      setIsClocked(false)
      setCurrentEntry(null)
      setElapsedTime(0)

      toast({
        title: "Clocked out",
        description: `Shift completed at ${formatTimeInTimezone(clockOutTime, userTimezone)} - Duration: ${durationText}`,
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
        {/* Current time display */}
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <div className="text-lg font-semibold text-gray-700">Current Time</div>
          <div className="text-2xl font-mono font-bold text-purple-600">
            {formatTimeInTimezone(currentTime, userTimezone)}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString("en-US", {
              timeZone: userTimezone,
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {isClocked && (
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-purple-600 mb-2">{formatTime(elapsedTime)}</div>
            <p className="text-sm text-gray-600">
              Started at {currentEntry && formatTimeInTimezone(new Date(currentEntry.clock_in), userTimezone)}
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
      </CardContent>
    </Card>
  )
}
