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

// Format time in user's timezone
export const formatTimeInTimezone = (date: Date | string, timezone: string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date

  try {
    return dateObj.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  } catch (error) {
    return dateObj.toLocaleTimeString()
  }
}

// Format date in user's timezone
export const formatDateInTimezone = (date: Date | string, timezone: string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date

  try {
    return dateObj.toLocaleDateString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return dateObj.toLocaleDateString()
  }
}

// Get current time in user's timezone
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  try {
    // Create a date in the user's timezone
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000

    // Get timezone offset
    const tempDate = new Date()
    const targetTime = new Date(tempDate.toLocaleString("en-US", { timeZone: timezone }))
    const localTime = new Date(tempDate.toLocaleString("en-US"))
    const offset = targetTime.getTime() - localTime.getTime()

    return new Date(utc + offset)
  } catch (error) {
    return new Date()
  }
}

// Convert UTC time to user's timezone
export const convertToUserTimezone = (utcDate: Date | string, timezone: string): Date => {
  const dateObj = typeof utcDate === "string" ? new Date(utcDate) : utcDate

  try {
    return new Date(dateObj.toLocaleString("en-US", { timeZone: timezone }))
  } catch (error) {
    return dateObj
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
