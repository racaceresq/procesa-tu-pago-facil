import { motion } from "framer-motion";
import { WhatsAppButton } from "./WhatsAppButton";

const CTASection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(170_55%_45%/0.15),transparent_60%)]" />
    <div className="container mx-auto px-4 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-5xl font-heading font-black text-primary-foreground mb-6">
          ¿Listo para vender tu saldo?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
          Escríbenos ahora y recibe tus bolívares en minutos. Sin complicaciones, sin riesgos.
        </p>
        <WhatsAppButton size="lg">
          Escribir por WhatsApp
        </WhatsAppButton>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
