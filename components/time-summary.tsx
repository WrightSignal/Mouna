"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { TrendingUp } from "lucide-react"
import { calculateDuration } from "@/lib/timezone-utils"

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
      // Get current time
      const now = new Date()

      // Calculate date boundaries in UTC for database queries
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
        // Use UTC times for duration calculation (database stores UTC)
        const clockInUTC = new Date(entry.clock_in)
        const clockOutUTC = new Date(entry.clock_out)

        // Calculate duration in hours using UTC times
        const durationSeconds = calculateDuration(clockInUTC, clockOutUTC)
        const breakHours = (entry.break_duration || 0) / 60 // convert minutes to hours
        const workHours = durationSeconds / 3600 - breakHours // convert seconds to hours

        // Get the date in user's timezone for date comparison
        const entryDateInTimezone = new Date(clockInUTC.toLocaleString("en-US", { timeZone: userTimezone }))
        const todayInTimezone = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }))
        const weekStartInTimezone = new Date(todayInTimezone)
        weekStartInTimezone.setDate(todayInTimezone.getDate() - todayInTimezone.getDay())

        const entryDate = new Date(
          entryDateInTimezone.getFullYear(),
          entryDateInTimezone.getMonth(),
          entryDateInTimezone.getDate(),
        )
        const todayDate = new Date(todayInTimezone.getFullYear(), todayInTimezone.getMonth(), todayInTimezone.getDate())
        const weekStartDate = new Date(
          weekStartInTimezone.getFullYear(),
          weekStartInTimezone.getMonth(),
          weekStartInTimezone.getDate(),
        )

        if (entryDate.getTime() === todayDate.getTime()) {
          todayHours += workHours
        }
        if (entryDate >= weekStartDate) {
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
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    
    return `${wholeHours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`
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

                      <div className="text-center p-4 bg-[#44004410] rounded-lg">
                          <div className="text-2xl font-bold text-[#440044]">{formatHours(summary.thisMonth)}</div>
              <div className="text-sm text-[#440044]">This Month</div>
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
