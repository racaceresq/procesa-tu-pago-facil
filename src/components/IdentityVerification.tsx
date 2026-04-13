import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";

interface Props {
  userId: string;
  verificationStatus: string;
  onVerified: () => void;
}

const IdentityVerification = ({ userId, verificationStatus, onVerified }: Props) => {
  const [cedula, setCedula] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "La imagen debe ser menor a 5MB", variant: "destructive" });
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !cedula.trim()) {
      toast({ title: "Error", description: "Debes ingresar tu cédula y subir la foto", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/cedula.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("id-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("id-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cedula,
          id_photo_url: filePath,
          verification_status: "submitted",
        } as any)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      toast({ title: "¡Enviado!", description: "Tu verificación ha sido enviada. Una asesora la revisará pronto." });
      onVerified();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus === "verified") {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle className="w-8 h-8" />
          <div>
            <h3 className="font-heading font-bold text-lg">Identidad Verificada</h3>
            <p className="text-sm text-muted-foreground">Tu identidad ha sido confirmada. Puedes realizar operaciones.</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === "submitted") {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 text-yellow-600">
          <Clock className="w-8 h-8" />
          <div>
            <h3 className="font-heading font-bold text-lg">Verificación en Proceso</h3>
            <p className="text-sm text-muted-foreground">Tu documentación está siendo revisada por nuestras asesoras. Te notificaremos cuando esté lista.</p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 text-destructive mb-4">
          <XCircle className="w-8 h-8" />
          <div>
            <h3 className="font-heading font-bold text-lg">Verificación Rechazada</h3>
            <p className="text-sm text-muted-foreground">Tu verificación fue rechazada. Por favor intenta de nuevo con una foto más clara.</p>
          </div>
        </div>
        <VerificationForm
          cedula={cedula}
          setCedula={setCedula}
          file={file}
          preview={preview}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    );
  }

  // pending
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-secondary" />
        <h3 className="font-heading font-bold text-lg text-foreground">Verificación de Identidad</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Para realizar operaciones, necesitas verificar tu identidad. Sube una foto donde se vea tu rostro junto a tu cédula de identidad.
      </p>
      <VerificationForm
        cedula={cedula}
        setCedula={setCedula}
        file={file}
        preview={preview}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

const VerificationForm = ({
  cedula, setCedula, file, preview, handleFileChange, handleSubmit, loading,
}: {
  cedula: string; setCedula: (v: string) => void;
  file: File | null; preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">Número de Cédula</label>
      <Input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="V-12345678" required />
    </div>
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">
        Foto con tu cédula de identidad
      </label>
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition-colors"
        onClick={() => document.getElementById("id-photo-input")?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Haz clic para subir tu foto</p>
            <p className="text-xs text-muted-foreground">JPG, PNG - Máximo 5MB</p>
          </div>
        )}
        <input
          id="id-photo-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
    <Button
      type="submit"
      disabled={loading || !file || !cedula.trim()}
      className="w-full bg-secondary text-secondary-foreground hover:bg-teal-light font-heading font-semibold"
    >
      {loading ? "Enviando..." : "Enviar Verificación"}
    </Button>
  </form>
);

export default IdentityVerification;
