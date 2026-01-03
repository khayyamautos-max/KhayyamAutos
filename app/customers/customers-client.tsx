"use client"

import { useState } from "react"
import { Plus, History, Wallet } from "lucide-react"
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
import { formatCurrency } from "@/lib/currency"
import { useRouter } from "next/navigation"

export function CustomersClient() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    debt_balance: "0",
  })
  const [settleAmount, setSettleAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Customer name is required")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("customers").insert({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        debt_balance: parseFloat(formData.debt_balance) || 0,
      })

      if (error) throw error

      toast.success("Customer added successfully")
      setIsAddOpen(false)
      setFormData({ name: "", phone: "", address: "", debt_balance: "0" })
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add customer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettleDebt = async () => {
    if (!selectedCustomer || !settleAmount) {
      toast.error("Please enter settlement amount")
      return
    }

    const amount = parseFloat(settleAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/debt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          action: "settle",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to settle debt")
      }

      toast.success(`Debt settled: ${formatCurrency(amount)}`)
      setIsSettleOpen(false)
      setSettleAmount("")
      setSelectedCustomer(null)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to settle debt")
    } finally {
      setIsLoading(false)
    }
  }

  const openSettle = (customer: any) => {
    setSelectedCustomer(customer)
    setSettleAmount("")
    setIsSettleOpen(true)
  }

  return (
    <>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40">
            <Plus className="mr-2 size-4" /> New Customer Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Customer address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt_balance">Initial Debt Balance</Label>
              <Input
                id="debt_balance"
                type="number"
                step="0.01"
                value={formData.debt_balance}
                onChange={(e) => setFormData({ ...formData, debt_balance: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Settle Customer Debt</DialogTitle>
            <DialogDescription>
              {selectedCustomer && (
                <>
                  Customer: <strong>{selectedCustomer.name}</strong>
                  <br />
                  Current Balance: <strong className="text-amber-500">
                    {formatCurrency(selectedCustomer.debt_balance)}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="settle-amount">Amount to Settle</Label>
              <Input
                id="settle-amount"
                type="number"
                step="0.01"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            {settleAmount && selectedCustomer && (
              <div className="p-3 rounded bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  New Balance:{" "}
                  <strong className={Number(selectedCustomer.debt_balance) - parseFloat(settleAmount) > 0 ? "text-amber-500" : "text-emerald-500"}>
                    {formatCurrency(Math.max(0, Number(selectedCustomer.debt_balance) - parseFloat(settleAmount)))}
                  </strong>
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSettleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSettleDebt} disabled={isLoading}>
                {isLoading ? "Processing..." : "Settle Debt"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {(() => {
        (window as any).__openSettleDebt = openSettle
        return null
      })()}
    </>
  )
}

