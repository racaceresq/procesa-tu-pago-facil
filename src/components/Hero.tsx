import { motion } from "framer-motion";
import { WhatsAppButton } from "./WhatsAppButton";
import { Shield, Zap, DollarSign } from "lucide-react";

const Hero = () => (
  <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
    {/* Decorative circles */}
    <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-teal-glow/10 blur-3xl" />
    <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-navy-light/20 blur-3xl" />

    <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
      <div className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-6">
            {[
              { icon: Shield, label: "Seguro" },
              { icon: Zap, label: "Rápido" },
              { icon: DollarSign, label: "Mejor tasa" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-heading font-semibold backdrop-blur-sm">
                <Icon className="w-3.5 h-3.5" /> {label}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-primary-foreground leading-tight mb-6">
            Vende tu saldo<br />
            <span className="text-teal-light">PayPal</span> en<br />
            Bolívares al instante
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 font-body mb-10 max-w-xl leading-relaxed">
            Recibe tu dinero en minutos con la mejor tasa del mercado. 
            Atención personalizada, seguridad garantizada y el proceso más rápido de Venezuela.
          </p>

          <WhatsAppButton size="lg">
            Vender mi saldo ahora
          </WhatsAppButton>
        </motion.div>
      </div>
    </div>

    {/* Bottom wave */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H0Z" fill="hsl(210 20% 98%)" />
      </svg>
    </div>
  </section>
);

export default Hero;
