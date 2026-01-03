import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/search
 * Search across multiple entities (inventory, customers, companies)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const types = searchParams.get("types")?.split(",") || ["inventory", "customers", "companies"]

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        data: {
          inventory: [],
          customers: [],
          companies: [],
        },
      })
    }

    const searchTerm = `%${query}%`
    const results: any = {
      inventory: [],
      customers: [],
      companies: [],
    }

    // Search inventory
    if (types.includes("inventory")) {
      const { data: inventory, error: invError } = await auth.supabase
        .from("inventory")
        .select("*, companies(name, id)")
        .or(`name.ilike.${searchTerm},part_number.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(20)

      if (!invError && inventory) {
        results.inventory = inventory
      }
    }

    // Search customers
    if (types.includes("customers")) {
      const { data: customers, error: custError } = await auth.supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},address.ilike.${searchTerm}`)
        .limit(20)

      if (!custError && customers) {
        results.customers = customers
      }
    }

    // Search companies
    if (types.includes("companies")) {
      const { data: companies, error: compError } = await auth.supabase
        .from("companies")
        .select("*")
        .ilike("name", searchTerm)
        .limit(20)

      if (!compError && companies) {
        results.companies = companies
      }
    }

    return NextResponse.json({ data: results, query })
  } catch (error) {
    return handleApiError(error)
  }
}

