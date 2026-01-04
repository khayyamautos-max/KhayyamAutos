import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const { data, error } = await auth.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/customers/[id]
 * Update a customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()

    const { name, phone, address, debt_balance } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (debt_balance !== undefined) {
      const parsed = parseFloat(debt_balance)
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: "Invalid debt_balance: must be a number" },
          { status: 400 }
        )
      }
      updateData.debt_balance = parsed
    }

    const { data, error } = await auth.supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const { error } = await auth.supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

