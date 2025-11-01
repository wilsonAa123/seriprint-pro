import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Upload, X } from "lucide-react";

interface QuoteItem {
  product_id: string;
  product_name: string;
  quantity: number;
  variant_size?: string;
  variant_color?: string;
  printing_technique?: string;
  number_of_colors?: number;
  print_area_size?: string;
  notes?: string;
}

const Cotizacion = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("producto");
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Client data
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  
  // Quote items
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  
  // Files
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        addQuoteItem(product);
      }
    }
  }, [productId, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "publicado");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    }
  };

  const addQuoteItem = (product?: any) => {
    const newItem: QuoteItem = {
      product_id: product?.id || "",
      product_name: product?.name || "",
      quantity: 1,
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...quoteItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
      }
    }
    
    setQuoteItems(updated);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !clientPhone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa los campos requeridos",
      });
      return;
    }

    if (quoteItems.length === 0 || quoteItems.some(item => !item.product_id)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor agrega al menos un producto válido",
      });
      return;
    }

    setLoading(true);

    try {
      // Create quote
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          customer_name: clientName,
          customer_phone: clientPhone,
          customer_email: clientEmail || null,
          customer_location: clientLocation || null,
          notes: clientNotes || null,
          status: "pendiente",
        } as any)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const itemsToInsert = quoteItems.map(item => ({
        quote_id: quoteData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        variant_size: item.variant_size || null,
        variant_color: item.variant_color || null,
        printing_technique: item.printing_technique || null,
        number_of_colors: item.number_of_colors || null,
        print_area_size: item.print_area_size || null,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${quoteData.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("quote-attachments")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("quote-attachments")
          .getPublicUrl(fileName);

        await supabase.from("quote_attachments").insert({
          quote_id: quoteData.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        } as any);
      }

      toast({
        title: "¡Cotización enviada!",
        description: `Tu solicitud ${quoteData.quote_number} ha sido recibida. Te contactaremos pronto.`,
      });

      // Reset form
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientLocation("");
      setClientNotes("");
      setQuoteItems([]);
      setFiles([]);

    } catch (error: any) {
      console.error("Error creating quote:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la cotización. Por favor intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Solicitar Cotización</h1>
            <p className="text-muted-foreground">
              Completa el formulario y te contactaremos con una cotización personalizada
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Datos de Contacto</CardTitle>
                <CardDescription>Información para contactarte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">
                      Nombre o Razón Social <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">
                      Teléfono <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Correo Electrónico</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientLocation">Ubicación</Label>
                    <Input
                      id="clientLocation"
                      value={clientLocation}
                      onChange={(e) => setClientLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientNotes">Comentarios Adicionales</Label>
                  <Textarea
                    id="clientNotes"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
                <CardDescription>Agrega los productos que necesitas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quoteItems.map((item, index) => (
                  <Card key={index} className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeQuoteItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Producto <span className="text-destructive">*</span></Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateQuoteItem(index, "product_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Cantidad <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(index, "quantity", parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Talla</Label>
                          <Input
                            value={item.variant_size || ""}
                            onChange={(e) => updateQuoteItem(index, "variant_size", e.target.value)}
                            placeholder="Ej: S, M, L, XL"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input
                            value={item.variant_color || ""}
                            onChange={(e) => updateQuoteItem(index, "variant_color", e.target.value)}
                            placeholder="Ej: Rojo, Azul, Negro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Técnica de Impresión</Label>
                          <Select
                            value={item.printing_technique || ""}
                            onValueChange={(value) => updateQuoteItem(index, "printing_technique", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serigrafia">Serigrafía</SelectItem>
                              <SelectItem value="sublimacion">Sublimación</SelectItem>
                              <SelectItem value="vinil">Vinil</SelectItem>
                              <SelectItem value="dtf">DTF</SelectItem>
                              <SelectItem value="bordado">Bordado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Número de Colores</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.number_of_colors || ""}
                            onChange={(e) => updateQuoteItem(index, "number_of_colors", parseInt(e.target.value))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tamaño de Área</Label>
                          <Input
                            value={item.print_area_size || ""}
                            onChange={(e) => updateQuoteItem(index, "print_area_size", e.target.value)}
                            placeholder="Ej: 20x30 cm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notas del Producto</Label>
                        <Textarea
                          value={item.notes || ""}
                          onChange={(e) => updateQuoteItem(index, "notes", e.target.value)}
                          rows={2}
                          placeholder="Detalles adicionales sobre este producto"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => addQuoteItem()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>

            {/* Files */}
            <Card>
              <CardHeader>
                <CardTitle>Archivos de Referencia</CardTitle>
                <CardDescription>
                  Sube imágenes, bocetos, logotipos o ejemplos de diseño (JPG, PNG, PDF, SVG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="files" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Seleccionar Archivos</span>
                    </div>
                  </Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.svg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cotizacion;
