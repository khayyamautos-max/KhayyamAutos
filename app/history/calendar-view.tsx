"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/currency"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns"

interface Transaction {
  id: string
  total_amount: number
  created_at: string
  customer_id?: string
  payment_method: string
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [currentDate])

  useEffect(() => {
    if (selectedDate) {
      const dayTransactions = transactions.filter((tx) => {
        const txDate = parseISO(tx.created_at)
        return isSameDay(txDate, selectedDate)
      })
      setSelectedDateTransactions(dayTransactions)
    }
  }, [selectedDate, transactions])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const start = startOfMonth(currentDate).toISOString()
      const end = endOfMonth(currentDate).toISOString()

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDaySales = (date: Date) => {
    return transactions
      .filter((tx) => {
        const txDate = parseISO(tx.created_at)
        return isSameDay(txDate, date)
      })
      .reduce((sum, tx) => sum + Number(tx.total_amount), 0)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const totalMonthSales = transactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0)
  const selectedDateTotal = selectedDateTransactions.reduce(
    (sum, tx) => sum + Number(tx.total_amount),
    0
  )

  return (
    <div className="space-y-4">
      <Card className="glass border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Daily Sales Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-mono text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const daySales = getDaySales(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded border transition-all
                    ${isSelected ? "bg-primary/20 border-primary/50" : "bg-white/5 border-white/10 hover:border-primary/30"}
                    ${isToday ? "ring-2 ring-primary/50" : ""}
                    ${daySales > 0 ? "border-emerald-500/30" : ""}
                  `}
                >
                  <div className="text-xs font-mono mb-1">{format(day, "d")}</div>
                  {daySales > 0 && (
                    <div className="text-[10px] text-emerald-500 font-bold">
                      {formatCurrency(daySales).replace("Rs. ", "")}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Month Total:</span>
              <span className="font-bold text-primary">{formatCurrency(totalMonthSales)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle>Sales for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateTransactions.length > 0 ? (
              <div className="space-y-2">
                {selectedDateTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5"
                  >
                    <div>
                      <p className="text-sm font-mono">#{tx.id.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{tx.payment_method}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(tx.total_amount)}</p>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(selectedDateTotal)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sales recorded for this date
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

