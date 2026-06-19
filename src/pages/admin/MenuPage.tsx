import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  UtensilsCrossed,
  Loader2,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageContainer } from "@/components/shared/PageContainer";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { menuService } from "@/services/menu.service";
import type { MenuItem } from "@/types";

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional(),
});

type MenuItemForm = z.infer<typeof menuItemSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: () => menuService.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: menuService.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const allCategories = ["All", ...(categories || [])];
  const menuItems = menuData?.data || [];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: MenuItemForm) => menuService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Menu item created!");
      closeDialog();
    },
    onError: () => toast.error("Failed to create menu item"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) => menuService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item updated!");
      closeDialog();
    },
    onError: () => toast.error("Failed to update menu item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Menu item deleted!");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: () => toast.error("Failed to delete menu item"),
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    reset({ name: "", description: "", price: 0, category: "", imageUrl: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description);
    setValue("price", item.price);
    setValue("category", item.category);
    setValue("imageUrl", item.imageUrl || "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    reset();
  };

  const onSubmit = (data: MenuItemForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleAvailability = (item: MenuItem) => {
    updateMutation.mutate({ id: item._id, data: { isAvailable: !item.isAvailable } });
  };

  return (
    <PageContainer
      title="Menu Management"
      description="Manage your restaurant's menu items"
      action={
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      }
    >
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted text-text-secondary hover:bg-muted/80 hover:text-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items found"
          description={search ? "Try adjusting your search" : "Add your first menu item to get started"}
          action={
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredItems.map((item) => (
            <motion.div key={item._id} variants={itemVariants} layout>
              <Card className="group overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-0">
                  <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-text-secondary/30" />
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="destructive">Unavailable</Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon-sm" variant="secondary" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                      <span className="text-sm font-bold text-primary whitespace-nowrap">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="muted" className="text-xs">{item.category}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">
                          {item.isAvailable ? "Available" : "Off"}
                        </span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => toggleAvailability(item)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the menu item details" : "Add a new item to your menu"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Butter Chicken" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A delicious dish..." {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01" 
                  placeholder="12.99" 
                  {...register("price", { valueAsNumber: true })} 
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" {...register("category")}>
                  <option value="">Select...</option>
                  {(categories || []).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Appetizers">Appetizers</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Sides">Sides</option>
                  <option value="Salads">Salads</option>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input id="imageUrl" placeholder="https://..." {...register("imageUrl")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem._id)}
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
