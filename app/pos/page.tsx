"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, Trash2, Printer, CreditCard, User, X, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { BackButton } from "@/components/back-button"
import { formatCurrency } from "@/lib/currency"
import { generatePDFReceipt } from "@/lib/pdf-receipt"

interface Product {
  id: string
  part_number: string
  name: string
  selling_price: number
  quantity_in_stock: number
  category: string
  company_id: string | null
  companies?: { name: string } | null
}

interface CartItem extends Product {
  quantity: number
}

interface Customer {
  id: string
  name: string
  phone: string
  debt_balance: number
  address?: string
}

const COMPANIES = ["SGA", "ISH", "Crown", "Atlas Honda", "Future", "NSA", "China", "Local", "All"]

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<string>("All")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerRef, setCustomerRef] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [isWalkIn, setIsWalkIn] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData } = await supabase
        .from("inventory")
        .select("*, companies(name)")
        .order("name", { ascending: true })

      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true })

      if (productsData) {
        setAllProducts(productsData)
        setProducts(productsData)
      }
      if (customersData) setCustomers(customersData)
    }
    fetchData()
  }, [])

  // Filter products by company
  useEffect(() => {
    if (selectedCompany === "All") {
      setProducts(allProducts)
    } else {
      const filtered = allProducts.filter((p) => {
        const companyName = p.companies?.name || ""
        return companyName.toLowerCase() === selectedCompany.toLowerCase()
      })
      setProducts(filtered)
    }
  }, [selectedCompany, allProducts])

  // Search products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.part_number.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Lookup customer by ref number (phone) or name
  const lookupCustomer = () => {
    if (!customerRef.trim()) {
      toast.error("Please enter a reference number or name")
      return
    }

    const found = customers.find(
      (c) =>
        c.phone?.toLowerCase().includes(customerRef.toLowerCase()) ||
        c.name.toLowerCase().includes(customerRef.toLowerCase()),
    )

    if (found) {
      setSelectedCustomer(found)
      setIsWalkIn(false)
      setCustomerName(found.name)
      toast.success(`Customer found: ${found.name}`)
    } else {
      toast.error("Customer not found. Please check the reference number or create a new customer.")
    }
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerRef("")
    setCustomerName("")
    setIsWalkIn(true)
    setAmountPaid("")
  }

  const addToCart = (product: Product) => {
    if (product.quantity_in_stock <= 0) {
      toast.error("Item out of stock")
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) {
          toast.error("Stock limit reached")
          return prev
        }
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta
          if (newQty <= 0) return item
          if (newQty > item.quantity_in_stock) {
            toast.error("Stock limit reached")
            return item
          }
          return { ...item, quantity: newQty }
        }
        return item
      }),
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax
  const previousBalance = selectedCustomer ? Number(selectedCustomer.debt_balance) : 0
  const paidAmount = amountPaid ? parseFloat(amountPaid) : total
  const remainingBalance = isWalkIn ? 0 : previousBalance + total - paidAmount

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (!isWalkIn && !selectedCustomer) {
      toast.error("Please lookup customer or select walk-in")
      return
    }

    if (!isWalkIn && !amountPaid) {
      toast.error("Please enter amount paid")
      return
    }

    setIsProcessing(true)

    try {
      const { data: userData } = await supabase.auth.getUser()

      // 1. Create Transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          customer_id: isWalkIn ? null : selectedCustomer?.id,
          staff_id: userData.user?.id,
          total_amount: total,
          payment_method: paymentMethod,
          status: remainingBalance > 0 ? "pending_debt" : "completed",
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.selling_price,
          })),
        })
        .select()
        .single()

      if (txError) throw txError

      // 2. Update Inventory
      for (const item of cart) {
        const { error: invError } = await supabase.rpc("decrement_inventory", {
          row_id: item.id,
          decrement_by: item.quantity,
        })
        if (invError) {
          await supabase
            .from("inventory")
            .update({
              quantity_in_stock: item.quantity_in_stock - item.quantity,
            })
            .eq("id", item.id)
        }
      }

      // 3. Update Customer Debt if not walk-in
      if (!isWalkIn && selectedCustomer) {
        const newDebt = remainingBalance
        await supabase
          .from("customers")
          .update({ debt_balance: newDebt })
          .eq("id", selectedCustomer.id)
      }

      const receiptData = {
        ...transaction,
        customer: selectedCustomer,
        previousBalance,
        paidAmount,
        remainingBalance,
        isWalkIn,
      }

      setLastTransaction(receiptData)

      // Generate PDF receipt
      generatePDFReceipt({
        transactionId: transaction.id,
        date: new Date().toLocaleString(),
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
        } : undefined,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.selling_price,
        })),
        subtotal: subtotal,
        tax: tax,
        total: total,
        previousBalance: !isWalkIn ? previousBalance : undefined,
        amountPaid: !isWalkIn ? paidAmount : undefined,
        remainingBalance: !isWalkIn ? remainingBalance : undefined,
        isWalkIn,
        paymentMethod,
      }).catch((error) => {
        console.error("PDF generation error:", error)
      })

      toast.success("Transaction Complete - Receipt Downloaded")
      setShowReceipt(true)
      setCart([])
      clearCustomer()
    } catch (err) {
      console.error(err)
      toast.error("Transaction Failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">POS Terminal</h1>
          <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">Point of Sale // Transaction Processing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Company Filter */}
          <div className="flex flex-wrap gap-2 pb-2">
            {COMPANIES.map((company) => (
              <Button
                key={company}
                variant={selectedCompany === company ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCompany(company)}
                className={
                  selectedCompany === company
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "border-white/10 hover:bg-white/5"
                }
              >
                <Building2 className="size-3 mr-1" />
                {company}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search parts by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 h-12 text-lg"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="glass border-white/5 cursor-pointer hover:border-primary/50 transition-all group h-fit"
                onClick={() => addToCart(product)}
              >
                <CardHeader className="p-2 sm:p-3">
                  <Badge variant="outline" className="w-fit text-[9px] sm:text-[10px] border-primary/20 text-primary mb-1">
                    {product.part_number}
                  </Badge>
                  <CardTitle className="text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="font-mono font-bold text-primary text-xs sm:text-sm">{formatCurrency(product.selling_price)}</span>
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-mono",
                        product.quantity_in_stock <= 5 ? "text-amber-500" : "text-muted-foreground",
                      )}
                    >
                      STOCK: {product.quantity_in_stock}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart & Checkout */}
        <Card className="glass border-white/10 flex flex-col lg:h-[calc(100vh-12rem)] bg-black/40">
          <CardHeader className="border-b border-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h2 className="font-bold tracking-tight">Current Cart</h2>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {cart.reduce((a, b) => a + b.quantity, 0)} ITEMS
              </Badge>
            </div>

            {/* Customer Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={isWalkIn ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsWalkIn(true)
                    clearCustomer()
                  }}
                  className={isWalkIn ? "bg-primary/20 text-primary" : ""}
                >
                  Walk-in Customer
                </Button>
                <Button
                  variant={!isWalkIn ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsWalkIn(false)}
                  className={!isWalkIn ? "bg-primary/20 text-primary" : ""}
                >
                  Registered Customer
                </Button>
              </div>

              {!isWalkIn && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ref # or Name"
                      value={customerRef}
                      onChange={(e) => setCustomerRef(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && lookupCustomer()}
                      className="flex-1 text-sm"
                    />
                    <Button size="sm" onClick={lookupCustomer}>
                      <Search className="size-3" />
                    </Button>
                  </div>
                  {selectedCustomer && (
                    <Card className="bg-primary/5 border-primary/20 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{selectedCustomer.name}</p>
                          <p className="text-xs text-muted-foreground">Phone: {selectedCustomer.phone || "N/A"}</p>
                          <p className="text-xs text-amber-500">
                            Outstanding: {formatCurrency(selectedCustomer.debt_balance)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearCustomer} className="size-6">
                          <X className="size-3" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-2">
                <ShoppingCart className="size-12" />
                <p className="italic font-mono text-sm">Cart is empty...</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium leading-tight">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 border border-white/10 rounded overflow-hidden">
                      <button
                        className="px-2 py-0.5 hover:bg-white/10 text-xs font-bold"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                      <button
                        className="px-2 py-0.5 hover:bg-white/10 text-xs font-bold text-primary"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(item.selling_price * item.quantity)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4 p-4 border-t border-white/5 bg-black/20">
            <div className="space-y-1 w-full">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax (8%)</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
              <Separator className="bg-white/5 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-primary tracking-tight uppercase">Total</span>
                <span className="font-mono font-bold text-2xl text-primary">
                  {formatCurrency(total)}
                </span>
              </div>

              {!isWalkIn && selectedCustomer && (
                <>
                  <Separator className="bg-white/5 my-2" />
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Previous Outstanding</span>
                      <span className="font-mono text-amber-500">{formatCurrency(previousBalance)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Current Purchase</span>
                      <span className="font-mono">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Due</span>
                      <span className="font-mono font-bold">{formatCurrency(previousBalance + total)}</span>
                    </div>
                    <div className="pt-2">
                      <Label className="text-xs">Amount Paid</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {amountPaid && (
                      <div className="flex justify-between pt-1">
                        <span className="text-xs">Remaining Balance</span>
                        <span className={`font-mono font-bold ${remainingBalance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                          {formatCurrency(remainingBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label className="text-xs">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("cash")}
                  className={paymentMethod === "cash" ? "bg-primary/20 text-primary" : ""}
                >
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "online" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("online")}
                  className={paymentMethod === "online" ? "bg-primary/20 text-primary" : ""}
                >
                  Online Payment
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 h-12 bg-transparent">
                    <Printer className="size-4 mr-2" /> RECEIPT
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-center font-mono">B-PARTS RECEIPT</DialogTitle>
                  </DialogHeader>
                  {lastTransaction && (
                    <div className="font-mono text-[10px] space-y-4 py-4">
                      <div className="text-center border-b border-dashed border-white/20 pb-2">
                        BIKE PARTS DISTRO SYS
                        <br />
                        TERMINAL #01-A
                        <br />
                        {new Date().toLocaleString()}
                      </div>
                      {!lastTransaction.isWalkIn && lastTransaction.customer && (
                        <div className="border-b border-dashed border-white/20 pb-2">
                          <p className="font-bold">Customer: {lastTransaction.customer.name}</p>
                          <p>Phone: {lastTransaction.customer.phone || "N/A"}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        {lastTransaction.items?.map((i: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {i.name.slice(0, 20)} x{i.quantity}
                            </span>
                            <span>{formatCurrency(i.price * i.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-dashed border-white/20 pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatCurrency(lastTransaction.total_amount / 1.08)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (8%)</span>
                          <span>{formatCurrency((lastTransaction.total_amount / 1.08) * 0.08)}</span>
                        </div>
                        {!lastTransaction.isWalkIn && (
                          <>
                            <div className="flex justify-between text-amber-500">
                              <span>Previous Outstanding</span>
                              <span>{formatCurrency(lastTransaction.previousBalance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Amount Paid</span>
                              <span>{formatCurrency(lastTransaction.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Remaining Balance</span>
                              <span className={lastTransaction.remainingBalance > 0 ? "text-amber-500" : "text-emerald-500"}>
                                {formatCurrency(lastTransaction.remainingBalance)}
                              </span>
                            </div>
                          </>
                        )}
                        <Separator className="bg-white/5 my-2" />
                        <div className="flex justify-between font-bold text-xs">
                          <span>TOTAL</span>
                          <span>{formatCurrency(lastTransaction.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button onClick={() => window.print()} className="w-full">
                    PRINT
                  </Button>
                </DialogContent>
              </Dialog>
              <Button
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 h-12"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
              >
                <CreditCard className="size-4 mr-2" />
                {isProcessing ? "PROCESSING..." : "CHECKOUT"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
