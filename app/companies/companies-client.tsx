"use client"

import { useState } from "react"
import { Plus, Edit, Eye } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Company {
  id: string
  name: string
  description?: string
  contact_info?: {
    phone?: string
    email?: string
  }
}

export function CompaniesClient({ 
  companies
}: { 
  companies: Company[]
}) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Company name is required")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("companies").insert({
        name: formData.name,
        description: formData.description || null,
        contact_info: {
          phone: formData.phone || null,
          email: formData.email || null,
        },
      })

      if (error) throw error

      toast.success("Company added successfully")
      setIsAddOpen(false)
      setFormData({ name: "", description: "", phone: "", email: "" })
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add company")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCompany || !formData.name) {
      toast.error("Company name is required")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          description: formData.description || null,
          contact_info: {
            phone: formData.phone || null,
            email: formData.email || null,
          },
        })
        .eq("id", selectedCompany.id)

      if (error) throw error

      toast.success("Company updated successfully")
      setIsEditOpen(false)
      setSelectedCompany(null)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update company")
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      description: company.description || "",
      phone: company.contact_info?.phone || "",
      email: company.contact_info?.email || "",
    })
    setIsEditOpen(true)
  }

  const openView = (company: Company) => {
    setSelectedCompany(company)
    setIsViewOpen(true)
  }

  return (
    <>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40">
            <Plus className="mr-2 size-4" /> Register New Vendor
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>Register a new vendor/company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Company description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedCompany?.name}</DialogTitle>
            <DialogDescription>Company Details</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedCompany.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm mt-1">{selectedCompany.contact_info?.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm mt-1">{selectedCompany.contact_info?.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewOpen(false)
                  openEdit(selectedCompany)
                }}>
                  <Edit className="mr-2 size-4" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export functions for use in parent */}
      {(() => {
        (window as any).__openEditCompany = openEdit
        ;(window as any).__openViewCompany = openView
        return null
      })()}
    </>
  )
}

