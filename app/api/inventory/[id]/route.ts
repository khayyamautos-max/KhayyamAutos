import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/inventory/[id]
 * Get a single inventory item by ID
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
      .from("inventory")
      .select("*, companies(name, id)")
      .eq("id", id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/inventory/[id]
 * Update an inventory item (admin/owner only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    if (!requireAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const {
      part_number,
      name,
      description,
      company_id,
      category,
      cost_price,
      selling_price,
      quantity_in_stock,
      min_stock_level,
    } = body

    const updateData: any = {}

    if (part_number !== undefined) updateData.part_number = part_number
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (company_id !== undefined) updateData.company_id = company_id
    if (category !== undefined) updateData.category = category
    if (cost_price !== undefined) updateData.cost_price = parseFloat(cost_price)
    if (selling_price !== undefined) updateData.selling_price = parseFloat(selling_price)
    if (quantity_in_stock !== undefined) updateData.quantity_in_stock = parseInt(quantity_in_stock)
    if (min_stock_level !== undefined) updateData.min_stock_level = parseInt(min_stock_level)

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await auth.supabase
      .from("inventory")
      .update(updateData)
      .eq("id", id)
      .select("*, companies(name, id)")
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/inventory/[id]
 * Delete an inventory item (admin/owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    if (!requireAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const { id } = await params

    const { error } = await auth.supabase
      .from("inventory")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

