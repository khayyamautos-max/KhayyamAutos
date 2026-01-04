import { createClient } from "@/lib/supabase/server"
import { Search, User, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackButton } from "@/components/back-button"
import { formatCurrency } from "@/lib/currency"
import { CalendarView } from "./calendar-view"

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, customers(name)")
    .order("created_at", { ascending: false })

  return (
    <div className="pt-4 md:pt-6 space-y-4 md:space-y-6 animate-in slide-in-from-right-2 duration-500">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Transaction Archives</h1>
          <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">Neural history // Sales & credit logs</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Transaction List</TabsTrigger>
          <TabsTrigger value="calendar">Daily Sales Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-6">
          <CalendarView />
        </TabsContent>
        <TabsContent value="list" className="mt-6">

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Filter by transaction ID or customer..." className="pl-10 glass border-white/10" />
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Timestamp</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">TX ID</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Customer</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Items</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Total</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">Method</TableHead>
              <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((tx) => (
              <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                <TableCell className="font-mono text-[10px] sm:text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-primary/40" />
                    <span className="whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[10px] sm:text-[11px] text-primary/60">#{tx.id.split("-")[0]}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="size-3 text-primary/40" />
                    <span className="font-medium text-xs sm:text-sm">{tx.customers?.name || "Walk-in"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {Array.isArray(tx.items) ? `${tx.items.length} units` : "0 units"}
                  </span>
                </TableCell>
                <TableCell className="font-mono font-bold text-primary text-xs sm:text-sm">
                  {formatCurrency(tx.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] border-white/10 uppercase tracking-tighter">
                    {tx.payment_method}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] border-none",
                      tx.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {tx.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
