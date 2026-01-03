import { formatCurrency } from "./currency"

interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

interface ReceiptData {
  transactionId: string
  date: string
  customer?: {
    name: string
    phone?: string
  }
  items: ReceiptItem[]
  subtotal: number
  tax: number
  total: number
  previousBalance?: number
  amountPaid?: number
  remainingBalance?: number
  isWalkIn: boolean
  paymentMethod: string
}

export async function generatePDFReceipt(data: ReceiptData) {
  if (typeof window === "undefined") return
  
  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("BIKE PARTS DISTRO SYS", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("TERMINAL #01-A", pageWidth / 2, yPos, { align: "center" })
  yPos += 6

  doc.setFontSize(10)
  doc.text(data.date, pageWidth / 2, yPos, { align: "center" })
  yPos += 10

  // Customer Info
  if (!data.isWalkIn && data.customer) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`Customer: ${data.customer.name}`, margin, yPos)
    yPos += 6
    if (data.customer.phone) {
      doc.setFont("helvetica", "normal")
      doc.text(`Phone: ${data.customer.phone}`, margin, yPos)
      yPos += 6
    }
    yPos += 3
  }

  // Items
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Items:", margin, yPos)
  yPos += 6

  doc.setFont("helvetica", "normal")
  data.items.forEach((item) => {
    const itemText = `${item.name.substring(0, 30)} x${item.quantity}`
    const priceText = formatCurrency(item.price * item.quantity)
    doc.text(itemText, margin, yPos)
    doc.text(priceText, pageWidth - margin, yPos, { align: "right" })
    yPos += 5
  })

  yPos += 5

  // Totals
  doc.setFontSize(10)
  doc.text("Subtotal:", margin, yPos)
  doc.text(formatCurrency(data.subtotal), pageWidth - margin, yPos, { align: "right" })
  yPos += 5

  doc.text("Tax (8%):", margin, yPos)
  doc.text(formatCurrency(data.tax), pageWidth - margin, yPos, { align: "right" })
  yPos += 5

  if (!data.isWalkIn && data.previousBalance !== undefined) {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 165, 0) // Orange for outstanding
    doc.text("Previous Outstanding:", margin, yPos)
    doc.text(formatCurrency(data.previousBalance), pageWidth - margin, yPos, { align: "right" })
    yPos += 5

    doc.setTextColor(0, 0, 0) // Black
    doc.setFont("helvetica", "normal")
    doc.text("Amount Paid:", margin, yPos)
    doc.text(formatCurrency(data.amountPaid || 0), pageWidth - margin, yPos, { align: "right" })
    yPos += 5

    doc.setFont("helvetica", "bold")
    if (data.remainingBalance && data.remainingBalance > 0) {
      doc.setTextColor(255, 165, 0) // Orange
    } else {
      doc.setTextColor(0, 128, 0) // Green
    }
    doc.text("Remaining Balance:", margin, yPos)
    doc.text(formatCurrency(data.remainingBalance || 0), pageWidth - margin, yPos, { align: "right" })
    yPos += 5
    doc.setTextColor(0, 0, 0) // Black
  }

  // Total
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL:", margin, yPos)
  doc.text(formatCurrency(data.total), pageWidth - margin, yPos, { align: "right" })
  yPos += 8

  // Payment Method
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, margin, yPos)
  yPos += 8

  // Footer
  doc.setFontSize(8)
  doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" })
  yPos += 4
  doc.text(`Transaction ID: ${data.transactionId.substring(0, 8)}`, pageWidth / 2, yPos, { align: "center" })

  // Save PDF
  const fileName = `receipt_${data.date.replace(/[\/\s:]/g, "_")}_${data.transactionId.substring(0, 8)}.pdf`
  doc.save(fileName)
}

