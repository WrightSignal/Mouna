"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import {
  TIMEZONE_OPTIONS,
  getDetectedTimezone,
  formatTimeInTimezone,
  getTimezoneInfo,
  getCurrentTimeInTimezone,
} from "@/lib/timezone-utils"

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  className?: string
}

export function TimezoneSelector({ value, onChange, className }: TimezoneSelectorProps) {
  const [showAllTimezones, setShowAllTimezones] = useState(false)
  const detectedTimezone = getDetectedTimezone()

  // Group timezones by region
  const timezonesByRegion = TIMEZONE_OPTIONS.reduce(
    (acc, tz) => {
      if (!acc[tz.region]) acc[tz.region] = []
      acc[tz.region].push(tz)
      return acc
    },
    {} as Record<string, typeof TIMEZONE_OPTIONS>,
  )

  // Show US timezones by default, all if requested
  const displayTimezones = showAllTimezones ? TIMEZONE_OPTIONS : TIMEZONE_OPTIONS.filter((tz) => tz.region === "US")

  const selectedTimezoneInfo = getTimezoneInfo(value)
  const detectedTimezoneInfo = getTimezoneInfo(detectedTimezone)

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select your timezone">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedTimezoneInfo.label}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Object.entries(timezonesByRegion).map(([region, timezones]) => {
                if (!showAllTimezones && region !== "US") return null

                return (
                  <div key={region}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 bg-gray-50">{region}</div>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{timezone.label}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTimeInTimezone(getCurrentTimeInTimezone(timezone.value), timezone.value)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                )
              })}

              {!showAllTimezones && (
                <div className="px-2 py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowAllTimezones(true)}
                  >
                    Show all timezones
                  </Button>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Current time preview */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Current time in your timezone:</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatTimeInTimezone(getCurrentTimeInTimezone(value), value)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Detected timezone suggestion */}
        {detectedTimezone !== value && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Detected timezone: {detectedTimezoneInfo.label}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Current time: {formatTimeInTimezone(getCurrentTimeInTimezone(detectedTimezone), detectedTimezone)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100 bg-transparent"
                    onClick={() => onChange(detectedTimezone)}
                  >
                    Use detected timezone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timezone info */}
        <div className="text-xs text-gray-500">
          <p>Your timezone affects how times are displayed and recorded throughout the app.</p>
        </div>
      </div>
    </div>
  )
}
