import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, requireAdmin } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/users
 * Get all users (Admin/Owner only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    if (!requireAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const { data: profiles, error } = await auth.supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: profiles || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/users
 * Create a new user (Admin/Owner only)
 * Note: This uses Supabase Admin API, so you need service_role key
 * For production, consider using Supabase Admin API directly
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
    const { email, password, full_name, role = "staff" } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["admin", "owner", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, owner, or staff" },
        { status: 400 }
      )
    }

    // Note: Creating users requires Supabase Admin API with service_role key
    // This is a simplified version - in production, use Supabase Admin API
    // For now, we'll return instructions
    
    return NextResponse.json(
      {
        message: "User creation via API requires Supabase Admin API. Please use the Supabase Dashboard or implement Admin API integration.",
        instructions: "Go to Supabase Dashboard > Authentication > Users > Add User, then update the profile role in the profiles table.",
      },
      { status: 501 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

