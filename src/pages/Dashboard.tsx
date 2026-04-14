import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, Mail, Save, ArrowLeft, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import type { User as SupaUser } from "@supabase/supabase-js";
import IdentityVerification from "@/components/IdentityVerification";
import ExchangeFlow from "@/components/ExchangeFlow";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  verification_status: string;
  cedula: string | null;
  id_photo_url: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency_from: string;
  currency_to: string;
  exchange_rate: number | null;
  amount_received: number | null;
  description: string | null;
  status: string;
  created_at: string;
  payment_method: string | null;
  bank_name: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "exchange" | "history">("profile");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
      setEmail(session.user.email || "");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
      setEmail(session.user.email || "");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchTransactions();
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
    if (data?.some((r: any) => r.role === "admin")) setIsAdmin(true);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      const p = data as any;
      setProfile({
        id: p.id, user_id: p.user_id, display_name: p.display_name,
        phone: p.phone, avatar_url: p.avatar_url,
        verification_status: p.verification_status || "pending",
        cedula: p.cedula, id_photo_url: p.id_photo_url,
      });
      setDisplayName(p.display_name || "");
      setPhone(p.phone || "");
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setTransactions(data as any);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: displayName, phone } as any).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Tus datos han sido guardados correctamente." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-muted text-muted-foreground"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const isVerified = profile?.verification_status === "verified";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Inicio
            </Button>
            <img src={logo} alt="Procesatupago" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")} className="text-secondary border-secondary">
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden md:inline">{email}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "profile" as const, label: "Mi Perfil" },
            { key: "exchange" as const, label: "Cambiar Saldo" },
            { key: "history" as const, label: "Historial" },
          ].map((t) => (
            <Button
              key={t.key}
              variant={activeTab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key ? "bg-secondary text-secondary-foreground" : ""}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <>
            <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-secondary" /> Mi Perfil
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block"><User className="w-4 h-4 inline mr-1" />Nombre</label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre completo" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block"><Phone className="w-4 h-4 inline mr-1" />Teléfono</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="04121234567"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block"><Mail className="w-4 h-4 inline mr-1" />Correo electrónico</label>
                  <Input value={email} disabled className="bg-muted" />
                </div>
                <Button type="submit" disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold">
                  <Save className="w-4 h-4 mr-1" /> {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </div>

            {user && profile && (
              <IdentityVerification
                userId={user.id}
                verificationStatus={profile.verification_status}
                onVerified={fetchProfile}
              />
            )}
          </>
        )}

        {/* Exchange Tab */}
        {activeTab === "exchange" && user && (
          isVerified ? (
            <ExchangeFlow userId={user.id} />
          ) : (
            <div className="bg-card rounded-lg border border-border p-8 shadow-[var(--shadow-card)] text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">Verificación Requerida</h3>
              <p className="text-muted-foreground mb-4">Debes verificar tu identidad antes de poder realizar operaciones de cambio.</p>
              <Button onClick={() => setActiveTab("profile")} className="bg-secondary text-secondary-foreground hover:bg-teal-light">
                Ir a Verificación
              </Button>
            </div>
          )
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-heading font-bold text-foreground mb-4">Historial de Transacciones</h2>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Aún no tienes transacciones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto USD</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Recibido Bs</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{new Date(tx.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                        <TableCell className="text-sm font-medium">${tx.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm">{tx.exchange_rate?.toLocaleString("es-ES", { minimumFractionDigits: 2 }) || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{tx.amount_received?.toLocaleString("es-ES", { minimumFractionDigits: 2 }) || "—"} Bs</TableCell>
                        <TableCell className="text-sm capitalize">{tx.payment_method?.replace("_", " ") || "—"}</TableCell>
                        <TableCell>{statusBadge(tx.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
