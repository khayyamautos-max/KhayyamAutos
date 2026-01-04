"use client"

import { useState } from "react"
import { Plus, Download, Upload, FileSpreadsheet, X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Company {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  part_number: string
  name: string
  description?: string
  company_id?: string
  category?: string
  cost_price: number
  selling_price: number
  quantity_in_stock: number
  min_stock_level: number
}

export function InventoryClient({ companies }: { companies: Company[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [formData, setFormData] = useState({
    part_number: "",
    name: "",
    description: "",
    company_id: "none",
    category: "",
    cost_price: "",
    selling_price: "",
    quantity_in_stock: "",
    min_stock_level: "5",
  })
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleAddPart = async () => {
    if (!formData.part_number || !formData.name || !formData.cost_price || !formData.selling_price) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("inventory").insert({
        part_number: formData.part_number,
        name: formData.name,
        description: formData.description || null,
        company_id: formData.company_id && formData.company_id !== "none" ? formData.company_id : null,
        category: formData.category || null,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity_in_stock: parseInt(formData.quantity_in_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 5,
      })

      if (error) throw error

      toast.success("Part added successfully")
      setIsAddOpen(false)
      setFormData({
        part_number: "",
        name: "",
        description: "",
        company_id: "none",
        category: "",
        cost_price: "",
        selling_price: "",
        quantity_in_stock: "",
        min_stock_level: "5",
      })
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add part")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx")
      const { data, error } = await supabase
        .from("inventory")
        .select("*, companies(name)")
        .order("name", { ascending: true })

      if (error) throw error

      const exportData = data.map((item: any) => ({
        "Part Number": item.part_number,
        "Name": item.name,
        "Description": item.description || "",
        "Company": item.companies?.name || "",
        "Category": item.category || "",
        "Cost Price": item.cost_price,
        "Selling Price": item.selling_price,
        "Quantity in Stock": item.quantity_in_stock,
        "Min Stock Level": item.min_stock_level,
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Inventory")
      XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().split("T")[0]}.xlsx`)

      toast.success("Inventory exported successfully")
    } catch (error) {
      toast.error("Failed to export inventory")
    }
  }

  const handleImport = async (file: File) => {
    try {
      const XLSX = await import("xlsx")
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      if (!jsonData.length) {
        toast.error("Excel file is empty")
        return
      }

      setIsLoading(true)
      const items = jsonData.map((row: any) => ({
        part_number: row["Part Number"] || row["part_number"],
        name: row["Name"] || row["name"],
        description: row["Description"] || row["description"] || null,
        category: row["Category"] || row["category"] || null,
        cost_price: parseFloat(row["Cost Price"] || row["cost_price"] || 0),
        selling_price: parseFloat(row["Selling Price"] || row["selling_price"] || 0),
        quantity_in_stock: parseInt(row["Quantity in Stock"] || row["quantity_in_stock"] || 0),
        min_stock_level: parseInt(row["Min Stock Level"] || row["min_stock_level"] || 5),
        company_id: null as string | null, // Will need to match by company name
      }))

      // Match companies by name
      for (const item of items) {
        const companyName = (jsonData.find((r: any) => 
          (r["Part Number"] || r["part_number"]) === item.part_number
        ) as any)?.["Company"] || (jsonData.find((r: any) => 
          (r["Part Number"] || r["part_number"]) === item.part_number
        ) as any)?.["company"]
        
        if (companyName) {
          const company = companies.find((c) => c.name === companyName)
          if (company) {
            item.company_id = company.id
          }
        }
      }

      const { error } = await supabase.from("inventory").insert(items)

      if (error) throw error

      toast.success(`Imported ${items.length} items successfully`)
      setIsImportOpen(false)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import inventory")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx")
      const template = [
        {
          "Part Number": "PART-001",
          "Name": "Example Part Name",
          "Description": "Part description",
          "Company": "SGA",
          "Category": "Drivetrain",
          "Cost Price": 100.00,
          "Selling Price": 150.00,
          "Quantity in Stock": 50,
          "Min Stock Level": 10,
        },
      ]

      const ws = XLSX.utils.json_to_sheet(template)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Inventory")
      XLSX.writeFile(wb, "inventory_template.xlsx")
      toast.success("Template downloaded")
    } catch (error) {
      toast.error("Failed to download template")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40">
            <Plus className="mr-2 size-4" /> Add New Part
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>Add a new inventory item to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number *</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  placeholder="PART-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Part Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Part description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">Company</Label>
                <Select value={formData.company_id || "none"} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Drivetrain, Brakes, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price *</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="100.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  placeholder="150.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  value={formData.quantity_in_stock}
                  onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPart} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Part"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <Upload className="mr-2 size-4" /> Import
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Import Inventory</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import inventory items. Download the template first to see the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <FileSpreadsheet className="mr-2 size-4" /> Download Template
            </Button>
            <div className="space-y-2">
              <Label htmlFor="file">Select Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={handleExport} className="border-white/10 hover:bg-white/5">
        <Download className="mr-2 size-4" /> Export
      </Button>
    </div>
  )
}

