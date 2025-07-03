"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { DailyUpdateForm } from "./daily-update-form"
import { DailyUpdatesFeed } from "./daily-updates-feed"

export function Communicate() {
  const { user } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUpdateAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <DailyUpdateForm userId={user?.id || ""} onUpdateAdded={handleUpdateAdded} />
      <DailyUpdatesFeed refreshTrigger={refreshTrigger} />
    </div>
  )
}
