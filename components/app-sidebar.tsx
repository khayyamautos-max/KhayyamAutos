"use client"

import { LayoutDashboard, Package, ShoppingCart, Users, Building2, History, LogOut, UserCog } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "POS Terminal", href: "/pos" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Building2, label: "Companies", href: "/companies" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: History, label: "Transaction History", href: "/history" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }
    fetchUserRole()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  const isAdmin = userRole === "admin" || userRole === "owner"

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-sidebar/80 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-8 relative flex items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20">
            <Image
              src="/images/image-removebg-preview-20-281-29.png"
              alt="Khayyam Kakakhel Logo"
              fill
              className="object-contain p-1"
            />
          </div>
          {state !== "collapsed" && (
            <span className="font-bold tracking-tight text-primary text-sm leading-tight uppercase">
              Khayyam Kakakhel
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarMenu className="px-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className={cn(
                  "h-11 transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground",
                )}
                tooltip={item.label}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="size-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/users"}
                className={cn(
                  "h-11 transition-all duration-200",
                  pathname === "/users"
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground",
                )}
                tooltip="User Management"
              >
                <Link href="/users" className="flex items-center gap-3">
                  <UserCog className="size-5" />
                  <span className="font-medium">User Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
