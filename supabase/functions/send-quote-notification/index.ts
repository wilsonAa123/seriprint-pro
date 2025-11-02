import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteNotificationRequest {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  status: 'aceptada' | 'rechazada' | 'enviada' | 'pendiente' | 'completada';
}

const getEmailContent = (status: string, customerName: string, quoteNumber: string) => {
  const statusMessages = {
    aceptada: {
      subject: `✅ Cotización ${quoteNumber} Aceptada`,
      html: `
        <h2>¡Buenas noticias, ${customerName}!</h2>
        <p>Tu cotización <strong>${quoteNumber}</strong> ha sido <strong>aceptada</strong>.</p>
        <p>Nos pondremos en contacto contigo pronto para coordinar los siguientes pasos.</p>
        <p>¡Gracias por confiar en nosotros!</p>
        <br>
        <p>Saludos cordiales,<br>El Equipo</p>
      `
    },
    rechazada: {
      subject: `❌ Cotización ${quoteNumber} - Actualización`,
      html: `
        <h2>Hola ${customerName},</h2>
        <p>Lamentamos informarte que tu cotización <strong>${quoteNumber}</strong> no pudo ser procesada en este momento.</p>
        <p>Si tienes alguna pregunta o deseas realizar ajustes, no dudes en contactarnos.</p>
        <p>Estamos aquí para ayudarte.</p>
        <br>
        <p>Saludos cordiales,<br>El Equipo</p>
      `
    },
    enviada: {
      subject: `🚚 Tu pedido ${quoteNumber} está en camino`,
      html: `
        <h2>¡Excelentes noticias, ${customerName}!</h2>
        <p>Tu pedido correspondiente a la cotización <strong>${quoteNumber}</strong> ya ha sido <strong>enviado</strong>.</p>
        <p>Recibirás tu pedido pronto. Te notificaremos cuando esté cerca de tu ubicación.</p>
        <p>¡Gracias por tu paciencia!</p>
        <br>
        <p>Saludos cordiales,<br>El Equipo</p>
      `
    },
    completada: {
      subject: `✨ Pedido ${quoteNumber} Completado`,
      html: `
        <h2>¡Gracias ${customerName}!</h2>
        <p>Tu pedido <strong>${quoteNumber}</strong> ha sido completado exitosamente.</p>
        <p>Esperamos que estés satisfecho con tu compra. Si tienes algún comentario o necesitas soporte, estamos aquí para ayudarte.</p>
        <p>¡Esperamos volver a trabajar contigo pronto!</p>
        <br>
        <p>Saludos cordiales,<br>El Equipo</p>
      `
    },
    pendiente: {
      subject: `⏳ Cotización ${quoteNumber} Recibida`,
      html: `
        <h2>Hola ${customerName},</h2>
        <p>Hemos recibido tu cotización <strong>${quoteNumber}</strong> y está siendo revisada.</p>
        <p>Te contactaremos pronto con más información.</p>
        <br>
        <p>Saludos cordiales,<br>El Equipo</p>
      `
    }
  };

  return statusMessages[status as keyof typeof statusMessages] || statusMessages.pendiente;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, quoteNumber, status }: QuoteNotificationRequest = await req.json();

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "El email del cliente es requerido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailContent = getEmailContent(status, customerName, quoteNumber);

    const emailResponse = await resend.emails.send({
      from: "Cotizaciones <onboarding@resend.dev>",
      to: [customerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error al enviar email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
