import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/users/[id]
 * Get a single user by ID (Admin/Owner only)
 */
export async function GET(
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

    const { data, error } = await auth.supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/users/[id]
 * Update user profile (Admin/Owner only)
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

    const { full_name, role } = body

    const updateData: any = {}

    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) {
      if (!["admin", "owner", "staff"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be admin, owner, or staff" },
          { status: 400 }
        )
      }
      updateData.role = role
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select("id, email, full_name, role, created_at")
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (Admin/Owner only)
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

    // Note: Deleting from profiles will cascade delete auth user due to ON DELETE CASCADE
    const { error } = await auth.supabase
      .from("profiles")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

