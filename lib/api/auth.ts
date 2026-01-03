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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

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

