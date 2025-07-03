"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { TrendingUp } from "lucide-react"
import { getCurrentTimeInTimezone, convertUTCToTimezone, calculateDuration } from "@/lib/timezone-utils"

export function TimeSummary() {
  const { user } = useAuth()
  const [userTimezone, setUserTimezone] = useState("America/New_York")
  const [summary, setSummary] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    overtime: 0,
  })

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    if (user && userTimezone) {
      fetchTimeSummary()
    }
  }, [user, userTimezone])

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

  const fetchTimeSummary = async () => {
    try {
      // Get current time in user's timezone
      const now = getCurrentTimeInTimezone(userTimezone)

      // Calculate date boundaries in user's timezone
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Fetch completed time entries
      const { data, error } = await supabase
        .from("time_entries")
        .select("clock_in, clock_out, break_duration")
        .eq("user_id", user?.id)
        .not("clock_out", "is", null)
        .gte("clock_in", monthStart.toISOString())

      if (error) {
        // If table doesn't exist, just show zeros
        if (error.code === "42P01") {
          console.log("Time entries table not found - please run database setup")
          return
        }
        throw error
      }

      let todayHours = 0
      let weekHours = 0
      let monthHours = 0

      data?.forEach((entry) => {
        // Convert UTC times to user's timezone for comparison
        const clockInLocal = convertUTCToTimezone(entry.clock_in, userTimezone)
        const clockOutLocal = convertUTCToTimezone(entry.clock_out, userTimezone)

        // Calculate duration in hours
        const durationSeconds = calculateDuration(entry.clock_in, entry.clock_out)
        const breakHours = (entry.break_duration || 0) / 60 // convert minutes to hours
        const workHours = durationSeconds / 3600 - breakHours // convert seconds to hours

        // Check if the entry falls within our date ranges (using local timezone dates)
        const entryDate = new Date(clockInLocal.getFullYear(), clockInLocal.getMonth(), clockInLocal.getDate())

        if (entryDate.getTime() === today.getTime()) {
          todayHours += workHours
        }
        if (entryDate >= weekStart) {
          weekHours += workHours
        }
        monthHours += workHours
      })

      const overtime = Math.max(0, weekHours - 40)

      setSummary({
        today: todayHours,
        thisWeek: weekHours,
        thisMonth: monthHours,
        overtime,
      })
    } catch (error: any) {
      console.error("Error fetching time summary:", error)
    }
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Time Summary
        </CardTitle>
        <CardDescription>Your time tracking overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatHours(summary.today)}</div>
            <div className="text-sm text-blue-600">Today</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatHours(summary.thisWeek)}</div>
            <div className="text-sm text-green-600">This Week</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatHours(summary.thisMonth)}</div>
            <div className="text-sm text-purple-600">This Month</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatHours(summary.overtime)}</div>
            <div className="text-sm text-orange-600">Overtime</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
