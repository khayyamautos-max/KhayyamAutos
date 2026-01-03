"use client"

import { Users, Phone, MapPin, Wallet, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/currency"
import { useRouter } from "next/navigation"

interface Customer {
  id: string
  name: string
  phone?: string
  address?: string
  debt_balance: number
}

export function CustomerCard({ customer }: { customer: Customer }) {
  const router = useRouter()

  const handleSettleDebt = () => {
    if ((window as any).__openSettleDebt) {
      ;(window as any).__openSettleDebt(customer)
    }
  }

  const handleViewHistory = () => {
    router.push(`/history?customer=${customer.id}`)
  }

  return (
    <Card className="glass border-white/5 hover:border-primary/20 transition-all group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <CardDescription className="text-[10px] font-mono">
                Ref: {customer.phone || customer.id.split("-")[0]}
              </CardDescription>
            </div>
          </div>
          {Number(customer.debt_balance) > 0 && (
            <Badge variant="destructive" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              DEBTOR
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Balance</span>
            <div className="flex items-center gap-2">
              <Wallet className="size-3 text-primary" />
              <span
                className={`font-mono font-bold ${
                  Number(customer.debt_balance) > 0 ? "text-amber-500" : "text-emerald-500"
                }`}
              >
                {formatCurrency(customer.debt_balance)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Contact</span>
            <div className="flex items-center gap-2 text-xs">
              <Phone className="size-3 text-primary/60" />
              <span>{customer.phone || "---"}</span>
            </div>
          </div>
        </div>

        {customer.address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <MapPin className="size-3 text-primary/40" />
            <span className="truncate">{customer.address}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-8 border-white/10 hover:bg-white/5 bg-transparent"
            onClick={handleViewHistory}
          >
            <History className="size-3 mr-1" /> HISTORY
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-8 border-primary/20 text-primary hover:bg-primary/10 bg-transparent"
            onClick={handleSettleDebt}
          >
            SETTLE DEBT
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

