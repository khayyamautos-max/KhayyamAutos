import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/inventory
 * Get all inventory items with optional search and filters
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const lowStock = searchParams.get("lowStock") === "true"
    const companyId = searchParams.get("companyId")

    let query = auth.supabase
      .from("inventory")
      .select("*, companies(name, id)")
      .order("name", { ascending: true })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,part_number.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const { data, error } = await query

    if (error) throw error

    let inventory = data || []

    // Filter low stock items if requested
    if (lowStock) {
      inventory = inventory.filter(
        (item) => item.quantity_in_stock <= item.min_stock_level
      )
    }

    return NextResponse.json({ data: inventory })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item (admin/owner only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    if (!requireAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

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

    // Validation
    if (!part_number || !name || !cost_price || !selling_price) {
      return NextResponse.json(
        { error: "Missing required fields: part_number, name, cost_price, selling_price" },
        { status: 400 }
      )
    }

    // Validate and parse numeric fields
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/inventory/route.ts:94',message:'Before parse validation',data:{cost_price,parsedCost:parseFloat(cost_price),selling_price,parsedSelling:parseFloat(selling_price),quantity_in_stock,parsedQty:parseInt(quantity_in_stock)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const parsedCost = parseFloat(cost_price)
    const parsedSelling = parseFloat(selling_price)
    const parsedQty = parseInt(quantity_in_stock) || 0
    const parsedMin = parseInt(min_stock_level) || 5

    if (isNaN(parsedCost)) {
      return NextResponse.json(
        { error: "Invalid cost_price: must be a number" },
        { status: 400 }
      )
    }
    if (isNaN(parsedSelling)) {
      return NextResponse.json(
        { error: "Invalid selling_price: must be a number" },
        { status: 400 }
      )
    }
    if (isNaN(parsedQty) && quantity_in_stock !== undefined) {
      return NextResponse.json(
        { error: "Invalid quantity_in_stock: must be a number" },
        { status: 400 }
      )
    }
    if (isNaN(parsedMin) && min_stock_level !== undefined) {
      return NextResponse.json(
        { error: "Invalid min_stock_level: must be a number" },
        { status: 400 }
      )
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/inventory/route.ts:120',message:'Parse validation passed',data:{costIsNaN:isNaN(parsedCost),sellingIsNaN:isNaN(parsedSelling),qtyIsNaN:isNaN(parsedQty),minIsNaN:isNaN(parsedMin)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const { data, error } = await auth.supabase
      .from("inventory")
      .insert({
        part_number,
        name,
        description,
        company_id: company_id || null,
        category,
        cost_price: parsedCost,
        selling_price: parsedSelling,
        quantity_in_stock: parsedQty,
        min_stock_level: parsedMin,
      })
      .select("*, companies(name, id)")
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

