import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/584121234567?text=Hola%2C%20quiero%20vender%20mi%20saldo%20PayPal";

const WhatsAppButton = ({ children, className = "", size = "default" }: { children: React.ReactNode; className?: string; size?: "default" | "lg" }) => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-2 rounded-full font-heading font-bold transition-all duration-300 bg-whatsapp text-primary-foreground hover:bg-whatsapp-hover animate-pulse-glow ${
      size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3 text-sm"
    } ${className}`}
  >
    <MessageCircle className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
    {children}
  </a>
);

export { WhatsAppButton, WHATSAPP_URL };
