import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * POST /api/customers/[id]/debt
 * Settle customer debt (add or subtract from debt balance)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()
    const { amount, action = "settle" } = body

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Get current customer
    const { data: customer, error: fetchError } = await auth.supabase
      .from("customers")
      .select("debt_balance")
      .eq("id", id)
      .maybeSingle() // Use maybeSingle() to handle missing records gracefully

    // Handle errors - PGRST116 is "not found", which is expected
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    const currentDebt = Number(customer.debt_balance)
    const amountNum = parseFloat(amount)

    let newDebt: number

    if (action === "settle") {
      // Subtract from debt (settlement)
      newDebt = Math.max(0, currentDebt - amountNum)
    } else if (action === "add") {
      // Add to debt
      newDebt = currentDebt + amountNum
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'settle' or 'add'" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("customers")
      .update({ debt_balance: newDebt })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      data,
      message: `Debt ${action === "settle" ? "settled" : "added"} successfully`,
      previous_balance: currentDebt,
      new_balance: newDebt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

