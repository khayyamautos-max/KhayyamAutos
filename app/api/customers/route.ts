import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/customers
 * Get all customers with optional search
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const hasDebt = searchParams.get("hasDebt") === "true"

    let query = auth.supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    let customers = data || []

    // Filter customers with debt if requested
    if (hasDebt) {
      customers = customers.filter(
        (customer) => Number(customer.debt_balance) > 0
      )
    }

    return NextResponse.json({ data: customers })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { name, phone, address, debt_balance } = body

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("customers")
      .insert({
        name,
        phone: phone || null,
        address: address || null,
        debt_balance: debt_balance ? parseFloat(debt_balance) : 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

