import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-primary py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Procesatupago" className="h-10 brightness-0 invert" />
        <p className="text-primary-foreground/60 text-sm font-body">
          © {new Date().getFullYear()} Procesatupago. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
