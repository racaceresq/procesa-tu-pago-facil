import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import type { User } from "@supabase/supabase-js";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-2 px-4">
        <img src={logo} alt="Procesatupago" className="h-15 md:h-[70px] w-auto object-contain" />
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 font-heading text-sm font-semibold text-foreground">
            <a href="#inicio" className="hover:text-teal transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-teal transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-teal transition-colors">¿Cómo funciona?</a>
            <a href="#testimonios" className="hover:text-teal transition-colors">Testimonios</a>
          </div>
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-heading font-semibold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="font-heading font-semibold bg-secondary text-secondary-foreground hover:bg-teal-light transition-all"
            >
              <LogIn className="w-4 h-4 mr-1" />
              Ingresar
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
