import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-primary" />
              <span className="text-xl font-bold">SeriGraf Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Personalización profesional de productos con serigrafía, sublimación y bordado.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalogo" className="text-muted-foreground hover:text-primary transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors">
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+56 9 1234 5678</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contacto@serigrafpro.cl</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Santiago, Chile</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SeriGraf Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
