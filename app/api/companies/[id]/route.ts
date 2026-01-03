import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/companies/[id]
 * Get a single company by ID
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
      .from("companies")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/companies/[id]
 * Update a company (admin/owner only)
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

    const { name, description, contact_info } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (contact_info !== undefined) updateData.contact_info = contact_info

    const { data, error } = await auth.supabase
      .from("companies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a company (admin/owner only)
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
      .from("companies")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Company deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

