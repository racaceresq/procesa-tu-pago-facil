import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShieldCheck, DollarSign, Mail, Users, RefreshCw, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"verifications" | "transactions" | "paypal" | "rates">("verifications");

  // Verifications
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  // Transactions
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  // PayPal accounts
  const [paypalAccounts, setPaypalAccounts] = useState<any[]>([]);
  const [newPaypalEmail, setNewPaypalEmail] = useState("");
  const [newPaypalLabel, setNewPaypalLabel] = useState("");
  // Rate
  const [manualRate, setManualRate] = useState("");
  const [currentRate, setCurrentRate] = useState<any>(null);
  const [fetchingRate, setFetchingRate] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const admin = roles?.some((r: any) => r.role === "admin");
    if (!admin) { navigate("/dashboard"); return; }
    setIsAdmin(true);
    setLoading(false);
    fetchAll();
  };

  const fetchAll = () => {
    fetchPendingProfiles();
    fetchAllTransactions();
    fetchPaypalAccounts();
    fetchCurrentRate();
  };

  const fetchPendingProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("verification_status", ["submitted", "pending", "rejected"])
      .order("created_at", { ascending: false });
    if (data) setPendingProfiles(data);
  };

  const fetchAllTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAllTransactions(data);
  };

  const fetchPaypalAccounts = async () => {
    const { data } = await supabase.from("paypal_accounts").select("*").order("created_at", { ascending: false });
    if (data) setPaypalAccounts(data);
  };

  const fetchCurrentRate = async () => {
    const { data } = await supabase.from("exchange_rates").select("*").eq("source", "BCV").order("rate_date", { ascending: false }).limit(1);
    if (data && data.length > 0) setCurrentRate(data[0]);
  };

  const handleVerify = async (profileId: string, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: status } as any)
      .eq("id", profileId);
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
    setNewPaypalEmail("");
    setNewPaypalLabel("");
    fetchPaypalAccounts();
  };

  const handleTogglePaypal = async (id: string, active: boolean) => {
    await supabase.from("paypal_accounts").update({ is_active: !active } as any).eq("id", id);
    fetchPaypalAccounts();
  };

  const handleFetchBCVRate = async () => {
    setFetchingRate(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-bcv-rate");
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Tasa actualizada", description: `Tasa BCV: ${data.rate} Bs/$` });
        fetchCurrentRate();
      } else {
        throw new Error(data?.error || "Error desconocido");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFetchingRate(false);
    }
  };

  const handleSetManualRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(manualRate);
    if (isNaN(rateNum) || rateNum <= 0) return;

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("exchange_rates").upsert(
      { rate: rateNum, source: "BCV", rate_date: today } as any,
      { onConflict: "source,rate_date" }
    );
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tasa actualizada", description: `Nueva tasa: ${rateNum} Bs/$` });
    setManualRate("");
    fetchCurrentRate();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  if (!isAdmin) return null;

  const tabs = [
    { key: "verifications", label: "Verificaciones", icon: ShieldCheck },
    { key: "transactions", label: "Transacciones", icon: DollarSign },
    { key: "paypal", label: "Cuentas PayPal", icon: Mail },
    { key: "rates", label: "Tasa BCV", icon: RefreshCw },
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
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
              className={tab === t.key ? "bg-secondary text-secondary-foreground" : ""}
            >
              <t.icon className="w-4 h-4 mr-1" /> {t.label}
            </Button>
          ))}
        </div>

        {/* Verifications Tab */}
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
                            alt="ID"
                            className="w-full h-full object-cover"
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

        {/* Transactions Tab */}
        {tab === "transactions" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-heading font-bold mb-4">Todas las Transacciones</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto USD</TableHead>
                    <TableHead>Bs</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>PayPal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{new Date(tx.created_at).toLocaleDateString("es-ES")}</TableCell>
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

        {/* PayPal Accounts Tab */}
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTogglePaypal(acc.id, acc.is_active)}>
                      {acc.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rates Tab */}
        {tab === "rates" && (
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <h2 className="text-lg font-heading font-bold mb-4">Tasa de Cambio BCV</h2>

            {currentRate && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Tasa actual:</p>
                <p className="text-2xl font-heading font-bold text-secondary">
                  {Number(currentRate.rate).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs/$
                </p>
                <p className="text-xs text-muted-foreground">Fecha: {currentRate.rate_date}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-heading font-semibold mb-3">Obtener automáticamente del BCV</h3>
                <Button onClick={handleFetchBCVRate} disabled={fetchingRate} className="w-full bg-secondary text-secondary-foreground hover:bg-teal-light">
                  <RefreshCw className={`w-4 h-4 mr-1 ${fetchingRate ? "animate-spin" : ""}`} />
                  {fetchingRate ? "Obteniendo..." : "Obtener Tasa BCV"}
                </Button>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h3 className="font-heading font-semibold mb-3">Ingresar manualmente</h3>
                <form onSubmit={handleSetManualRate} className="flex gap-2">
                  <Input type="number" step="0.01" min="0" value={manualRate} onChange={(e) => setManualRate(e.target.value)} placeholder="Ej: 36.50" className="flex-1" required />
                  <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-teal-light">Guardar</Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
