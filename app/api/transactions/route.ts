import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/transactions
 * Get all transactions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const status = searchParams.get("status")
    const paymentMethod = searchParams.get("paymentMethod")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")

    let query = auth.supabase
      .from("transactions")
      .select("*, customers(name, id), profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/transactions
 * Create a new transaction (usually done through POS checkout)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      customer_id,
      total_amount,
      payment_method,
      status,
      items,
    } = body

    if (!total_amount || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: total_amount, items" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("transactions")
      .insert({
        customer_id: customer_id || null,
        staff_id: auth.user.id,
        total_amount: parseFloat(total_amount),
        payment_method: payment_method || "cash",
        status: status || "completed",
        items: items,
      })
      .select("*, customers(name, id), profiles(full_name, email)")
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

