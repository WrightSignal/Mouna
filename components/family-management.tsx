"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { supabase, getUserFamilies, getFamilyMembers, inviteToFamily, UserRole } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Users, UserPlus, Copy, Mail, Clock, DollarSign } from "lucide-react"

interface FamilyData {
  id: string
  name: string
  description: string | null
  family_code: string
  created_by: string
  created_at: string
  updated_at: string
}

interface FamilyMemberWithProfile {
  id: string
  family_id: string
  user_id: string
  role: string
  hourly_rate: number | null
  is_active: boolean
  joined_at: string
  user_profiles?: {
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
    user_role: string | null
  } | null
}

export function FamilyManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [families, setFamilies] = useState<FamilyData[]>([])
  const [selectedFamily, setSelectedFamily] = useState<FamilyData | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "" as UserRole | "",
    hourly_rate: ""
  })

  useEffect(() => {
    if (user) {
      fetchFamilies()
    }
  }, [user])

  useEffect(() => {
    if (selectedFamily) {
      fetchFamilyMembers()
    }
  }, [selectedFamily])

  const fetchFamilies = async () => {
    try {
      const data = await getUserFamilies()
      const familyData = data.map(fm => fm.families).filter(Boolean) as FamilyData[]
      setFamilies(familyData)
      if (familyData.length > 0 && !selectedFamily) {
        setSelectedFamily(familyData[0])
      }
    } catch (error: any) {
      toast({
        title: "Error loading families",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilyMembers = async () => {
    if (!selectedFamily) return
    
    try {
      const members = await getFamilyMembers(selectedFamily.id)
      setFamilyMembers(members || [])
    } catch (error: any) {
      toast({
        title: "Error loading family members",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleInvite = async () => {
    if (!selectedFamily || !inviteData.email || !inviteData.role) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const hourlyRate = inviteData.role === 'nanny' && inviteData.hourly_rate 
        ? parseFloat(inviteData.hourly_rate) 
        : undefined

      await inviteToFamily(selectedFamily.id, inviteData.email, inviteData.role, hourlyRate)
      
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${inviteData.email}`,
      })

      setInviteDialogOpen(false)
      setInviteData({ email: "", role: "", hourly_rate: "" })
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const copyFamilyCode = () => {
    if (selectedFamily) {
      navigator.clipboard.writeText(selectedFamily.family_code)
      toast({
        title: "Family code copied!",
        description: "Share this code with others to join your family",
      })
    }
  }

  const getDisplayName = (member: any) => {
    const profile = member.user_profiles
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    return "Unknown User"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#440044]"></div>
      </div>
    )
  }

  if (families.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Families Found</CardTitle>
          <CardDescription>
            You haven't joined any families yet. Complete your profile setup to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Family Selection */}
      {families.length > 1 && (
        <div className="space-y-2">
          <Label>Select Family</Label>
          <Select
            value={selectedFamily?.id || ""}
            onValueChange={(value) => {
              const family = families.find(f => f.id === value)
              setSelectedFamily(family || null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a family" />
            </SelectTrigger>
            <SelectContent>
              {families.map((family) => (
                <SelectItem key={family.id} value={family.id}>
                  {family.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedFamily && (
        <>
          {/* Family Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {selectedFamily.name}
                  </CardTitle>
                  <CardDescription>{selectedFamily.description || "No description"}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedFamily.family_code}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={copyFamilyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Family Members</CardTitle>
                  <CardDescription>{familyMembers.length} member(s)</CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Family Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join {selectedFamily.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteData.role} onValueChange={(value) => setInviteData({ ...inviteData, role: value as UserRole })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="nanny">Nanny</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {inviteData.role === 'nanny' && (
                        <div className="space-y-2">
                          <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                          <Input
                            id="hourly_rate"
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            value={inviteData.hourly_rate}
                            onChange={(e) => setInviteData({ ...inviteData, hourly_rate: e.target.value })}
                          />
                        </div>
                      )}

                      <Button onClick={handleInvite} className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.user_profiles?.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-[#44004420] text-[#440044]">
                          {getInitials(getDisplayName(member))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getDisplayName(member)}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'parent' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                          {member.role === 'nanny' && member.hourly_rate && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {member.hourly_rate}/hr
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 