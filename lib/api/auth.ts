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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api/auth.ts:25',message:'Before profile fetch',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles gracefully

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api/auth.ts:29',message:'Profile fetch result',data:{profileExists:!!profile,profileError:profileError?.code,role:profile?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Profile error is non-critical - user can still authenticate without a profile
  // Only log if it's not a "not found" error
  if (profileError && profileError.code !== "PGRST116") {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/api/auth.ts:35',message:'Profile fetch error (non-critical)',data:{error:profileError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

