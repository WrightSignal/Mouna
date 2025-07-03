"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Plus } from "lucide-react"

export function MileageTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    miles: "",
    start_location: "",
    end_location: "",
    purpose: "",
  })

  useEffect(() => {
    if (user) {
      fetchMileageEntries()
    }
  }, [user])

  const fetchMileageEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("mileage_entries")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false })
        .limit(10)

      if (error) throw error
      setEntries(data || [])
    } catch (error: any) {
      console.error("Error fetching mileage entries:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("mileage_entries").insert({
        user_id: user?.id,
        date: formData.date,
        miles: Number.parseFloat(formData.miles),
        start_location: formData.start_location,
        end_location: formData.end_location,
        purpose: formData.purpose,
        rate_per_mile: 0.67, // IRS standard rate
      })

      if (error) throw error

      toast({
        title: "Mileage logged",
        description: `${formData.miles} miles added successfully.`,
      })

      setFormData({
        date: new Date().toISOString().split("T")[0],
        miles: "",
        start_location: "",
        end_location: "",
        purpose: "",
      })

      fetchMileageEntries()
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

  const calculateReimbursement = (miles: number, rate = 0.67) => {
    return (miles * rate).toFixed(2)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Log Mileage
          </CardTitle>
          <CardDescription>Track your driving for reimbursement</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="miles">Miles</Label>
                <Input
                  id="miles"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.miles}
                  onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_location">Start Location</Label>
                <Input
                  id="start_location"
                  type="text"
                  placeholder="Starting address"
                  value={formData.start_location}
                  onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_location">End Location</Label>
                <Input
                  id="end_location"
                  type="text"
                  placeholder="Destination address"
                  value={formData.end_location}
                  onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="Trip purpose (e.g., grocery shopping, doctor visit)"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={2}
              />
            </div>

            {formData.miles && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Estimated Reimbursement:</span>
                  <span className="font-bold text-green-700">
                    ${calculateReimbursement(Number.parseFloat(formData.miles))}
                  </span>
                </div>
                <div className="text-xs text-green-600 mt-1">Based on IRS standard rate of $0.67/mile</div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Logging..." : "Log Mileage"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Mileage Entries</CardTitle>
          <CardDescription>Your latest mileage logs</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Miles</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Reimbursement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.miles}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.purpose || "No description"}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${calculateReimbursement(entry.miles, entry.rate_per_mile)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No mileage entries yet. Start by logging your first trip!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
