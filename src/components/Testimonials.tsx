import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "María G.", text: "Excelente servicio, en menos de 5 minutos tenía mis bolívares. Totalmente recomendado.", rating: 5 },
  { name: "Carlos R.", text: "La mejor tasa que he encontrado y la atención es de primera. Ya llevo más de 10 cambios con ellos.", rating: 5 },
  { name: "Ana P.", text: "Muy seguros y rápidos. Me dieron confianza desde el primer momento. 100% recomendados.", rating: 5 },
];

const Testimonials = () => (
  <section id="testimonios" className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-4">
          Lo que dicen nuestros clientes
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl p-8 border border-border"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-5 h-5 fill-teal text-teal" />
              ))}
            </div>
            <p className="text-foreground font-body mb-6 leading-relaxed italic">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-primary-foreground bg-primary text-sm">
                {t.name[0]}
              </div>
              <span className="font-heading font-semibold text-primary">{t.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
