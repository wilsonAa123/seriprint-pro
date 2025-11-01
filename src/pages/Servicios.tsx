import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shirt, Palette, Sparkles, Package, Clock, Award, ArrowRight } from "lucide-react";

const Servicios = () => {
  const services = [
    {
      title: "Serigrafía",
      description: "Impresión de alta calidad en textiles y diversos materiales. Ideal para grandes cantidades con diseños de múltiples colores.",
      icon: Shirt,
      features: [
        "Durabilidad excepcional",
        "Colores vibrantes y resistentes",
        "Ideal para 50+ unidades",
        "Perfecto para textiles"
      ]
    },
    {
      title: "Sublimación",
      description: "Técnica de impresión que transfiere diseños con colores fotográficos a productos especialmente tratados.",
      icon: Palette,
      features: [
        "Colores ilimitados",
        "Detalles fotográficos",
        "No se siente al tacto",
        "Excelente para tazas y poliéster"
      ]
    },
    {
      title: "Vinil Textil",
      description: "Corte de vinil de alta calidad para diseños precisos y profesionales en prendas y accesorios.",
      icon: Sparkles,
      features: [
        "Acabado profesional",
        "Colores sólidos y brillantes",
        "Perfecto para logos y textos",
        "Ideal para pocas unidades"
      ]
    },
    {
      title: "DTF (Direct to Film)",
      description: "Tecnología moderna que permite impresiones de alta calidad en cualquier tipo de tela con gran detalle.",
      icon: Package,
      features: [
        "Funciona en cualquier tela",
        "Detalles increíbles",
        "Colores brillantes",
        "Durabilidad garantizada"
      ]
    },
    {
      title: "Bordado",
      description: "Bordado personalizado de alta calidad que añade elegancia y durabilidad a tus prendas.",
      icon: Award,
      features: [
        "Acabado premium",
        "Máxima durabilidad",
        "Ideal para uniformes corporativos",
        "Aspecto profesional"
      ]
    },
    {
      title: "Diseño Gráfico",
      description: "Creación y adaptación de diseños profesionales para todos nuestros servicios de personalización.",
      icon: Palette,
      features: [
        "Diseñadores experimentados",
        "Adaptación de logos",
        "Propuestas creativas",
        "Visualización previa"
      ]
    }
  ];

  const process = [
    {
      step: "1",
      title: "Consulta",
      description: "Contáctanos con tu idea y te asesoramos sobre la mejor técnica para tu proyecto."
    },
    {
      step: "2",
      title: "Cotización",
      description: "Recibe una cotización detallada sin compromiso en menos de 24 horas."
    },
    {
      step: "3",
      title: "Diseño",
      description: "Aprobamos juntos el diseño final antes de comenzar la producción."
    },
    {
      step: "4",
      title: "Producción",
      description: "Fabricamos tu pedido con los más altos estándares de calidad."
    },
    {
      step: "5",
      title: "Entrega",
      description: "Recibe tu pedido en el tiempo acordado, listo para usar."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 gradient-hero">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h1 className="text-5xl font-bold mb-6">Nuestros Servicios</h1>
            <p className="text-xl max-w-2xl mx-auto opacity-95 mb-8">
              Ofrecemos una amplia gama de técnicas de personalización para darle vida a tus ideas
            </p>
            <Link to="/cotizacion">
              <Button size="lg" variant="secondary" className="shadow-glow">
                Solicitar Cotización
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Técnicas de Personalización</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Utilizamos las mejores técnicas del mercado para garantizar resultados excepcionales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card key={index} className="hover:shadow-glow transition-all duration-300 animate-fade-in">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-primary text-xs font-bold">✓</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Proceso de Trabajo</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un proceso simple y transparente de principio a fin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {process.map((item, index) => (
                <div key={index} className="text-center animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-glow transition-all">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                    <Clock className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Entregas Rápidas</h3>
                  <p className="text-muted-foreground">
                    Tiempos de producción optimizados para que recibas tu pedido cuando lo necesitas
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-glow transition-all">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                    <Award className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Calidad Garantizada</h3>
                  <p className="text-muted-foreground">
                    Utilizamos materiales premium y tecnología de punta para resultados excepcionales
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-glow transition-all">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Asesoría Personalizada</h3>
                  <p className="text-muted-foreground">
                    Te ayudamos a elegir la mejor técnica y diseño para tu proyecto
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 gradient-hero">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">¿Listo para Tu Proyecto?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-95">
              Solicita una cotización gratuita y comencemos a trabajar en tu idea
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cotizacion">
                <Button size="lg" variant="secondary" className="shadow-glow">
                  Solicitar Cotización
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contacto">
                <Button size="lg" variant="outline" className="shadow-glow border-white text-white hover:bg-white hover:text-primary">
                  Contáctanos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Servicios;
