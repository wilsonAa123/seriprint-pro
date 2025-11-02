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
import { Plus, Pencil, Trash2, FileText, Loader2, Upload, X, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_location: string | null;
  status: string;
  total_amount: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  payment_terms: string | null;
  delivery_time: string | null;
  valid_until: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
}

interface QuoteItem {
  id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_color: string;
  variant_size: string;
  printing_technique: string;
  number_of_colors: number;
  print_area_size: string;
  base_cost: number;
  additional_costs: number;
  notes: string;
}

interface QuoteAttachment {
  id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at?: string;
}

export const QuoteManagement = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteAttachments, setQuoteAttachments] = useState<QuoteAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_location: "",
    status: "pendiente" as const,
    valid_until: "",
    payment_terms: "",
    delivery_time: "",
    tax_amount: "0",
    discount_amount: "0",
    notes: "",
    internal_notes: "",
  });

  const [currentItem, setCurrentItem] = useState<QuoteItem>({
    product_name: "",
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
    variant_color: "",
    variant_size: "",
    printing_technique: "serigrafía",
    number_of_colors: 1,
    print_area_size: "",
    base_cost: 0,
    additional_costs: 0,
    notes: "",
  });

  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetails = async (quoteId: string) => {
    try {
      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId);

      if (itemsError) throw itemsError;
      setQuoteItems(items || []);

      // Fetch attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from("quote_attachments")
        .select("*")
        .eq("quote_id", quoteId);

      if (attachmentsError) throw attachmentsError;
      setQuoteAttachments(attachments || []);
    } catch (error: any) {
      console.error("Error fetching quote details:", error);
    }
  };

  const calculateItemSubtotal = (item: QuoteItem) => {
    const subtotal = (item.base_cost + item.additional_costs) * item.quantity;
    return subtotal;
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  };

  const addItem = () => {
    const subtotal = calculateItemSubtotal(currentItem);
    setQuoteItems([...quoteItems, { ...currentItem, subtotal }]);
    setCurrentItem({
      product_name: "",
      quantity: 1,
      unit_price: 0,
      subtotal: 0,
      variant_color: "",
      variant_size: "",
      printing_technique: "serigrafía",
      number_of_colors: 1,
      print_area_size: "",
      base_cost: 0,
      additional_costs: 0,
      notes: "",
    });
  };

  const removeItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (quoteId: string) => {
    const uploadedAttachments: QuoteAttachment[] = [];

    for (const file of attachmentFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${quoteId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("quote-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("quote-attachments")
        .getPublicUrl(filePath);

      uploadedAttachments.push({
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
    }

    // Insert attachment records
    if (uploadedAttachments.length > 0) {
      const { error: insertError } = await supabase
        .from("quote_attachments")
        .insert(
          uploadedAttachments.map((att) => ({
            quote_id: quoteId,
            ...att,
          }))
        );

      if (insertError) throw insertError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quoteItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes agregar al menos un producto a la cotización",
      });
      return;
    }

    setUploading(true);

    try {
      const totals = calculateTotals();
      
      const quoteData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone,
        customer_location: formData.customer_location || null,
        status: formData.status,
        valid_until: formData.valid_until || null,
        payment_terms: formData.payment_terms || null,
        delivery_time: formData.delivery_time || null,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        discount_amount: totals.discount,
        total_amount: totals.total,
        notes: formData.notes || null,
        internal_notes: formData.internal_notes || null,
      };

      if (editingQuote) {
        // Update existing quote
        const { error } = await supabase
          .from("quotes")
          .update(quoteData as any)
          .eq("id", editingQuote.id);

        if (error) throw error;

        // Delete old items and insert new ones
        await supabase.from("quote_items").delete().eq("quote_id", editingQuote.id);
        
        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(
            quoteItems.map((item) => ({
              quote_id: editingQuote.id,
              ...item,
            }))
          );

        if (itemsError) throw itemsError;

        // Upload new attachments if any
        if (attachmentFiles.length > 0) {
          await uploadAttachments(editingQuote.id);
        }

        toast({
          title: "Cotización actualizada",
          description: "La cotización se actualizó correctamente",
        });
      } else {
        // Create new quote
        const { data: newQuote, error } = await supabase
          .from("quotes")
          .insert(quoteData as any)
          .select()
          .single();

        if (error) throw error;

        // Insert items
        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(
            quoteItems.map((item) => ({
              quote_id: newQuote.id,
              ...item,
            }))
          );

        if (itemsError) throw itemsError;

        // Upload attachments if any
        if (attachmentFiles.length > 0) {
          await uploadAttachments(newQuote.id);
        }

        toast({
          title: "Cotización creada",
          description: `Cotización ${newQuote.quote_number} creada correctamente`,
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchQuotes();
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

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const { data: quoteData, error: fetchError } = await supabase
        .from('quotes')
        .select('customer_email, customer_name, quote_number')
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("quotes")
        .update({ status: newStatus as any })
        .eq("id", quoteId);

      if (error) throw error;

      // Enviar notificación por email si el cliente tiene email
      if (quoteData?.customer_email) {
        try {
          await supabase.functions.invoke('send-quote-notification', {
            body: {
              customerEmail: quoteData.customer_email,
              customerName: quoteData.customer_name,
              quoteNumber: quoteData.quote_number,
              status: newStatus
            }
          });
          toast({
            title: "Estado actualizado",
            description: "La cotización se actualizó y se envió notificación al cliente",
          });
        } catch (emailError) {
          console.error('Error sending notification:', emailError);
          toast({
            title: "Estado actualizado",
            description: "La cotización se actualizó (email no enviado)",
          });
        }
      } else {
        toast({
          title: "Estado actualizado",
          description: "El estado de la cotización se actualizó correctamente",
        });
      }

      fetchQuotes();
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
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_location: "",
      status: "pendiente",
      valid_until: "",
      payment_terms: "",
      delivery_time: "",
      tax_amount: "0",
      discount_amount: "0",
      notes: "",
      internal_notes: "",
    });
    setQuoteItems([]);
    setAttachmentFiles([]);
    setEditingQuote(null);
  };

  const openViewDialog = async (quote: Quote) => {
    setViewingQuote(quote);
    await fetchQuoteDetails(quote.id);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendiente: "secondary",
      enviada: "default",
      aceptada: "default",
      rechazada: "destructive",
      convertida: "default",
    };
    const labels = {
      pendiente: "Pendiente",
      enviada: "Enviada",
      aceptada: "Aceptada",
      rechazada: "Rechazada",
      convertida: "Convertida",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
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
          <h3 className="text-2xl font-bold">Gestión de Cotizaciones</h3>
          <p className="text-muted-foreground">
            Administra las solicitudes de cotización
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? "Editar Cotización" : "Nueva Cotización"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos de la cotización
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos del cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Nombre/Razón Social *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">Teléfono *</Label>
                      <Input
                        id="customer_phone"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_email">Correo</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_location">Dirección</Label>
                      <Input
                        id="customer_location"
                        value={formData.customer_location}
                        onChange={(e) => setFormData({ ...formData, customer_location: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Producto Base</Label>
                      <Input
                        value={currentItem.product_name}
                        onChange={(e) => setCurrentItem({ ...currentItem, product_name: e.target.value })}
                        placeholder="Ej: Camiseta, Taza, Gorra"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Talla</Label>
                      <Input
                        value={currentItem.variant_size}
                        onChange={(e) => setCurrentItem({ ...currentItem, variant_size: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        value={currentItem.variant_color}
                        onChange={(e) => setCurrentItem({ ...currentItem, variant_color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Técnica de Impresión</Label>
                      <Select
                        value={currentItem.printing_technique}
                        onValueChange={(value) => setCurrentItem({ ...currentItem, printing_technique: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serigrafía">Serigrafía</SelectItem>
                          <SelectItem value="sublimación">Sublimación</SelectItem>
                          <SelectItem value="vinil">Vinil</SelectItem>
                          <SelectItem value="dtf">DTF</SelectItem>
                          <SelectItem value="bordado">Bordado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nº Colores</Label>
                      <Input
                        type="number"
                        min="1"
                        value={currentItem.number_of_colors}
                        onChange={(e) => setCurrentItem({ ...currentItem, number_of_colors: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tamaño Área</Label>
                      <Input
                        value={currentItem.print_area_size}
                        onChange={(e) => setCurrentItem({ ...currentItem, print_area_size: e.target.value })}
                        placeholder="Ej: 20x30cm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Costo Base</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentItem.base_cost}
                        onChange={(e) => setCurrentItem({ ...currentItem, base_cost: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Costos Adicionales</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentItem.additional_costs}
                        onChange={(e) => setCurrentItem({ ...currentItem, additional_costs: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <Input
                        type="number"
                        value={calculateItemSubtotal(currentItem).toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas del Producto</Label>
                    <Textarea
                      value={currentItem.notes}
                      onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={addItem} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>

                  {quoteItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Técnica</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quoteItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {item.product_name} {item.variant_size && `- ${item.variant_size}`}
                              </TableCell>
                              <TableCell>{item.printing_technique}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.subtotal?.toFixed(2) || "0.00"}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Totales y Condiciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Totales y Condiciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Impuestos</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.tax_amount}
                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descuentos</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Total General</Label>
                      <Input
                        type="text"
                        value={`$${calculateTotals().total.toFixed(2)}`}
                        disabled
                        className="font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Validez</Label>
                      <Input
                        type="date"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Condiciones de Pago</Label>
                      <Input
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        placeholder="Ej: 50% adelanto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo de Entrega</Label>
                      <Input
                        value={formData.delivery_time}
                        onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                        placeholder="Ej: 7-10 días"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                        <SelectItem value="aceptada">Aceptada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                        <SelectItem value="convertida">Convertida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Archivos y Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Archivos de Referencia y Observaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Archivos (JPG, PNG, PDF, SVG - Max 10MB)</Label>
                    <Input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,application/pdf,image/svg+xml"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
                        if (validFiles.length !== files.length) {
                          toast({
                            variant: "destructive",
                            title: "Algunos archivos son muy grandes",
                            description: "El tamaño máximo es 10MB por archivo",
                          });
                        }
                        setAttachmentFiles(validFiles);
                      }}
                    />
                    {attachmentFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {attachmentFiles.length} archivo(s) seleccionado(s)
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Observaciones (Cliente)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Notas visibles para el cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notas Internas</Label>
                    <Textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      rows={3}
                      placeholder="Notas solo para uso interno"
                    />
                  </div>
                </CardContent>
              </Card>

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
                  {editingQuote ? "Actualizar" : "Crear Cotización"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Quote Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Cotización {viewingQuote?.quote_number}</DialogTitle>
            <DialogDescription>
              {viewingQuote && format(new Date(viewingQuote.created_at), "PPP", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          
          {viewingQuote && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nombre:</span> {viewingQuote.customer_name}</div>
                  <div><span className="font-medium">Teléfono:</span> {viewingQuote.customer_phone}</div>
                  {viewingQuote.customer_email && (
                    <div><span className="font-medium">Email:</span> {viewingQuote.customer_email}</div>
                  )}
                  {viewingQuote.customer_location && (
                    <div><span className="font-medium">Dirección:</span> {viewingQuote.customer_location}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Técnica</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quoteItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {item.product_name}
                            {item.variant_size && ` - ${item.variant_size}`}
                            {item.variant_color && ` (${item.variant_color})`}
                          </TableCell>
                          <TableCell>{item.printing_technique}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.subtotal?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Totales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${viewingQuote.subtotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>${viewingQuote.tax_amount?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuentos:</span>
                    <span>-${viewingQuote.discount_amount?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total:</span>
                    <span>${viewingQuote.total_amount?.toFixed(2) || "0.00"}</span>
                  </div>
                </CardContent>
              </Card>

              {quoteAttachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Archivos Adjuntos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {quoteAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{att.file_name}</span>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones</CardTitle>
          <CardDescription>
            {quotes.length} cotización{quotes.length !== 1 ? "es" : ""} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell>{format(new Date(quote.created_at), "PPP", { locale: es })}</TableCell>
                  <TableCell>
                    {quote.total_amount ? `$${quote.total_amount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={quote.status}
                      onValueChange={(value) => handleStatusChange(quote.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue>
                          {getStatusBadge(quote.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                        <SelectItem value="aceptada">Aceptada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                        <SelectItem value="convertida">Convertida</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(quote)}
                      >
                        <Eye className="h-4 w-4" />
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