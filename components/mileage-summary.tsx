"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { MapPin } from "lucide-react"

export function MileageSummary() {
  const { user } = useAuth()
  const [summary, setSummary] = useState({
    thisMonth: { miles: 0, reimbursement: 0 },
    lastMonth: { miles: 0, reimbursement: 0 },
  })

  useEffect(() => {
    if (user) {
      fetchMileageSummary()
    }
  }, [user])

  const fetchMileageSummary = async () => {
    try {
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // This month
      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from("mileage_entries")
        .select("miles, rate_per_mile")
        .eq("user_id", user?.id)
        .gte("date", thisMonthStart.toISOString().split("T")[0])

      if (thisMonthError) {
        if (thisMonthError.code === "42P01") {
          console.log("Mileage entries table not found - please run database setup")
          return
        }
        throw thisMonthError
      }

      // Last month
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from("mileage_entries")
        .select("miles, rate_per_mile")
        .eq("user_id", user?.id)
        .gte("date", lastMonthStart.toISOString().split("T")[0])
        .lte("date", lastMonthEnd.toISOString().split("T")[0])

      if (lastMonthError) {
        if (lastMonthError.code === "42P01") {
          console.log("Mileage entries table not found - please run database setup")
          return
        }
        throw lastMonthError
      }

      const calculateTotals = (data: any[]) => {
        return data.reduce(
          (acc, entry) => ({
            miles: acc.miles + entry.miles,
            reimbursement: acc.reimbursement + entry.miles * entry.rate_per_mile,
          }),
          { miles: 0, reimbursement: 0 },
        )
      }

      setSummary({
        thisMonth: calculateTotals(thisMonthData || []),
        lastMonth: calculateTotals(lastMonthData || []),
      })
    } catch (error: any) {
      console.error("Error fetching mileage summary:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Mileage Summary
        </CardTitle>
        <CardDescription>Your driving overview and reimbursements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">This Month</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.thisMonth.miles.toFixed(1)}</div>
                <div className="text-sm text-blue-600">Miles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${summary.thisMonth.reimbursement.toFixed(2)}</div>
                <div className="text-sm text-green-600">Reimbursement</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Last Month</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{summary.lastMonth.miles.toFixed(1)}</div>
                <div className="text-sm text-purple-600">Miles</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">${summary.lastMonth.reimbursement.toFixed(2)}</div>
                <div className="text-sm text-pink-600">Reimbursement</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
