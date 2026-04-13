import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-background py-12 border-t border-border">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Procesatupago" className="h-14 w-auto object-contain" />
        <p className="text-muted-foreground text-sm font-body">
          © {new Date().getFullYear()} Procesatupago. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
