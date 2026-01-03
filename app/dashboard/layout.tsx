import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { LowStockNotification } from "@/components/low-stock-notification"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" storageKey="bike-parts-theme" enableSystem={false}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background selection:bg-primary/20">
          <AppSidebar />
          <SidebarInset className="flex flex-col bg-background/50">
            <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b border-white/5 px-3 sm:px-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-white/10 mx-2" />
              <div className="flex-1">
                <span className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                  System // Operational
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 rounded border border-primary/30 bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                  v1.0.4-BETA
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <LowStockNotification />
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
