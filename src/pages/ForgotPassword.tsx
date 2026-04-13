import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Procesatupago" className="h-16 w-auto object-contain" />
        </div>
        <div className="bg-card rounded-lg border border-border p-8 shadow-[var(--shadow-card)]">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">¡Correo enviado!</h1>
              <p className="text-muted-foreground text-sm">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
              </p>
              <Link to="/auth" className="text-sm text-secondary hover:text-teal transition-colors font-medium inline-block mt-4">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">
                Recuperar Contraseña
              </h1>
              <p className="text-muted-foreground text-center text-sm mb-6">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Correo electrónico</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/auth" className="text-sm text-secondary hover:text-teal transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
