"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function LowStockNotification() {
  useEffect(() => {
    const checkLowStock = async () => {
      const supabase = createClient()
      const { data: inventory } = await supabase
        .from("inventory")
        .select("id, name, quantity_in_stock, min_stock_level")

      if (!inventory) return

      const lowStockItems = inventory.filter((item) => {
        const threshold = Math.max(item.min_stock_level * 0.2, 1) // 20% threshold
        return item.quantity_in_stock <= threshold
      })

      if (lowStockItems.length > 0) {
        const criticalItems = lowStockItems.filter(
          (item) => item.quantity_in_stock <= item.min_stock_level
        )

        if (criticalItems.length > 0) {
          toast.error(
            `${criticalItems.length} item(s) at CRITICAL stock level!`,
            {
              description: criticalItems.map((i) => i.name).join(", "),
              duration: 10000,
            }
          )
        } else {
          toast.warning(
            `${lowStockItems.length} item(s) below 20% stock threshold`,
            {
              description: "Check inventory for details",
              duration: 5000,
            }
          )
        }
      }
    }

    // Check on mount
    checkLowStock()

    // Check every 5 minutes
    const interval = setInterval(checkLowStock, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}

