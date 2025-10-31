import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import poleraImage from "@/assets/polera-muestra.jpg";
import gorraImage from "@/assets/gorra-muestra.jpg";

const Catalogo = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select(`
          *,
          categories (name),
          product_images (image_url, is_primary)
        `)
        .eq("status", "publicado");

      const { data, error } = await query;

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesStatus = selectedStatus === "all" || product.stock_status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Fallback images for demonstration
  const getProductImage = (product: any) => {
    const primaryImage = product.product_images?.find((img: any) => img.is_primary);
    if (primaryImage) return primaryImage.image_url;
    
    // Use sample images based on category
    if (product.categories?.name?.toLowerCase().includes("polera")) return poleraImage;
    if (product.categories?.name?.toLowerCase().includes("gorra")) return gorraImage;
    return poleraImage;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-12 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Catálogo de Productos</h1>
            <p className="text-lg text-muted-foreground">
              Explora nuestra selección completa de productos personalizables
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b bg-background/95 backdrop-blur sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Disponibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="en_stock">En Stock</SelectItem>
                  <SelectItem value="bajo_stock">Bajo Stock</SelectItem>
                  <SelectItem value="a_pedido">A Pedido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Filter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground">
                  Intenta ajustar los filtros o el término de búsqueda
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      image={getProductImage(product)}
                      category={product.categories?.name || "Sin categoría"}
                      stockStatus={product.stock_status}
                      sku={product.sku}
                      price={product.price}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Catalogo;
