import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  stockStatus: string;
  sku: string;
  price?: number;
}

const stockStatusConfig = {
  en_stock: { label: "En Stock", variant: "default" as const, color: "bg-success" },
  bajo_stock: { label: "Bajo Stock", variant: "secondary" as const, color: "bg-warning" },
  a_pedido: { label: "A Pedido", variant: "outline" as const, color: "bg-muted" },
  sin_stock: { label: "Sin Stock", variant: "destructive" as const, color: "bg-destructive" },
};

export const ProductCard = ({ id, name, image, category, stockStatus, sku, price }: ProductCardProps) => {
  const statusInfo = stockStatusConfig[stockStatus as keyof typeof stockStatusConfig] || stockStatusConfig.a_pedido;

  return (
    <Card className="group overflow-hidden hover:shadow-glow transition-all duration-300 animate-fade-in">
      <Link to={`/producto/${id}`}>
        <div className="relative overflow-hidden aspect-square bg-muted">
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-3 right-3" variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{category}</p>
        <Link to={`/producto/${id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">SKU: {sku}</p>
          {price && (
            <p className="text-lg font-bold text-primary">${price.toLocaleString()}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" size="sm">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Solicitar Cotización
        </Button>
      </CardFooter>
    </Card>
  );
};
