import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/companies
 * Get all companies with optional search
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = auth.supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true })

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/companies
 * Create a new company (admin/owner only)
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
    const { name, description, contact_info } = body

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("companies")
      .insert({
        name,
        description: description || null,
        contact_info: contact_info || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

