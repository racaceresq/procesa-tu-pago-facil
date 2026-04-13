import logo from "@/assets/logo.png";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto flex items-center justify-between py-2 px-4">
      <img src={logo} alt="Procesatupago" className="h-12 md:h-14 w-auto object-contain" />
      <div className="hidden md:flex items-center gap-8 font-heading text-sm font-semibold text-foreground">
        <a href="#inicio" className="hover:text-teal transition-colors">Inicio</a>
        <a href="#servicios" className="hover:text-teal transition-colors">Servicios</a>
        <a href="#como-funciona" className="hover:text-teal transition-colors">¿Cómo funciona?</a>
        <a href="#testimonios" className="hover:text-teal transition-colors">Testimonios</a>
      </div>
    </div>
  </nav>
);

export default Navbar;
