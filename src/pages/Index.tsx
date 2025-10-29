import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Palette, Shirt, Award, Clock } from "lucide-react";
import heroImage from "@/assets/hero-serigrafía.jpg";

const Index = () => {
  const categories = [
    {
      name: "Poleras",
      description: "Camisetas personalizadas de alta calidad",
      icon: Shirt,
      slug: "poleras",
    },
    {
      name: "Gorras",
      description: "Gorras bordadas y personalizadas",
      icon: Palette,
      slug: "gorras",
    },
    {
      name: "Tazas",
      description: "Tazas sublimadas con tus diseños",
      icon: Award,
      slug: "tazas",
    },
    {
      name: "Bolsos",
      description: "Mochilas y bolsos personalizados",
      icon: Clock,
      slug: "bolsos",
    },
  ];

  const features = [
    {
      title: "Calidad Premium",
      description: "Productos de primera calidad con materiales duraderos",
      icon: Award,
    },
    {
      title: "Diseños Únicos",
      description: "Personalización completa según tus necesidades",
      icon: Palette,
    },
    {
      title: "Entrega Rápida",
      description: "Tiempos de producción optimizados",
      icon: Clock,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Productos personalizados de serigrafía"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-hero opacity-90" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center text-primary-foreground animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Personalización que Destaca
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95">
            Serigrafía, sublimación y bordado profesional para empresas y particulares
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catalogo">
              <Button size="lg" className="shadow-glow">
                Ver Catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/cotizacion">
              <Button size="lg" variant="secondary" className="shadow-glow">
                Solicitar Cotización
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nuestras Categorías</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora nuestra amplia gama de productos personalizables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link key={index} to={`/catalogo?categoria=${category.slug}`}>
                  <Card className="group hover:shadow-glow transition-all duration-300 cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">¿Por Qué Elegirnos?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">¿Listo para Comenzar?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-95">
            Solicita una cotización gratuita y descubre cómo podemos hacer realidad tus ideas
          </p>
          <Link to="/cotizacion">
            <Button size="lg" variant="secondary" className="shadow-glow">
              Solicitar Cotización Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
