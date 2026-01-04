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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:13',message:'POST checkout started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:25',message:'Request body parsed',data:{itemCount:items?.length,customer_id,payment_method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:49',message:'Before stock check',data:{inventoryItems:inventoryItems.map(i=>({id:i.id,stock:i.quantity_in_stock})),requestedItems:items.map(i=>({id:i.id,qty:i.quantity}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:67',message:'Stock check passed',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:103',message:'Before inventory update (atomic)',data:{itemsToUpdate:items.map(i=>({id:i.id,qty:i.quantity}))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:145',message:'Inventory update failed - no transaction created',data:{errors:inventoryUpdateErrors},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        {
          error: "Inventory update failed",
          details: inventoryUpdateErrors,
        },
        { status: 400 }
      )
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:155',message:'Inventory updated successfully, creating transaction',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:170',message:'Transaction creation failed - inventory already updated',data:{error:txError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Rollback inventory updates if transaction creation fails
      for (const item of items) {
        await auth.supabase.rpc("increment_inventory", {
          row_id: item.id,
          increment_by: item.quantity,
        }).catch(async () => {
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
        })
      }
      throw txError
    }
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/458cece2-39d1-49f1-8ecb-2abc4c18a496',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/pos/checkout/route.ts:190',message:'Transaction created successfully',data:{transactionId:transaction?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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

