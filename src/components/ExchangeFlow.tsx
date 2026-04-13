import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { DollarSign, ArrowRight, Building2, Smartphone, CreditCard, Send, CheckCircle } from "lucide-react";

interface Props {
  userId: string;
}

type Step = "calculator" | "paypal_accounts" | "bank_details" | "confirmation";

const VENEZUELAN_BANKS = [
  "Banco de Venezuela",
  "Banco Nacional de Crédito (BNC)",
  "Banesco",
  "Banco Mercantil",
  "Banco Provincial (BBVA)",
  "Banco del Tesoro",
  "Banco Bicentenario",
  "Banco Exterior",
  "Banco Caroní",
  "Banco Sofitasa",
  "Banco Plaza",
  "Banco Venezolano de Crédito",
  "Bancamiga",
  "Banplus",
  "100% Banco",
  "Banco Activo",
  "Mibanco",
  "Bancrecer",
];

const ExchangeFlow = ({ userId }: Props) => {
  const [step, setStep] = useState<Step>("calculator");
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [paypalAccounts, setPaypalAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"pago_movil" | "transferencia">("pago_movil");
  const [bankName, setBankName] = useState("");
  const [bankPhone, setBankPhone] = useState("");
  const [bankCedula, setBankCedula] = useState("");
  const [bankFullName, setBankFullName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [txCreated, setTxCreated] = useState(false);

  useEffect(() => {
    fetchRate();
    fetchPaypalAccounts();
  }, []);

  const fetchRate = async () => {
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
  };

  const fetchPaypalAccounts = async () => {
    const { data } = await supabase
      .from("paypal_accounts")
      .select("*")
      .eq("is_active", true);
    if (data) setPaypalAccounts(data);
  };

  const numAmount = parseFloat(amount) || 0;
  const bolivares = rate ? numAmount * rate : 0;

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const txData: any = {
        user_id: userId,
        type: "exchange",
        amount: numAmount,
        currency_from: "USD",
        currency_to: "VES",
        exchange_rate: rate,
        amount_received: bolivares,
        status: "pending",
        payment_method: paymentMethod,
        bank_name: bankName,
        bank_cedula: bankCedula,
        paypal_account_used: selectedAccount,
        description: `Cambio PayPal USD ${numAmount} a Bs ${bolivares.toFixed(2)}`,
      };

      if (paymentMethod === "pago_movil") {
        txData.bank_phone = bankPhone;
      } else {
        txData.bank_full_name = bankFullName;
        txData.bank_account_number = bankAccountNumber;
      }

      const { error } = await supabase.from("transactions").insert(txData);
      if (error) throw error;

      setTxCreated(true);
      setStep("confirmation");
      toast({ title: "¡Operación registrada!", description: "Tu solicitud ha sido enviada. Confirmaremos tu pago pronto." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "confirmation" && txCreated) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 shadow-[var(--shadow-card)] text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-heading font-bold text-foreground mb-2">¡Operación Registrada!</h3>
        <p className="text-muted-foreground mb-4">
          Hemos recibido tu solicitud de cambio. Una vez confirmemos tu pago PayPal al correo <strong className="text-foreground">{selectedAccount}</strong>, procesaremos la transferencia a tu cuenta bancaria.
        </p>
        <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2">
          <p className="text-sm"><strong>Monto:</strong> ${numAmount} USD</p>
          <p className="text-sm"><strong>Tasa BCV:</strong> {rate?.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</p>
          <p className="text-sm"><strong>Recibirás:</strong> {bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
          <p className="text-sm"><strong>Método:</strong> {paymentMethod === "pago_movil" ? "Pago Móvil" : "Transferencia"}</p>
        </div>
        <Button onClick={() => { setStep("calculator"); setTxCreated(false); }} className="bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold">
          Nueva Operación
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { key: "calculator", label: "Monto" },
          { key: "paypal_accounts", label: "PayPal" },
          { key: "bank_details", label: "Banco" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s.key ? "bg-secondary text-secondary-foreground" :
              ["calculator", "paypal_accounts", "bank_details"].indexOf(step) > i ? "bg-secondary/20 text-secondary" :
              "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className="text-xs font-heading font-semibold text-muted-foreground hidden sm:inline">{s.label}</span>
            {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Calculator */}
      {step === "calculator" && (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" />
            ¿Cuánto deseas cambiar?
          </h3>

          {rate && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <strong className="text-secondary">Tasa BCV del día:</strong>{" "}
              {rate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$ •{" "}
              <span className="text-muted-foreground">
                {new Date(rateDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Monto USD</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8 text-lg font-bold h-12" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Recibirás en Bs</label>
              <div className="bg-muted rounded-lg h-12 flex items-center px-4 text-lg font-heading font-bold text-secondary">
                {bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs
              </div>
            </div>
          </div>

          <Button
            onClick={() => setStep("paypal_accounts")}
            disabled={numAmount <= 0 || !rate}
            className="w-full bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold"
          >
            Continuar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: PayPal Accounts */}
      {step === "paypal_accounts" && (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Send className="w-5 h-5 text-secondary" />
            Envía el pago a una de estas cuentas PayPal
          </h3>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Envía <strong className="text-foreground">${numAmount} USD</strong> desde tu PayPal a una de las siguientes cuentas.
              Recibirás <strong className="text-secondary">{bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong> (Tasa BCV: {rate?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}).
            </p>
          </div>

          {paypalAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay cuentas PayPal disponibles en este momento. Intenta más tarde.</p>
          ) : (
            <div className="space-y-3">
              {paypalAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.email)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAccount === acc.email
                      ? "border-secondary bg-secondary/5 shadow-md"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${selectedAccount === acc.email ? "border-secondary bg-secondary" : "border-muted-foreground"}`} />
                    <div>
                      <p className="font-heading font-semibold text-foreground">{acc.email}</p>
                      {acc.label && <p className="text-xs text-muted-foreground">{acc.label}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("calculator")} className="flex-1">
              Atrás
            </Button>
            <Button
              onClick={() => setStep("bank_details")}
              disabled={!selectedAccount}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold"
            >
              Ya envié el pago <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Bank Details */}
      {step === "bank_details" && (
        <form onSubmit={handleSubmitTransaction} className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-secondary" />
            ¿Dónde recibirás tus bolívares?
          </h3>

          {/* Payment method selector */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setPaymentMethod("pago_movil")}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                paymentMethod === "pago_movil" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
              }`}
            >
              <Smartphone className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="font-heading font-semibold text-sm">Pago Móvil</p>
            </div>
            <div
              onClick={() => setPaymentMethod("transferencia")}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                paymentMethod === "transferencia" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="font-heading font-semibold text-sm">Transferencia</p>
            </div>
          </div>

          {/* Bank */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Banco</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecciona tu banco</option>
              {VENEZUELAN_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Cedula */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Cédula</label>
            <Input value={bankCedula} onChange={(e) => setBankCedula(e.target.value)} placeholder="V-12345678" required />
          </div>

          {paymentMethod === "pago_movil" ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Número de Teléfono</label>
              <Input value={bankPhone} onChange={(e) => setBankPhone(e.target.value)} placeholder="0412-1234567" required />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre Completo (titular)</label>
                <Input value={bankFullName} onChange={(e) => setBankFullName(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Número de Cuenta</label>
                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="0102-1234-56-7890123456" required />
              </div>
            </>
          )}

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
            <p><strong>Resumen:</strong></p>
            <p>Envías: <strong>${numAmount} USD</strong> a {selectedAccount}</p>
            <p>Tasa BCV: <strong>{rate?.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>
            <p>Recibirás: <strong className="text-secondary">{bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("paypal_accounts")} className="flex-1">
              Atrás
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold">
              {loading ? "Procesando..." : "Confirmar Operación"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExchangeFlow;
