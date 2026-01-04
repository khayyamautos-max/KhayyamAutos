import { createClient } from "@/lib/supabase/server"
import { Building2, Phone, Mail, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { CompaniesClient } from "./companies-client"
import { CompanyCard } from "./company-card"

export default async function CompaniesPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase.from("companies").select("*").order("name", { ascending: true })

  return (
    <div className="pt-4 md:pt-6 space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Vendor Matrix</h1>
            <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">Company network // Partner registry</p>
          </div>
        </div>
        <CompaniesClient companies={companies || []} />
      </div>

      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  )
}
