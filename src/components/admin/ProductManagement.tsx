import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number | null;
  status: string;
  stock_status: string;
  category_id: string | null;
  created_at: string;
  categories?: { name: string };
  product_images?: Array<{ image_url: string; is_primary: boolean }>;
}

interface Category {
  id: string;
  name: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    category_id: "",
    status: "borrador" as const,
    stock_status: "a_pedido" as const,
    image: null as File | null,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (name),
          product_images (image_url, is_primary)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los productos",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const uploadImage = async (file: File, productId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    // Insert image record
    const { error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: publicUrl,
        is_primary: true,
      });

    if (insertError) throw insertError;

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id || null,
        status: formData.status,
        stock_status: formData.stock_status,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        // Upload new image if provided
        if (formData.image) {
          await uploadImage(formData.image, editingProduct.id);
        }

        toast({
          title: "Producto actualizado",
          description: "El producto se actualizó correctamente",
        });
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Upload image if provided
        if (formData.image && newProduct) {
          await uploadImage(formData.image, newProduct.id);
        }

        toast({
          title: "Producto creado",
          description: "El producto se creó correctamente",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      price: "",
      category_id: "",
      status: "borrador",
      stock_status: "a_pedido",
      image: null,
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku,
      price: product.price?.toString() || "",
      category_id: product.category_id || "",
      status: product.status as any,
      stock_status: product.stock_status as any,
      image: null,
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      publicado: "default",
      borrador: "secondary",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status === "publicado" ? "Publicado" : "Borrador"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestión de Productos</h3>
          <p className="text-muted-foreground">
            Administra el catálogo de productos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos del producto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_status">Disponibilidad</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value) => setFormData({ ...formData, stock_status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_stock">En Stock</SelectItem>
                      <SelectItem value="bajo_stock">Bajo Stock</SelectItem>
                      <SelectItem value="a_pedido">A Pedido</SelectItem>
                      <SelectItem value="sin_stock">Sin Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Imagen (PNG o JPG)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                />
                {formData.image && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {formData.image.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            {products.length} producto{products.length !== 1 ? "s" : ""} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.product_images?.[0] ? (
                      <img
                        src={product.product_images[0].image_url}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.categories?.name || "-"}</TableCell>
                  <TableCell>
                    {product.price ? `$${product.price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.stock_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};