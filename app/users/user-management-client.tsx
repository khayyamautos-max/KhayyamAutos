"use client"

import { useState } from "react"
import { Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface UserManagementClientProps {
  user: User
  currentUserId: string
}

export function UserManagementClient({ user, currentUserId }: UserManagementClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || "")
  const [role, setRole] = useState(user.role)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          role: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user")
      }

      toast.success("User updated successfully")
      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user")
      }

      toast.success("User deleted successfully")
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsLoading(false)
      setIsDeleting(false)
    }
  }

  const canDelete = user.id !== currentUserId

  return (
    <div className="flex items-center justify-end gap-2">
      {isEditing ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false)
              setFullName(user.full_name || "")
              setRole(user.role)
            }}
            disabled={isLoading}
          >
            <X className="size-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
            <Save className="size-3 mr-1" /> {isLoading ? "Saving..." : "Save"}
          </Button>
        </>
      ) : (
        <>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                <Edit className="size-3 mr-1" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information and role</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canDelete && (
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3 mr-1" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Delete User</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {user.email}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDeleting(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                    {isLoading ? "Deleting..." : "Delete User"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  )
}

