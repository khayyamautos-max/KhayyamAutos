"use client"

import { Badge } from "@/components/ui/badge"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/currency"

interface InventoryItem {
  id: string
  part_number: string
  name: string
  category?: string
  selling_price: number
  quantity_in_stock: number
  min_stock_level: number
  companies?: { name: string } | null
}

export function InventoryTable({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <TableBody>
      {inventory.map((part) => {
        const threshold = Math.max(part.min_stock_level * 0.2, 1)
        const isLowStock = part.quantity_in_stock <= threshold
        const isCritical = part.quantity_in_stock <= part.min_stock_level

        return (
          <TableRow key={part.id} className="border-white/5 hover:bg-white/5 transition-colors">
            <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
            <TableCell className="font-medium">{part.name}</TableCell>
            <TableCell className="text-muted-foreground">{part.companies?.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-primary/20 text-primary/80 bg-primary/5">
                {part.category}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(part.selling_price)}</TableCell>
            <TableCell className="text-right font-mono">{part.quantity_in_stock}</TableCell>
            <TableCell className="text-center">
              {isCritical ? (
                <Badge
                  variant="destructive"
                  className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                >
                  CRITICAL
                </Badge>
              ) : isLowStock ? (
                <Badge
                  variant="destructive"
                  className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                >
                  LOW STOCK
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                  HEALTHY
                </Badge>
              )}
            </TableCell>
          </TableRow>
        )
      })}
      {(!inventory || inventory.length === 0) && (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
            No parts found in the neural grid.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

