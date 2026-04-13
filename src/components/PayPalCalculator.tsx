import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Calculator, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PayPalCalculator = () => {
  const [amount, setAmount] = useState<string>("100");
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchRate = async () => {
    setLoading(true);
    try {
      // Try to get today's rate from DB
      const { data } = await supabase
        .from("exchange_rates")
        .select("*")
        .eq("source", "BCV")
        .order("rate_date", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setRate(Number(data[0].rate));
        setRateDate(data[0].rate_date);
      }
    } catch (err) {
      console.error("Error fetching rate:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const bolivares = rate ? numAmount * rate : 0;

  return (
    <section id="calculadora" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Calculadora <span className="text-gradient">PayPal a Bolívares</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Calcula cuánto recibirás en bolívares según la tasa BCV del día
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="bg-card rounded-2xl border border-border p-8 shadow-[var(--shadow-card)]">
            {/* Rate display */}
            <div className="flex items-center justify-between mb-6 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-sm font-heading font-semibold text-foreground">
                  Tasa BCV:
                </span>
              </div>
              {loading ? (
                <span className="text-sm text-muted-foreground">Cargando...</span>
              ) : rate ? (
                <div className="text-right">
                  <span className="text-lg font-heading font-bold text-secondary">
                    {rate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rateDate + "T12:00:00").toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-destructive">No disponible</span>
              )}
            </div>

            {/* Input */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-heading font-semibold text-foreground mb-2 block">
                  Monto en USD (PayPal)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg font-heading font-bold h-14"
                    placeholder="100.00"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-secondary" />
                </div>
              </div>

              {/* Result */}
              <div>
                <label className="text-sm font-heading font-semibold text-foreground mb-2 block">
                  Recibirás en Bolívares
                </label>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <span className="text-3xl font-heading font-black text-gradient">
                    {bolivares.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-lg font-heading font-bold text-muted-foreground ml-2">Bs</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRate}
              disabled={loading}
              className="mt-4 w-full text-muted-foreground hover:text-secondary"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualizar tasa
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PayPalCalculator;
