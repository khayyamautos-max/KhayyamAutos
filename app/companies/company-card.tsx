"use client"

import { Building2, Phone, Mail, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  description?: string
  contact_info?: {
    phone?: string
    email?: string
  }
}

export function CompanyCard({ company }: { company: Company }) {
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name,
    description: company.description || "",
    phone: company.contact_info?.phone || "",
    email: company.contact_info?.email || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleEdit = async () => {
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
        .eq("id", company.id)

      if (error) throw error

      toast.success("Company updated successfully")
      setIsEditOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update company")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="glass border-white/5 hover:border-primary/30 transition-all duration-300 group">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{company.name}</CardTitle>
              <CardDescription className="text-[10px] font-mono uppercase tracking-tighter text-muted-foreground/50">
                ID: {company.id.split("-")[0]}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {company.description || "No transmission log for this entity."}
          </p>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3 text-primary/60" />
              <span>{company.contact_info?.phone || "+X XXX-XXX-XXXX"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3 text-primary/60" />
              <span>{company.contact_info?.email || "neural-link@vendor.sys"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
              onClick={() => setIsViewOpen(true)}
            >
              <Eye className="size-3 mr-1" /> VIEW
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="size-3 mr-1" /> EDIT
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>{company.name}</DialogTitle>
            <DialogDescription>Full Company Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{company.description || "No description available"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="text-sm">{company.contact_info?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm">{company.contact_info?.email || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Company ID</p>
              <p className="text-sm font-mono">{company.id}</p>
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
              <label className="text-sm">Company Name *</label>
              <input
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded min-h-20"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Phone</label>
                <input
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded"
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
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

