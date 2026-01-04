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

    // Update inventory quantities FIRST (before creating transaction) to prevent race conditions
    // Use atomic updates with stock validation
    const inventoryUpdateErrors: Array<{ itemId: string; error: string }> = []
    
    for (const item of items) {
      const inventoryItem = inventoryItems.find((inv) => inv.id === item.id)
      if (!inventoryItem) {
        inventoryUpdateErrors.push({ itemId: item.id, error: "Item not found in inventory" })
        continue
      }

      // Use RPC for atomic decrement, or fallback to direct update with stock check
      const { error: updateError } = await auth.supabase.rpc("decrement_inventory", {
        row_id: item.id,
        decrement_by: item.quantity,
      })

      if (updateError) {
        // Fallback: Direct update with stock validation
        // Re-fetch current stock to prevent race conditions
        const { data: currentItem, error: fetchError } = await auth.supabase
          .from("inventory")
          .select("quantity_in_stock")
          .eq("id", item.id)
          .single()

        if (fetchError || !currentItem) {
          inventoryUpdateErrors.push({ itemId: item.id, error: fetchError?.message || "Failed to fetch current stock" })
          continue
        }

        // Check stock again (race condition protection)
        if (currentItem.quantity_in_stock < item.quantity) {
          inventoryUpdateErrors.push({
            itemId: item.id,
            error: `Insufficient stock. Available: ${currentItem.quantity_in_stock}, Requested: ${item.quantity}`,
          })
          continue
        }

        const { error: fallbackError } = await auth.supabase
          .from("inventory")
          .update({
            quantity_in_stock: currentItem.quantity_in_stock - item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .gte("quantity_in_stock", item.quantity) // Additional safety check

        if (fallbackError) {
          inventoryUpdateErrors.push({ itemId: item.id, error: fallbackError.message })
        }
      }
    }

    // If any inventory update failed, return error BEFORE creating transaction
    if (inventoryUpdateErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Inventory update failed",
          details: inventoryUpdateErrors,
        },
        { status: 400 }
      )
    }

    // Create transaction AFTER successful inventory update
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

    if (txError) {
      // Rollback inventory updates if transaction creation fails
      for (const item of items) {
        const { error: rollbackError } = await auth.supabase.rpc("increment_inventory", {
          row_id: item.id,
          increment_by: item.quantity,
        })
        
        if (rollbackError) {
          // Fallback rollback
          const inventoryItem = inventoryItems.find((inv) => inv.id === item.id)
          if (inventoryItem) {
            await auth.supabase
              .from("inventory")
              .update({
                quantity_in_stock: inventoryItem.quantity_in_stock,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id)
          }
        }
      }
      throw txError
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

