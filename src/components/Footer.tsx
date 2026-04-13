const Footer = () => (
  <footer className="bg-background py-12 border-t border-border">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-xl font-bold text-foreground font-heading">Procesatupago</span>
        <p className="text-muted-foreground text-sm font-body">
          © {new Date().getFullYear()} Procesatupago. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
