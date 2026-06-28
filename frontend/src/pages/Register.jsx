import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NBButton, NBCard, NBInput } from "../components/nb";
import { GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { registerSchema } from "../lib/validations";
import { useFormValidation } from "../hooks/useFormValidation";

const LOGO_URL = "/logo.png";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "teacher" ? "teacher" : "student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { errors, touched, validate, validateField, touchField } = useFormValidation(registerSchema);

  const formData = { name, email, password };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate(formData)) return;
    setLoading(true);
    try {
      const u = await register({ name, email, password, role });
      toast.success(`¡Bienvenido, ${u.name}!`);
      nav("/dashboard");
    } catch (e) {
      if (e.displayMessage) {
        toast.error(e.displayMessage);
      } else {
        setError(e.message);
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-3 mb-6 nb-press inline-flex" data-testid="register-back-home">
          <img src={LOGO_URL} alt="NUMA" className="w-12 h-12 nb-border nb-shadow-sm object-cover bg-white" />
          <div className="leading-tight">
            <div className="font-display font-black text-2xl text-[#1F5A2A]">NUMA</div>
            <div className="label-caps text-[0.6rem] text-[#3E8E41]">Plantas & Bienestar</div>
          </div>
        </Link>

        <NBCard className="p-8 space-y-5">
          <div>
            <h1 className="font-display font-black text-3xl uppercase text-[#1F5A2A]">Registrarse</h1>
            <p className="text-sm text-[#3E5A3E]">Empieza tu camino en menos de un minuto.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`nb-border p-4 nb-press text-left ${role === "student" ? "bg-[#A5D6A7] nb-shadow" : "bg-white"}`}
              data-testid="register-role-student"
            >
              <GraduationCap className="w-6 h-6 mb-2" />
              <div className="font-display font-black">Estudiante</div>
              <div className="text-xs">Aprende y gana XP</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`nb-border p-4 nb-press text-left ${role === "teacher" ? "bg-[#8BC34A] nb-shadow" : "bg-white"}`}
              data-testid="register-role-teacher"
            >
              <BookOpen className="w-6 h-6 mb-2" />
              <div className="font-display font-black">Profesor</div>
              <div className="text-xs">Crea y califica</div>
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-caps block mb-1.5">Nombre completo</label>
              <NBInput
                value={name}
                onChange={(e) => { setName(e.target.value); validateField("name", { ...formData, name: e.target.value }); }}
                onBlur={() => touchField("name")}
                placeholder="Ana Pérez"
                className={errors.name && touched.name ? "border-[#FF6B6B]" : ""}
                data-testid="register-name-input"
              />
              {errors.name && touched.name && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium" data-testid="register-name-error">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="label-caps block mb-1.5">Correo</label>
              <NBInput
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateField("email", { ...formData, email: e.target.value }); }}
                onBlur={() => touchField("email")}
                placeholder="tu@correo.com"
                className={errors.email && touched.email ? "border-[#FF6B6B]" : ""}
                data-testid="register-email-input"
              />
              {errors.email && touched.email && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium" data-testid="register-email-error">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="label-caps block mb-1.5">Contraseña</label>
              <NBInput
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); validateField("password", { ...formData, password: e.target.value }); }}
                onBlur={() => touchField("password")}
                placeholder="Mínimo 6 caracteres"
                className={errors.password && touched.password ? "border-[#FF6B6B]" : ""}
                data-testid="register-password-input"
              />
              {errors.password && touched.password && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium" data-testid="register-password-error">{errors.password}</p>
              )}
            </div>
            {error && <div className="nb-border bg-[#FF6B6B] text-white px-3 py-2 text-sm font-medium" data-testid="register-error">{error}</div>}
            <NBButton type="submit" variant="dark" className="w-full" disabled={loading} data-testid="register-submit-btn">
              {loading ? "Creando..." : `Crear cuenta de ${role === "teacher" ? "profesor" : "estudiante"}`}
            </NBButton>
          </form>

          <div className="text-sm text-center">
            ¿Ya tienes cuenta? <Link to="/login" className="font-bold underline" data-testid="register-login-link">Entrar</Link>
          </div>
        </NBCard>
      </div>
    </div>
  );
}
