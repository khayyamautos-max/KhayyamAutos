import { createClient } from "@/lib/supabase/server"
import { Package, Search, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BackButton } from "@/components/back-button"
import { formatCurrency } from "@/lib/currency"
import { InventoryClient } from "./inventory-client"
import { InventoryTable } from "./inventory-table"

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, companies(name)")
    .order("name", { ascending: true })

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true })

  // Calculate low stock (20% threshold)
  const lowStockItems = inventory?.filter((item) => {
    const threshold = Math.max(item.min_stock_level * 0.2, 1) // 20% of min_stock_level or at least 1
    return item.quantity_in_stock <= threshold
  }) || []

  return (
    <div className="pt-4 md:pt-6 space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Inventory Management</h1>
            <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">Core database // Part lookup & stock levels</p>
          </div>
        </div>
        <InventoryClient companies={companies || []} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5 border-l-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {lowStockItems.length}
            </div>
            {lowStockItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Below 20% threshold</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by part number or name..."
            className="pl-10 bg-white/5 border-white/10 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Part #</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Name</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Model</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Company</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Category</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest text-right">
                Price
              </TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest text-right">
                Stock
              </TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory?.map((part) => {
              const threshold = Math.max(part.min_stock_level * 0.2, 1)
              const isLowStock = part.quantity_in_stock <= threshold
              const isCritical = part.quantity_in_stock <= part.min_stock_level
              
              return (
                <TableRow key={part.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs sm:text-sm">{part.part_number}</TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">{part.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm">{part.model || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs sm:text-sm">{part.companies?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 text-primary/80 bg-primary/5">
                      {part.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs sm:text-sm">{formatCurrency(part.selling_price)}</TableCell>
                  <TableCell className="text-right font-mono text-xs sm:text-sm">{part.quantity_in_stock}</TableCell>
                  <TableCell className="text-center">
                    {isCritical ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                      >
                        CRITICAL
                      </Badge>
                    ) : isLowStock ? (
                      <Badge
                        variant="destructive"
                        className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                      >
                        LOW STOCK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                        HEALTHY
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {(!inventory || inventory.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">
                  No parts found in the neural grid.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
