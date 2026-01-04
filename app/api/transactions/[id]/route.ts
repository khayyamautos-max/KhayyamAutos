import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/transactions/[id]
 * Get a single transaction by ID
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
      .from("transactions")
      .select("*, customers(name, id), profiles(full_name, email)")
      .eq("id", id)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

