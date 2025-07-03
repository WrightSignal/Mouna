"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"
import { DatabaseSetupNotice } from "@/components/database-setup-notice"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const { user, loading } = useAuth()
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null)
  const [checkingDatabase, setCheckingDatabase] = useState(false)

  useEffect(() => {
    if (user) {
      checkDatabaseSetup()
    }
  }, [user])

  const checkDatabaseSetup = async () => {
    setCheckingDatabase(true)
    try {
      // Try to query the user_profiles table to see if it exists
      const { error } = await supabase.from("user_profiles").select("id").limit(1)

      if (error && error.code === "42P01") {
        // Table doesn't exist
        setDatabaseReady(false)
      } else {
        // Table exists or other error (which means table exists)
        setDatabaseReady(true)
      }
    } catch (error) {
      // Assume database is not ready
      setDatabaseReady(false)
    } finally {
      setCheckingDatabase(false)
    }
  }

  const handleRefresh = () => {
    setDatabaseReady(null)
    checkDatabaseSetup()
  }

  if (loading || checkingDatabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (databaseReady === false) {
    return <DatabaseSetupNotice onRefresh={handleRefresh} />
  }

  if (databaseReady === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <Dashboard />
}
