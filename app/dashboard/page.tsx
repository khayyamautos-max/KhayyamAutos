import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TrendingUp, Users, Package, AlertCircle, ArrowUpRight, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BackButton } from "@/components/back-button"
import { formatCurrency } from "@/lib/currency"

interface InventoryItem {
  id: string
  name?: string
  part_number: string
  quantity_in_stock: number
  min_stock_level: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    redirect("/auth/login")
  }

  // Parallel data fetching for metrics
  const [profileRes, inventoryRes, customersRes, transactionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
    supabase.from("inventory").select("id, quantity_in_stock, min_stock_level"),
    supabase.from("customers").select("id, debt_balance"),
    supabase.from("transactions").select("total_amount, created_at").order("created_at", { ascending: false }),
  ])

  const profile = profileRes.data
  const inventory = inventoryRes.data || []
  const customers = customersRes.data || []
  const transactions = transactionsRes.data || []

  // Metrics calculation
  const lowStockCount = inventory.filter((i) => i.quantity_in_stock <= i.min_stock_level).length
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance), 0)
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0)

  // Today's sales (only transactions from today, resets daily)
  const today = new Date().toISOString().split("T")[0]
  const todayStart = new Date(today + "T00:00:00.000Z").toISOString()
  const todayEnd = new Date(today + "T23:59:59.999Z").toISOString()
  const todaySales = transactions
    .filter((t) => {
      const txDate = new Date(t.created_at)
      return txDate >= new Date(todayStart) && txDate <= new Date(todayEnd)
    })
    .reduce((sum, t) => sum + Number(t.total_amount), 0)

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <BackButton />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Khayyam Kakakhel Operations</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 uppercase font-mono text-[10px]"
          >
            Operator: {profile?.full_name || userData.user.email}
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-500 bg-amber-500/5 uppercase font-mono text-[10px]"
          >
            Access: {profile?.role || "staff"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="size-12 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-mono">
              Daily Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(todaySales)}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="size-3 text-emerald-500" />
              Live stream operational
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-mono">
              Total Matrix Sales
            </CardTitle>
            <DollarSign className="size-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-mono">
              Active Nodes
            </CardTitle>
            <Users className="size-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length} Entities</div>
          </CardContent>
        </Card>

        <Card className={cn("glass border-white/5", lowStockCount > 0 && "border-l-amber-500/50 shadow-amber-500/5")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-mono">
              Stock Anomalies
            </CardTitle>
            <AlertCircle className={cn("size-4", lowStockCount > 0 ? "text-amber-500" : "text-emerald-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", lowStockCount > 0 ? "text-amber-500" : "text-emerald-500")}>
              {lowStockCount} Alerts
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Revenue Analytics
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Historical performance across the neural grid
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-white/5">
            <div className="text-muted-foreground italic text-sm opacity-50 flex flex-col items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 bg-primary/20 rounded-t-sm" style={{ height: `${20 + i * 15}px` }} />
                ))}
              </div>
              Visualization stream initializing...
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 glass border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="size-5 text-primary" />
              Critical Inventory
            </CardTitle>
            <CardDescription className="text-xs font-mono">Parts requiring immediate procurement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventory
              .filter((i) => i.quantity_in_stock <= i.min_stock_level)
              .slice(0, 5)
              .map((part: InventoryItem) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{part.name || "Unknown Part"}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{part.part_number}</span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]"
                  >
                    {part.quantity_in_stock} LEFT
                  </Badge>
                </div>
              ))}
            {lowStockCount === 0 && (
              <div className="h-40 flex items-center justify-center text-muted-foreground italic text-sm">
                All inventory levels stabilized.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
