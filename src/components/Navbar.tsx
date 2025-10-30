import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Search, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [cartItems, setCartItems] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchUserRole(session.user.id);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    
    setUserRole(data?.role || null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    navigate("/");
  };

  const isStaff = userRole && ["admin", "vendedor", "diseñador"].includes(userRole);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gradient-primary" />
            <span className="text-xl font-bold">SeriGraf Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/catalogo" className="text-sm font-medium hover:text-primary transition-colors">
              Catálogo
            </Link>
            <Link to="/servicios" className="text-sm font-medium hover:text-primary transition-colors">
              Servicios
            </Link>
            <Link to="/contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search className="h-5 w-5" />
            </Button>
            
            <Link to="/cotizacion">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </Button>
            </Link>

            {!user ? (
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Ingresar
                </Button>
              </Link>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                {isStaff && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      Panel Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <Link to="/catalogo" className="text-lg font-medium hover:text-primary transition-colors">
                    Catálogo
                  </Link>
                  <Link to="/servicios" className="text-lg font-medium hover:text-primary transition-colors">
                    Servicios
                  </Link>
                  <Link to="/contacto" className="text-lg font-medium hover:text-primary transition-colors">
                    Contacto
                  </Link>
                  {!user ? (
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Ingresar
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {isStaff && (
                        <Link to="/admin">
                          <Button variant="outline" className="w-full mb-2">
                            Panel Admin
                          </Button>
                        </Link>
                      )}
                      <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
