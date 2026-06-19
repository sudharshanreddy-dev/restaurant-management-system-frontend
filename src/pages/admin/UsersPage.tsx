import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Users, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { PageContainer } from "@/components/shared/PageContainer";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import type { User } from "@/types";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cashier", "kitchen"], { message: "Role is required" }),
});

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "cashier", "kitchen"], { message: "Role is required" }),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "accent" }> = {
  admin: { label: "Admin", variant: "default" },
  cashier: { label: "Cashier", variant: "secondary" },
  kitchen: { label: "Kitchen", variant: "accent" },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  });

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const createMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created!");
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => toast.error("Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated!");
      setEditDialogOpen(false);
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted!");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const openEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({ name: user.name, email: user.email, role: user.role });
    setEditDialogOpen(true);
  };

  const onCreateSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserForm) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser._id, data });
    }
  };

  const allUsers = users || [];

  return (
    <PageContainer
      title="User Management"
      description="Manage staff accounts and roles"
      action={
        <Button onClick={() => { createForm.reset(); setCreateDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : allUsers.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No users found" 
          description="Add your first staff member"
          action={
            <Button onClick={() => { createForm.reset(); setCreateDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Joined</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user, idx) => {
                    const role = roleConfig[user.role] || { label: user.role, variant: "muted" as const };
                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={role.variant} className="gap-1">
                            <Shield className="h-3 w-3" />
                            {role.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => openEdit(user)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new staff account</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="John Doe" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="john@restrohub.com" {...createForm.register("email")} />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" {...createForm.register("password")} />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select {...createForm.register("role")}>
                <option value="">Select role...</option>
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen Staff</option>
              </Select>
              {createForm.formState.errors.role && (
                <p className="text-xs text-destructive">{createForm.formState.errors.role.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...editForm.register("email")} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select {...editForm.register("role")}>
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen Staff</option>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedUser?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
