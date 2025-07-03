"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X } from "lucide-react"
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/supabase"

interface ProfilePictureUploadProps {
  userId: string
  currentImageUrl?: string | null
  userName?: string
  onImageUpdate: (imageUrl: string | null) => void
}

export function ProfilePictureUpload({
  userId,
  currentImageUrl,
  userName = "User",
  onImageUpdate,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const publicUrl = await uploadProfilePicture(userId, file)
      setImageUrl(publicUrl)
      onImageUpdate(publicUrl)

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been uploaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async () => {
    setUploading(true)

    try {
      await deleteProfilePicture(userId)
      setImageUrl(null)
      onImageUpdate(null)

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      })
    } catch (error: any) {
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={imageUrl || undefined} alt={userName} />
          <AvatarFallback className="text-lg bg-purple-100 text-purple-600">{getInitials(userName)}</AvatarFallback>
        </Avatar>

        {imageUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
              Uploading...
            </>
          ) : (
            <>
              {imageUrl ? <Camera className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {imageUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <p className="text-xs text-gray-500 text-center">JPG, PNG or WebP. Max size 5MB.</p>
    </div>
  )
}
