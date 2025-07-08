"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Database, ExternalLink, RefreshCw } from "lucide-react"

interface DatabaseSetupNoticeProps {
  onRefresh: () => void
}

export function DatabaseSetupNotice({ onRefresh }: DatabaseSetupNoticeProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Database className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Database Setup Required</CardTitle>
            <CardDescription>The database tables need to be created before you can use the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                Please run the database setup script to create the necessary tables for Mouna.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure your Supabase project is configured with the correct environment variables</li>
                <li>
                  Run the SQL script located in{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">scripts/01-create-tables.sql</code>
                </li>
                <li>The script will create all necessary tables and security policies</li>
                <li>Click "Check Database" below once the setup is complete</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What gets created:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• User profiles table for storing user information</li>
                <li>• Time entries table for clock-in/clock-out records</li>
                <li>• Mileage entries table for trip logging</li>
                <li>• Scheduled shifts table (for future features)</li>
                <li>• PTO requests table (for future features)</li>
                <li>• Row Level Security policies for data protection</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={onRefresh} className="bg-[#440044] hover:bg-[#330033]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Database
              </Button>
              <Button variant="outline" onClick={() => window.open("https://supabase.com/docs", "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Supabase Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
