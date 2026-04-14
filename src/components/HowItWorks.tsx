import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, Send, Banknote } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Regístrate", desc: "Crea tu cuenta en nuestra plataforma de forma rápida y sencilla." },
  { icon: ShieldCheck, title: "Verifica tu identidad", desc: "Sube tu cédula de identidad para validar tu cuenta." },
  { icon: Send, title: "Envía tu saldo", desc: "Transfiere tu saldo PayPal a nuestras cuentas de forma segura." },
  { icon: Banknote, title: "Recibe en Bs", desc: "Tu pago en bolívares llega en minutos a tu cuenta bancaria." },
];

const HowItWorks = () => (
  <section id="como-funciona" className="py-20 md:py-28 bg-muted/50">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-4">
          ¿Cómo funciona?
        </h2>
        <p className="text-muted-foreground text-lg">4 pasos simples para recibir tu dinero</p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-8 relative">
        <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative text-center"
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
              style={{ background: "var(--gradient-hero)" }}>
              <s.icon className="w-10 h-10 text-primary-foreground" />
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-teal text-primary-foreground font-heading font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-heading font-bold text-primary mb-2">{s.title}</h3>
            <p className="text-muted-foreground font-body">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
