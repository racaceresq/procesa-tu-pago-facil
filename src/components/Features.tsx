import { motion } from "framer-motion";
import { Shield, Zap, HeadphonesIcon, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Transacciones protegidas y verificadas. Tu dinero siempre está respaldado.",
  },
  {
    icon: Zap,
    title: "Ultra Rápido",
    description: "Recibe tus bolívares en minutos. Sin esperas, sin complicaciones.",
  },
  {
    icon: HeadphonesIcon,
    title: "Atención Premium",
    description: "Asistencia personalizada por WhatsApp. Te acompañamos en cada paso.",
  },
  {
    icon: TrendingUp,
    title: "Mejor Tasa",
    description: "Tasas competitivas y actualizadas en tiempo real. Siempre ganas más con nosotros.",
  },
];

const Features = () => (
  <section id="servicios" className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-4">
          ¿Por qué elegirnos?
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Somos la opción #1 en Venezuela para cambiar tu saldo PayPal
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group bg-card rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
            style={{ boxShadow: "var(--shadow-card)" }}
            whileHover={{ boxShadow: "var(--shadow-hover)" } as any}
          >
            <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-teal/20 transition-colors">
              <f.icon className="w-8 h-8 text-teal" />
            </div>
            <h3 className="text-xl font-heading font-bold text-primary mb-3">{f.title}</h3>
            <p className="text-muted-foreground font-body leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
