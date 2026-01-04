import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface AuthenticatedRequest {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: { id: string; email: string; role?: string }
}

/**
 * Middleware to authenticate API requests
 */
export async function authenticateRequest(): Promise<AuthenticatedRequest | NextResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles gracefully

  // Profile error is non-critical - user can still authenticate without a profile
  // Only log if it's not a "not found" error
  if (profileError && profileError.code !== "PGRST116") {
    // Log non-critical errors if needed (can be removed or replaced with proper logging)
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "staff"
    }
  }
}

/**
 * Check if user has admin/owner role
 */
export function requireAdmin(role?: string): boolean {
  return role === "admin" || role === "owner"
}

