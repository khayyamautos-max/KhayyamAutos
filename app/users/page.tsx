import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Plus, Mail, Shield, User, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BackButton } from "@/components/back-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserManagementClient } from "./user-management-client"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin or owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    redirect("/dashboard")
  }

  // Get all users
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">User Management</h1>
            <p className="text-muted-foreground italic text-xs sm:text-sm font-mono">
              Admin control // Account creation & role assignment
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40">
              <Plus className="mr-2 size-4" /> Create New User
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account. The user will need to be created in Supabase Dashboard first,
                then you can update their role here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="font-semibold mb-2">Note:</p>
                <p>
                  To create a new user, go to <strong>Supabase Dashboard → Authentication → Users → Add User</strong>.
                  After creating the user, you can update their role and details here.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            System Users ({users?.length || 0})
          </CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">
                    User
                  </TableHead>
                  <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">
                    Email
                  </TableHead>
                  <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">
                    Role
                  </TableHead>
                  <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest">
                    Created
                  </TableHead>
                  <TableHead className="text-primary font-mono uppercase text-[10px] tracking-widest text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="size-4 text-primary" />
                        </div>
                        <span className="font-medium">{user.full_name || "No name"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="size-3 text-primary/60" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "admin"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : user.role === "owner"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }
                      >
                        <Shield className="size-3 mr-1" />
                        {user.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserManagementClient user={user} currentUserId={userData.user.id} />
                    </TableCell>
                  </TableRow>
                ))}
                {(!users || users.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

