import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

/**
 * POST /api/pos/checkout
 * Complete a POS checkout transaction with inventory updates
 * This is an atomic operation that:
 * 1. Creates a transaction
 * 2. Updates inventory quantities
 * 3. Updates customer debt if payment method is "debt"
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      customer_id,
      items,
      payment_method = "cash",
      tax_rate = 0.08,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and cannot be empty" },
        { status: 400 }
      )
    }

    // Validate items and check stock
    const itemIds = items.map((item: any) => item.id)
    const { data: inventoryItems, error: invError } = await auth.supabase
      .from("inventory")
      .select("id, name, selling_price, quantity_in_stock")
      .in("id", itemIds)

    if (invError) throw invError

    if (!inventoryItems || inventoryItems.length !== items.length) {
      return NextResponse.json(
        { error: "Some items not found in inventory" },
        { status: 400 }
      )
    }

    // Check stock availability
    for (const cartItem of items) {
      const inventoryItem = inventoryItems.find((inv) => inv.id === cartItem.id)
      if (!inventoryItem) {
        return NextResponse.json(
          { error: `Item ${cartItem.id} not found` },
          { status: 400 }
        )
      }

      if (inventoryItem.quantity_in_stock < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity_in_stock}, Requested: ${cartItem.quantity}`,
          },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const tax = subtotal * tax_rate
    const total = subtotal + tax

    // Prepare transaction items
    const transactionItems = items.map((item: any) => {
      const invItem = inventoryItems.find((inv) => inv.id === item.id)
      return {
        id: item.id,
        name: invItem?.name || item.name,
        quantity: item.quantity,
        price: item.price,
      }
    })

    // Determine transaction status
    const status = payment_method === "debt" ? "pending_debt" : "completed"

    // Create transaction
    const { data: transaction, error: txError } = await auth.supabase
      .from("transactions")
      .insert({
        customer_id: customer_id || null,
        staff_id: auth.user.id,
        total_amount: total,
        payment_method,
        status,
        items: transactionItems,
      })
      .select("*, customers(name, id)")
      .single()

    if (txError) throw txError

    // Update inventory quantities
    for (const item of items) {
      const { error: updateError } = await auth.supabase.rpc("decrement_inventory", {
        row_id: item.id,
        decrement_by: item.quantity,
      })

      // Fallback if RPC doesn't exist
      if (updateError) {
        const inventoryItem = inventoryItems.find((inv) => inv.id === item.id)
        if (inventoryItem) {
          const { error: fallbackError } = await auth.supabase
            .from("inventory")
            .update({
              quantity_in_stock: inventoryItem.quantity_in_stock - item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id)

          if (fallbackError) throw fallbackError
        }
      }
    }

    // Update customer debt if payment method is "debt"
    if (payment_method === "debt" && customer_id) {
      const { error: debtError } = await auth.supabase.rpc("increment_customer_debt", {
        cust_id: customer_id,
        amount: total,
      })

      // Fallback if RPC doesn't exist
      if (debtError) {
        const { data: customer } = await auth.supabase
          .from("customers")
          .select("debt_balance")
          .eq("id", customer_id)
          .single()

        if (customer) {
          const { error: fallbackError } = await auth.supabase
            .from("customers")
            .update({
              debt_balance: Number(customer.debt_balance) + total,
            })
            .eq("id", customer_id)

          if (fallbackError) throw fallbackError
        }
      }
    }

    return NextResponse.json(
      {
        data: transaction,
        message: "Checkout completed successfully",
        totals: {
          subtotal,
          tax,
          total,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

