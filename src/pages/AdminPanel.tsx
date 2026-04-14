import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShieldCheck, DollarSign, Mail, Users, CheckCircle, XCircle, Plus } from "lucide-react";
import logo from "@/assets/logo.png";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"verifications" | "transactions" | "paypal" | "rates">("verifications");

  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [paypalAccounts, setPaypalAccounts] = useState<any[]>([]);
  const [newPaypalEmail, setNewPaypalEmail] = useState("");
  const [newPaypalLabel, setNewPaypalLabel] = useState("");

  // Rates
  const [rateUnder50, setRateUnder50] = useState("");
  const [rateOver100, setRateOver100] = useState("");
  const [pagoMovilCommission, setPagoMovilCommission] = useState("");
  const [currentRate, setCurrentRate] = useState<any>(null);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    if (!roles?.some((r: any) => r.role === "admin")) { navigate("/dashboard"); return; }
    setIsAdmin(true);
    setLoading(false);
    fetchAll();
  };

  const fetchAll = () => { fetchPendingProfiles(); fetchAllTransactions(); fetchPaypalAccounts(); fetchCurrentRate(); };

  const fetchPendingProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").in("verification_status", ["submitted", "pending", "rejected"]).order("created_at", { ascending: false });
    if (data) setPendingProfiles(data);
  };

  const fetchAllTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (data) setAllTransactions(data);
  };

  const fetchPaypalAccounts = async () => {
    const { data } = await supabase.from("paypal_accounts").select("*").order("created_at", { ascending: false });
    if (data) setPaypalAccounts(data);
  };

  const fetchCurrentRate = async () => {
    const { data } = await supabase.from("exchange_rates").select("*").order("rate_date", { ascending: false }).limit(1);
    if (data && data.length > 0) {
      setCurrentRate(data[0]);
      setRateUnder50((data[0] as any).rate_under_50?.toString() || "");
      setRateOver100((data[0] as any).rate_over_100?.toString() || "");
      setPagoMovilCommission((data[0] as any).pago_movil_commission?.toString() || "0");
    }
  };

  const handleVerify = async (profileId: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ verification_status: status } as any).eq("id", profileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "verified" ? "¡Verificado!" : "Rechazado", description: `El usuario ha sido ${status === "verified" ? "verificado" : "rechazado"}.` });
    fetchPendingProfiles();
  };

  const handleUpdateTxStatus = async (txId: string, status: string) => {
    const { error } = await supabase.from("transactions").update({ status } as any).eq("id", txId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Actualizado", description: `Transacción marcada como ${status}.` });
    fetchAllTransactions();
  };

  const handleAddPaypal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaypalEmail.trim()) return;
    const { error } = await supabase.from("paypal_accounts").insert({ email: newPaypalEmail.trim(), label: newPaypalLabel.trim() || null } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agregado", description: "Cuenta PayPal agregada." });
    setNewPaypalEmail(""); setNewPaypalLabel("");
    fetchPaypalAccounts();
  };

  const handleTogglePaypal = async (id: string, active: boolean) => {
    await supabase.from("paypal_accounts").update({ is_active: !active } as any).eq("id", id);
    fetchPaypalAccounts();
  };

  const handleSetRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const r50 = parseFloat(rateUnder50);
    const r100 = parseFloat(rateOver100);
    const commission = parseFloat(pagoMovilCommission) || 0;
    if (isNaN(r50) || r50 <= 0 || isNaN(r100) || r100 <= 0) {
      toast({ title: "Error", description: "Ingresa tasas válidas para ambos rangos.", variant: "destructive" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("exchange_rates").upsert(
      { rate: r50, rate_under_50: r50, rate_over_100: r100, pago_movil_commission: commission, source: "manual", rate_date: today } as any,
      { onConflict: "source,rate_date" }
    );
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tasas actualizadas", description: `Menor a $50: ${r50} Bs/$ | Mayor a $100: ${r100} Bs/$` });
    fetchCurrentRate();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  if (!isAdmin) return null;

  const tabs = [
    { key: "verifications", label: "Verificaciones", icon: ShieldCheck },
    { key: "transactions", label: "Transacciones", icon: DollarSign },
    { key: "paypal", label: "Cuentas PayPal", icon: Mail },
    { key: "rates", label: "Tasas del día", icon: DollarSign },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <img src={logo} alt="Admin" className="h-10 w-auto object-contain" />
          </div>
          <span className="text-sm font-heading font-semibold text-secondary flex items-center gap-1">
            <Users className="w-4 h-4" /> Panel Admin
          </span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)}
              className={tab === t.key ? "bg-secondary text-secondary-foreground" : ""}>
              <t.icon className="w-4 h-4 mr-1" /> {t.label}
            </Button>
          ))}
        </div>

        {/* Verifications */}
        {tab === "verifications" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-heading font-bold mb-4">Verificaciones Pendientes</h2>
            {pendingProfiles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay verificaciones pendientes.</p>
            ) : (
              <div className="space-y-4">
                {pendingProfiles.map((p) => (
                  <div key={p.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{p.display_name || "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">Cédula: {(p as any).cedula || "No proporcionada"}</p>
                        <p className="text-xs text-muted-foreground">Estado: {(p as any).verification_status}</p>
                      </div>
                      {(p as any).id_photo_url && (
                        <div className="w-32 h-24 bg-muted rounded overflow-hidden">
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/id-photos/${(p as any).id_photo_url}`}
                            alt="ID" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleVerify(p.id, "verified")} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" /> Verificar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleVerify(p.id, "rejected")}>
                          <XCircle className="w-4 h-4 mr-1" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions */}
        {tab === "transactions" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-heading font-bold mb-4">Todas las Transacciones</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Remitente PayPal</TableHead>
                    <TableHead>Monto USD</TableHead>
                    <TableHead>Bs</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>PayPal destino</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{new Date(tx.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="text-sm">{(tx as any).paypal_sender_name || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">${tx.amount}</TableCell>
                      <TableCell className="text-sm">{tx.amount_received?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm">{(tx as any).payment_method || "—"}</TableCell>
                      <TableCell className="text-sm">{(tx as any).paypal_account_used || "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === "completed" ? "bg-green-100 text-green-800" :
                          tx.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>{tx.status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {tx.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateTxStatus(tx.id, "completed")} className="text-xs h-7">
                                <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateTxStatus(tx.id, "cancelled")} className="text-xs h-7 text-destructive">
                                <XCircle className="w-3 h-3 mr-1" /> Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* PayPal Accounts */}
        {tab === "paypal" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-heading font-bold mb-4">Cuentas PayPal</h2>
            <form onSubmit={handleAddPaypal} className="flex gap-3 mb-6">
              <Input value={newPaypalEmail} onChange={(e) => setNewPaypalEmail(e.target.value)} placeholder="correo@paypal.com" className="flex-1" required />
              <Input value={newPaypalLabel} onChange={(e) => setNewPaypalLabel(e.target.value)} placeholder="Etiqueta (opcional)" className="w-40" />
              <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-teal-light">
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </form>
            <div className="space-y-3">
              {paypalAccounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="font-semibold">{acc.email}</p>
                    {acc.label && <p className="text-xs text-muted-foreground">{acc.label}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleTogglePaypal(acc.id, acc.is_active)}>
                    {acc.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rates */}
        {tab === "rates" && (
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <h2 className="text-lg font-heading font-bold mb-4">Tasas del Día</h2>

            {currentRate && (
              <div className="bg-muted rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Menos de $50</p>
                  <p className="text-xl font-heading font-bold text-secondary">
                    {Number((currentRate as any).rate_under_50 || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Más de $100</p>
                  <p className="text-xl font-heading font-bold text-secondary">
                    {Number((currentRate as any).rate_over_100 || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comisión Pago Móvil</p>
                  <p className="text-xl font-heading font-bold text-secondary">
                    {Number((currentRate as any).pago_movil_commission || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSetRates} className="border border-border rounded-lg p-4 space-y-4">
              <h3 className="font-heading font-semibold">Actualizar tasas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tasa menos de $50</label>
                  <Input type="number" step="0.01" min="0" value={rateUnder50} onChange={(e) => setRateUnder50(e.target.value)} placeholder="Ej: 55.00" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tasa más de $100</label>
                  <Input type="number" step="0.01" min="0" value={rateOver100} onChange={(e) => setRateOver100(e.target.value)} placeholder="Ej: 57.00" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Comisión Pago Móvil (Bs)</label>
                  <Input type="number" step="0.01" min="0" value={pagoMovilCommission} onChange={(e) => setPagoMovilCommission(e.target.value)} placeholder="Ej: 1.50" />
                </div>
              </div>
              <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-teal-light">Guardar tasas</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
