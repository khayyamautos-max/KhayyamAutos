import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * GET /api/stats
 * Get dashboard statistics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all" // all, today, week, month

    // Calculate date range
    let startDate: string | null = null
    if (period === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate = today.toISOString()
    } else if (period === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString()
    } else if (period === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      startDate = monthAgo.toISOString()
    }

    // Fetch data in parallel
    const [inventoryRes, customersRes, transactionsRes] = await Promise.all([
      auth.supabase
        .from("inventory")
        .select("id, quantity_in_stock, min_stock_level"),
      auth.supabase
        .from("customers")
        .select("id, debt_balance"),
      startDate
        ? auth.supabase
            .from("transactions")
            .select("total_amount, created_at")
            .gte("created_at", startDate)
            .order("created_at", { ascending: false })
        : auth.supabase
            .from("transactions")
            .select("total_amount, created_at")
            .order("created_at", { ascending: false }),
    ])

    const inventory = inventoryRes.data || []
    const customers = customersRes.data || []
    const transactions = transactionsRes.data || []

    // Calculate metrics
    const totalParts = inventory.length
    const lowStockCount = inventory.filter(
      (i) => i.quantity_in_stock <= i.min_stock_level
    ).length
    const totalDebt = customers.reduce(
      (sum, c) => sum + Number(c.debt_balance),
      0
    )
    const totalSales = transactions.reduce(
      (sum, t) => sum + Number(t.total_amount),
      0
    )
    const transactionCount = transactions.length

    // Today's sales
    const today = new Date().toISOString().split("T")[0]
    const todaySales = transactions
      .filter((t) => t.created_at.startsWith(today))
      .reduce((sum, t) => sum + Number(t.total_amount), 0)

    // Average transaction value
    const avgTransactionValue =
      transactionCount > 0 ? totalSales / transactionCount : 0

    return NextResponse.json({
      data: {
        inventory: {
          totalParts,
          lowStockCount,
        },
        customers: {
          total: customers.length,
          totalDebt,
          debtorsCount: customers.filter(
            (c) => Number(c.debt_balance) > 0
          ).length,
        },
        sales: {
          totalSales,
          todaySales,
          transactionCount,
          avgTransactionValue,
        },
        period,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

