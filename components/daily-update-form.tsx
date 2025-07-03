"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, Send, X } from "lucide-react"
import { uploadDailyUpdatePhoto, supabase } from "@/lib/supabase"

interface DailyUpdateFormProps {
  userId: string
  onUpdateAdded: () => void
}

const UPDATE_TYPES = [
  { value: "general", label: "General Update", emoji: "📝" },
  { value: "meal", label: "Meal Time", emoji: "🍽️" },
  { value: "nap", label: "Nap Time", emoji: "😴" },
  { value: "activity", label: "Activity", emoji: "🎨" },
  { value: "milestone", label: "Milestone", emoji: "🌟" },
  { value: "concern", label: "Concern", emoji: "⚠️" },
]

export function DailyUpdateForm({ userId, onUpdateAdded }: DailyUpdateFormProps) {
  const [message, setMessage] = useState("")
  const [updateType, setUpdateType] = useState("general")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, WebP)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() && !selectedImage) {
      toast({
        title: "Empty update",
        description: "Please add a message or photo to share an update.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let photoUrl = null

      // Upload photo if selected
      if (selectedImage) {
        photoUrl = await uploadDailyUpdatePhoto(userId, selectedImage)
      }

      // Save update to database
      const { error } = await supabase.from("daily_updates").insert({
        user_id: userId,
        message: message.trim() || null,
        photo_url: photoUrl,
        update_type: updateType,
        date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error

      // Reset form
      setMessage("")
      setUpdateType("general")
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      toast({
        title: "Update shared",
        description: "Your daily update has been added successfully.",
      })

      onUpdateAdded()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to share update",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUpdateType = UPDATE_TYPES.find((type) => type.value === updateType)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Send className="h-5 w-5 mr-2" />
          Share Daily Update
        </CardTitle>
        <CardDescription>Keep the family updated on how the day is going</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-type">Update Type</Label>
            <Select value={updateType} onValueChange={setUpdateType}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center">
                    <span className="mr-2">{selectedUpdateType?.emoji}</span>
                    {selectedUpdateType?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {UPDATE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <span className="mr-2">{type.emoji}</span>
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Share what's happening today..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full max-w-sm h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-dashed"
              >
                <div className="flex flex-col items-center">
                  <Camera className="h-6 w-6 mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600">Add Photo</span>
                </div>
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Share Update
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
