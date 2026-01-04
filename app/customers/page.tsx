import { createClient } from "@/lib/supabase/server"
import { Users, Phone, MapPin, Wallet, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"
import { formatCurrency } from "@/lib/currency"
import { CustomersClient } from "./customers-client"
import { CustomerCard } from "./customer-card"

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase.from("customers").select("*").order("name", { ascending: true })

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
        <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Customer Ledger</h1>
            <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">
            Entity directory // Credit & balance tracking
          </p>
          </div>
        </div>
        <CustomersClient />
      </div>

      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {customers?.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
        {(!customers || customers.length === 0) && (
          <Card className="glass border-white/5 col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="size-12 mx-auto mb-4 opacity-30" />
              <p>No customers found. Add your first customer to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
