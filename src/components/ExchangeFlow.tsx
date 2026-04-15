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
  "Banco de Venezuela", "Banco Nacional de Crédito (BNC)", "Banesco",
  "Banco Mercantil", "Banco Provincial (BBVA)", "Banco del Tesoro",
  "Banco Bicentenario", "Banco Exterior", "Banco Caroní", "Banco Sofitasa",
  "Banco Plaza", "Banco Venezolano de Crédito", "Bancamiga", "Banplus",
  "100% Banco", "Banco Activo", "Mibanco", "Bancrecer",
];

const ExchangeFlow = ({ userId }: Props) => {
  const [step, setStep] = useState<Step>("calculator");
  const [amount, setAmount] = useState("100");
  const [rateData, setRateData] = useState<any>(null);
  const [paypalAccounts, setPaypalAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paypalSenderName, setPaypalSenderName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pago_movil" | "transferencia">("pago_movil");
  const [bankName, setBankName] = useState("");
  const [bankPhone, setBankPhone] = useState("");
  const [bankCedula, setBankCedula] = useState("");
  const [bankFullName, setBankFullName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [txCreated, setTxCreated] = useState(false);

  useEffect(() => { fetchRate(); fetchPaypalAccounts(); }, []);

  const fetchRate = async () => {
    const { data } = await supabase.from("exchange_rates").select("*").order("rate_date", { ascending: false }).limit(1);
    if (data && data.length > 0) setRateData(data[0]);
  };

  const fetchPaypalAccounts = async () => {
    const { data } = await supabase.from("paypal_accounts").select("*").eq("is_active", true);
    if (data) setPaypalAccounts(data);
  };

  const numAmount = parseFloat(amount) || 0;

  // PayPal fee: 5.4% + $0.30
  const paypalFee = numAmount * 0.054 + 0.30;
  const netAmount = Math.max(numAmount - paypalFee, 0);

  // Select rate based on gross amount, fallback to base rate
  const baseRate = Number(rateData?.rate) || 0;
  const rateUnder50 = Number(rateData?.rate_under_50) || baseRate;
  const rateOver100 = Number(rateData?.rate_over_100) || baseRate;
  const pagoMovilCommission = Number(rateData?.pago_movil_commission) || 0;

  const appliedRate = numAmount >= 100 ? rateOver100 : numAmount < 50 ? rateUnder50 : baseRate;
  const bolivaresGross = netAmount * appliedRate;
  const bolivares = paymentMethod === "pago_movil" ? Math.max(bolivaresGross - pagoMovilCommission, 0) : bolivaresGross;

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalSenderName.trim()) {
      toast({ title: "Error", description: "Ingresa el nombre de quien envía el pago PayPal.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const txData: any = {
        user_id: userId, type: "exchange", amount: numAmount,
        currency_from: "USD", currency_to: "VES",
        exchange_rate: appliedRate, amount_received: bolivares,
        status: "pending", payment_method: paymentMethod,
        bank_name: bankName, bank_cedula: bankCedula,
        paypal_account_used: selectedAccount,
        paypal_sender_name: paypalSenderName.trim(),
        description: `Cambio PayPal USD ${numAmount} (neto: ${netAmount.toFixed(2)}) a Bs ${bolivares.toFixed(2)}`,
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
      toast({ title: "¡Operación registrada!", description: "Tu solicitud ha sido enviada." });
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
          Hemos recibido tu solicitud de cambio. Una vez confirmemos tu pago PayPal al correo <strong className="text-foreground">{selectedAccount}</strong>, procesaremos la transferencia.
        </p>
        <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2">
          <p className="text-sm"><strong>Monto bruto:</strong> ${numAmount} USD</p>
          <p className="text-sm"><strong>Comisión PayPal (5.4% + $0.30):</strong> -${paypalFee.toFixed(2)}</p>
          <p className="text-sm"><strong>Monto neto:</strong> ${netAmount.toFixed(2)} USD</p>
          <p className="text-sm"><strong>Tasa del día:</strong> {appliedRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</p>
          {paymentMethod === "pago_movil" && pagoMovilCommission > 0 && (
            <p className="text-sm"><strong>Comisión Pago Móvil:</strong> -{pagoMovilCommission.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
          )}
          <p className="text-sm"><strong>Recibirás:</strong> {bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
          <p className="text-sm"><strong>Método:</strong> {paymentMethod === "pago_movil" ? "Pago Móvil" : "Transferencia"}</p>
          <p className="text-sm"><strong>Remitente PayPal:</strong> {paypalSenderName}</p>
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
            }`}>{i + 1}</div>
            <span className="text-xs font-heading font-semibold text-muted-foreground hidden sm:inline">{s.label}</span>
            {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Calculator */}
      {step === "calculator" && (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" /> ¿Cuánto deseas cambiar?
          </h3>

          {rateData && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><strong className="text-secondary">Tasas del día:</strong></p>
              {rateUnder50 > 0 && <p>Menos de $50: <strong>{rateUnder50.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>}
              {baseRate > 0 && baseRate !== rateUnder50 && baseRate !== rateOver100 && <p>$50 - $99: <strong>{baseRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>}
              {rateOver100 > 0 && <p>$100 o más: <strong>{rateOver100.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>}
              {pagoMovilCommission > 0 && <p>Comisión Pago Móvil: <strong>{pagoMovilCommission.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Monto USD (bruto)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8 text-lg font-bold h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Desglose</label>
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p>Comisión PayPal (5.4% + $0.30): <strong className="text-destructive">-${paypalFee.toFixed(2)}</strong></p>
                <p>Monto neto: <strong>${netAmount.toFixed(2)}</strong></p>
                <p>Tasa aplicada ({numAmount >= 100 ? ">$100" : "<$50"}): <strong>{appliedRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>
                {paymentMethod === "pago_movil" && pagoMovilCommission > 0 && (
                  <p>Comisión Pago Móvil: <strong className="text-destructive">-{pagoMovilCommission.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>
                )}
                <hr className="border-border my-1" />
                <p className="text-base">Recibirás: <strong className="text-secondary">{bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>
              </div>
            </div>
          </div>

          {/* Payment method selector in calculator for commission preview */}
          <div className="grid grid-cols-2 gap-3">
            <div onClick={() => setPaymentMethod("pago_movil")}
              className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${paymentMethod === "pago_movil" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
              <Smartphone className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <p className="font-heading font-semibold text-xs">Pago Móvil</p>
            </div>
            <div onClick={() => setPaymentMethod("transferencia")}
              className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${paymentMethod === "transferencia" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <p className="font-heading font-semibold text-xs">Transferencia</p>
            </div>
          </div>

          <Button onClick={() => setStep("paypal_accounts")} disabled={numAmount <= 0 || appliedRate <= 0}
            className="w-full bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold">
            Continuar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: PayPal Accounts */}
      {step === "paypal_accounts" && (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Send className="w-5 h-5 text-secondary" /> Envía el pago a una de estas cuentas PayPal
          </h3>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Envía <strong className="text-foreground">${numAmount} USD</strong> desde tu PayPal. Monto neto: <strong>${netAmount.toFixed(2)}</strong>.
              Recibirás <strong className="text-secondary">{bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong> (Tasa: {appliedRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })}).
            </p>
          </div>

          {paypalAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay cuentas PayPal disponibles en este momento.</p>
          ) : (
            <div className="space-y-3">
              {paypalAccounts.map((acc) => (
                <div key={acc.id} onClick={() => setSelectedAccount(acc.email)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedAccount === acc.email ? "border-secondary bg-secondary/5 shadow-md" : "border-border hover:border-secondary/50"}`}>
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

          {/* Sender name field */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nombre de quien envía el pago PayPal</label>
            <Input value={paypalSenderName} onChange={(e) => setPaypalSenderName(e.target.value)} placeholder="Nombre como aparece en PayPal" required />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("calculator")} className="flex-1">Atrás</Button>
            <Button onClick={() => setStep("bank_details")} disabled={!selectedAccount || !paypalSenderName.trim()}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold">
              Ya envié el pago <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Bank Details */}
      {step === "bank_details" && (
        <form onSubmit={handleSubmitTransaction} className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-secondary" /> ¿Dónde recibirás tus bolívares?
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div onClick={() => setPaymentMethod("pago_movil")}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${paymentMethod === "pago_movil" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
              <Smartphone className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="font-heading font-semibold text-sm">Pago Móvil</p>
            </div>
            <div onClick={() => setPaymentMethod("transferencia")}
              className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${paymentMethod === "transferencia" ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
              <CreditCard className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <p className="font-heading font-semibold text-sm">Transferencia</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Banco</label>
            <select value={bankName} onChange={(e) => setBankName(e.target.value)} required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Selecciona tu banco</option>
              {VENEZUELAN_BANKS.map((b) => (<option key={b} value={b}>{b}</option>))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Cédula</label>
            <Input
              value={bankCedula}
              onChange={(e) => setBankCedula(e.target.value.replace(/\D/g, ""))}
              placeholder="12345678"
              inputMode="numeric"
              required
            />
          </div>

          {paymentMethod === "pago_movil" ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Número de Teléfono</label>
              <Input
                value={bankPhone}
                onChange={(e) => setBankPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="04121234567"
                inputMode="numeric"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre Completo (titular)</label>
                <Input value={bankFullName} onChange={(e) => setBankFullName(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Número de Cuenta</label>
                <Input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="01021234567890123456"
                  inputMode="numeric"
                  required
                />
              </div>
            </>
          )}

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
            <p><strong>Resumen:</strong></p>
            <p>Envías: <strong>${numAmount} USD</strong> a {selectedAccount}</p>
            <p>Remitente PayPal: <strong>{paypalSenderName}</strong></p>
            <p>Comisión PayPal: <strong>-${paypalFee.toFixed(2)}</strong></p>
            <p>Monto neto: <strong>${netAmount.toFixed(2)}</strong></p>
            <p>Tasa del día: <strong>{appliedRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$</strong></p>
            {paymentMethod === "pago_movil" && pagoMovilCommission > 0 && (
              <p>Comisión Pago Móvil: <strong>-{pagoMovilCommission.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>
            )}
            <p>Recibirás: <strong className="text-secondary">{bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</strong></p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("paypal_accounts")} className="flex-1">Atrás</Button>
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
