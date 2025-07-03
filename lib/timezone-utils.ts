// Common timezone options for the US and other regions
export const TIMEZONE_OPTIONS = [
  // US Timezones
  { value: "America/New_York", label: "Eastern Time (ET)", region: "US" },
  { value: "America/Chicago", label: "Central Time (CT)", region: "US" },
  { value: "America/Denver", label: "Mountain Time (MT)", region: "US" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", region: "US" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", region: "US" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", region: "US" },

  // Other Common Timezones
  { value: "Europe/London", label: "London (GMT/BST)", region: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)", region: "Europe" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", region: "Asia" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", region: "Australia" },
  { value: "America/Toronto", label: "Toronto (ET)", region: "Canada" },
  { value: "America/Vancouver", label: "Vancouver (PT)", region: "Canada" },
]

// Get user's detected timezone
export const getDetectedTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    return "America/New_York" // fallback
  }
}

// Get current time - always returns UTC time for consistent database storage
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  // Always return current UTC time for database storage
  // The timezone parameter is kept for API consistency but not used
  // All times are stored in UTC and converted for display only
  return new Date()
}

// Convert a UTC date to display in user's timezone (for display purposes only)
export const convertUTCToTimezone = (utcDate: Date | string, timezone: string): string => {
  try {
    const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate

    return date.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch (error) {
    console.error("Error converting UTC to timezone:", error)
    return (typeof utcDate === "string" ? new Date(utcDate) : utcDate).toLocaleString()
  }
}

// Convert timezone date to UTC for storage (not needed anymore but kept for compatibility)
export const convertTimezoneToUTC = (localDate: Date, timezone: string): Date => {
  // Just return the date as-is since we're always working with UTC
  return localDate
}

// Format time in user's timezone
export const formatTimeInTimezone = (date: Date | string, timezone: string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    
    return dateObj.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit", 
      second: "2-digit",
      hour12: true,
    })
  }
}

// Format date in user's timezone
export const formatDateInTimezone = (date: Date | string, timezone: string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    return dateObj.toLocaleDateString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString()
  }
}

// Format date and time in user's timezone
export const formatDateTimeInTimezone = (date: Date | string, timezone: string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    return dateObj.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleString()
  }
}

// Get timezone display info
export const getTimezoneInfo = (timezone: string) => {
  const option = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone)
  if (option) return option

  // If not in our list, try to create a display name
  try {
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    })
    const timezoneName = timeString.split(" ").pop() || timezone

    return {
      value: timezone,
      label: `${timezone.replace("_", " ")} (${timezoneName})`,
      region: "Other",
    }
  } catch (error) {
    return {
      value: timezone,
      label: timezone,
      region: "Other",
    }
  }
}

// Calculate duration between two dates in seconds
export const calculateDuration = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate
  const end = typeof endDate === "string" ? new Date(endDate) : endDate

  const durationMs = end.getTime() - start.getTime()
  return Math.floor(durationMs / 1000)
}

// Format duration in hours and minutes
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
